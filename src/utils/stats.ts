import { ProgressData } from '../types/progress';
import { Question } from '../types/question';

export function getOverallStats(progress: ProgressData) {
  const answers = Object.values(progress.answers);
  const total = answers.length;
  const correct = answers.filter(a => a.isCorrect).length;
  return {
    total,
    correct,
    incorrect: total - correct,
    percentage: total > 0 ? Math.round((correct / total) * 100) : 0,
  };
}

export function getTopicStats(progress: ProgressData, questions: Question[]) {
  const byTopic = new Map<string, { correct: number; total: number; name: string }>();

  for (const q of questions) {
    if (!progress.answers[q.id]) continue;
    const existing = byTopic.get(q.topicId) || { correct: 0, total: 0, name: q.topicName };
    existing.total++;
    if (progress.answers[q.id].isCorrect) existing.correct++;
    byTopic.set(q.topicId, existing);
  }

  return Array.from(byTopic.entries()).map(([topicId, stats]) => ({
    topicId,
    ...stats,
    percentage: stats.total > 0 ? Math.round((stats.correct / stats.total) * 100) : 0,
  }));
}
