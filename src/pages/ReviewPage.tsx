import { useState, useCallback } from 'react';
import { Question } from '../types/question';
import { ProgressData, AnswerRecord } from '../types/progress';
import { QuestionCard } from '../components/Question/QuestionCard';
import { useTimer } from '../hooks/useTimer';

interface Props {
  questions: Question[];
  progress: ProgressData;
  onRecordAnswer: (questionId: string, record: AnswerRecord) => void;
  onToggleBookmark: (questionId: string) => void;
  onBack: () => void;
}

type ReviewMode = 'completed' | 'incorrect' | 'bookmarked';

export function ReviewPage({ questions, progress, onRecordAnswer, onToggleBookmark, onBack }: Props) {
  const [mode, setMode] = useState<ReviewMode>('completed');
  const [currentIndex, setCurrentIndex] = useState(0);
  const timer = useTimer();

  const filteredQuestions = mode === 'completed'
    ? questions.filter(q => progress.answers[q.id])
    : mode === 'incorrect'
    ? questions.filter(q => progress.answers[q.id] && !progress.answers[q.id].isCorrect)
    : questions.filter(q => progress.bookmarkedQuestions.includes(q.id));

  const currentQuestion = filteredQuestions[currentIndex];

  const completedCount = questions.filter(q => progress.answers[q.id]).length;
  const incorrectCount = questions.filter(q => progress.answers[q.id] && !progress.answers[q.id].isCorrect).length;
  const bookmarkedCount = questions.filter(q => progress.bookmarkedQuestions.includes(q.id)).length;

  const handleAnswer = useCallback((choiceLabel: string) => {
    if (!currentQuestion) return;
    const record: AnswerRecord = {
      selectedAnswer: choiceLabel,
      isCorrect: choiceLabel === currentQuestion.correctAnswer,
      answeredAt: new Date().toISOString(),
      timeSpentMs: timer.elapsed(),
      topicId: currentQuestion.topicId,
    };
    onRecordAnswer(currentQuestion.id, record);
  }, [currentQuestion, timer, onRecordAnswer]);

  const switchMode = (m: ReviewMode) => {
    setMode(m);
    setCurrentIndex(0);
  };

  return (
    <div className="min-h-screen bg-slate-900">
      <header className="bg-slate-800 border-b border-slate-700 sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 py-3 flex items-center gap-4">
          <button onClick={onBack} className="text-slate-400 hover:text-slate-200">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
          </button>
          <h1 className="text-lg font-bold text-teal-400">Review</h1>
          <div className="flex gap-2 ml-auto flex-wrap">
            <button
              onClick={() => switchMode('completed')}
              className={`px-3 py-1.5 text-sm rounded-lg transition-colors ${
                mode === 'completed' ? 'bg-teal-900/50 text-teal-400 font-medium' : 'text-slate-400 hover:bg-slate-700'
              }`}
            >
              Completed ({completedCount})
            </button>
            <button
              onClick={() => switchMode('incorrect')}
              className={`px-3 py-1.5 text-sm rounded-lg transition-colors ${
                mode === 'incorrect' ? 'bg-red-900/50 text-red-400 font-medium' : 'text-slate-400 hover:bg-slate-700'
              }`}
            >
              Incorrect ({incorrectCount})
            </button>
            <button
              onClick={() => switchMode('bookmarked')}
              className={`px-3 py-1.5 text-sm rounded-lg transition-colors ${
                mode === 'bookmarked' ? 'bg-amber-900/50 text-amber-400 font-medium' : 'text-slate-400 hover:bg-slate-700'
              }`}
            >
              Bookmarked ({bookmarkedCount})
            </button>
          </div>
        </div>
      </header>

      <main className="px-4 py-6">
        {filteredQuestions.length === 0 ? (
          <div className="max-w-4xl mx-auto text-center py-16">
            <p className="text-slate-400 text-lg">
              {mode === 'completed' ? 'No completed questions yet.' :
               mode === 'incorrect' ? 'No incorrect answers yet.' :
               'No bookmarked questions.'}
            </p>
            <button onClick={onBack} className="mt-4 px-6 py-2 rounded-lg bg-teal-600 text-white">
              Go Back
            </button>
          </div>
        ) : currentQuestion ? (
          <QuestionCard
            key={currentQuestion.id}
            question={currentQuestion}
            index={currentIndex}
            total={filteredQuestions.length}
            isBookmarked={progress.bookmarkedQuestions.includes(currentQuestion.id)}
            previousAnswer={progress.answers[currentQuestion.id]?.selectedAnswer}
            onAnswer={handleAnswer}
            onNext={() => setCurrentIndex(i => Math.min(i + 1, filteredQuestions.length - 1))}
            onPrevious={() => setCurrentIndex(i => Math.max(i - 1, 0))}
            onBookmark={() => onToggleBookmark(currentQuestion.id)}
            hasPrevious={currentIndex > 0}
            hasNext={currentIndex < filteredQuestions.length - 1}
            onEnd={onBack}
          />
        ) : null}
      </main>
    </div>
  );
}
