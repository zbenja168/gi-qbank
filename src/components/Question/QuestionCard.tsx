import { useState } from 'react';
import { Question } from '../../types/question';

interface Props {
  question: Question;
  index: number;
  total: number;
  isBookmarked: boolean;
  previousAnswer?: string;
  onAnswer: (choiceLabel: string) => void;
  onNext: () => void;
  onPrevious: () => void;
  onBookmark: () => void;
  hasPrevious: boolean;
  hasNext: boolean;
  onEnd: () => void;
  runningStats?: { correct: number; answered: number };
}

export function QuestionCard({
  question, index, total, isBookmarked, previousAnswer,
  onAnswer, onNext, onPrevious, onBookmark, hasPrevious, hasNext, onEnd,
  runningStats,
}: Props) {
  const [selected, setSelected] = useState<string | null>(previousAnswer ?? null);
  const answered = selected !== null;

  const handleSelect = (label: string) => {
    if (answered) return;
    setSelected(label);
    onAnswer(label);
  };

  const getChoiceStyle = (label: string) => {
    if (!answered) {
      return 'border-slate-600 hover:border-teal-400 hover:bg-slate-700 cursor-pointer';
    }
    if (label === question.correctAnswer) {
      return 'border-green-500 bg-green-900/40';
    }
    if (label === selected && label !== question.correctAnswer) {
      return 'border-red-500 bg-red-900/40';
    }
    return 'border-slate-700 opacity-50';
  };

  const getChoiceIcon = (label: string) => {
    if (!answered) return null;
    if (label === question.correctAnswer) {
      return <span className="text-green-400 font-bold ml-auto">&#10003;</span>;
    }
    if (label === selected && label !== question.correctAnswer) {
      return <span className="text-red-400 font-bold ml-auto">&#10007;</span>;
    }
    return null;
  };

  return (
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <span className="text-sm font-medium text-slate-400">
            Question {index + 1} of {total}
          </span>
          <span className={`text-xs px-2 py-0.5 rounded font-medium ${
            question.difficulty === 'hard' ? 'bg-red-900/50 text-red-400' :
            question.difficulty === 'easy' ? 'bg-green-900/50 text-green-400' :
            'bg-amber-900/50 text-amber-400'
          }`}>
            {question.difficulty}
          </span>
        </div>
        <div className="flex items-center gap-2">
          {answered && <span className="text-xs text-slate-500">{question.topicName}</span>}
          <button
            onClick={onBookmark}
            className={`p-1.5 rounded transition-colors ${isBookmarked ? 'text-amber-400' : 'text-slate-500 hover:text-amber-400'}`}
            title={isBookmarked ? 'Remove bookmark' : 'Bookmark this question'}
          >
            <svg className="w-5 h-5" fill={isBookmarked ? 'currentColor' : 'none'} viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" /></svg>
          </button>
        </div>
      </div>

      {/* Running percent correct */}
      {runningStats && runningStats.answered > 0 && (
        <div className="mb-4 flex items-center gap-2">
          <div className={`text-sm font-semibold ${
            runningStats.answered > 0
              ? Math.round((runningStats.correct / runningStats.answered) * 100) >= 70
                ? 'text-green-400'
                : Math.round((runningStats.correct / runningStats.answered) * 100) >= 50
                  ? 'text-amber-400'
                  : 'text-red-400'
              : 'text-slate-400'
          }`}>
            {Math.round((runningStats.correct / runningStats.answered) * 100)}% correct ({runningStats.correct}/{runningStats.answered})
          </div>
        </div>
      )}

      {/* Progress bar */}
      <div className="w-full h-1.5 bg-slate-700 rounded-full mb-6">
        <div
          className="h-full bg-teal-500 rounded-full transition-all duration-300"
          style={{ width: `${((index + 1) / total) * 100}%` }}
        />
      </div>

      {/* Stem */}
      <div className="bg-slate-800 rounded-xl border border-slate-700 p-6 mb-6 shadow-sm">
        <p className="text-slate-200 leading-relaxed whitespace-pre-line">{question.stem}</p>
      </div>

      {/* Choices */}
      <div className="space-y-3 mb-6">
        {question.choices.map(choice => (
          <button
            key={choice.label}
            onClick={() => handleSelect(choice.label)}
            disabled={answered}
            className={`w-full text-left px-5 py-4 rounded-xl border-2 transition-all flex items-center gap-3 ${getChoiceStyle(choice.label)}`}
          >
            <span className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold flex-shrink-0 ${
              answered && choice.label === question.correctAnswer ? 'bg-green-600 text-white' :
              answered && choice.label === selected ? 'bg-red-600 text-white' :
              'bg-slate-700 text-slate-300'
            }`}>
              {choice.label}
            </span>
            <span className="text-slate-300 flex-1">{choice.text}</span>
            {getChoiceIcon(choice.label)}
          </button>
        ))}
      </div>

      {/* Explanation */}
      {answered && (
        <div className={`rounded-xl border-2 p-6 mb-6 ${
          selected === question.correctAnswer ? 'border-green-700 bg-green-900/30' : 'border-red-700 bg-red-900/30'
        }`}>
          <div className="flex items-center gap-2 mb-3">
            <span className={`text-lg font-bold ${
              selected === question.correctAnswer ? 'text-green-400' : 'text-red-400'
            }`}>
              {selected === question.correctAnswer ? 'Correct!' : 'Incorrect'}
            </span>
            {selected !== question.correctAnswer && (
              <span className="text-sm text-slate-400">
                — The correct answer is {question.correctAnswer}
              </span>
            )}
          </div>
          <p className="text-slate-300 mb-4 leading-relaxed">{question.explanation.summary}</p>

          <div className="mb-4">
            <h4 className="font-semibold text-slate-200 mb-1">Why {question.correctAnswer} is correct:</h4>
            <p className="text-slate-400 leading-relaxed">{question.explanation.whyCorrect}</p>
          </div>

          <div>
            <h4 className="font-semibold text-slate-200 mb-2">Why the other choices are wrong:</h4>
            <div className="space-y-2">
              {question.choices
                .filter(c => c.label !== question.correctAnswer)
                .map(c => (
                  <div key={c.label} className="flex gap-2">
                    <span className="font-medium text-slate-500 flex-shrink-0">{c.label}.</span>
                    <p className="text-slate-400 text-sm leading-relaxed">
                      {question.explanation.whyWrongByChoice[c.label]}
                    </p>
                  </div>
                ))}
            </div>
          </div>
        </div>
      )}

      {/* Navigation */}
      <div className="flex items-center justify-between pt-2 pb-8">
        <button
          onClick={onPrevious}
          disabled={!hasPrevious}
          className="px-5 py-2.5 rounded-lg border border-slate-600 text-slate-400 hover:bg-slate-700 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
        >
          Previous
        </button>
        <button
          onClick={onEnd}
          className="px-5 py-2.5 rounded-lg text-slate-500 hover:text-slate-300 hover:bg-slate-700 transition-colors"
        >
          End Quiz
        </button>
        {hasNext ? (
          <button
            onClick={onNext}
            disabled={!answered}
            className="px-5 py-2.5 rounded-lg bg-teal-600 text-white hover:bg-teal-500 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            Next
          </button>
        ) : (
          <button
            onClick={onEnd}
            disabled={!answered}
            className="px-5 py-2.5 rounded-lg bg-green-600 text-white hover:bg-green-500 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            Finish
          </button>
        )}
      </div>
    </div>
  );
}
