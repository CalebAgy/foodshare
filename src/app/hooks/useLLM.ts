export interface LLMResponse {
  output: string;
  raw?: unknown;
}

export async function generateLLMResponse(
  prompt: string,
  options?: { system?: string; signal?: AbortSignal }
): Promise<LLMResponse> {
  const response = await fetch('/api/llm', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      prompt,
      system: options?.system,
    }),
    signal: options?.signal,
  });

  if (!response.ok) {
    const errorBody = await response.text();
    throw new Error(`LLM request failed: ${response.status} ${errorBody}`);
  }

  const data = (await response.json()) as LLMResponse;
  return data;
}
