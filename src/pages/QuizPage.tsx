import { useState, useEffect, useCallback } from 'react';
import { Question } from '../types/question';
import { ProgressData, AnswerRecord, Session } from '../types/progress';
import { QuestionCard } from '../components/Question/QuestionCard';
import { useTimer } from '../hooks/useTimer';
import { track } from '../utils/track';

interface Props {
  questions: Question[];
  progress: ProgressData;
  onRecordAnswer: (questionId: string, record: AnswerRecord) => void;
  onRecordSession: (session: Session) => void;
  onToggleBookmark: (questionId: string) => void;
  onExit: () => void;
  selectedTopicIds: string[];
}

export function QuizPage({
  questions, progress, onRecordAnswer, onRecordSession,
  onToggleBookmark, onExit, selectedTopicIds,
}: Props) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [sessionAnswers, setSessionAnswers] = useState<Map<string, boolean>>(new Map());
  const [sessionStart] = useState(() => new Date().toISOString());
  const timer = useTimer();

  useEffect(() => {
    timer.start();
  }, [currentIndex, timer]);

  const currentQuestion = questions[currentIndex];

  // Running stats for the current session
  const sessionCorrect = Array.from(sessionAnswers.values()).filter(Boolean).length;
  const sessionAnswered = sessionAnswers.size;

  const handleAnswer = useCallback((choiceLabel: string) => {
    if (!currentQuestion) return;
    const timeSpent = timer.elapsed();
    const isCorrect = choiceLabel === currentQuestion.correctAnswer;

    const record: AnswerRecord = {
      selectedAnswer: choiceLabel,
      isCorrect,
      answeredAt: new Date().toISOString(),
      timeSpentMs: timeSpent,
      topicId: currentQuestion.topicId,
    };

    onRecordAnswer(currentQuestion.id, record);
    track('question_answered');
    setSessionAnswers(prev => new Map(prev).set(currentQuestion.id, isCorrect));
  }, [currentQuestion, timer, onRecordAnswer]);

  const handleEnd = useCallback(() => {
    const answered = Array.from(sessionAnswers.entries());

    const session: Session = {
      id: `session-${Date.now()}`,
      startedAt: sessionStart,
      endedAt: new Date().toISOString(),
      questionIds: Array.from(sessionAnswers.keys()),
      score: sessionCorrect,
      total: answered.length,
      topicIds: selectedTopicIds,
    };

    if (answered.length > 0) {
      onRecordSession(session);
      track('quiz_complete', { score: session.score, total: session.total });
    }
    onExit();
  }, [sessionAnswers, sessionCorrect, sessionStart, selectedTopicIds, onRecordSession, onExit]);

  if (!currentQuestion) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-900">
        <div className="text-center">
          <p className="text-slate-400 mb-2 text-lg">All questions completed!</p>
          <p className="text-slate-500 mb-6 text-sm">You've answered all available questions for the selected topics.</p>
          <button onClick={onExit} className="px-6 py-2 rounded-lg bg-teal-600 text-white">
            Go Back
          </button>
        </div>
      </div>
    );
  }

  return (
    <div data-part="quiz-root" className="min-h-screen bg-slate-900">
      <header data-part="quiz-header" className="bg-slate-800 border-b border-slate-700 sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 py-3 flex items-center justify-between">
          <h1 data-part="quiz-title" className="text-lg font-bold text-teal-400">GI QBank</h1>
          <div className="flex items-center gap-4">
            {sessionAnswered > 0 && (
              <span data-part="quiz-meta" className={`text-sm font-medium ${
                Math.round((sessionCorrect / sessionAnswered) * 100) >= 70 ? 'text-green-400' :
                Math.round((sessionCorrect / sessionAnswered) * 100) >= 50 ? 'text-amber-400' : 'text-red-400'
              }`}>
                {Math.round((sessionCorrect / sessionAnswered) * 100)}% ({sessionCorrect}/{sessionAnswered})
              </span>
            )}
          </div>
        </div>
      </header>

      <main data-part="quiz-main" className="px-4 py-6">
        <QuestionCard
          key={currentQuestion.id}
          question={currentQuestion}
          index={currentIndex}
          total={questions.length}
          isBookmarked={progress.bookmarkedQuestions.includes(currentQuestion.id)}
          previousAnswer={sessionAnswers.has(currentQuestion.id) ? progress.answers[currentQuestion.id]?.selectedAnswer : undefined}
          onAnswer={handleAnswer}
          onNext={() => setCurrentIndex(i => Math.min(i + 1, questions.length - 1))}
          onPrevious={() => setCurrentIndex(i => Math.max(i - 1, 0))}
          onBookmark={() => onToggleBookmark(currentQuestion.id)}
          hasPrevious={currentIndex > 0}
          hasNext={currentIndex < questions.length - 1}
          onEnd={handleEnd}
          runningStats={{ correct: sessionCorrect, answered: sessionAnswered }}
        />
      </main>
    </div>
  );
}
