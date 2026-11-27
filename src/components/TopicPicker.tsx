// The QBank topic picker: collapsible weeks of quiet session rows (clean home,
// 2026-11-26). Source of truth: C:/study-tools/_shared/react/TopicPicker.tsx,
// copied by _shared/sync_react.py. Styles: at-shell.css (.at-pk-*).
//
// Data-shape agnostic on purpose: it takes the same topics.json categories,
// per-topic stats (hooks/useTopicProgress) and extras set every QBank already
// has, typed structurally so no repo type has to change.
//
//   <TopicPicker categories={topics.categories} selectedTopicIds={...}
//     extrasTopicIds={...} topicStats={topicStats} hyMode={hyMode}
//     sessions={progress.sessions}
//     onToggleTopic={...} onToggleCategory={...} />
import { useMemo, useState } from 'react';
import { SITE } from '../siteConfig';
import { lectureName } from './SiteHeader';

export interface PickerTopic {
  id: string;
  name: string;
  questionCount: number;
  coreCount?: number;
  extraCount?: number;
  hyCoreCount?: number;
}
export interface PickerCategory {
  id: string;
  name: string;
  topics: PickerTopic[];
  week?: number;
  weekName?: string;
  weekSubtitle?: string;
}
/** hooks/useTopicProgress's TopicStat; the tier fields are optional so the
 *  single-tier banks' older stat shape still fits. */
export interface PickerStat {
  total: number;
  remaining: number;
  complete: boolean;
  coreTotal?: number;
  coreRemaining?: number;
  coreComplete?: boolean;
  hyTotal?: number;
  hyRemaining?: number;
  hyComplete?: boolean;
  /** ISO time of the latest answer in the topic (picks the "current" week). */
  lastAt?: string;
}

/** Counts follow the tier each topic serves (core, core+extras, or the
 *  high-yield picks), so a row never promises questions a quiz would not
 *  serve. The same rules the old CategoryAccordion used. */
function topicMetrics(
  topicStats: Map<string, PickerStat> | null | undefined,
  extrasTopicIds: Set<string>,
  hyMode: boolean,
) {
  const on = (id: string) => extrasTopicIds.has(id);
  const stat = (id: string) => topicStats?.get(id);
  const total = (t: PickerTopic): number => {
    const s = stat(t.id);
    if (hyMode) return s ? (s.hyTotal ?? 0) : (t.hyCoreCount ?? 0);
    if (!s) return on(t.id) ? t.questionCount : (t.coreCount ?? t.questionCount);
    return on(t.id) ? s.total : (s.coreTotal ?? s.total);
  };
  /** Null until the question files have loaded. */
  const remaining = (t: PickerTopic): number | null => {
    const s = stat(t.id);
    if (!s) return null;
    if (hyMode) return s.hyRemaining ?? 0;
    return on(t.id) ? s.remaining : (s.coreRemaining ?? s.remaining);
  };
  const done = (t: PickerTopic): boolean => {
    const s = stat(t.id);
    if (!s) return false;
    if (hyMode) return !!s.hyComplete;
    return on(t.id) ? s.complete : (s.coreComplete ?? s.complete);
  };
  return { total, remaining, done };
}

type Metrics = ReturnType<typeof topicMetrics>;

interface Props<C extends PickerCategory> {
  categories: C[];
  selectedTopicIds: Set<string>;
  extrasTopicIds: Set<string>;
  topicStats?: Map<string, PickerStat> | null;
  hyMode?: boolean;
  /** Fallback for the current week when stats carry no lastAt. */
  sessions?: { endedAt: string; topicIds: string[] }[];
  onToggleTopic: (topicId: string) => void;
  onToggleCategory: (category: C) => void;
  /** localStorage key for open/closed weeks. Defaults to one per repo. */
  storageKey?: string;
}

interface Week<C extends PickerCategory = PickerCategory> {
  key: string;
  label: string;
  categories: C[];
  /** Not a teaching week ("Picture questions", micro's "More"): never the
   *  default-open "newest" week. */
  isAside: boolean;
  week?: number;
}

function groupWeeks<C extends PickerCategory>(categories: C[]): Week<C>[] {
  const out: Week<C>[] = [];
  for (const c of categories) {
    const key = c.week !== undefined ? `w${c.week}` : 'all';
    let w = out[out.length - 1];
    if (!w || w.key !== key) {
      const name = c.weekName || (c.week !== undefined ? `Week ${c.week}` : '');
      w = {
        key,
        label: [name, c.weekSubtitle].filter(Boolean).join(' · '),
        categories: [],
        isAside: /picture|^more$/i.test(name.trim()),
        week: c.week,
      };
      out.push(w);
    }
    w.categories.push(c);
  }
  return out;
}

function readOpen(key: string): Record<string, boolean> {
  try {
    const v = JSON.parse(localStorage.getItem(key) || '{}');
    return v && typeof v === 'object' ? v : {};
  } catch { return {}; }
}

const Chevron = ({ open }: { open: boolean }) => (
  <svg className={`at-pk-chev${open ? ' is-open' : ''}`} viewBox="0 0 24 24" fill="none" stroke="currentColor"
       strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="m6 9 6 6 6-6" />
  </svg>
);

function Check({ state }: { state: 'on' | 'some' | 'off' }) {
  return (
    <span className={`at-pk-box is-${state}`} aria-hidden="true">
      {state === 'on' && (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3.2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M5 13l4 4L19 7" />
        </svg>
      )}
      {state === 'some' && <span className="at-pk-dash" />}
    </span>
  );
}

export function TopicPicker<C extends PickerCategory>({
  categories, selectedTopicIds, extrasTopicIds, topicStats, hyMode = false, sessions,
  onToggleTopic, onToggleCategory, storageKey = `at_open_weeks_${SITE.repo}`,
}: Props<C>) {
  const m = topicMetrics(topicStats, extrasTopicIds, hyMode);
  const weeks = useMemo(() => groupWeeks(categories), [categories]);

  // The current week: where the latest answer was, else the latest session,
  // else the newest teaching week (picture / "More" groups don't count as newest).
  const currentKey = useMemo(() => {
    const weekOfTopic = new Map<string, string>();
    for (const w of weeks) for (const c of w.categories) for (const t of c.topics) weekOfTopic.set(t.id, w.key);
    let best: string | undefined, bestAt = '';
    if (topicStats) {
      for (const [id, s] of topicStats) {
        if (s.lastAt && s.lastAt > bestAt && weekOfTopic.has(id)) { bestAt = s.lastAt; best = weekOfTopic.get(id); }
      }
    }
    if (!best && sessions?.length) {
      const last = [...sessions].sort((a, b) => (a.endedAt < b.endedAt ? 1 : -1))[0];
      best = last.topicIds.map(id => weekOfTopic.get(id)).find(Boolean);
    }
    if (best) return best;
    const teaching = weeks.filter(w => !w.isAside);
    return (teaching[teaching.length - 1] ?? weeks[weeks.length - 1])?.key;
  }, [weeks, topicStats, sessions]);

  // Only explicit clicks are stored, so the default keeps following the
  // student's current week until they open or close something themselves.
  const [overrides, setOverrides] = useState<Record<string, boolean>>(() => readOpen(storageKey));
  const isOpen = (w: Week<C>) => weeks.length === 1 || (overrides[w.key] ?? w.key === currentKey);
  const toggleWeek = (w: Week<C>) => {
    const next = { ...overrides, [w.key]: !isOpen(w) };
    setOverrides(next);
    try { localStorage.setItem(storageKey, JSON.stringify(next)); } catch { /* private mode */ }
  };

  return (
    <div className="at-pk">
      {weeks.map(w => {
        const open = isOpen(w);
        const qs = w.categories.reduce((n, c) => n + c.topics.reduce((k, t) => k + m.total(t), 0), 0);
        const picked = w.categories.reduce((n, c) => n + (c.topics.some(t => selectedTopicIds.has(t.id)) ? 1 : 0), 0);
        const allDone = !!topicStats && w.categories.every(c => c.topics.length > 0 && c.topics.every(m.done));
        const single = weeks.length === 1 && !w.label;
        return (
          <section key={w.key} className={`at-pk-week${open ? ' is-open' : ''}`}>
            {!single && (
              <button type="button" className="at-pk-wh" aria-expanded={open} onClick={() => toggleWeek(w)}>
                <span className="at-pk-wh-label" title={w.label}>{w.label}</span>
                {picked > 0 && <span className="at-pk-wh-picked">{picked} selected</span>}
                <span className="at-pk-muted">{allDone ? 'Done' : `${qs} Qs`}</span>
                <Chevron open={open} />
              </button>
            )}
            {open && (
              <div className="at-pk-rows">
                {w.categories.map(c => (
                  <SessionRow key={c.id} category={c} m={m} selectedTopicIds={selectedTopicIds}
                              statsReady={!!topicStats}
                              onToggleTopic={onToggleTopic}
                              onToggleCategory={() => onToggleCategory(c)} />
                ))}
              </div>
            )}
          </section>
        );
      })}
    </div>
  );
}

function SessionRow({ category, m, selectedTopicIds, statsReady, onToggleTopic, onToggleCategory }: {
  category: PickerCategory;
  m: Metrics;
  selectedTopicIds: Set<string>;
  statsReady: boolean;
  onToggleTopic: (id: string) => void;
  onToggleCategory: () => void;
}) {
  const [open, setOpen] = useState(false);
  const total = category.topics.reduce((n, t) => n + m.total(t), 0);
  const left = category.topics.reduce((n, t) => n + (m.remaining(t) ?? m.total(t)), 0);
  const answered = total - left;
  const done = statsReady && category.topics.length > 0 && category.topics.every(m.done);
  const sel = category.topics.filter(t => selectedTopicIds.has(t.id)).length;
  const state = sel === 0 ? 'off' : sel === category.topics.length ? 'on' : 'some';
  const name = lectureName(category.name);
  return (
    <div className={`at-pk-row${done ? ' is-done' : ''}${state !== 'off' ? ' is-picked' : ''}`}>
      <div className="at-pk-rh">
        <button type="button" className="at-pk-pick" role="checkbox"
                aria-checked={state === 'on' ? true : state === 'some' ? 'mixed' : false}
                onClick={onToggleCategory}>
          <Check state={state} />
          <span className="at-pk-name">{name}</span>
          <span className="at-pk-muted" title={answered > 0 && !done ? `${left} left` : undefined}>
            {done ? 'Done' : `${total} Qs`}
          </span>
        </button>
        <button type="button" className="at-pk-exp" aria-expanded={open}
                aria-label={`${open ? 'Hide' : 'Show'} lectures in ${name}`} onClick={() => setOpen(o => !o)}>
          <Chevron open={open} />
        </button>
        {answered > 0 && !done && (
          <div className="at-pk-prog" aria-hidden="true">
            <div style={{ width: `${total ? (answered / total) * 100 : 0}%` }} />
          </div>
        )}
      </div>
      {open && (
        <ul className="at-pk-lects">
          {category.topics.map(t => {
            const tDone = m.done(t);
            const rem = m.remaining(t);
            const tot = m.total(t);
            return (
              <li key={t.id}>
                <label className={`at-pk-lect${tDone ? ' is-done' : ''}`}
                       title={tDone ? 'Every question here is answered. Reset progress to take them again.' : undefined}>
                  <input type="checkbox" className="at-pk-sr" checked={selectedTopicIds.has(t.id)} disabled={tDone}
                         onChange={() => onToggleTopic(t.id)} />
                  <Check state={selectedTopicIds.has(t.id) ? 'on' : 'off'} />
                  <span className="at-pk-name">{lectureName(t.name)}</span>
                  <span className="at-pk-muted">
                    {tDone ? 'Done' : rem !== null && rem < tot ? `${rem} left` : `${tot} Qs`}
                  </span>
                </label>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
