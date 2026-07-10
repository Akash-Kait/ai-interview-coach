import { describe, it, expect } from 'vitest';
import { gradePrompt, questionPrompt, transcriptPrompt } from './prompts';

describe('questionPrompt', () => {
  it('technical: names the competency, asks for one question only, lists avoids', () => {
    const { system, user } = questionPrompt({
      competencyLabel: 'ML Fundamentals', topicLabel: 'Bias-variance', style: 'technical', avoid: ['Q1', 'Q2'],
    });
    expect(system).toContain('ML Fundamentals');
    expect(system).not.toMatch(/STAR/);
    expect(user).toContain('ONLY the question');
    expect(user).toContain('Q1');
    expect(user).toContain('Q2');
  });
  it('behavioral: uses STAR and handles empty avoid', () => {
    const { system, user } = questionPrompt({
      competencyLabel: 'Behavioral', topicLabel: 'Conflict', style: 'behavioral', avoid: [],
    });
    expect(system).toContain('STAR');
    expect(user).toContain('(none)');
  });
});

describe('gradePrompt', () => {
  it('embeds question + answer and requests JSON; behavioral adds STAR', () => {
    const t = gradePrompt({ question: 'Explain X', answer: 'Because Y', style: 'technical' });
    expect(t.user).toContain('Explain X');
    expect(t.user).toContain('Because Y');
    expect(t.system).toContain('JSON');
    expect(t.system).not.toMatch(/STAR/);
    expect(gradePrompt({ question: 'q', answer: 'a', style: 'behavioral' }).system).toContain('STAR');
  });
});

describe('transcriptPrompt', () => {
  it('maps kind to the domain label', () => {
    expect(transcriptPrompt({ prompt: 'p', transcript: 't', kind: 'mlsd' }).system).toContain('ML system design');
    expect(transcriptPrompt({ prompt: 'p', transcript: 't', kind: 'sd' }).system).toContain('system design');
  });
});
