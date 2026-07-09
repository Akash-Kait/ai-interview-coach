import type { QuizResult, TranscriptResult } from '../domain/types';

export interface LlmClient {
  complete(req: { system: string; user: string; maxTokens?: number }): Promise<string>;
}

export interface AssessmentProvider {
  generateQuestion(i: {
    competencyLabel: string;
    topicLabel: string;
    style: 'technical' | 'behavioral';
    avoid: string[];
  }): Promise<string>;

  gradeAnswer(i: {
    question: string;
    answer: string;
    style: 'technical' | 'behavioral';
  }): Promise<QuizResult>;

  evaluateTranscript(i: {
    prompt: string;
    transcript: string;
    kind: 'mlsd' | 'sd';
  }): Promise<TranscriptResult>;
}
