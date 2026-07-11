type KeyValueStore = Pick<Storage, 'getItem' | 'setItem' | 'removeItem'>;

export const LLM_CONFIG_STORAGE_KEY = 'runway.llm';

export type LlmProvider = 'anthropic' | 'groq' | 'gemini' | 'custom';

export interface LlmConfig {
  provider: LlmProvider;
  baseUrl: string; // ignored for anthropic (fixed endpoint)
  model: string;
}

export interface ProviderPreset {
  id: LlmProvider;
  label: string;
  baseUrl: string;
  model: string;
  editableBaseUrl: boolean;
  editableModel: boolean;
}

export const PROVIDER_PRESETS: ProviderPreset[] = [
  { id: 'anthropic', label: 'Anthropic', baseUrl: '', model: 'claude-sonnet-5', editableBaseUrl: false, editableModel: false },
  { id: 'groq', label: 'Groq', baseUrl: 'https://api.groq.com/openai/v1', model: 'llama-3.3-70b-versatile', editableBaseUrl: false, editableModel: true },
  { id: 'gemini', label: 'Google Gemini', baseUrl: 'https://generativelanguage.googleapis.com/v1beta/openai', model: 'gemini-2.5-flash', editableBaseUrl: false, editableModel: true },
  { id: 'custom', label: 'Custom / OpenAI-compatible', baseUrl: '', model: '', editableBaseUrl: true, editableModel: true },
];

export const DEFAULT_LLM_CONFIG: LlmConfig = { provider: 'anthropic', baseUrl: '', model: 'claude-sonnet-5' };

export function presetFor(provider: LlmProvider): ProviderPreset {
  return PROVIDER_PRESETS.find((p) => p.id === provider) ?? PROVIDER_PRESETS[0];
}

/** Human label for the "which brain is grading" readout. */
export function providerModelLabel(config: LlmConfig): string {
  return `${presetFor(config.provider).label} · ${config.model || 'no model'}`;
}

function isLlmConfig(v: unknown): v is LlmConfig {
  if (typeof v !== 'object' || v === null) return false;
  const c = v as Record<string, unknown>;
  return typeof c.provider === 'string' && typeof c.baseUrl === 'string' && typeof c.model === 'string';
}

export interface LlmConfigStore {
  get(): LlmConfig;
  set(config: LlmConfig): void;
}

/** Provider/baseUrl/model live in their own entry (not AppState, so core is untouched
 *  and export/import excludes them, like the API key). */
export function createLlmConfigStore(storage: KeyValueStore = localStorage): LlmConfigStore {
  return {
    get() {
      try {
        const raw = storage.getItem(LLM_CONFIG_STORAGE_KEY);
        if (raw === null) return DEFAULT_LLM_CONFIG;
        const parsed: unknown = JSON.parse(raw);
        return isLlmConfig(parsed) ? parsed : DEFAULT_LLM_CONFIG;
      } catch {
        return DEFAULT_LLM_CONFIG;
      }
    },
    set(config) {
      try {
        storage.setItem(LLM_CONFIG_STORAGE_KEY, JSON.stringify(config));
      } catch {
        // ignore
      }
    },
  };
}
