// @vitest-environment jsdom
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import SkillQuiz from './SkillQuiz';
import { createSeedState } from '../../core';
import type { AppState, AssessmentProvider } from '../../core';
import type { ApiKeyStore } from '../lib/apiKey';

const keyed: ApiKeyStore = { get: () => 'k', set: () => {}, clear: () => {} };
const noKey: ApiKeyStore = { get: () => null, set: () => {}, clear: () => {} };

function fakeProvider(overrides: Partial<AssessmentProvider> = {}): AssessmentProvider {
  return {
    generateQuestion: vi.fn(async () => 'What is a hash map?'),
    gradeAnswer: vi.fn(async () => ({
      score: 82, verdict: 'Solid', strengths: ['clear'], gaps: ['edges'], modelAnswer: 'A map.',
    })),
    evaluateTranscript: vi.fn(),
    ...overrides,
  };
}

function oneTopic(competency: 'be' | 'beh', best = 0): AppState {
  return { ...createSeedState(), topics: [{ id: 't1', label: 'Caching', competency, best, asked: [] }] };
}

describe('SkillQuiz', () => {
  it('shows a topic + best and, with no key, a prompt and disabled button', () => {
    render(<SkillQuiz state={oneTopic('be', 60)} dispatch={vi.fn()} provider={fakeProvider()} apiKeyStore={noKey} />);
    expect(screen.getByText('Caching')).toBeInTheDocument();
    expect(screen.getByText('60')).toBeInTheDocument();
    expect(screen.getByText(/add your.*key/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /take quiz|new quiz/i })).toBeDisabled();
  });

  it('runs the quiz: generate → answer → grade', async () => {
    const dispatch = vi.fn();
    const provider = fakeProvider();
    render(<SkillQuiz state={oneTopic('be')} dispatch={dispatch} provider={provider} apiKeyStore={keyed} />);
    await userEvent.click(screen.getByRole('button', { name: /take quiz/i }));
    expect(await screen.findByText('What is a hash map?')).toBeInTheDocument();
    expect(provider.generateQuestion).toHaveBeenCalledWith(expect.objectContaining({ style: 'technical', avoid: [] }));
    await userEvent.type(screen.getByLabelText(/your answer/i), 'It maps keys to values.');
    await userEvent.click(screen.getByRole('button', { name: /submit/i }));
    expect(await screen.findByText('Solid')).toBeInTheDocument();
    expect(screen.getByText(/82/)).toBeInTheDocument();
    expect(dispatch).toHaveBeenCalledWith({ type: 'recordQuiz', topicId: 't1', score: 82 });
  });

  it('uses behavioral style for behavioral topics', async () => {
    const provider = fakeProvider();
    render(<SkillQuiz state={oneTopic('beh')} dispatch={vi.fn()} provider={provider} apiKeyStore={keyed} />);
    await userEvent.click(screen.getByRole('button', { name: /take quiz/i }));
    await screen.findByText('What is a hash map?');
    expect(provider.generateQuestion).toHaveBeenCalledWith(expect.objectContaining({ style: 'behavioral' }));
  });

  it('surfaces an error and allows retry', async () => {
    let n = 0;
    const provider = fakeProvider({
      generateQuestion: async () => {
        if (n++ === 0) throw new Error('boom');
        return 'Q2?';
      },
    });
    render(<SkillQuiz state={oneTopic('be')} dispatch={vi.fn()} provider={provider} apiKeyStore={keyed} />);
    await userEvent.click(screen.getByRole('button', { name: /take quiz/i }));
    expect(await screen.findByText(/boom/i)).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: /retry/i }));
    expect(await screen.findByText('Q2?')).toBeInTheDocument();
  });
});
