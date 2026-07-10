type Style = 'technical' | 'behavioral';

export function questionPrompt(i: {
  competencyLabel: string;
  topicLabel: string;
  style: Style;
  avoid: string[];
}): { system: string; user: string } {
  const system =
    i.style === 'behavioral'
      ? 'You are a senior interviewer running a behavioral interview. Ask one question at a time that can be answered with the STAR framework (Situation, Task, Action, Result). Probe for concrete, reflective examples — never trivia.'
      : `You are a senior interviewer running a technical interview on ${i.competencyLabel}. Ask one focused, interview-level question at a time that probes understanding and reasoning, not recall of facts.`;
  const avoid = i.avoid.length ? i.avoid.map((q) => `- ${q}`).join('\n') : '(none)';
  const user = `Topic: ${i.topicLabel}\n\nAsk ONE fresh interview question on this topic${
    i.style === 'behavioral' ? ' (answerable with STAR)' : ''
  }. Do not repeat or closely paraphrase any of these previously asked questions:\n${avoid}\n\nReturn ONLY the question text — no preamble, numbering, or commentary.`;
  return { system, user };
}

export function gradePrompt(i: {
  question: string;
  answer: string;
  style: Style;
}): { system: string; user: string } {
  const rubric =
    i.style === 'behavioral'
      ? 'Grade with the STAR framework (Situation, Task, Action, Result). Reward concrete, structured answers with a clear result; penalize vague or generic ones.'
      : 'Reward correct reasoning and depth; penalize hand-waving and recall without understanding.';
  const system = `You are a rigorous interviewer grading a candidate's written answer. ${rubric} Score 0–100, where 75 is a solid pass. Respond with ONLY a JSON object — no code fences, no prose.`;
  const user = `Question:\n${i.question}\n\nCandidate answer:\n${i.answer}\n\nReturn a JSON object with exactly these fields:\n{"score": <integer 0-100>, "verdict": "<short phrase>", "strengths": ["<up to 3>"], "gaps": ["<up to 3>"], "modelAnswer": "<2-3 sentence ideal answer>"}`;
  return { system, user };
}

export function transcriptPrompt(i: {
  prompt: string;
  transcript: string;
  kind: 'mlsd' | 'sd';
}): { system: string; user: string } {
  const domain = i.kind === 'mlsd' ? 'ML system design' : 'system design';
  const system = `You are an expert ${domain} interviewer evaluating a full interview transcript. Judge problem structuring, tradeoff reasoning, and coverage of the key areas for this kind of problem. Score 0–100, where 75 is a solid pass. Respond with ONLY a JSON object — no code fences, no prose.`;
  const user = `Problem:\n${i.prompt}\n\nTranscript:\n${i.transcript}\n\nReturn a JSON object with exactly these fields:\n{"score": <integer 0-100>, "summary": "<2-3 sentences>", "strengths": ["<list>"], "gaps": ["<list>"], "focus": ["<up to 2 next steps>"]}`;
  return { system, user };
}
