import { describe, it, expect } from 'vitest';
import {
  createLlmConfigStore,
  DEFAULT_LLM_CONFIG,
  PROVIDER_PRESETS,
  presetFor,
  providerModelLabel,
  LLM_CONFIG_STORAGE_KEY,
} from './llmConfig';

function fakeStorage() {
  const map = new Map<string, string>();
  return {
    getItem: (k: string) => map.get(k) ?? null,
    setItem: (k: string, v: string) => void map.set(k, v),
    removeItem: (k: string) => void map.delete(k),
  };
}

describe('llmConfig', () => {
  it('defaults to Anthropic when nothing is stored', () => {
    expect(createLlmConfigStore(fakeStorage()).get()).toEqual(DEFAULT_LLM_CONFIG);
    expect(DEFAULT_LLM_CONFIG.provider).toBe('anthropic');
  });
  it('round-trips a saved config', () => {
    const store = createLlmConfigStore(fakeStorage());
    const cfg = { provider: 'groq' as const, baseUrl: 'https://api.groq.com/openai/v1', model: 'llama-3.3-70b-versatile' };
    store.set(cfg);
    expect(store.get()).toEqual(cfg);
  });
  it('falls back to the default on corrupt data', () => {
    const s = fakeStorage();
    s.setItem(LLM_CONFIG_STORAGE_KEY, 'not json');
    expect(createLlmConfigStore(s).get()).toEqual(DEFAULT_LLM_CONFIG);
  });
  it('presets cover the four providers with the required Groq/Gemini defaults', () => {
    expect(PROVIDER_PRESETS.map((p) => p.id)).toEqual(['anthropic', 'groq', 'gemini', 'custom']);
    expect(presetFor('groq').baseUrl).toBe('https://api.groq.com/openai/v1');
    expect(presetFor('groq').model).toBe('llama-3.3-70b-versatile');
    expect(presetFor('gemini').baseUrl).toContain('generativelanguage.googleapis.com');
    expect(presetFor('custom').editableBaseUrl).toBe(true);
  });
  it('providerModelLabel reads provider + model', () => {
    expect(providerModelLabel({ provider: 'groq', baseUrl: 'x', model: 'llama-3.3-70b-versatile' })).toBe(
      'Groq · llama-3.3-70b-versatile',
    );
  });
});
