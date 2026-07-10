import type { AssessmentProvider, LlmClient } from './provider';
import type { QuizResult, TranscriptResult } from '../domain/types';
import { gradePrompt, questionPrompt, transcriptPrompt } from './prompts';

const QUESTION_MAX_TOKENS = 512;
const GRADE_MAX_TOKENS = 1024;
const TRANSCRIPT_MAX_TOKENS = 1024;

function stripFences(s: string): string {
  const t = s.trim();
  const m = t.match(/^```(?:json)?\s*([\s\S]*?)\s*```$/);
  return m ? m[1].trim() : t;
}

function parseObject(raw: string): Record<string, unknown> {
  const cleaned = stripFences(raw);
  const start = cleaned.indexOf('{');
  const end = cleaned.lastIndexOf('}');
  const candidate = start !== -1 && end > start ? cleaned.slice(start, end + 1) : cleaned;
  let parsed: unknown;
  try {
    parsed = JSON.parse(candidate);
  } catch {
    throw new Error('The model did not return valid JSON. Please try again.');
  }
  if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed)) {
    throw new Error('The model response was not a JSON object. Please try again.');
  }
  return parsed as Record<string, unknown>;
}

function clampScore(v: unknown): number {
  const n = typeof v === 'number' ? v : Number(v);
  if (!Number.isFinite(n)) return 0;
  return Math.max(0, Math.min(100, Math.round(n)));
}

function str(v: unknown): string {
  return typeof v === 'string' ? v.trim() : '';
}

function strList(v: unknown, cap?: number): string[] {
  if (!Array.isArray(v)) return [];
  const list = v.filter((x): x is string => typeof x === 'string').map((x) => x.trim()).filter(Boolean);
  return cap === undefined ? list : list.slice(0, cap);
}

export class AnthropicAssessmentProvider implements AssessmentProvider {
  private readonly llm: LlmClient;

  constructor(llm: LlmClient) {
    this.llm = llm;
  }

  async generateQuestion(i: {
    competencyLabel: string;
    topicLabel: string;
    style: 'technical' | 'behavioral';
    avoid: string[];
  }): Promise<string> {
    const { system, user } = questionPrompt(i);
    const raw = await this.llm.complete({ system, user, maxTokens: QUESTION_MAX_TOKENS });
    const text = stripFences(raw).trim();
    if (!text) throw new Error('The model returned an empty question. Please try again.');
    return text;
  }

  async gradeAnswer(i: {
    question: string;
    answer: string;
    style: 'technical' | 'behavioral';
  }): Promise<QuizResult> {
    const { system, user } = gradePrompt(i);
    const raw = await this.llm.complete({ system, user, maxTokens: GRADE_MAX_TOKENS });
    const o = parseObject(raw);
    return {
      score: clampScore(o.score),
      verdict: str(o.verdict),
      strengths: strList(o.strengths, 3),
      gaps: strList(o.gaps, 3),
      modelAnswer: str(o.modelAnswer),
    };
  }

  async evaluateTranscript(i: {
    prompt: string;
    transcript: string;
    kind: 'mlsd' | 'sd';
  }): Promise<TranscriptResult> {
    const { system, user } = transcriptPrompt(i);
    const raw = await this.llm.complete({ system, user, maxTokens: TRANSCRIPT_MAX_TOKENS });
    const o = parseObject(raw);
    return {
      score: clampScore(o.score),
      summary: str(o.summary),
      strengths: strList(o.strengths),
      gaps: strList(o.gaps),
      focus: strList(o.focus, 2),
    };
  }
}
