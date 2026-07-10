import { describe, it, expect, vi } from 'vitest';
import { createBrowserLlmClient } from './browserLlmClient';

function resp(status: number, body: unknown): Response {
  return {
    ok: status >= 200 && status < 300,
    status,
    json: async () => body,
  } as unknown as Response;
}

const okBody = { content: [{ type: 'text', text: 'hello ' }, { type: 'text', text: 'world' }] };

describe('createBrowserLlmClient', () => {
  it('sends the right URL, headers, and body, and returns concatenated text', async () => {
    const fetchImpl = vi.fn(async (_url: string, _init?: RequestInit) => resp(200, okBody));
    const client = createBrowserLlmClient(() => 'sk-ant-key', fetchImpl as unknown as typeof fetch);
    const out = await client.complete({ system: 'sys', user: 'usr', maxTokens: 512 });

    expect(out).toBe('hello world');
    const [url, init] = fetchImpl.mock.calls[0];
    expect(url).toBe('https://api.anthropic.com/v1/messages');
    const headers = (init as RequestInit).headers as Record<string, string>;
    expect(headers['x-api-key']).toBe('sk-ant-key');
    expect(headers['anthropic-dangerous-direct-browser-access']).toBe('true');
    expect(headers['anthropic-version']).toBe('2023-06-01');
    const sent = JSON.parse((init as RequestInit).body as string);
    expect(sent.model).toBe('claude-sonnet-5');
    expect(sent.max_tokens).toBe(512);
    expect(sent.thinking).toEqual({ type: 'disabled' });
    expect(sent.system).toBe('sys');
    expect(sent.messages).toEqual([{ role: 'user', content: 'usr' }]);
  });

  it('defaults max_tokens to 1024', async () => {
    const fetchImpl = vi.fn(async (_url: string, _init?: RequestInit) => resp(200, okBody));
    await createBrowserLlmClient(() => 'k', fetchImpl as unknown as typeof fetch).complete({ system: 's', user: 'u' });
    expect(JSON.parse((fetchImpl.mock.calls[0][1] as RequestInit).body as string).max_tokens).toBe(1024);
  });

  it('throws and never calls fetch when no key is set', async () => {
    const fetchImpl = vi.fn();
    const client = createBrowserLlmClient(() => null, fetchImpl as unknown as typeof fetch);
    await expect(client.complete({ system: 's', user: 'u' })).rejects.toThrow(/API key/i);
    expect(fetchImpl).not.toHaveBeenCalled();
  });

  it('maps 401 to a friendly message that does not leak the key', async () => {
    const fetchImpl = vi.fn(async () => resp(401, { error: { message: 'invalid x-api-key' } }));
    const client = createBrowserLlmClient(() => 'sk-secret', fetchImpl as unknown as typeof fetch);
    await expect(client.complete({ system: 's', user: 'u' })).rejects.toThrow(/401/);
    await expect(
      createBrowserLlmClient(() => 'sk-secret', (async () => resp(401, {})) as unknown as typeof fetch).complete({ system: 's', user: 'u' }),
    ).rejects.not.toThrow(/sk-secret/);
  });

  it('throws a connection error when fetch rejects', async () => {
    const fetchImpl = vi.fn(async () => { throw new Error('network down'); });
    const client = createBrowserLlmClient(() => 'k', fetchImpl as unknown as typeof fetch);
    await expect(client.complete({ system: 's', user: 'u' })).rejects.toThrow(/reach Anthropic/i);
  });

  it('throws on empty content', async () => {
    const fetchImpl = vi.fn(async () => resp(200, { content: [] }));
    const client = createBrowserLlmClient(() => 'k', fetchImpl as unknown as typeof fetch);
    await expect(client.complete({ system: 's', user: 'u' })).rejects.toThrow(/empty/i);
  });
});
