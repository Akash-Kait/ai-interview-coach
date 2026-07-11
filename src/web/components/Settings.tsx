import { useMemo, useState } from 'react';
import type { AppState } from '../../core';
import { SEED_COMPANIES } from '../../core';
import type { AppAction } from '../hooks/useAppState';
import { createApiKeyStore, type ApiKeyStore } from '../lib/apiKey';
import {
  createLlmConfigStore,
  presetFor,
  PROVIDER_PRESETS,
  type LlmConfig,
  type LlmConfigStore,
  type LlmProvider,
} from '../lib/llmConfig';
import { exportStateToJson, parseImportedState } from '../lib/exportImport';
import { downloadTextFile } from '../lib/download';

interface SettingsProps {
  state: AppState;
  dispatch: React.Dispatch<AppAction>;
  apiKeyStore?: ApiKeyStore;
  llmConfigStore?: LlmConfigStore;
}

function maskKey(key: string): string {
  return `••••${key.slice(-4)}`;
}

const panel = 'space-y-3 rounded-lg border border-slate-800 bg-slate-900/50 p-4';
const field =
  'w-full rounded-md border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-100 outline-none focus-visible:border-cyan-400 focus-visible:ring-1 focus-visible:ring-cyan-400/50';
const btnGhost =
  'rounded-md border border-slate-700 px-3 py-2 text-sm text-slate-200 hover:bg-slate-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400/60';
const btnPrimary =
  'rounded-md bg-indigo-500 px-3 py-2 text-sm font-medium text-white hover:bg-indigo-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400/60';

export default function Settings({ state, dispatch, apiKeyStore, llmConfigStore }: SettingsProps) {
  const store = useMemo(() => apiKeyStore ?? createApiKeyStore(), [apiKeyStore]);
  const [savedKey, setSavedKey] = useState<string | null>(() => store.get());
  const [keyInput, setKeyInput] = useState('');
  const [showKey, setShowKey] = useState(false);
  const [importError, setImportError] = useState<string | null>(null);
  const [goalPct, setGoalPct] = useState(state.goal ? String(state.goal.targetReadiness) : '');
  const [goalDate, setGoalDate] = useState(
    state.goal ? new Date(state.goal.targetDate).toISOString().slice(0, 10) : '',
  );

  const configStore = useMemo(() => llmConfigStore ?? createLlmConfigStore(), [llmConfigStore]);
  const [config, setConfig] = useState<LlmConfig>(() => configStore.get());
  const preset = presetFor(config.provider);

  function updateConfig(next: LlmConfig) {
    setConfig(next);
    configStore.set(next);
  }
  function selectProvider(id: LlmProvider) {
    const p = presetFor(id);
    updateConfig({ provider: id, baseUrl: p.baseUrl, model: p.model });
  }

  function saveGoal() {
    const pct = Math.max(0, Math.min(100, Number(goalPct)));
    const t = Date.parse(goalDate);
    if (goalPct.trim() === '' || Number.isNaN(t)) return;
    dispatch({ type: 'setGoal', goal: { targetReadiness: pct, targetDate: t } });
  }
  function clearGoal() {
    dispatch({ type: 'setGoal', goal: undefined });
    setGoalPct('');
    setGoalDate('');
  }

  function handleSaveKey() {
    const trimmed = keyInput.trim();
    if (!trimmed) return;
    store.set(trimmed);
    setSavedKey(trimmed);
    setKeyInput('');
  }
  function handleClearKey() {
    store.clear();
    setSavedKey(null);
  }
  function handleExport() {
    const date = new Date().toISOString().slice(0, 10);
    downloadTextFile(`runway-progress-${date}.json`, exportStateToJson(state));
  }
  function handleImport(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const result = parseImportedState(String(reader.result));
      if (result.ok) {
        dispatch({ type: 'replace', state: result.state });
        setImportError(null);
      } else {
        setImportError(result.error);
      }
    };
    reader.onerror = () => setImportError('Could not read that file.');
    reader.readAsText(file);
    e.target.value = ''; // allow re-importing the same file
  }

  return (
    <section className="space-y-6">
      <h2 className="text-lg font-semibold text-slate-100">Settings</h2>

      <div className={panel}>
        <h3 className="text-sm font-medium text-slate-200">AI provider</h3>

        <label htmlFor="provider" className="block text-sm text-slate-300">
          Provider
          <select
            id="provider"
            className={`mt-1 ${field}`}
            value={config.provider}
            onChange={(e) => selectProvider(e.target.value as LlmProvider)}
          >
            {PROVIDER_PRESETS.map((p) => (
              <option key={p.id} value={p.id}>
                {p.label}
              </option>
            ))}
          </select>
        </label>

        {config.provider !== 'anthropic' && (
          <>
            <label htmlFor="base-url" className="block text-sm text-slate-300">
              Base URL
              <input
                id="base-url"
                className={`mt-1 ${field}`}
                value={config.baseUrl}
                onChange={(e) => updateConfig({ ...config, baseUrl: e.target.value })}
                readOnly={!preset.editableBaseUrl}
                placeholder="https://api.example.com/v1"
                autoComplete="off"
              />
            </label>
            <label htmlFor="model" className="block text-sm text-slate-300">
              Model
              <input
                id="model"
                className={`mt-1 ${field}`}
                value={config.model}
                onChange={(e) => updateConfig({ ...config, model: e.target.value })}
                readOnly={!preset.editableModel}
                placeholder="model-name"
                autoComplete="off"
              />
            </label>
          </>
        )}

        <label htmlFor="api-key" className="block text-sm font-medium text-slate-200">
          {preset.label} API key
        </label>
        <div className="flex gap-2">
          <input
            id="api-key"
            type={showKey ? 'text' : 'password'}
            value={keyInput}
            onChange={(e) => setKeyInput(e.target.value)}
            placeholder={savedKey ? maskKey(savedKey) : 'Paste your key'}
            autoComplete="off"
            className={field}
          />
          <button type="button" onClick={() => setShowKey((s) => !s)} className={btnGhost}>
            {showKey ? 'Hide' : 'Show'}
          </button>
          <button type="button" onClick={handleSaveKey} className={btnPrimary}>
            Save key
          </button>
        </div>
        {savedKey ? (
          <p className="text-xs text-emerald-400">
            A key is saved ({maskKey(savedKey)}).{' '}
            <button
              type="button"
              onClick={handleClearKey}
              className="underline hover:text-emerald-300 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-emerald-400/60"
            >
              Clear
            </button>
          </p>
        ) : (
          <p className="text-xs text-amber-400">AI features are disabled until you add a key.</p>
        )}
        <p className="text-xs text-slate-500">
          Your key is stored only in this browser (localStorage) and is sent only to your chosen provider — never to us.
          It is excluded from export/import.
        </p>
      </div>

      <div className={panel}>
        <label htmlFor="company" className="block text-sm font-medium text-slate-200">
          Target company
        </label>
        <select
          id="company"
          value={state.companyId}
          onChange={(e) => dispatch({ type: 'setCompany', companyId: e.target.value })}
          className={field}
        >
          {SEED_COMPANIES.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
        <p className="text-xs text-slate-500">Re-weights your readiness gauge for that company's priorities.</p>
      </div>

      <div className={panel}>
        <h3 className="text-sm font-medium text-slate-200">Readiness goal</h3>
        <div className="flex flex-wrap gap-3">
          <label className="flex-1 text-sm text-slate-300">
            Target readiness %
            <input type="number" min={0} max={100} className={`mt-1 ${field}`} value={goalPct} onChange={(e) => setGoalPct(e.target.value)} placeholder="80" />
          </label>
          <label className="flex-1 text-sm text-slate-300">
            Target date
            <input type="date" className={`mt-1 ${field}`} value={goalDate} onChange={(e) => setGoalDate(e.target.value)} />
          </label>
        </div>
        <div className="flex gap-2">
          <button type="button" onClick={saveGoal} className={btnPrimary}>Save goal</button>
          {state.goal && <button type="button" onClick={clearGoal} className={btnGhost}>Clear goal</button>}
        </div>
        <p className="text-xs text-slate-500">No pressure — move the date anytime. It's a guide, not a deadline.</p>
      </div>

      <div className={panel}>
        <h3 className="text-sm font-medium text-slate-200">Your data</h3>
        <div className="flex flex-wrap items-center gap-3">
          <button type="button" onClick={handleExport} className={btnGhost}>
            Export progress
          </button>
          <label
            htmlFor="import"
            className="cursor-pointer rounded-md border border-slate-700 px-3 py-2 text-sm text-slate-200 hover:bg-slate-800 focus-within:outline-none focus-within:ring-2 focus-within:ring-cyan-400/60"
          >
            Import progress
            <input
              id="import"
              type="file"
              accept="application/json,.json"
              onChange={handleImport}
              className="sr-only"
            />
          </label>
        </div>
        {importError && <p className="text-xs text-rose-400">{importError}</p>}
        <p className="text-xs text-slate-500">Export/import never includes your API key.</p>
      </div>
    </section>
  );
}
