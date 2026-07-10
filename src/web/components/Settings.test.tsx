// @vitest-environment jsdom
import { describe, it, expect, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import Settings from './Settings';
import { createSeedState } from '../../core';
import type { ApiKeyStore } from '../lib/apiKey';

vi.mock('../lib/download', () => ({ downloadTextFile: vi.fn() }));
import { downloadTextFile } from '../lib/download';

function fakeApiKeyStore(initial: string | null = null): ApiKeyStore {
  let key = initial;
  return { get: () => key, set: (k) => { key = k; }, clear: () => { key = null; } };
}

describe('Settings', () => {
  it('changing company dispatches setCompany', async () => {
    const dispatch = vi.fn();
    render(<Settings state={createSeedState()} dispatch={dispatch} apiKeyStore={fakeApiKeyStore('k')} />);
    await userEvent.selectOptions(screen.getByLabelText(/target company/i), 'ml-heavy');
    expect(dispatch).toHaveBeenCalledWith({ type: 'setCompany', companyId: 'ml-heavy' });
  });

  it('shows the AI-disabled note when no key is set', () => {
    render(<Settings state={createSeedState()} dispatch={vi.fn()} apiKeyStore={fakeApiKeyStore(null)} />);
    expect(screen.getByText(/ai features are disabled/i)).toBeInTheDocument();
  });

  it('saves an entered key and hides the disabled note', async () => {
    const store = fakeApiKeyStore(null);
    render(<Settings state={createSeedState()} dispatch={vi.fn()} apiKeyStore={store} />);
    await userEvent.type(screen.getByLabelText(/anthropic api key/i), 'sk-ant-secret123');
    await userEvent.click(screen.getByRole('button', { name: /save key/i }));
    expect(store.get()).toBe('sk-ant-secret123');
    expect(screen.queryByText(/ai features are disabled/i)).not.toBeInTheDocument();
  });

  it('exports progress as JSON via the download helper', async () => {
    render(<Settings state={createSeedState()} dispatch={vi.fn()} apiKeyStore={fakeApiKeyStore('k')} />);
    await userEvent.click(screen.getByRole('button', { name: /export progress/i }));
    expect(downloadTextFile).toHaveBeenCalledOnce();
    const [, text] = vi.mocked(downloadTextFile).mock.calls[0];
    expect(JSON.parse(text).companyId).toBe('generalist');
  });

  it('imports a valid progress file and dispatches replace', async () => {
    const dispatch = vi.fn();
    render(<Settings state={createSeedState()} dispatch={dispatch} apiKeyStore={fakeApiKeyStore('k')} />);
    const imported = { ...createSeedState(), companyId: 'backend-infra' };
    const file = new File([JSON.stringify(imported)], 'runway.json', { type: 'application/json' });
    await userEvent.upload(screen.getByLabelText(/import progress/i), file);
    await waitFor(() =>
      expect(dispatch).toHaveBeenCalledWith({ type: 'replace', state: imported }),
    );
  });
});
