// One slim toolbar for the QBank home (clean home, 2026-11-26): the
// All | High Yield switch on the left; the exam-skin menu and the
// "Include extras" switch on the right. Source of truth:
// C:/study-tools/_shared/react/QBankToolbar.tsx, copied by _shared/sync_react.py.
// Styles: at-shell.css (.at-tb-*).
//
// Purely presentational: every state and gate is passed in, so the per-repo
// rules (skin access, the extras sign-in, the Advanced tier) stay where they are.
// A control that needs sign-in is shown disabled with a tooltip, not explained.
import { useEffect, useRef, useState, type ReactNode } from 'react';

export interface SkinOption { value: string; label: string }

const DEFAULT_SKINS: SkinOption[] = [
  { value: 'off', label: 'Off' },
  { value: 'examplify', label: 'Examplify' },
  { value: 'examplify-dark', label: 'Examplify Dark' },
  { value: 'nbme', label: 'NBME' },
];

interface Props {
  /** Optional control placed first, e.g. a Standard | Advanced tier switch. */
  leading?: ReactNode;
  hy?: {
    on: boolean;
    onChange: (on: boolean) => void;
    /** Tooltip on the High Yield button (e.g. how many more sign-in adds). */
    title?: string;
  } | null;
  skin?: {
    value: string;
    onChange: (value: string) => void;
    /** Not signed in: the menu is disabled and says why on hover. */
    locked: boolean;
    options?: SkinOption[];
  } | null;
  extras?: {
    on: boolean;
    onChange: (on: boolean) => void;
    /** Not signed in: disabled, with the reason on hover. */
    locked: boolean;
    /** Disabled for another reason (High Yield already mixes them in). */
    disabledReason?: string;
    /** Tooltip while enabled, e.g. "+312 questions". */
    title?: string;
  } | null;
}

const Zap = () => (
  <svg className="at-tb-zap" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
    <path d="M13 2 3 14h9l-1 8 10-12h-9l1-8z" />
  </svg>
);

const SIGN_IN_SKINS = 'Sign in to Active Transport to use the exam skins';
const SIGN_IN_EXTRAS = 'Sign in to Active Transport to include the extra questions';

export function QBankToolbar({ leading, hy, skin, extras }: Props) {
  return (
    <div className="at-tb" role="toolbar" aria-label="Question options">
      <div className="at-tb-left">
        {leading}
        {hy && (
          <div className="at-tb-seg" role="group" aria-label="Question set">
            <button type="button" aria-pressed={!hy.on} className={!hy.on ? 'is-on' : ''}
                    onClick={() => hy.onChange(false)}>All</button>
            <button type="button" aria-pressed={hy.on} className={`is-hy${hy.on ? ' is-on' : ''}`}
                    title={hy.title ?? 'Each topic cut to its highest-yield questions'}
                    onClick={() => hy.onChange(true)}>
              <Zap />High Yield
            </button>
          </div>
        )}
      </div>
      <div className="at-tb-right">
        {skin && <SkinMenu {...skin} />}
        {extras && <ExtrasSwitch {...extras} />}
      </div>
    </div>
  );
}

function SkinMenu({ value, onChange, locked, options = DEFAULT_SKINS }: NonNullable<Props['skin']>) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!open) return;
    const away = (e: MouseEvent) => { if (!ref.current?.contains(e.target as Node)) setOpen(false); };
    const esc = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpen(false); };
    document.addEventListener('mousedown', away);
    document.addEventListener('keydown', esc);
    return () => { document.removeEventListener('mousedown', away); document.removeEventListener('keydown', esc); };
  }, [open]);
  const current = options.find(o => o.value === value)?.label ?? 'Off';
  return (
    // The title sits on the wrapper: a disabled button fires no hover events.
    <div className="at-tb-menu" ref={ref} title={locked ? SIGN_IN_SKINS : undefined}>
      <button type="button" className="at-tb-btn" disabled={locked} aria-haspopup="menu" aria-expanded={open}
              onClick={() => setOpen(o => !o)}>
        <span className="at-tb-btn-k">Exam skin</span>
        <span className="at-tb-btn-v">{locked ? 'Off' : current}</span>
        <svg className="at-tb-caret" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2"
             strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="m6 9 6 6 6-6" /></svg>
      </button>
      {open && !locked && (
        <div className="at-tb-pop" role="menu">
          {options.map(o => (
            <button key={o.value} type="button" role="menuitemradio" aria-checked={o.value === value}
                    onClick={() => { onChange(o.value); setOpen(false); }}>
              <span className="at-tb-tick" aria-hidden="true">{o.value === value ? '✓' : ''}</span>
              {o.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function ExtrasSwitch({ on, onChange, locked, disabledReason, title }: NonNullable<Props['extras']>) {
  const disabled = locked || !!disabledReason;
  const tip = locked ? SIGN_IN_EXTRAS : disabledReason ?? title;
  return (
    <span className="at-tb-sw-wrap" title={tip}>
      <button type="button" role="switch" aria-checked={on && !disabled} disabled={disabled}
              className={`at-tb-sw${on && !disabled ? ' is-on' : ''}`} onClick={() => onChange(!on)}>
        <span className="at-tb-sw-track" aria-hidden="true"><span className="at-tb-sw-dot" /></span>
        Include extras
      </button>
    </span>
  );
}
