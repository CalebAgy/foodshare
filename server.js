import express from 'express';

const app = express();
const PORT = Number(process.env.PORT || 3001);
const OLLAMA_HOST = process.env.OLLAMA_HOST || 'http://127.0.0.1:11434';
const OLLAMA_MODEL = process.env.OLLAMA_MODEL || 'llama2';

app.use(express.json());

app.post('/api/llm', async (req, res) => {
  const { prompt, system } = req.body;

  if (!prompt || typeof prompt !== 'string') {
    return res.status(400).json({ error: 'Prompt is required and must be a string.' });
  }

  try {
    const response = await fetch(`${OLLAMA_HOST}/v1/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
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
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      return res.status(response.status).json({ error: data.error || data });
    }

    const output = data?.choices?.[0]?.message?.content ?? '';

    return res.json({ output, raw: data });
  } catch (error) {
    return res.status(500).json({ error: error instanceof Error ? error.message : String(error) });
  }
});

app.listen(PORT, () => {
  console.log(`LLM proxy running on http://127.0.0.1:${PORT}`);
});
