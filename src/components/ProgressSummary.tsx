interface Props {
  answered: number;
  correct: number;
  total: number;
  onReset: () => void;
}

/** Where you are in the bank, in one line.
 *
 *  Replaces three equal stat boxes that gave the same weight to a number you
 *  check constantly (how much is left) and one you rarely do (how many you have
 *  answered). The bar is the point: right and wrong are stacked in it, so the
 *  shape of the bar is your accuracy and its fill is your coverage.
 */
export function ProgressSummary({ answered, correct, total, onReset }: Props) {
  const remaining = Math.max(0, total - answered);
  const pct = answered > 0 ? Math.round((correct / answered) * 100) : 0;
  const covered = total > 0 ? (answered / total) * 100 : 0;
  const rightShare = answered > 0 ? (correct / answered) * covered : 0;
  const wrongShare = Math.max(0, covered - rightShare);

  return (
    <div className="bg-slate-800 border border-slate-700 rounded-xl px-5 py-4 mb-8">
      <div className="flex items-end justify-between gap-4 flex-wrap mb-3">
        <div>
          <div className="text-3xl font-bold text-slate-100 leading-none">
            {remaining.toLocaleString()}
            <span className="text-sm font-medium text-slate-400 ml-2">left to do</span>
          </div>
          <div className="text-xs text-slate-500 mt-1.5">
            {answered.toLocaleString()} of {total.toLocaleString()} answered
          </div>
        </div>
        <div className="text-right">
          <div className={`text-2xl font-bold leading-none ${
            pct >= 70 ? 'text-green-400' : pct >= 50 ? 'text-amber-400' : 'text-red-400'}`}>
            {pct}%
          </div>
          <div className="text-xs text-slate-500 mt-1.5">{correct} right · {answered - correct} wrong</div>
        </div>
      </div>

      <div className="h-2 rounded-full bg-slate-700 overflow-hidden flex" role="img"
           aria-label={`${answered} of ${total} answered, ${pct}% correct`}>
        <div className="bg-green-500 h-full" style={{ width: `${rightShare}%` }} />
        <div className="bg-red-500/70 h-full" style={{ width: `${wrongShare}%` }} />
      </div>

      <div className="flex items-center justify-end mt-2.5">
        <button
          onClick={() => {
            if (window.confirm('Clear all progress? This cannot be undone.')) onReset();
          }}
          className="text-xs text-slate-500 hover:text-red-400 transition-colors"
        >
          Reset progress
        </button>
      </div>
    </div>
  );
}
