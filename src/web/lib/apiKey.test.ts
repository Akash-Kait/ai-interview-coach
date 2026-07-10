import { describe, it, expect } from 'vitest';
import { createApiKeyStore } from './apiKey';

function fakeStorage() {
  const map = new Map<string, string>();
  return {
    getItem: (k: string) => map.get(k) ?? null,
    setItem: (k: string, v: string) => void map.set(k, v),
    removeItem: (k: string) => void map.delete(k),
  };
}

describe('createApiKeyStore', () => {
  it('returns null when no key is set', () => {
    expect(createApiKeyStore(fakeStorage()).get()).toBeNull();
  });
  it('sets, gets, and clears the key', () => {
    const store = createApiKeyStore(fakeStorage());
    store.set('sk-ant-abc');
    expect(store.get()).toBe('sk-ant-abc');
    store.clear();
    expect(store.get()).toBeNull();
  });
});
