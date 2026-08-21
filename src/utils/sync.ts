// Account-backed progress. This QBank's own storage is localStorage, which is
// per browser — open it on a phone and you start from nothing. When the reader
// is signed in to Active Transport, progress is mirrored to their account so it
// follows them between devices, and between the exam skins' scored palette and
// the dashboard.
//
// Signed-in is the bar, same signed ?at= token as the skins. Everything here
// fails soft: if the network is down or the token has expired, the QBank keeps
// working exactly as it did before, on local storage alone.
import { ProgressData, DEFAULT_PROGRESS, AnswerRecord } from '../types/progress';

const API = 'https://activetransport.app';

/** Slug this QBank reports as. Taken from the pathname so a repo rename can't
 *  silently split one tool's progress across two names. */
export function toolSlug(): string {
  try {
    const seg = location.pathname.split('/').filter(Boolean)[0] || 'qbank';
    return seg.toLowerCase().slice(0, 40);
  } catch {
    return 'qbank';
  }
}

function token(): string | null {
  try {
    const m = (location.search || '').match(/[?&]at=([A-Za-z0-9._-]+)/);
    if (m) return m[1];
    return sessionStorage.getItem('at_tool_uid');
  } catch {
    return null;
  }
}

export function canSync(): boolean {
  return !!token();
}

function counts(p: ProgressData) {
  const rows = Object.values(p.answers || {});
  return { answered: rows.length, correct: rows.filter(r => r.isCorrect).length };
}

/** Union two progress blobs. Per question the LATER answer wins, so answering
 *  the same question on two devices settles on the most recent attempt rather
 *  than on whichever device happened to sync last. */
export function mergeProgress(a: ProgressData, b: ProgressData): ProgressData {
  const answers: Record<string, AnswerRecord> = { ...(a.answers || {}) };
  for (const [id, rec] of Object.entries(b.answers || {})) {
    const cur = answers[id];
    if (!cur || String(rec.answeredAt || '') > String(cur.answeredAt || '')) {
      answers[id] = rec;
    }
  }
  const seen = new Set<string>();
  const sessions = [...(a.sessions || []), ...(b.sessions || [])]
    .filter(s => (s && s.id && !seen.has(s.id)) ? (seen.add(s.id), true) : false)
    .sort((x, y) => String(x.startedAt).localeCompare(String(y.startedAt)));
  return {
    version: 1,
    answers,
    sessions,
    bookmarkedQuestions: Array.from(new Set([
      ...(a.bookmarkedQuestions || []), ...(b.bookmarkedQuestions || []),
    ])),
    lastTopicFilter: b.lastTopicFilter?.length ? b.lastTopicFilter : (a.lastTopicFilter || []),
  };
}

/** Fetch the account copy and merge it into `local`. Returns the merged result,
 *  or `local` unchanged when there is nothing to merge or the call fails. */
export async function pullProgress(local: ProgressData): Promise<ProgressData> {
  const t = token();
  if (!t) return local;
  try {
    const r = await fetch(
      `${API}/api/study-tools/progress?at=${encodeURIComponent(t)}&tool=${encodeURIComponent(toolSlug())}`,
      { mode: 'cors' });
    if (!r.ok) return local;
    const body = await r.json();
    const remote = body && body.progress;
    if (!remote || remote.version !== 1) return local;
    return mergeProgress(local, remote as ProgressData);
  } catch {
    return local;
  }
}

let pushTimer: number | undefined;

/** Mirror progress to the account. Debounced — answering ten questions in a row
 *  should cost one request, not ten. */
export function pushProgress(p: ProgressData) {
  const t = token();
  if (!t) return;
  clearTimeout(pushTimer);
  pushTimer = setTimeout(() => {
    const { answered, correct } = counts(p);
    try {
      fetch(`${API}/api/study-tools/progress?at=${encodeURIComponent(t)}&tool=${encodeURIComponent(toolSlug())}`,
        {
          method: 'POST',
          mode: 'cors',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ progress: p, answered, correct }),
        }).catch(() => { /* progress syncing must never break the quiz */ });
    } catch { /* ignore */ }
  }, 1500) as unknown as number;
}

export { DEFAULT_PROGRESS };
