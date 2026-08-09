import { useState, useCallback } from 'react';
import { Question } from '../types/question';
import { ProgressData } from '../types/progress';
import { loadMultipleCategories, Tier } from '../utils/questionLoader';
import { shuffle } from '../utils/shuffle';

export function useQuestions() {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(false);

  // Load questions for quiz — filters out already-completed questions
  const loadQuestions = useCallback(async (
    categoryIds: string[],
    selectedTopicIds: Set<string>,
    progress: ProgressData,
    tier: Tier = 'standard',
  ) => {
    setLoading(true);
    try {
      const categories = await loadMultipleCategories(categoryIds, tier);
      const all = categories.flatMap(c => c.questions);
      const filtered = all.filter(q =>
        selectedTopicIds.has(q.topicId) && !progress.answers[q.id]
      );
      setQuestions(shuffle(filtered));
    } catch (err) {
      console.error('Failed to load questions:', err);
      setQuestions([]);
    } finally {
      setLoading(false);
    }
  }, []);

  // Load ONLY the questions he has answered incorrectly, as a retake.
  //
  // Deliberately does not filter out answered questions the way loadQuestions
  // does - every question here has been answered, that is the point. The set is
  // resolved once, here, so the run is fixed at the moment he starts it: fixing
  // one must not make the list shrink under him mid-quiz.
  const loadMissedQuestions = useCallback(async (
    categoryIds: string[],
    progress: ProgressData,
    tier: Tier = 'standard',
  ) => {
    setLoading(true);
    try {
      const categories = await loadMultipleCategories(categoryIds, tier);
      const all = categories.flatMap(c => c.questions);
      const missed = all.filter(q => {
        const a = progress.answers[q.id];
        return a && !a.isCorrect;
      });
      setQuestions(shuffle(missed));
      return missed.length;
    } catch (err) {
      console.error('Failed to load missed questions:', err);
      setQuestions([]);
      return 0;
    } finally {
      setLoading(false);
    }
  }, []);

  // Load all questions (for dashboard/review — no filtering)
  const loadAllQuestions = useCallback(async (categoryIds: string[], tier: Tier = 'standard') => {
    setLoading(true);
    try {
      const categories = await loadMultipleCategories(categoryIds, tier);
      const all = categories.flatMap(c => c.questions);
      setQuestions(all);
    } catch (err) {
      console.error('Failed to load questions:', err);
      setQuestions([]);
    } finally {
      setLoading(false);
    }
  }, []);

  return { questions, loading, loadQuestions, loadMissedQuestions, loadAllQuestions };
}
