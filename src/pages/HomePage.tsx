import { TopicsIndex, Category } from '../types/topic';
import { CategoryAccordion } from '../components/TopicFilter/CategoryAccordion';
import { ProgressData, getAnsweredByTopic } from '../types/progress';
import { getOverallStats } from '../utils/stats';
import { BrandCard } from '../components/Brand';
import { Tier } from '../utils/questionLoader';

interface Props {
  tier: Tier;
  onSetTier: (t: Tier) => void;
  topics: TopicsIndex;
  selectedTopicIds: Set<string>;
  selectedCount: number;
  progress: ProgressData;
  onToggleTopic: (topicId: string) => void;
  onToggleCategory: (category: Category) => void;
  onSelectAll: () => void;
  onClearAll: () => void;
  onStartQuiz: () => void;
  onGoToDashboard: () => void;
  onGoToReview: () => void;
  onClearProgress: () => void;
}

export function HomePage({
  tier, onSetTier, topics, selectedTopicIds, selectedCount, progress,
  onToggleTopic, onToggleCategory, onSelectAll, onClearAll,
  onStartQuiz, onGoToDashboard, onGoToReview, onClearProgress,
}: Props) {
  // Standard and advanced share topicIds but have distinct question ids
  // (advanced ids contain "-adv-"), so scope the home-screen counts to the
  // active tier — otherwise "remaining" and the stats blend the two banks.
  const isAdvId = (id: string) => id.includes('-adv-');
  const tierProgress = {
    ...progress,
    answers: Object.fromEntries(
      Object.entries(progress.answers).filter(([id]) => isAdvId(id) === (tier === 'advanced')),
    ),
  };
  const stats = getOverallStats(tierProgress);
  const completedCount = Object.keys(tierProgress.answers).length;
  const answeredByTopic = getAnsweredByTopic(tierProgress);

  // Compute remaining (unanswered) for selected topics
  const remainingCount = topics.categories.reduce((sum, cat) =>
    sum + cat.topics.reduce((s, t) => {
      if (!selectedTopicIds.has(t.id)) return s;
      const answered = answeredByTopic[t.id] || 0;
      return s + Math.max(0, t.questionCount - answered);
    }, 0), 0);

  return (
    <div className="min-h-screen bg-slate-900">
      <header className="bg-slate-800 border-b border-slate-700 sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-4 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-teal-400">GI QBank</h1>
            <p className="text-sm text-slate-400">Gastrointestinal &amp; Hepatobiliary Question Bank</p>
          </div>
          <div className="flex items-center gap-3">
            <a
              href="https://zbenja168.github.io/Resp_QBank/"
              className="text-xs px-3 py-1.5 rounded-lg border border-slate-600 text-slate-400 hover:text-teal-400 hover:border-teal-600 transition-colors"
            >
              Resp QBank &rarr;
            </a>
            {stats.total > 0 && (
              <button
                onClick={onGoToDashboard}
                className="px-4 py-2 text-sm rounded-lg border border-slate-600 text-slate-300 hover:bg-slate-700 transition-colors"
              >
                Dashboard ({stats.percentage}%)
              </button>
            )}
            {completedCount > 0 && (
              <button
                onClick={onGoToReview}
                className="px-4 py-2 text-sm rounded-lg border border-teal-700 text-teal-400 hover:bg-teal-900/30 transition-colors"
              >
                Completed ({completedCount})
              </button>
            )}
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-8">
        <BrandCard />

        {/* Standard / Advanced tier toggle */}
        <div className="mb-6">
          <div className="inline-flex rounded-xl border border-slate-700 bg-slate-800 p-1">
            <button
              onClick={() => onSetTier('standard')}
              className={`px-4 py-2 text-sm font-semibold rounded-lg transition-colors ${
                tier === 'standard' ? 'bg-teal-600 text-white' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Standard
            </button>
            <button
              onClick={() => onSetTier('advanced')}
              className={`px-4 py-2 text-sm font-semibold rounded-lg transition-colors ${
                tier === 'advanced' ? 'bg-amber-500 text-slate-900' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Advanced
            </button>
          </div>
          <p className="mt-2 text-sm text-slate-400 max-w-2xl">
            {tier === 'advanced'
              ? 'Advanced: UWorld-style, multi-step clinical vignettes that make you apply the bricks, not just recall them. Rolling out brick by brick — the topics below are the ones ready so far.'
              : 'Standard: foundational, recall-level questions to learn each brick.'}
          </p>
        </div>

        {/* Stats summary */}
        {stats.total > 0 && (<>
          <div className="grid grid-cols-3 gap-4 mb-8">
            <div className="bg-slate-800 rounded-xl border border-slate-700 p-4 text-center">
              <div className="text-2xl font-bold text-slate-200">{stats.total}</div>
              <div className="text-sm text-slate-400">Answered</div>
            </div>
            <div className="bg-slate-800 rounded-xl border border-slate-700 p-4 text-center">
              <div className="text-2xl font-bold text-green-400">{stats.percentage}%</div>
              <div className="text-sm text-slate-400">Correct</div>
            </div>
            <div className="bg-slate-800 rounded-xl border border-slate-700 p-4 text-center">
              <div className="text-2xl font-bold text-slate-200">{topics.totalQuestions - stats.total}</div>
              <div className="text-sm text-slate-400">Remaining</div>
            </div>
          </div>
          <div className="text-right mb-4">
            <button
              onClick={() => {
                if (window.confirm('Clear all progress? This cannot be undone.')) {
                  onClearProgress();
                }
              }}
              className="text-sm text-red-400 hover:text-red-300 transition-colors"
            >
              Reset Progress
            </button>
          </div>
        </>)}

        {/* Filter controls */}
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-slate-200">Select Topics</h2>
          <div className="flex items-center gap-3">
            <button onClick={onSelectAll} className="text-sm text-teal-400 hover:text-teal-300">Select All</button>
            <span className="text-slate-600">|</span>
            <button onClick={onClearAll} className="text-sm text-teal-400 hover:text-teal-300">Clear All</button>
          </div>
        </div>

        {/* Category accordions */}
        <div className="space-y-2 mb-8">
          {topics.categories.map(cat => (
            <CategoryAccordion
              key={cat.id}
              category={cat}
              selectedTopicIds={selectedTopicIds}
              answeredByTopic={answeredByTopic}
              onToggleTopic={onToggleTopic}
              onToggleCategory={onToggleCategory}
            />
          ))}
        </div>

        {/* Start button */}
        <div className="sticky bottom-0 bg-gradient-to-t from-slate-900 via-slate-900 to-transparent pt-4 pb-6">
          <button
            onClick={onStartQuiz}
            disabled={remainingCount === 0}
            className="w-full py-4 rounded-xl bg-teal-600 text-white font-semibold text-lg hover:bg-teal-500 disabled:bg-slate-700 disabled:text-slate-500 disabled:cursor-not-allowed transition-colors shadow-lg"
          >
            {remainingCount > 0
              ? `Start Quiz (${remainingCount} remaining)`
              : selectedCount > 0
                ? 'All selected questions completed!'
                : 'Select topics to begin'}
          </button>
        </div>
      </main>
    </div>
  );
}
