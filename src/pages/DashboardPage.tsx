import { ProgressData } from '../types/progress';
import { Question } from '../types/question';
import { getOverallStats, getTopicStats } from '../utils/stats';

interface Props {
  progress: ProgressData;
  questions: Question[];
  onBack: () => void;
  onClearProgress: () => void;
  totalQuestions: number;
}

export function DashboardPage({ progress, questions, onBack, onClearProgress, totalQuestions }: Props) {
  const stats = getOverallStats(progress);
  const topicStats = getTopicStats(progress, questions);
  const sessions = [...progress.sessions].reverse();

  return (
    <div className="min-h-screen bg-slate-900">
      <header className="bg-slate-800 border-b border-slate-700 sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button onClick={onBack} className="text-slate-400 hover:text-slate-200">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
            </button>
            <h1 className="text-xl font-bold text-teal-400">Dashboard</h1>
          </div>
          <button
            onClick={() => {
              if (window.confirm('Clear all progress? This cannot be undone.')) {
                onClearProgress();
              }
            }}
            className="text-sm text-red-400 hover:text-red-300"
          >
            Reset Progress
          </button>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-8">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-slate-800 rounded-xl border border-slate-700 p-5 text-center">
            <div className="text-3xl font-bold text-slate-200">{stats.total}</div>
            <div className="text-sm text-slate-400 mt-1">Answered</div>
          </div>
          <div className="bg-slate-800 rounded-xl border border-slate-700 p-5 text-center">
            <div className="text-3xl font-bold text-green-400">{stats.correct}</div>
            <div className="text-sm text-slate-400 mt-1">Correct</div>
          </div>
          <div className="bg-slate-800 rounded-xl border border-slate-700 p-5 text-center">
            <div className="text-3xl font-bold text-red-400">{stats.incorrect}</div>
            <div className="text-sm text-slate-400 mt-1">Incorrect</div>
          </div>
          <div className="bg-slate-800 rounded-xl border border-slate-700 p-5 text-center">
            <div className="text-3xl font-bold text-teal-400">{stats.percentage}%</div>
            <div className="text-sm text-slate-400 mt-1">Score</div>
          </div>
        </div>

        <div className="bg-slate-800 rounded-xl border border-slate-700 p-5 mb-8">
          <div className="flex justify-between text-sm text-slate-400 mb-2">
            <span>Overall Progress</span>
            <span>{stats.total} / {totalQuestions}</span>
          </div>
          <div className="w-full h-3 bg-slate-700 rounded-full overflow-hidden">
            <div
              className="h-full bg-teal-500 rounded-full transition-all"
              style={{ width: `${(stats.total / totalQuestions) * 100}%` }}
            />
          </div>
        </div>

        {topicStats.length > 0 && (
          <div className="bg-slate-800 rounded-xl border border-slate-700 p-5 mb-8">
            <h2 className="font-semibold text-slate-200 mb-4">Performance by Topic</h2>
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {topicStats.sort((a, b) => a.percentage - b.percentage).map(ts => (
                <div key={ts.topicId}>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-slate-300 truncate mr-2">{ts.name}</span>
                    <span className={`font-medium flex-shrink-0 ${
                      ts.percentage >= 70 ? 'text-green-400' : ts.percentage >= 50 ? 'text-amber-400' : 'text-red-400'
                    }`}>
                      {ts.correct}/{ts.total} ({ts.percentage}%)
                    </span>
                  </div>
                  <div className="w-full h-2 bg-slate-700 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all ${
                        ts.percentage >= 70 ? 'bg-green-500' : ts.percentage >= 50 ? 'bg-amber-500' : 'bg-red-500'
                      }`}
                      style={{ width: `${ts.percentage}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {sessions.length > 0 && (
          <div className="bg-slate-800 rounded-xl border border-slate-700 p-5">
            <h2 className="font-semibold text-slate-200 mb-4">Session History</h2>
            <div className="space-y-3">
              {sessions.slice(0, 20).map(session => {
                const pct = session.total > 0 ? Math.round((session.score / session.total) * 100) : 0;
                const date = new Date(session.startedAt);
                return (
                  <div key={session.id} className="flex items-center justify-between py-2 border-b border-slate-700 last:border-0">
                    <div>
                      <div className="text-sm text-slate-300">
                        {date.toLocaleDateString()} {date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </div>
                      <div className="text-xs text-slate-500">{session.total} questions</div>
                    </div>
                    <div className={`text-lg font-bold ${
                      pct >= 70 ? 'text-green-400' : pct >= 50 ? 'text-amber-400' : 'text-red-400'
                    }`}>
                      {session.score}/{session.total} ({pct}%)
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
