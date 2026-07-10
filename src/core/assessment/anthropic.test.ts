import { describe, it, expect, vi } from 'vitest';
import { AnthropicAssessmentProvider } from './anthropic';
import type { LlmClient } from './provider';

const llmReturning = (reply: string): LlmClient => ({ complete: async () => reply });

describe('gradeAnswer', () => {
  it('parses a clean JSON object', async () => {
    const p = new AnthropicAssessmentProvider(
      llmReturning('{"score":82,"verdict":"solid","strengths":["a"],"gaps":["b"],"modelAnswer":"do X"}'),
    );
    expect(await p.gradeAnswer({ question: 'q', answer: 'a', style: 'technical' })).toEqual({
      score: 82, verdict: 'solid', strengths: ['a'], gaps: ['b'], modelAnswer: 'do X',
    });
  });
  it('strips ```json fences and extracts an object wrapped in prose', async () => {
    const p = new AnthropicAssessmentProvider(
      llmReturning('Here you go:\n```json\n{"score":50,"verdict":"ok","strengths":[],"gaps":[],"modelAnswer":"m"}\n```'),
    );
    expect((await p.gradeAnswer({ question: 'q', answer: 'a', style: 'technical' })).score).toBe(50);
  });
  it('clamps and rounds the score', async () => {
    const hi = new AnthropicAssessmentProvider(llmReturning('{"score":150}'));
    const lo = new AnthropicAssessmentProvider(llmReturning('{"score":-5}'));
    const bad = new AnthropicAssessmentProvider(llmReturning('{"score":"abc"}'));
    const frac = new AnthropicAssessmentProvider(llmReturning('{"score":87.6}'));
    expect((await hi.gradeAnswer({ question: 'q', answer: 'a', style: 'technical' })).score).toBe(100);
    expect((await lo.gradeAnswer({ question: 'q', answer: 'a', style: 'technical' })).score).toBe(0);
    expect((await bad.gradeAnswer({ question: 'q', answer: 'a', style: 'technical' })).score).toBe(0);
    expect((await frac.gradeAnswer({ question: 'q', answer: 'a', style: 'technical' })).score).toBe(88);
  });
  it('caps strengths/gaps to 3 and drops non-strings', async () => {
    const p = new AnthropicAssessmentProvider(
      llmReturning('{"score":70,"strengths":["a","b","c","d"],"gaps":[1,"x"]}'),
    );
    const r = await p.gradeAnswer({ question: 'q', answer: 'a', style: 'technical' });
    expect(r.strengths).toEqual(['a', 'b', 'c']);
    expect(r.gaps).toEqual(['x']);
  });
  it('throws on non-JSON output', async () => {
    const p = new AnthropicAssessmentProvider(llmReturning('I cannot grade this.'));
    await expect(p.gradeAnswer({ question: 'q', answer: 'a', style: 'technical' })).rejects.toThrow();
  });
  it('passes maxTokens and the built prompt to the client', async () => {
    const complete = vi.fn(async (_req: { system: string; user: string; maxTokens?: number }) => '{"score":75}');
    const p = new AnthropicAssessmentProvider({ complete });
    await p.gradeAnswer({ question: 'Explain caching', answer: 'a', style: 'technical' });
    expect(complete).toHaveBeenCalledOnce();
    const arg = complete.mock.calls[0][0];
    expect(arg.maxTokens).toBe(1024);
    expect(arg.user).toContain('Explain caching');
  });
});

describe('generateQuestion', () => {
  it('returns cleaned text', async () => {
    const p = new AnthropicAssessmentProvider(llmReturning('  What is a B-tree?  '));
    expect(await p.generateQuestion({ competencyLabel: 'DE', topicLabel: 'indexing', style: 'technical', avoid: [] })).toBe(
      'What is a B-tree?',
    );
  });
});

describe('evaluateTranscript', () => {
  it('caps focus to 2', async () => {
    const p = new AnthropicAssessmentProvider(
      llmReturning('{"score":60,"summary":"s","strengths":["a"],"gaps":["b"],"focus":["1","2","3"]}'),
    );
    expect((await p.evaluateTranscript({ prompt: 'p', transcript: 't', kind: 'sd' })).focus).toEqual(['1', '2']);
  });
});
