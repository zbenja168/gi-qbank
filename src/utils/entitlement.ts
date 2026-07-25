// Advanced questions are Active Transport Pro-only and are served ONLY from
// activetransport.app behind an entitlement check — they no longer ship in this
// static repo. This client fetches them with the signed token the hub appends
// (?at=...) and that tool-track.js stores, and caches the result for the session.
import { CategoryQuestions } from '../types/question';
import { TopicsIndex } from '../types/topic';

const API = 'https://activetransport.app';

export type EntitlementStatus = 'ok' | 'locked' | 'error';
export interface EntitlementResult { status: EntitlementStatus; reason?: string }

let cache: { topics: TopicsIndex; questionsByCat: Record<string, CategoryQuestions['questions']> } | null = null;
let cachedTool: string | null = null;

function toolSlug(): string {
  try {
    const el = document.querySelector('script[data-tool]');
    const override = el && el.getAttribute('data-tool');
    if (override) return override.toLowerCase();
    return (location.pathname || '').split('/').filter(Boolean)[0]?.toLowerCase() || 'gi-qbank';
  } catch { return 'gi-qbank'; }
}

function token(): string | null {
  try {
    const m = (location.search || '').match(/[?&]at=([A-Za-z0-9._-]+)/);
    if (m) return m[1];
    return sessionStorage.getItem('at_tool_uid');
  } catch { return null; }
}

export async function loadEntitlement(): Promise<EntitlementResult> {
  const tool = toolSlug();
  if (cache && cachedTool === tool) return { status: 'ok' };
  const t = token();
  const url = `${API}/api/study-tools/${encodeURIComponent(tool)}/advanced` + (t ? `?at=${encodeURIComponent(t)}` : '');
  try {
    const r = await fetch(url, { mode: 'cors' });
    if (r.status === 403) {
      const d = await r.json().catch(() => ({}));
      return { status: 'locked', reason: (d as { reason?: string }).reason };
    }
    if (!r.ok) return { status: 'error' };
    const d = await r.json() as { topics: TopicsIndex; questions: Record<string, CategoryQuestions['questions']> };
    cache = { topics: d.topics, questionsByCat: d.questions || {} };
    cachedTool = tool;
    return { status: 'ok' };
  } catch {
    return { status: 'error' };
  }
}

export function advancedTopics(): TopicsIndex | null {
  return cache ? cache.topics : null;
}

export function advancedCategory(categoryId: string): CategoryQuestions {
  return { categoryId, categoryName: '', questions: (cache && cache.questionsByCat[categoryId]) || [] };
}
