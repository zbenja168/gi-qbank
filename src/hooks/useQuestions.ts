import { useState, useCallback } from 'react';
import { Question } from '../types/question';
import { ProgressData } from '../types/progress';
import { loadMultipleCategories } from '../utils/questionLoader';
import { shuffle } from '../utils/shuffle';

export function useQuestions() {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(false);

  // Load questions for quiz — filters out already-completed questions
  const loadQuestions = useCallback(async (
    categoryIds: string[],
    selectedTopicIds: Set<string>,
    progress: ProgressData
  ) => {
    setLoading(true);
    try {
      const categories = await loadMultipleCategories(categoryIds);
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

  // Load all questions (for dashboard/review — no filtering)
  const loadAllQuestions = useCallback(async (categoryIds: string[]) => {
    setLoading(true);
    try {
      const categories = await loadMultipleCategories(categoryIds);
      const all = categories.flatMap(c => c.questions);
      setQuestions(all);
    } catch (err) {
      console.error('Failed to load questions:', err);
      setQuestions([]);
    } finally {
      setLoading(false);
    }
  }, []);

  return { questions, loading, loadQuestions, loadAllQuestions };
}
