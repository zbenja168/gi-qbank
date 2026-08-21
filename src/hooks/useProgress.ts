import { useState, useCallback, useEffect } from 'react';
import { ProgressData, AnswerRecord, Session } from '../types/progress';
import { loadProgress, saveProgress, clearProgress as clearStore } from '../utils/storage';
import { pullProgress, pushProgress, canSync } from '../utils/sync';

export function useProgress() {
  const [progress, setProgress] = useState<ProgressData>(() => loadProgress());
  const [syncing, setSyncing] = useState<boolean>(() => canSync());

  // Signed in? Merge the account copy in once on load, so a QBank opened on a
  // second device starts where the first one left off. Local is never
  // discarded — the two are unioned — so a failed pull costs nothing.
  useEffect(() => {
    if (!canSync()) return;
    let live = true;
    pullProgress(loadProgress())
      .then(merged => {
        if (!live) return;
        saveProgress(merged);
        setProgress(merged);
      })
      .finally(() => { if (live) setSyncing(false); });
    return () => { live = false; };
  }, []);

  /** Save locally and mirror to the account. Local is authoritative for this
   *  browser; the push is best-effort. */
  const persist = useCallback((next: ProgressData) => {
    saveProgress(next);
    pushProgress(next);
    return next;
  }, []);

  const recordAnswer = useCallback((questionId: string, record: AnswerRecord) => {
    setProgress(prev => persist({
      ...prev,
      answers: { ...prev.answers, [questionId]: record },
    }));
  }, [persist]);

  const recordSession = useCallback((session: Session) => {
    setProgress(prev => persist({
      ...prev,
      sessions: [...prev.sessions, session],
    }));
  }, [persist]);

  const toggleBookmark = useCallback((questionId: string) => {
    setProgress(prev => {
      const bookmarks = prev.bookmarkedQuestions.includes(questionId)
        ? prev.bookmarkedQuestions.filter(id => id !== questionId)
        : [...prev.bookmarkedQuestions, questionId];
      return persist({ ...prev, bookmarkedQuestions: bookmarks });
    });
  }, [persist]);

  const clearAllProgress = useCallback(() => {
    clearStore();
    const fresh = loadProgress();
    // Clearing has to reach the account too, or the next load pulls it all back.
    pushProgress(fresh);
    setProgress(fresh);
  }, []);

  return {
    progress,
    recordAnswer,
    recordSession,
    toggleBookmark,
    clearAllProgress,
    syncing,
    synced: canSync(),
  };
}
