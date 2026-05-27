export interface LLMResponse {
  output: string;
  raw?: unknown;
}

const DEFAULT_CLIENT_TIMEOUT_MS = 180000;

/** Combines timeouts with an optional caller `AbortSignal`. */
function withTimeout(signal: AbortSignal | undefined, timeoutMs: number) {
  const controller = new AbortController();
  const id = window.setTimeout(() => controller.abort(), timeoutMs);

  const onAbort = () => controller.abort();
  signal?.addEventListener('abort', onAbort);

  return {
    signal: controller.signal,
    cleanup: () => {
      window.clearTimeout(id);
      signal?.removeEventListener('abort', onAbort);
    },
  };
}

export async function generateLLMResponse(
  prompt: string,
  options?: { system?: string; signal?: AbortSignal; timeoutMs?: number },
): Promise<LLMResponse> {
  const timeoutMs = options?.timeoutMs ?? DEFAULT_CLIENT_TIMEOUT_MS;
  const { signal, cleanup } = withTimeout(options?.signal, timeoutMs);

  try {
    const response = await fetch('/api/llm', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        prompt,
        system: options?.system,
      }),
      signal,
    });

    const errorBody = await response.text();

    if (!response.ok) {
      let hint = '';
      try {
        const j = JSON.parse(errorBody) as { hint?: unknown };
        if (typeof j?.hint === 'string' && j.hint.trim() !== '') {
          hint = `\n${j.hint}`;
        }
      } catch {
        // ignore invalid JSON error bodies
      }
      throw new Error(`LLM request failed: ${response.status} ${errorBody}${hint}`);
    }

    return JSON.parse(errorBody) as LLMResponse;
  } catch (err) {
    if (err instanceof DOMException && err.name === 'AbortError') {
      throw new Error(
        `Anfrage abgebrochen (Timeout nach ${Math.round(timeoutMs / 1000)}s). ` +
          `Lokal kann llama2 auf dem CPU-Mac sehr lange brauchen – kleineres Modell probieren oder warten.`,
      );
    }
    throw err;
  } finally {
    cleanup();
  }
}
