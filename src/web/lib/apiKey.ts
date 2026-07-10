type KeyValueStore = Pick<Storage, 'getItem' | 'setItem' | 'removeItem'>;

export const API_KEY_STORAGE_KEY = 'runway.apiKey';

export interface ApiKeyStore {
  get(): string | null;
  set(key: string): void;
  clear(): void;
}

/** The Anthropic key lives in its OWN entry — never in AppState/export, never logged. */
export function createApiKeyStore(storage: KeyValueStore = localStorage): ApiKeyStore {
  return {
    get() {
      try {
        return storage.getItem(API_KEY_STORAGE_KEY);
      } catch {
        return null;
      }
    },
    set(key) {
      try {
        storage.setItem(API_KEY_STORAGE_KEY, key);
      } catch {
        // ignore
      }
    },
    clear() {
      try {
        storage.removeItem(API_KEY_STORAGE_KEY);
      } catch {
        // ignore
      }
    },
  };
}
