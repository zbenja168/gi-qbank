import { useState, useCallback } from 'react';
import { ProgressData, AnswerRecord, Session } from '../types/progress';
import { loadProgress, saveProgress, clearProgress as clearStore } from '../utils/storage';

export function useProgress() {
  const [progress, setProgress] = useState<ProgressData>(() => loadProgress());

  const recordAnswer = useCallback((questionId: string, record: AnswerRecord) => {
    setProgress(prev => {
      const next = {
        ...prev,
        answers: { ...prev.answers, [questionId]: record },
      };
      saveProgress(next);
      return next;
    });
  }, []);

  const recordSession = useCallback((session: Session) => {
    setProgress(prev => {
      const next = {
        ...prev,
        sessions: [...prev.sessions, session],
      };
      saveProgress(next);
      return next;
    });
  }, []);

  const toggleBookmark = useCallback((questionId: string) => {
    setProgress(prev => {
      const bookmarks = prev.bookmarkedQuestions.includes(questionId)
        ? prev.bookmarkedQuestions.filter(id => id !== questionId)
        : [...prev.bookmarkedQuestions, questionId];
      const next = { ...prev, bookmarkedQuestions: bookmarks };
      saveProgress(next);
      return next;
    });
  }, []);

  const clearAllProgress = useCallback(() => {
    clearStore();
    setProgress(loadProgress());
  }, []);

  return {
    progress,
    recordAnswer,
    recordSession,
    toggleBookmark,
    clearAllProgress,
  };
}
