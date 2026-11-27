// The Primary Active Transport header (STYLE_SPEC §2), shared by every React
// study tool. Source of truth: C:/study-tools/_shared/react/SiteHeader.tsx,
// copied byte-identical by _shared/sync_react.py. Per-site data (course, accent,
// sibling tools) lives in the generated src/siteConfig.ts. Styles: at-shell.css.
import { useState } from 'react';
import { SITE } from '../siteConfig';
import { BrandStyle, LogoMark } from './Brand';

// The course accent drives active states, progress and focus rings (and the
// remapped Tailwind blue/sky scales in at-shell.css). Set at import time so the
// first paint already has it.
if (typeof document !== 'undefined') {
  const root = document.documentElement.style;
  root.setProperty('--at-accent', SITE.accent);
  root.setProperty('--at-on-accent', SITE.onAccent);
}

const PREFIX_RE = SITE.stripPrefixes.length
  ? new RegExp(`^(?:${SITE.stripPrefixes.map(p => p.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|')})\\s*:\\s+`, 'i')
  : null;

/** A brick/lecture title without the course prefix the header already shows:
 *  "BOOM: Glycolysis" -> "Glycolysis". Display only; ids and data are untouched. */
export function lectureName(name: string | undefined | null): string {
  if (!name) return '';
  return PREFIX_RE ? name.replace(PREFIX_RE, '') : name;
}

/** `authSlot` gives tool-track.js's "Signed in / Sign in" pill a home on the
 *  header's right (#at-auth-slot) instead of a floating corner. Opt-in, so a
 *  repo that still renders <BrandBadge/> keeps its corner stack unchanged. */
export function SiteHeader({ authSlot = false }: { authSlot?: boolean }) {
  return (
    <header className="at-sh" data-at-header="">
      <BrandStyle />
      <div className={`at-sh-in${authSlot ? ' at-sh-has-slot' : ''}`}>
        <a className="at-sh-brand" href="https://activetransport.app/#primary" target="_blank" rel="noopener noreferrer"
           title="Active Transport home">
          <LogoMark size={26} />
          <span className="at-wordmark at-sh-word">Active Transport</span>
        </a>
        <div className="at-sh-title">
          <div className="at-sh-eyebrow">Primary Active Transport · {SITE.course}</div>
          <h1 className="at-sh-h1">{SITE.title}</h1>
        </div>
        {SITE.siblings.length > 1 && (
          <nav className="at-sh-sibs" aria-label={`${SITE.course} study tools`}>
            {SITE.siblings.map(s => (
              <a key={s.url} href={s.url} className="at-sh-pill" aria-current={s.current ? 'page' : undefined}>
                {s.label}
              </a>
            ))}
          </nav>
        )}
        {authSlot && <div id="at-auth-slot" className="at-sh-slot" />}
      </div>
    </header>
  );
}

/** The course's banner art under the header. The files may not be live yet,
 *  so the image stays display:none until it has actually loaded and removes
 *  itself on error: no broken-image icon and no reserved space. */
export function CourseArt({ className = '' }: { className?: string }) {
  const [state, setState] = useState<'wait' | 'ok' | 'err'>('wait');
  if (!SITE.courseKey || state === 'err') return null;
  return (
    <img
      className={`at-art ${className}`}
      src={`https://activetransport.app/static/course-art/${SITE.courseKey}.svg`}
      alt=""
      decoding="async"
      style={state === 'ok' ? undefined : { display: 'none' }}
      onLoad={() => setState('ok')}
      onError={() => setState('err')}
    />
  );
}
