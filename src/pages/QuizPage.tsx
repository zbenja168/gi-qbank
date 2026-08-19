import { useState, useEffect, useCallback } from 'react';
import { Question } from '../types/question';
import { ProgressData, AnswerRecord, Session } from '../types/progress';
import { QuestionCard } from '../components/Question/QuestionCard';
import { useTimer } from '../hooks/useTimer';
import { track } from '../utils/track';
import { SkinName } from '../utils/skin';

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

  // Exam chrome — the palette, flag pill and bottom navigation only exist when a
  // skin is on, because they are there to reproduce a layout, not to change how
  // the QBank works. Watching the attribute keeps them in step if the skin is
  // switched while a quiz is open.
  const [skin, setSkin] = useState<SkinName>(
    () => (document.documentElement.getAttribute('data-skin') as SkinName) || 'off',
  );
  useEffect(() => {
    const el = document.documentElement;
    const obs = new MutationObserver(() =>
      setSkin((el.getAttribute('data-skin') as SkinName) || 'off'));
    obs.observe(el, { attributes: true, attributeFilter: ['data-skin'] });
    return () => obs.disconnect();
  }, []);
  const examMode = skin !== 'off';

  // A running clock: an exam interface without one does not feel like an exam.
  const [elapsed, setElapsed] = useState(0);
  useEffect(() => {
    if (!examMode) return;
    const t = setInterval(() => setElapsed(e => e + 1), 1000);
    return () => clearInterval(t);
  }, [examMode]);
  const clock = [Math.floor(elapsed / 3600), Math.floor((elapsed % 3600) / 60), elapsed % 60]
    .map(n => String(n).padStart(2, '0')).join(':');

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
        <div data-part="quiz-headbar" className="max-w-4xl mx-auto px-4 py-3 flex items-center justify-between">
          <h1 data-part="quiz-title" className="text-lg font-bold text-teal-400">GI QBank</h1>
          <div className="flex items-center gap-4">
            {examMode && <span data-part="quiz-clock">{clock}</span>}
            {sessionAnswered > 0 && (
              <span data-part="quiz-meta" className={`text-sm font-medium ${
                Math.round((sessionCorrect / sessionAnswered) * 100) >= 70 ? 'text-green-400' :
                Math.round((sessionCorrect / sessionAnswered) * 100) >= 50 ? 'text-amber-400' : 'text-red-400'
              }`}>
                {Math.round((sessionCorrect / sessionAnswered) * 100)}% ({sessionCorrect}/{sessionAnswered})
              </span>
            )}
            {examMode && (
              <button data-part="quiz-end" onClick={handleEnd}>
                {skin === 'nbme' ? 'End Block' : 'END EXAM'}
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Examplify keeps a question palette down the left; the NBME interface
          does not, so it is skinned away there rather than rendered twice. */}
      {examMode && (
        <aside data-part="palette" aria-label="Questions">
          <span data-part="palette-head">FILTER ›</span>
          <span data-part="palette-chev" data-dir="up" aria-hidden="true" />
          <div data-part="palette-items">
            {questions.map((q, i) => {
              const done = progress.answers[q.id] || sessionAnswers.has(q.id);
              return (
                <button
                  key={q.id}
                  data-part="palette-item"
                  data-state={i === currentIndex ? 'current' : done ? 'done' : undefined}
                  aria-current={i === currentIndex ? 'true' : undefined}
                  onClick={() => setCurrentIndex(i)}
                >
                  {i + 1}
                </button>
              );
            })}
          </div>
          <span data-part="palette-chev" data-dir="down" aria-hidden="true" />
        </aside>
      )}

      <main data-part="quiz-main" className="px-4 py-6">
        {examMode && (
          <div data-part="exam-itembar">
            <span data-part="exam-itemno">
              {skin === 'nbme'
                ? `Item ${currentIndex + 1} of ${questions.length}`
                : `Question ${currentIndex + 1}`}
            </span>
            <button
              data-part="exam-flag"
              data-state={progress.bookmarkedQuestions.includes(currentQuestion.id) ? 'on' : undefined}
              onClick={() => onToggleBookmark(currentQuestion.id)}
            >
              {progress.bookmarkedQuestions.includes(currentQuestion.id)
                ? (skin === 'nbme' ? '☑ Mark' : 'UNFLAG QUESTION')
                : (skin === 'nbme' ? '☐ Mark' : 'FLAG QUESTION')}
            </button>
            {skin === 'examplify' && <span data-part="exam-more" aria-hidden="true">•••</span>}
          </div>
        )}
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

      {examMode && (
        <div data-part="examfoot">
          <span data-part="examfoot-count">
            {currentIndex + 1} OF {questions.length} QUESTIONS
          </span>
          <div data-part="examfoot-nav">
            <button
              data-part="examfoot-prev"
              disabled={currentIndex === 0}
              onClick={() => setCurrentIndex(i => Math.max(i - 1, 0))}
            >
              Previous
            </button>
            <button
              data-part="examfoot-next"
              onClick={() =>
                currentIndex < questions.length - 1
                  ? setCurrentIndex(i => i + 1)
                  : handleEnd()
              }
            >
              {currentIndex < questions.length - 1 ? 'Next' : 'Finish'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
