import { describe, it, expect } from 'vitest';
import { createLocalStore, STORAGE_KEY } from './localStore';
import { createSeedState } from '../../core';

function fakeStorage() {
  const map = new Map<string, string>();
  return {
    getItem: (k: string) => map.get(k) ?? null,
    setItem: (k: string, v: string) => void map.set(k, v),
    removeItem: (k: string) => void map.delete(k),
  };
}

describe('createLocalStore', () => {
  it('round-trips state through save/load', () => {
    const store = createLocalStore(fakeStorage());
    const state = createSeedState();
    store.save(state);
    expect(store.load()).toEqual(state);
  });
  it('returns null when nothing is stored', () => {
    expect(createLocalStore(fakeStorage()).load()).toBeNull();
  });
  it('returns null on corrupt (non-JSON) data', () => {
    const s = fakeStorage();
    s.setItem(STORAGE_KEY, 'not json{');
    expect(createLocalStore(s).load()).toBeNull();
  });
  it('returns null on valid JSON with the wrong shape', () => {
    const s = fakeStorage();
    s.setItem(STORAGE_KEY, JSON.stringify({ nope: true }));
    expect(createLocalStore(s).load()).toBeNull();
  });
  it('clear() removes persisted state', () => {
    const s = fakeStorage();
    const store = createLocalStore(s);
    store.save(createSeedState());
    store.clear();
    expect(store.load()).toBeNull();
  });
});
