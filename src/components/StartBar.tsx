// The QBank start bar (clean home, 2026-11-26): slides up from the bottom only
// once something is selected, and is gone (not a disabled grey bar) otherwise.
// Source of truth: C:/study-tools/_shared/react/StartBar.tsx, copied by
// _shared/sync_react.py. Styles: at-shell.css (.at-sb-*).
//
// Renders a spacer while visible so the bar never sits over the last row.
interface Props {
  /** Sessions (categories) with at least one topic selected. */
  sessions: number;
  /** Questions the quiz will serve. */
  questions: number;
  onStart: () => void;
  onClear?: () => void;
  /** High Yield mode: the button takes the amber energy accent. */
  hy?: boolean;
}

export function StartBar({ sessions, questions, onStart, onClear, hy = false }: Props) {
  const show = sessions > 0;
  return (
    <>
      {show && <div className="at-sb-spacer" aria-hidden="true" />}
      <div className={`at-sb${show ? ' is-up' : ''}`} aria-hidden={!show}>
        <div className="at-sb-in">
          {onClear && (
            <button type="button" className="at-sb-clear" onClick={onClear} tabIndex={show ? 0 : -1}>Clear</button>
          )}
          <button type="button" className={`at-sb-go${hy ? ' is-hy' : ''}`} onClick={onStart} disabled={!show || questions === 0}
                  tabIndex={show ? 0 : -1}>
            Start {sessions} session{sessions === 1 ? '' : 's'}
            <span className="at-sb-dot">·</span>
            {questions} Qs
            <span aria-hidden="true"> →</span>
          </button>
        </div>
      </div>
    </>
  );
}
