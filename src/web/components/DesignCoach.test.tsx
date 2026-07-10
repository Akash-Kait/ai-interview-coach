// @vitest-environment jsdom
import { describe, it, expect, vi } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import DesignCoach from './DesignCoach';
import { createSeedState } from '../../core';
import type { AppState, AssessmentProvider } from '../../core';
import type { ApiKeyStore } from '../lib/apiKey';

const keyed: ApiKeyStore = { get: () => 'k', set: () => {}, clear: () => {} };

function fakeProvider(overrides: Partial<AssessmentProvider> = {}): AssessmentProvider {
  return {
    generateQuestion: vi.fn(),
    gradeAnswer: vi.fn(),
    evaluateTranscript: vi.fn(async () => ({
      score: 68, summary: 'Reasonable structure.', strengths: ['clear reqs'], gaps: ['no capacity math'], focus: ['estimate QPS'],
    })),
    ...overrides,
  };
}

const long = 'x'.repeat(250);

describe('DesignCoach', () => {
  it('rejects a too-short transcript without calling the model', async () => {
    const provider = fakeProvider();
    render(<DesignCoach state={createSeedState()} dispatch={vi.fn()} provider={provider} apiKeyStore={keyed} />);
    await userEvent.click(screen.getByLabelText(/transcript/i));
    await userEvent.paste('too short');
    await userEvent.click(screen.getByRole('button', { name: /evaluate/i }));
    expect(screen.getByText(/at least/i)).toBeInTheDocument();
    expect(provider.evaluateTranscript).not.toHaveBeenCalled();
  });

  it('evaluates a transcript and stores an eval', async () => {
    const dispatch = vi.fn();
    const provider = fakeProvider();
    render(<DesignCoach state={createSeedState()} dispatch={dispatch} provider={provider} apiKeyStore={keyed} />);
    await userEvent.click(screen.getByLabelText(/transcript/i));
    await userEvent.paste(long);
    await userEvent.click(screen.getByRole('button', { name: /evaluate/i }));
    expect(await screen.findByText('Reasonable structure.')).toBeInTheDocument();
    expect(screen.getByText(/68/)).toBeInTheDocument();
    expect(provider.evaluateTranscript).toHaveBeenCalledWith(expect.objectContaining({ kind: 'sd', transcript: long }));
    expect(dispatch).toHaveBeenCalledWith(
      expect.objectContaining({ type: 'addEval', record: expect.objectContaining({ competency: 'sd', score: 68 }) }),
    );
  });

  it('lists past sessions for the current mode', () => {
    const s: AppState = {
      ...createSeedState(),
      evals: [{ id: 'e1', competency: 'sd', prompt: 'Design a URL shortener', score: 70, summary: 'ok', at: 0 }],
    };
    render(<DesignCoach state={s} dispatch={vi.fn()} provider={fakeProvider()} apiKeyStore={keyed} />);
    expect(within(screen.getByRole('region', { name: /past sessions/i })).getByText(/URL shortener/)).toBeInTheDocument();
  });

  it('gates on a missing key', () => {
    render(<DesignCoach state={createSeedState()} dispatch={vi.fn()} provider={fakeProvider()} apiKeyStore={{ get: () => null, set: () => {}, clear: () => {} }} />);
    expect(screen.getByText(/add your.*key/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /evaluate/i })).toBeDisabled();
  });
});
