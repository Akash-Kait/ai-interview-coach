import type { LlmClient } from '../../core';

const DEFAULT_MAX_TOKENS = 1024;

interface OpenAiError {
  error?: { message?: string };
}
interface ChatCompletion {
  choices?: Array<{ message?: { content?: string } }>;
}

async function errorMessage(res: Response): Promise<string> {
  let detail = '';
  try {
    detail = ((await res.json()) as OpenAiError).error?.message ?? '';
  } catch {
    // no JSON body
  }
  if (res.status === 401) return 'The provider rejected your API key (401). Check it in Settings.';
  if (res.status === 429) return 'The provider rate-limited the request (429). Wait a moment and retry.';
  return `The model provider request failed (${res.status})${detail ? `: ${detail}` : ''}.`;
}

function extractContent(data: unknown): string {
  const content = (data as ChatCompletion).choices?.[0]?.message?.content;
  if (typeof content !== 'string' || content === '') {
    throw new Error('The model returned an empty response. Please try again.');
  }
  return content;
}

/**
 * LlmClient over any OpenAI-compatible /chat/completions endpoint (Groq, Google
 * Gemini's OpenAI-compat layer, or a custom base URL). Transport only — the
 * prompts and grading live unchanged in the core AssessmentProvider. The key is
 * read per-call, sent only in the Authorization header, and never logged.
 * `fetchImpl` is injectable for tests.
 */
export function createOpenAiCompatibleLlmClient(
  getApiKey: () => string | null,
  baseUrl: string,
  model: string,
  fetchImpl: typeof fetch = fetch,
): LlmClient {
  return {
    async complete(req) {
      const key = getApiKey();
      if (!key) throw new Error('No API key set. Add your key in Settings to use AI features.');

      const url = `${baseUrl.replace(/\/+$/, '')}/chat/completions`;
      let res: Response;
      try {
        res = await fetchImpl(url, {
          method: 'POST',
          headers: {
            'content-type': 'application/json',
            authorization: `Bearer ${key}`,
          },
          body: JSON.stringify({
            model,
            max_tokens: req.maxTokens ?? DEFAULT_MAX_TOKENS,
            messages: [
              { role: 'system', content: req.system },
              { role: 'user', content: req.user },
            ],
          }),
        });
      } catch {
        throw new Error('Could not reach the model provider. Check your connection and try again.');
      }

      if (!res.ok) throw new Error(await errorMessage(res));
      return extractContent(await res.json());
    },
  };
}
