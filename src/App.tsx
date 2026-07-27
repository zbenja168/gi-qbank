import { useState, useCallback, useEffect } from 'react';
import { useTopics } from './hooks/useTopics';
import { useProgress } from './hooks/useProgress';
import { useQuestions } from './hooks/useQuestions';
import { HomePage } from './pages/HomePage';
import { QuizPage } from './pages/QuizPage';
import { DashboardPage } from './pages/DashboardPage';
import { ReviewPage } from './pages/ReviewPage';
import { BrandBadge } from './components/Brand';
import { track } from './utils/track';
import { Tier } from './utils/questionLoader';

type Page = 'home' | 'quiz' | 'dashboard' | 'review';

function AppShell() {
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
  const { questions, loading: questionsLoading, loadQuestions, loadAllQuestions } = useQuestions();

  const allCategoryIds = topicsHook.topics?.categories.map(c => c.id) ?? [];

  const handleStartQuiz = useCallback(async () => {
    // Pass progress so completed questions are filtered out
    await loadQuestions(topicsHook.categoriesForSelected, topicsHook.selectedTopicIds, progress, tier);
    track('quiz_start');
    setPage('quiz');
  }, [loadQuestions, topicsHook.categoriesForSelected, topicsHook.selectedTopicIds, progress, tier]);

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
      else setPage('home');
    };
    window.addEventListener('hashchange', handleHash);
    return () => window.removeEventListener('hashchange', handleHash);
  }, [handleGoToDashboard, handleGoToReview]);

  if (topicsHook.loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-900">
        <div className="text-center">
          <div className="w-8 h-8 border-3 border-teal-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-slate-400">Loading question bank...</p>
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
        <div className="text-center">
          <div className="w-8 h-8 border-3 border-teal-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-slate-400">Loading questions...</p>
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
          progress={progress}
          onToggleTopic={topicsHook.toggleTopic}
          onToggleCategory={topicsHook.toggleCategory}
          onSelectAll={topicsHook.selectAll}
          onClearAll={topicsHook.clearAll}
          onStartQuiz={handleStartQuiz}
          onGoToDashboard={handleGoToDashboard}
          onGoToReview={handleGoToReview}
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
