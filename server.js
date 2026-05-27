import express from 'express';

const app = express();
const PORT = Number(process.env.PORT || 3001);
const RAW_OLLAMA_HOST = process.env.OLLAMA_HOST || 'http://127.0.0.1:11434';
const OLLAMA_HOST = RAW_OLLAMA_HOST.startsWith('http://') || RAW_OLLAMA_HOST.startsWith('https://')
  ? RAW_OLLAMA_HOST
  : `http://${RAW_OLLAMA_HOST}`;
const OLLAMA_MODEL = process.env.OLLAMA_MODEL || 'llama2:latest';
const OLLAMA_API_KEY = process.env.OLLAMA_API_KEY || ''; // HIER EINFGÜGEN: Deinen Ollama API-Key als Umgebungsvariable
const OLLAMA_TIMEOUT_MS = Number(process.env.OLLAMA_TIMEOUT_MS || 120000);

app.use(express.json());

/** Node's fetch wraps low-level failures in `error.cause` (e.g. ECONNREFUSED). */
function serializeFetchError(err) {
  const msg = err instanceof Error ? err.message : String(err);
  const c = err instanceof Error ? err.cause : undefined;
  let cause = '';
  if (c != null && typeof c === 'object') {
    const code = Reflect.get(c, 'code');
    if (typeof code === 'string') cause = code;
  }
  if (!cause && c instanceof Error) cause = c.message;
  else if (!cause && c != null) cause = String(c);
  const detail = cause ? `${msg} (${cause})` : msg;
  return { message: msg, cause: cause || undefined, detail };
}

app.get('/api/health/llm', async (_req, res) => {
  try {
    const r = await fetch(`${OLLAMA_HOST}/api/tags`);
    const tags = await r.json().catch(() => ({}));
    return res.json({
      ok: true,
      ollamaHost: OLLAMA_HOST,
      model: OLLAMA_MODEL,
      tags,
    });
  } catch (e) {
    const { detail, cause } = serializeFetchError(e);
    return res.status(503).json({
      ok: false,
      ollamaHost: OLLAMA_HOST,
      model: OLLAMA_MODEL,
      error: detail,
      cause,
      hint:
        cause === 'ECONNREFUSED'
          ? 'Ollama lauscht nicht auf diesem Host (meist läuft `ollama serve` nicht oder ist anderer Port).'
          : 'Prüfen: Terminal mit `OLLAMA_HOST=127.0.0.1:11434 ollama serve` offen lassen.',
    });
  }
});

async function callOllama(messages) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), OLLAMA_TIMEOUT_MS);

  const headers = {
    'Content-Type': 'application/json',
  };

  if (OLLAMA_API_KEY) {
    headers.Authorization = `Bearer ${OLLAMA_API_KEY}`;
  }

  try {
    const resp = await fetch(`${OLLAMA_HOST}/v1/chat/completions`, {
      method: 'POST',
      headers,
      signal: controller.signal,
      body: JSON.stringify({
        model: OLLAMA_MODEL,
        messages,
        max_tokens: 512,
        stream: false,
      }),
    });

    const data = await resp.json().catch(() => ({}));
    if (!resp.ok) throw new Error(JSON.stringify(data));
    return data;
  } catch (err) {
    if (err?.name === 'AbortError') {
      throw new Error(`Ollama request timed out after ${OLLAMA_TIMEOUT_MS}ms`);
    }
    throw err;
  } finally {
    clearTimeout(timeout);
  }
}

function fallbackHandleReport(description) {
  const text = description.toLowerCase();
  const keywords = ['schimmel', 'verderb', 'nicht konsumierbar', 'nicht in guter', 'verbrannt', 'fremdkörper', 'ekel'];
  const found = keywords.find((k) => text.includes(k));

  const severity = found ? 'high' : 'medium';
  const suggestedAction = severity === 'high' ? 'remove_and_refund' : 'inspect_and_contact';

  const message = `Danke für den Hinweis. Wir haben den Vorfall als ${severity} eingestuft. Empfohlene Aktion: ${suggestedAction}. Bitte sende nach Möglichkeit ein Foto und deine Uhrzeit des Fundes.`;

  return {
    outcome: 'fallback',
    severity,
    suggestedAction,
    message,
  };
}

app.post('/api/llm', async (req, res) => {
  const { prompt, system } = req.body;

  if (!prompt || typeof prompt !== 'string') {
    return res.status(400).json({ error: 'Prompt is required and must be a string.' });
  }

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), OLLAMA_TIMEOUT_MS);

    const headers = {
      'Content-Type': 'application/json',
    };

    if (OLLAMA_API_KEY) {
      headers.Authorization = `Bearer ${OLLAMA_API_KEY}`; // HIER EINFGÜGEN: nur nötig, wenn dein Ollama-Server einen API-Key benötigt
    }

    console.log('Calling Ollama host:', OLLAMA_HOST, 'model:', OLLAMA_MODEL, 'apiKeySet:', Boolean(OLLAMA_API_KEY));

    try {
      const response = await fetch(`${OLLAMA_HOST}/v1/chat/completions`, {
        method: 'POST',
        headers,
        signal: controller.signal,
        body: JSON.stringify({
          model: OLLAMA_MODEL,
          messages: [
            {
              role: 'system',
              content: system || 'Du bist ein hilfreicher Assistent für Lebensmittelrettung.',
            },
            {
              role: 'user',
              content: prompt,
            },
          ],
          max_tokens: 512,
          stream: false,
        }),
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        return res.status(response.status).json({ error: data.error || data });
      }

      const output = data?.choices?.[0]?.message?.content ?? '';
      return res.json({ output, raw: data });
    } catch (err) {
      if (err?.name === 'AbortError') {
        return res.status(504).json({ error: `Ollama request timed out after ${OLLAMA_TIMEOUT_MS}ms` });
      }
      throw err;
    } finally {
      clearTimeout(timeout);
    }
  } catch (error) {
    console.error('Error while calling Ollama:', error && (error.stack || error));
    const { detail, cause } = serializeFetchError(error);
    const status =
      cause === 'ECONNREFUSED' || cause === 'ENOTFOUND' || cause === 'ETIMEDOUT' ? 503 : 500;
    return res.status(status).json({
      error: detail,
      cause,
      hint:
        cause === 'ECONNREFUSED'
          ? 'Starte Ollama in einem eigenen Terminal: `ollama serve` und lasse das Fenster offen.'
          : undefined,
    });
  }
});

// New endpoint to report issues (uses Ollama if available, otherwise fallback)
app.post('/api/report', async (req, res) => {
  const { listingId, description, user } = req.body;
  if (!description || typeof description !== 'string') {
    return res.status(400).json({ error: 'description is required' });
  }

  const system = `Du bist ein Support-Assistent für FoodShare. Klassifiziere die Schwere (low/medium/high), gib eine kurze Begründung und schlage eine Handlung vor (z.B. Refund, Remove listing, Contact poster, Request photo). Antworte im JSON-Format mit keys: severity, reason, action, replyMessage`;

  const userContent = `ListingId: ${listingId || 'n/a'}\nUser: ${user || 'anonymous'}\nReport: ${description}`;

  try {
    const data = await callOllama([
      { role: 'system', content: system },
      { role: 'user', content: userContent },
    ]);

    const output = data?.choices?.[0]?.message?.content ?? '';
    return res.json({ output, raw: data });
  } catch (err) {
    console.error('Ollama report call failed, using fallback:', err && (err.stack || err));
    const fb = fallbackHandleReport(description);
    return res.json({ fallback: true, ...fb });
  }
});

app.listen(PORT, () => {
  console.log(`LLM proxy running on http://127.0.0.1:${PORT}`);
});
