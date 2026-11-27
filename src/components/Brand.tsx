// Active Transport branding for the Primary Active Transport study tools.
// Source of truth: C:/study-tools/_shared/react/Brand.tsx, copied byte-identical
// into every React tool by _shared/sync_react.py. Edit it there, not here.
//
// Exports:
//   <LogoMark/>   the spinning-transporter mark from activetransport.app.
//   <BrandStyle/> the keyframes + wordmark/card/badge styles (idempotent).
//   <BrandBadge/> small fixed corner pill; render once at the app root. It also
//                 collects tool-track.js's "Signed in / Sign in" pill into the
//                 same corner stack so the two never cover content separately.
//   <BrandCard/>  the promo card: title + button (STYLE_SPEC §4).
import { useEffect, useRef } from 'react';

const AT_URL = 'https://activetransport.app';

// Injected once; duplicate tags are harmless if it renders more than once.
export function BrandStyle() {
  return (
    <style>{`
      /* The spinning transporter: a copy of activetransport.app's header mark
         (templates/_logo_mark.html + static/style.css). Stepped 120-degree
         rotation with a dwell, and one substrate pumped up through the pore. */
      @keyframes atStepRotate {
        0%, 2%    { transform: rotate(0deg); }
        7%        { transform: rotate(90deg); }
        10%       { transform: rotate(90deg); }
        14%, 35%  { transform: rotate(120deg); }
        40%       { transform: rotate(210deg); }
        43%       { transform: rotate(210deg); }
        47%, 68%  { transform: rotate(240deg); }
        73%       { transform: rotate(330deg); }
        76%       { transform: rotate(330deg); }
        80%, 100% { transform: rotate(360deg); }
      }
      @keyframes atSubPump {
        0%   { transform: translate(0, 0) scale(1);           opacity: 0; fill: #38bdf8; }
        6%   { transform: translate(0, -2px) scale(1);        opacity: 1; fill: #38bdf8; }
        24%  { transform: translate(0, -10px) scale(1);       opacity: 1; fill: #38bdf8; }
        28%  { transform: translate(0, -16px) scale(1);       opacity: 0; fill: #38bdf8; }
        44%  { transform: translate(0, -46px) scale(1);       opacity: 0; fill: #38bdf8; }
        50%  { transform: translate(0, -58px) scale(1);       opacity: 0; fill: #f97316; }
        55%  { transform: translate(0, -66px) scale(1);       opacity: 0; fill: #f97316; }
        59%  { transform: translate(0, -72px) scale(1);       opacity: 1; fill: #f97316; }
        72%  { transform: translate(8px, -88px) scale(1);     opacity: 1; fill: #f97316; }
        86%  { transform: translate(18px, -102px) scale(1);   opacity: 1; fill: #f97316; }
        100% { transform: translate(26px, -116px) scale(0.8); opacity: 0; fill: #f97316; }
      }
      .at-mark-head { transform-box: view-box; transform-origin: 60px 35.75px; animation: atStepRotate 3.6s infinite; }
      .at-mark-sub  { fill: #38bdf8; transform-box: fill-box; transform-origin: center; animation: atSubPump 3.6s linear infinite; }
      @media (prefers-reduced-motion: reduce) {
        .at-mark-head { animation: none; }
        .at-mark-sub  { animation: none; transform: translateY(-6px); opacity: 1; }
      }
      .at-wordmark {
        background: linear-gradient(135deg, #38bdf8 0%, #22d3ee 45%, #2dd4bf 100%);
        -webkit-background-clip: text;
        background-clip: text;
        -webkit-text-fill-color: transparent;
        font-weight: 800;
        letter-spacing: -0.02em;
      }

      /* Corner stack: the AT badge and tool-track.js's sign-in pill, side by side. */
      .at-corner {
        position: fixed; left: 16px; bottom: 16px; z-index: 50;
        display: flex; align-items: center; gap: 8px; max-width: calc(100vw - 32px);
        pointer-events: none;
      }
      .at-corner > * { pointer-events: auto; }
      .at-badge {
        display: flex; align-items: center; gap: 8px; flex-shrink: 0;
        padding: 7px 12px 7px 9px; border-radius: 999px;
        background: rgba(15,23,42,0.92); border: 1px solid #334155;
        text-decoration: none; backdrop-filter: blur(6px);
        box-shadow: 0 4px 14px rgba(0,0,0,0.35);
        transition: transform .15s ease, box-shadow .15s ease;
      }
      .at-badge:hover { transform: translateY(-1px); box-shadow: 0 6px 20px rgba(34,211,238,0.18); }
      .at-badge-text { display: flex; flex-direction: column; line-height: 1.05; }
      .at-badge-sub { font-size: 0.62rem; color: #64748b; }
      .at-corner #at-auth-badge { position: static !important; flex-shrink: 1; min-width: 0; white-space: nowrap; }
      @media (max-width: 640px) {
        .at-corner { left: 12px; bottom: 12px; max-width: calc(100vw - 24px); }
        .at-badge { height: 36px; box-sizing: border-box; padding: 0 11px 0 8px; gap: 6px; }
        .at-badge .at-badge-sub { display: none; }
        .at-corner #at-auth-badge { height: 36px; box-sizing: border-box; padding: 0 11px !important; }
      }

      /* Promo card: icon | text | button in a row; stacked below 640px. */
      .at-card {
        display: grid; grid-template-columns: auto minmax(0, 1fr) auto;
        grid-template-areas: "icon title cta";
        column-gap: 16px; row-gap: 4px; align-items: center;
        margin: 24px 0; padding: 16px 18px; border-radius: 16px; text-decoration: none;
        background: linear-gradient(135deg, rgba(34,211,238,0.08), rgba(45,212,191,0.05));
        border: 1px solid #1e3a44;
      }
      .at-card-icon { grid-area: icon; display: flex; }
      .at-card-title { grid-area: title; font-size: 1.05rem; font-weight: 700; color: #e2e8f0; min-width: 0; }
      .at-card-text { grid-area: text; margin: 0; font-size: 0.86rem; color: #94a3b8; line-height: 1.5; align-self: start; }
      .at-card-cta {
        grid-area: cta; white-space: nowrap; text-align: center;
        padding: 10px 16px; border-radius: 10px; font-size: 0.875rem; font-weight: 600;
        color: #0f172a; background: linear-gradient(135deg, #38bdf8 0%, #22d3ee 45%, #2dd4bf 100%);
        transition: filter .15s ease, transform .15s ease;
      }
      .at-card:hover .at-card-cta { filter: brightness(1.08); transform: translateY(-1px); }
      @media (max-width: 639px) {
        .at-card {
          grid-template-columns: auto minmax(0, 1fr);
          grid-template-areas: "icon title" "cta cta";
          row-gap: 10px; column-gap: 10px; padding: 16px;
        }
        .at-card-title { align-self: center; }
        .at-card-cta { display: flex; align-items: center; justify-content: center; min-height: 44px; white-space: normal; }
      }
    `}</style>
  );
}

/** The logo mark: activetransport.app's spinning transporter, at any size.
 *
 *  Same geometry and paint order as the site's templates/_logo_mark.html
 *  (viewBox 120x112, rendered 30:28): two membrane leaflets, the ring and tube
 *  of the transporter, a three-lobed head that turns in 120-degree steps, and a
 *  substrate threaded between the head's back and front lobes.
 */
export function LogoMark({ size = 28 }: { size?: number }) {
  return (
    <span aria-hidden="true" style={{ display: 'inline-block', width: (size * 30) / 28, height: size, flexShrink: 0 }}>
      <svg viewBox="0 0 120 112" style={{ display: 'block', width: '100%', height: '100%', overflow: 'visible' }}>
        <rect x="0" y="68" width="120" height="8" rx="4" fill="#475569" />
        <rect x="0" y="92" width="120" height="8" rx="4" fill="#475569" />
        <ellipse cx="60" cy="84" rx="20" ry="16" fill="#0d7f76" opacity="0.92"
                 stroke="#38bdf8" strokeWidth="1.4" strokeOpacity="0.75" />
        <rect x="55" y="50" width="10" height="36" rx="5" fill="#38bdf8" opacity="0.85" />
        <g className="at-mark-head">
          <ellipse cx="60" cy="37" rx="22" ry="16" fill="#fbbf24" opacity="0.28" />
          <circle cx="60" cy="26" r="10.5" fill="#fbbf24" opacity="0.85" />
          <circle cx="43" cy="35" r="10.5" fill="#f59e0b" opacity="0.82" />
          <circle cx="77" cy="35" r="10.5" fill="#f59e0b" opacity="0.82" />
        </g>
        <circle className="at-mark-sub" cx="60" cy="112" r="4.5" />
        <g className="at-mark-head">
          <circle cx="50" cy="47" r="9" fill="#fbbf24" opacity="0.82" />
          <circle cx="70" cy="47" r="9" fill="#fbbf24" opacity="0.82" />
        </g>
      </svg>
    </span>
  );
}

// Small fixed pill, bottom-left, on every page. tool-track.js (loaded from
// activetransport.app) appends its own sign-in pill to <body> bottom-right; it
// is moved into this stack so phones get one corner, not two.
export function BrandBadge() {
  const stack = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const adopt = () => {
      const pill = document.getElementById('at-auth-badge');
      // A page whose header has the pill slot (SiteHeader authSlot) keeps it there.
      if (document.getElementById('at-auth-slot')) return !!pill;
      if (pill && stack.current && pill.parentElement !== stack.current) stack.current.appendChild(pill);
      return !!pill;
    };
    if (adopt()) return;
    const obs = new MutationObserver(() => { if (adopt()) obs.disconnect(); });
    obs.observe(document.body, { childList: true });
    const stop = window.setTimeout(() => obs.disconnect(), 20000);
    return () => { obs.disconnect(); window.clearTimeout(stop); };
  }, []);
  return (
    <>
      <BrandStyle />
      <div ref={stack} className="at-corner">
        <a
          id="at-badge-root"
          href={AT_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="at-badge"
          title="Active Transport"
        >
          <LogoMark size={22} />
          <span className="at-badge-text">
            <span className="at-wordmark" style={{ fontSize: '0.82rem' }}>Active Transport</span>
          </span>
        </a>
      </div>
    </>
  );
}

type CardKind = 'qbank' | 'game';

// Promo card (STYLE_SPEC §4): "Part of Active Transport" plus the button, no
// paragraph. Place it after the tool's main content, never as the first screen
// on a phone. `kind` is kept so existing call sites compile; the copy no longer
// differs by tool type.
export function BrandCard(_props: { kind?: CardKind }) {
  return (
    <>
      <BrandStyle />
      <a href={`${AT_URL}/#primary`} target="_blank" rel="noopener noreferrer" className="at-card">
        <span className="at-card-icon"><LogoMark size={34} /></span>
        <span className="at-card-title">Part of <span className="at-wordmark">Active Transport</span></span>
        <span className="at-card-cta">Open Active Transport →</span>
      </a>
    </>
  );
}
