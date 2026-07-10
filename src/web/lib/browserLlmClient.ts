import type { LlmClient } from '../../core';

const ANTHROPIC_URL = 'https://api.anthropic.com/v1/messages';
const MODEL = 'claude-sonnet-5'; // SPEC §5: current Sonnet
const ANTHROPIC_VERSION = '2023-06-01';
const DEFAULT_MAX_TOKENS = 1024;

interface AnthropicError {
  error?: { message?: string };
}
interface AnthropicMessage {
  content?: Array<{ type?: string; text?: string }>;
}

async function errorMessage(res: Response): Promise<string> {
  let detail = '';
  try {
    detail = ((await res.json()) as AnthropicError).error?.message ?? '';
  } catch {
    // no JSON body
  }
  if (res.status === 401) return 'Anthropic rejected your API key (401). Check it in Settings.';
  if (res.status === 429) return 'Anthropic rate-limited the request (429). Wait a moment and retry.';
  return `Anthropic request failed (${res.status})${detail ? `: ${detail}` : ''}.`;
}

function extractText(data: unknown): string {
  const blocks = (data as AnthropicMessage).content;
  if (!Array.isArray(blocks)) throw new Error('Unexpected response shape from Anthropic.');
  const text = blocks
    .filter((b) => b.type === 'text' && typeof b.text === 'string')
    .map((b) => b.text)
    .join('');
  if (!text) throw new Error('Anthropic returned an empty response. Please try again.');
  return text;
}

/**
 * LlmClient over a direct browser call to the Anthropic Messages API (SPEC §7).
 * The key is read per-call from getApiKey, used only in the request header, and
 * never logged. `fetchImpl` is injectable for tests.
 */
export function createBrowserLlmClient(
  getApiKey: () => string | null,
  fetchImpl: typeof fetch = fetch,
): LlmClient {
  return {
    async complete(req) {
      const key = getApiKey();
      if (!key) throw new Error('No Anthropic API key set. Add your key in Settings to use AI features.');

      let res: Response;
      try {
        res = await fetchImpl(ANTHROPIC_URL, {
          method: 'POST',
          headers: {
            'content-type': 'application/json',
            'x-api-key': key,
            'anthropic-version': ANTHROPIC_VERSION,
            'anthropic-dangerous-direct-browser-access': 'true',
          },
          body: JSON.stringify({
            model: MODEL,
            max_tokens: req.maxTokens ?? DEFAULT_MAX_TOKENS,
            thinking: { type: 'disabled' },
            system: req.system,
            messages: [{ role: 'user', content: req.user }],
          }),
        });
      } catch {
        throw new Error('Could not reach Anthropic. Check your connection and try again.');
      }

      if (!res.ok) throw new Error(await errorMessage(res));
      return extractText(await res.json());
    },
  };
}
