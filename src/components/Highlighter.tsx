// Highlighter for QBank questions. Shared, byte-identical in every QBank
// (copied by _shared/sync_react.py; edit it there, not in a repo).
//
// Select text in the stem or the explanation and it turns yellow, the way the
// exam software does. Click a highlight to remove it. Highlights are kept per
// question in this browser (localStorage), so they're still there on review.
// Offsets are character positions in the field's plain text, so they survive
// re-renders and never depend on the DOM shape.
import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react';

type Range2 = [number, number];
type Store = Record<string, Range2[]>;

const MODE_KEY = 'at-hl-mode';

function tool(): string {
  try { return (location.pathname.split('/').filter(Boolean)[0] || 'qbank').toLowerCase(); }
  catch { return 'qbank'; }
}
const keyFor = (qid: string) => `at-hl:${tool()}:${qid}`;

function load(qid: string): Store {
  try {
    const raw = localStorage.getItem(keyFor(qid));
    const v = raw ? JSON.parse(raw) : {};
    return v && typeof v === 'object' ? v : {};
  } catch { return {}; }
}

function save(qid: string, s: Store) {
  try {
    const empty = Object.values(s).every(r => !r.length);
    if (empty) localStorage.removeItem(keyFor(qid));
    else localStorage.setItem(keyFor(qid), JSON.stringify(s));
  } catch { /* private mode: highlights just don't persist */ }
}

function merge(list: Range2[]): Range2[] {
  const sorted = list.filter(([a, b]) => b > a).sort((x, y) => x[0] - y[0]);
  const out: Range2[] = [];
  for (const r of sorted) {
    const last = out[out.length - 1];
    if (last && r[0] <= last[1]) last[1] = Math.max(last[1], r[1]);
    else out.push([r[0], r[1]]);
  }
  return out;
}

/** Highlight state for one question, plus the on/off mode (remembered). */
export function useHighlights(qid: string) {
  const [store, setStore] = useState<Store>(() => load(qid));
  const [on, setOn] = useState<boolean>(() => {
    try { return localStorage.getItem(MODE_KEY) !== 'off'; } catch { return true; }
  });
  useEffect(() => { setStore(load(qid)); }, [qid]);

  const update = useCallback((fn: (s: Store) => Store) => {
    setStore(prev => { const next = fn(prev); save(qid, next); return next; });
  }, [qid]);

  return {
    on,
    toggle: () => setOn(v => {
      try { localStorage.setItem(MODE_KEY, v ? 'off' : 'on'); } catch { /* ignore */ }
      return !v;
    }),
    ranges: (field: string) => store[field] || [],
    add: (field: string, r: Range2) => update(s => ({ ...s, [field]: merge([...(s[field] || []), r]) })),
    remove: (field: string, i: number) =>
      update(s => ({ ...s, [field]: (s[field] || []).filter((_, j) => j !== i) })),
    clear: () => update(() => ({})),
    any: Object.values(store).some(r => r.length > 0),
  };
}

export type Highlights = ReturnType<typeof useHighlights>;

/** Character offset of (node, offset) from the start of `root`'s text. */
function offsetIn(root: Node, node: Node, offset: number): number {
  const r = document.createRange();
  r.setStart(root, 0);
  r.setEnd(node, offset);
  return r.toString().length;
}

interface TextProps {
  field: string;
  text: string;
  hl: Highlights;
  as?: 'p' | 'span' | 'div';
  className?: string;
}

/** Renders `text` with its highlights, and turns a selection inside it into one. */
export function HighlightText({ field, text, hl, as = 'p', className }: TextProps) {
  const ref = useRef<HTMLElement | null>(null);
  // Keep each range's index in the store, so removing one removes the right one.
  const ranges = hl.ranges(field)
    .map((r, i) => [r[0], r[1], i] as [number, number, number])
    .filter(([a, b]) => a < text.length && b > a);

  const capture = () => {
    if (!hl.on || !ref.current) return;
    const sel = window.getSelection();
    if (!sel || sel.rangeCount === 0 || sel.isCollapsed) return;
    const root = ref.current;
    const r = sel.getRangeAt(0);
    // Clamp the selection to this field, so a drag that runs past its end
    // still highlights the part that's inside.
    const whole = document.createRange();
    whole.selectNodeContents(root);
    if (r.compareBoundaryPoints(Range.END_TO_START, whole) >= 0 ||
        r.compareBoundaryPoints(Range.START_TO_END, whole) <= 0) return;
    const start = r.compareBoundaryPoints(Range.START_TO_START, whole) < 0
      ? 0 : offsetIn(root, r.startContainer, r.startOffset);
    const end = r.compareBoundaryPoints(Range.END_TO_END, whole) > 0
      ? text.length : offsetIn(root, r.endContainer, r.endOffset);
    // Trim surrounding whitespace so a double-click doesn't paint a trailing space.
    let s = start, e = Math.min(end, text.length);
    while (s < e && /\s/.test(text[s])) s++;
    while (e > s && /\s/.test(text[e - 1])) e--;
    if (e > s) {
      hl.add(field, [s, e]);
      sel.removeAllRanges();
    }
  };

  const parts: ReactNode[] = [];
  let pos = 0;
  ranges.forEach(([a, b, i]) => {
    const e = Math.min(b, text.length);
    if (a > pos) parts.push(text.slice(pos, a));
    parts.push(
      <mark
        key={i}
        data-part="hl"
        title="Click to remove the highlight"
        onClick={ev => {
          const sel = window.getSelection();
          if (sel && !sel.isCollapsed) return; // starting a new selection, not a click
          ev.stopPropagation();
          hl.remove(field, i);
        }}
      >{text.slice(a, e)}</mark>
    );
    pos = e;
  });
  if (pos < text.length) parts.push(text.slice(pos));

  const Tag = as;
  return (
    <Tag
      ref={(el: HTMLElement | null) => { ref.current = el; }}
      className={className}
      data-hl-on={hl.on ? 'on' : undefined}
      onMouseUp={capture}
      onTouchEnd={() => setTimeout(capture, 0)}
      onKeyUp={capture}
    >{parts}</Tag>
  );
}

/** The marker toggle (and a clear button once something is highlighted). */
export function HighlightToggle({ hl }: { hl: Highlights }) {
  return (
    <span className="inline-flex items-center gap-1">
      <button
        type="button"
        data-part="tool-btn"
        data-state={hl.on ? 'on' : undefined}
        aria-pressed={hl.on}
        onClick={hl.toggle}
        title={hl.on ? 'Highlighter on: select text to highlight it' : 'Highlighter off'}
        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium border transition-colors ${
          hl.on ? 'border-yellow-400/60 bg-yellow-400/15 text-yellow-300'
                : 'border-slate-600 text-slate-400 hover:text-slate-200'}`}
      >
        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="m9 11-6 6v3h9l3-3" /><path d="m22 12-4.6 4.6a2 2 0 0 1-2.8 0l-5.2-5.2a2 2 0 0 1 0-2.8L14 4" />
        </svg>
        Highlight
      </button>
      {hl.any && (
        <button
          type="button"
          data-part="tool-btn"
          onClick={hl.clear}
          title="Remove every highlight on this question"
          className="px-2 py-1 rounded-md text-xs text-slate-500 hover:text-slate-300"
        >
          Clear
        </button>
      )}
    </span>
  );
}
