export interface AnswerRecord {
  selectedAnswer: string;
  isCorrect: boolean;
  answeredAt: string;
  timeSpentMs: number;
  topicId: string;
}

export interface Session {
  id: string;
  startedAt: string;
  endedAt: string;
  questionIds: string[];
  score: number;
  total: number;
  topicIds: string[];
}

export interface ProgressData {
  version: 1;
  answers: Record<string, AnswerRecord>;
  sessions: Session[];
  bookmarkedQuestions: string[];
  lastTopicFilter: string[];
}

export const DEFAULT_PROGRESS: ProgressData = {
  version: 1,
  answers: {},
  sessions: [],
  bookmarkedQuestions: [],
  lastTopicFilter: [],
};

/** Count answered questions per topicId */
export function getAnsweredByTopic(progress: ProgressData): Record<string, number> {
  const counts: Record<string, number> = {};
  for (const record of Object.values(progress.answers)) {
    counts[record.topicId] = (counts[record.topicId] || 0) + 1;
  }
  return counts;
}
