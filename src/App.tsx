import { useState, useCallback, useEffect } from 'react';
import { useTopicProgress } from './hooks/useTopicProgress';
import { setCompletedTopicIds, useTopics } from './hooks/useTopics';
import { useProgress } from './hooks/useProgress';
import { useQuestions } from './hooks/useQuestions';
import { MembraneLoader } from './components/Membrane';
import { HomePage } from './pages/HomePage';
import { QuizPage } from './pages/QuizPage';
import { DashboardPage } from './pages/DashboardPage';
import { ReviewPage } from './pages/ReviewPage';
import { BrandBadge } from './components/Brand';
import { track } from './utils/track';
import { Tier } from './utils/questionLoader';
import { restoreSkin } from './utils/skin';

type Page = 'home' | 'quiz' | 'dashboard' | 'review';

function AppShell() {
  // Re-apply a saved exam skin, and drop it if the account that
  // unlocked it is no longer signed in.
  useEffect(() => { restoreSkin(); }, []);

  const [page, setPage] = useState<Page>('home');
  const [tier, setTierState] = useState<Tier>(
    () => (localStorage.getItem('gi_qbank_tier') === 'advanced' ? 'advanced' : 'standard'),
  );
  const setTier = useCallback((t: Tier) => {
    try { localStorage.setItem('gi_qbank_tier', t); } catch { /* ignore */ }
    setTierState(t);
    setPage('home');
  }, []);

  const topicsHook = useTopics(tier);
  const { progress, recordAnswer, recordSession, toggleBookmark, clearAllProgress } = useProgress();
  const { questions, loading: questionsLoading, loadQuestions, loadMissedQuestions, loadAllQuestions } = useQuestions();
  // What is left in each topic, so the picker can show remaining rather than
  // total and a finished topic can grey itself out.
  const { stats: topicStats } = useTopicProgress(topicsHook.topics, progress, tier);
  // Keep bulk selection in step with what is finished.
  setCompletedTopicIds(new Set(
    topicStats ? Array.from(topicStats).filter(([, v]) => v.complete).map(([k]) => k) : []));

  const allCategoryIds = topicsHook.topics?.categories.map(c => c.id) ?? [];

  const handleStartQuiz = useCallback(async () => {
    // Pass progress so completed questions are filtered out
    await loadQuestions(topicsHook.categoriesForSelected, topicsHook.selectedTopicIds, progress, tier);
    track('quiz_start');
    setPage('quiz');
  }, [loadQuestions, topicsHook.categoriesForSelected, topicsHook.selectedTopicIds, progress, tier]);

  // Retake every question he got wrong, as a real quiz rather than a review.
  //
  // His previous answers are left in place on purpose. Wiping them would make a
  // half-finished retake lose the missed list entirely; leaving them means a
  // question he now gets right simply stops being missed, and one he gets wrong
  // again stays. Same outcome, nothing destroyed if he walks away mid-run.
  const handleRetakeMissed = useCallback(async () => {
    if (allCategoryIds.length === 0) return;
    const count = await loadMissedQuestions(allCategoryIds, progress, tier);
    if (count === 0) return;
    track('retake_missed');
    setPage('quiz');
  }, [loadMissedQuestions, allCategoryIds, progress, tier]);

  const handleGoToDashboard = useCallback(async () => {
    if (allCategoryIds.length > 0) {
      await loadAllQuestions(allCategoryIds, tier);
    }
    setPage('dashboard');
  }, [loadAllQuestions, allCategoryIds, tier]);

  const [reviewMode, setReviewMode] = useState<'completed' | 'incorrect' | 'bookmarked'>('completed');
  const handleGoToReview = useCallback(async (mode: 'completed' | 'incorrect' | 'bookmarked' = 'completed') => {
    setReviewMode(mode);
    if (allCategoryIds.length > 0) {
      await loadAllQuestions(allCategoryIds, tier);
    }
    setPage('review');
  }, [loadAllQuestions, allCategoryIds, tier]);

  useEffect(() => {
    const handleHash = () => {
      const hash = window.location.hash.slice(1);
      if (hash === '/dashboard') handleGoToDashboard();
      else if (hash === '/review') handleGoToReview();
      else if (hash === '/missed') handleGoToReview('incorrect');
      else if (hash === '/retake') handleRetakeMissed();
      else setPage('home');
    };
    window.addEventListener('hashchange', handleHash);
    return () => window.removeEventListener('hashchange', handleHash);
  }, [handleGoToDashboard, handleGoToReview, handleRetakeMissed]);

  if (topicsHook.loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-900">
        <div className="text-center w-full max-w-xl px-4">
          <MembraneLoader label="Loading question bank…" />
        </div>
      </div>
    );
  }

  // In advanced tier the board is legitimately empty when the user isn't Pro
  // (entitlement locked/error) — let HomePage render the upgrade screen instead
  // of a hard error. Only treat null topics as an error for the standard tier.
  if (!topicsHook.topics && tier === 'standard') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-900">
        <p className="text-red-400">Failed to load topics. Check that data/topics.json exists.</p>
      </div>
    );
  }

  if (questionsLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-900">
        <div className="text-center w-full max-w-xl px-4">
          <MembraneLoader label="Loading questions…" />
        </div>
      </div>
    );
  }

  switch (page) {
    case 'quiz':
      return (
        <QuizPage
          questions={questions}
          progress={progress}
          onRecordAnswer={recordAnswer}
          onRecordSession={recordSession}
          onToggleBookmark={toggleBookmark}
          onExit={() => { setPage('home'); window.location.hash = ''; }}
          selectedTopicIds={Array.from(topicsHook.selectedTopicIds)}
        />
      );
    case 'dashboard':
      return (
        <DashboardPage
          progress={progress}
          questions={questions}
          totalQuestions={topicsHook.topics?.totalQuestions ?? 0}
          onBack={() => { setPage('home'); window.location.hash = ''; }}
          onClearProgress={clearAllProgress}
        />
      );
    case 'review':
      return (
        <ReviewPage
          initialMode={reviewMode}
          questions={questions}
          progress={progress}
          onRecordAnswer={recordAnswer}
          onToggleBookmark={toggleBookmark}
          onBack={() => { setPage('home'); window.location.hash = ''; }}
        />
      );
    default:
      return (
        <HomePage
          tier={tier}
          onSetTier={setTier}
          entitlement={topicsHook.entitlement}
          entitlementReason={topicsHook.entitlementReason}
          topics={topicsHook.topics}
          selectedTopicIds={topicsHook.selectedTopicIds}
          selectedCount={topicsHook.selectedCount}
          topicStats={topicStats}
          progress={progress}
          onToggleTopic={topicsHook.toggleTopic}
          onToggleCategory={topicsHook.toggleCategory}
          onSelectAll={topicsHook.selectAll}
          onClearAll={topicsHook.clearAll}
          onStartQuiz={handleStartQuiz}
          onGoToDashboard={handleGoToDashboard}
          onGoToReview={handleGoToReview}
          onRetakeMissed={handleRetakeMissed}
          onClearProgress={clearAllProgress}
        />
      );
  }
}

export default function App() {
  return (
    <>
      <BrandBadge />
      <AppShell />
    </>
  );
}
