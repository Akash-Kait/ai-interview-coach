import { describe, it, expect, vi } from 'vitest';
import { createOpenAiCompatibleLlmClient } from './openAiCompatibleLlmClient';

function resp(status: number, body: unknown): Response {
  return { ok: status >= 200 && status < 300, status, json: async () => body } as unknown as Response;
}

const okBody = { choices: [{ message: { role: 'assistant', content: 'hello world' } }] };

describe('createOpenAiCompatibleLlmClient', () => {
  it('posts system+user messages to /chat/completions and returns choices[0].message.content', async () => {
    const fetchImpl = vi.fn(async (_url: string, _init?: RequestInit) => resp(200, okBody));
    const client = createOpenAiCompatibleLlmClient(
      () => 'sk-key',
      'https://api.groq.com/openai/v1',
      'llama-3.3-70b-versatile',
      fetchImpl as unknown as typeof fetch,
    );
    const out = await client.complete({ system: 'sys', user: 'usr', maxTokens: 512 });

    expect(out).toBe('hello world');
    const [url, init] = fetchImpl.mock.calls[0];
    expect(url).toBe('https://api.groq.com/openai/v1/chat/completions');
    const headers = (init as RequestInit).headers as Record<string, string>;
    expect(headers.authorization).toBe('Bearer sk-key');
    expect(headers['content-type']).toBe('application/json');
    const body = JSON.parse((init as RequestInit).body as string);
    expect(body.model).toBe('llama-3.3-70b-versatile');
    expect(body.max_tokens).toBe(512);
    expect(body.messages).toEqual([
      { role: 'system', content: 'sys' },
      { role: 'user', content: 'usr' },
    ]);
  });

  it('trims a trailing slash on the base URL', async () => {
    const fetchImpl = vi.fn(async (_url: string, _init?: RequestInit) => resp(200, okBody));
    await createOpenAiCompatibleLlmClient(() => 'k', 'https://x/v1/', 'm', fetchImpl as unknown as typeof fetch).complete({
      system: 's', user: 'u',
    });
    expect(fetchImpl.mock.calls[0][0]).toBe('https://x/v1/chat/completions');
  });

  it('defaults max_tokens to 1024', async () => {
    const fetchImpl = vi.fn(async (_url: string, _init?: RequestInit) => resp(200, okBody));
    await createOpenAiCompatibleLlmClient(() => 'k', 'https://x/v1', 'm', fetchImpl as unknown as typeof fetch).complete({
      system: 's', user: 'u',
    });
    expect(JSON.parse((fetchImpl.mock.calls[0][1] as RequestInit).body as string).max_tokens).toBe(1024);
  });

  it('throws and never calls fetch when no key is set', async () => {
    const fetchImpl = vi.fn();
    const client = createOpenAiCompatibleLlmClient(() => null, 'https://x/v1', 'm', fetchImpl as unknown as typeof fetch);
    await expect(client.complete({ system: 's', user: 'u' })).rejects.toThrow(/API key/i);
    expect(fetchImpl).not.toHaveBeenCalled();
  });

  it('maps 401 to a friendly message that does not leak the key', async () => {
    const fetchImpl = vi.fn(async () => resp(401, { error: { message: 'invalid api key' } }));
    await expect(
      createOpenAiCompatibleLlmClient(() => 'sk-secret', 'https://x/v1', 'm', fetchImpl as unknown as typeof fetch).complete({ system: 's', user: 'u' }),
    ).rejects.toThrow(/401/);
    await expect(
      createOpenAiCompatibleLlmClient(() => 'sk-secret', 'https://x/v1', 'm', (async () => resp(401, {})) as unknown as typeof fetch).complete({ system: 's', user: 'u' }),
    ).rejects.not.toThrow(/sk-secret/);
  });

  it('throws on empty/missing content', async () => {
    const fetchImpl = vi.fn(async () => resp(200, { choices: [] }));
    await expect(
      createOpenAiCompatibleLlmClient(() => 'k', 'https://x/v1', 'm', fetchImpl as unknown as typeof fetch).complete({ system: 's', user: 'u' }),
    ).rejects.toThrow(/empty/i);
  });

  // Real-call verification against a live provider. Skipped unless LLM_API_KEY is
  // set. Exercises the actual client (real fetch). Defaults to Groq; override with
  // LLM_BASE_URL / LLM_MODEL. Run: LLM_API_KEY=... npx vitest run src/web/lib/openAiCompatibleLlmClient.test.ts
  const env = (globalThis as { process?: { env?: Record<string, string | undefined> } }).process?.env ?? {};
  const REAL_KEY = env.LLM_API_KEY;
  it.skipIf(!REAL_KEY)(
    'makes a real call to a live provider and returns content',
    async () => {
      const client = createOpenAiCompatibleLlmClient(
        () => REAL_KEY ?? null,
        env.LLM_BASE_URL ?? 'https://api.groq.com/openai/v1',
        env.LLM_MODEL ?? 'llama-3.3-70b-versatile',
      );
      const out = await client.complete({ system: 'Reply with exactly: OK', user: 'ping' });
      expect(typeof out).toBe('string');
      expect(out.length).toBeGreaterThan(0);
    },
    30_000,
  );
});
