// Exam skins ("Examplify Skin" / "NBME Skin") re-dress the quiz to look like
// the interfaces students actually sit exams in. They are gated on being
// signed in to Active Transport — same signed-token plumbing as the advanced
// questions, one rung lower: any account, not just Pro.
const API = 'https://activetransport.app';

export type SkinName = 'off' | 'examplify' | 'nbme';
export type SkinAccess = 'ok' | 'locked' | 'error';

const STORE = 'at_qbank_skin';

function token(): string | null {
  try {
    const m = (location.search || '').match(/[?&]at=([A-Za-z0-9._-]+)/);
    if (m) return m[1];
    return sessionStorage.getItem('at_tool_uid');
  } catch {
    return null;
  }
}

let accessCache: SkinAccess | null = null;

export async function loadSkinAccess(): Promise<SkinAccess> {
  if (accessCache) return accessCache;
  const t = token();
  // No token at all means not signed in — don't spend a request to find out.
  if (!t) {
    accessCache = 'locked';
    return accessCache;
  }
  try {
    const r = await fetch(`${API}/api/study-tools/skins?at=${encodeURIComponent(t)}`, { mode: 'cors' });
    accessCache = r.status === 403 ? 'locked' : r.ok ? 'ok' : 'error';
  } catch {
    accessCache = 'error';
  }
  return accessCache;
}

export function savedSkin(): SkinName {
  try {
    const s = localStorage.getItem(STORE);
    return s === 'examplify' || s === 'nbme' ? s : 'off';
  } catch {
    return 'off';
  }
}

/** Sets the attribute every skin rule hangs off, and remembers the choice. */
export function applySkin(skin: SkinName) {
  try {
    if (skin === 'off') document.documentElement.removeAttribute('data-skin');
    else document.documentElement.setAttribute('data-skin', skin);
    localStorage.setItem(STORE, skin);
  } catch {
    /* private mode — the skin still applies for this page view */
  }
}

/** Re-apply on load, but never leave a skin on for someone who has signed out. */
export async function restoreSkin(): Promise<SkinName> {
  const want = savedSkin();
  if (want === 'off') return 'off';
  const access = await loadSkinAccess();
  if (access !== 'ok') {
    applySkin('off');
    return 'off';
  }
  applySkin(want);
  return want;
}
