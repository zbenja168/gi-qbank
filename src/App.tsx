import { useState, useCallback, useEffect } from 'react';
import { useTopics } from './hooks/useTopics';
import { useProgress } from './hooks/useProgress';
import { useQuestions } from './hooks/useQuestions';
import { HomePage } from './pages/HomePage';
import { QuizPage } from './pages/QuizPage';
import { DashboardPage } from './pages/DashboardPage';
import { ReviewPage } from './pages/ReviewPage';

type Page = 'home' | 'quiz' | 'dashboard' | 'review';

function App() {
  const [page, setPage] = useState<Page>('home');
  const topicsHook = useTopics();
  const { progress, recordAnswer, recordSession, toggleBookmark, clearAllProgress } = useProgress();
  const { questions, loading: questionsLoading, loadQuestions, loadAllQuestions } = useQuestions();

  const allCategoryIds = topicsHook.topics?.categories.map(c => c.id) ?? [];

  const handleStartQuiz = useCallback(async () => {
    // Pass progress so completed questions are filtered out
    await loadQuestions(topicsHook.categoriesForSelected, topicsHook.selectedTopicIds, progress);
    setPage('quiz');
  }, [loadQuestions, topicsHook.categoriesForSelected, topicsHook.selectedTopicIds, progress]);

  const handleGoToDashboard = useCallback(async () => {
    if (allCategoryIds.length > 0) {
      await loadAllQuestions(allCategoryIds);
    }
    setPage('dashboard');
  }, [loadAllQuestions, allCategoryIds]);

  const handleGoToReview = useCallback(async () => {
    if (allCategoryIds.length > 0) {
      await loadAllQuestions(allCategoryIds);
    }
    setPage('review');
  }, [loadAllQuestions, allCategoryIds]);

  useEffect(() => {
    const handleHash = () => {
      const hash = window.location.hash.slice(1);
      if (hash === '/dashboard') handleGoToDashboard();
      else if (hash === '/review') handleGoToReview();
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

  if (!topicsHook.topics) {
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
          totalQuestions={topicsHook.topics.totalQuestions}
          onBack={() => { setPage('home'); window.location.hash = ''; }}
          onClearProgress={clearAllProgress}
        />
      );
    case 'review':
      return (
        <ReviewPage
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

export default App;
