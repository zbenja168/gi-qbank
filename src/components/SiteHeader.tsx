// The Primary Active Transport header (STYLE_SPEC §2), shared by every React
// study tool. Source of truth: C:/study-tools/_shared/react/SiteHeader.tsx,
// copied byte-identical by _shared/sync_react.py. Per-site data (course, accent,
// sibling tools) lives in the generated src/siteConfig.ts. Styles: at-shell.css.
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

export function SiteHeader() {
  return (
    <header className="at-sh" data-at-header="">
      <BrandStyle />
      <div className="at-sh-in">
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
      </div>
    </header>
  );
}
