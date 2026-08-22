/* Active Transport's visual identity, ported into the study tools.
 *
 * Two pieces, both self-contained (these are static sites and cannot share the
 * app's stylesheet):
 *   <MembraneDivider/> — the phospholipid-bilayer rule with an ATP node in
 *     transit through it, used to separate sections.
 *   <MembraneLoader/>  — the transporter working in the membrane, shown while a
 *     quiz loads instead of a bare "Loading questions…".
 *
 * The lipid tile and the transporter geometry are lifted from the app's own
 * scene rather than redrawn, so the two products actually match.
 */

// One phospholipid: two heads with tails meeting in the middle — the tile that
// repeats to make a bilayer. Same asset as --membrane-bg in the app.
const LIPID_TILE =
  "url(\"data:image/svg+xml,%3Csvg%20xmlns='http://www.w3.org/2000/svg'%20width='16'%20height='30'%3E%3Ccircle%20cx='8'%20cy='4.5'%20r='4.2'%20fill='%2338bdf8'%20fill-opacity='0.72'/%3E%3Cpath%20d='M6.2%208.4C5.4%2010.5%206.6%2012.5%205.8%2015M9.8%208.4C10.6%2010.5%209.4%2012.5%2010.2%2015'%20stroke='%2338bdf8'%20stroke-opacity='0.6'%20stroke-width='1.4'%20fill='none'%20stroke-linecap='round'/%3E%3Ccircle%20cx='8'%20cy='25.5'%20r='4.2'%20fill='%2338bdf8'%20fill-opacity='0.72'/%3E%3Cpath%20d='M6.2%2021.6C5.4%2019.5%206.6%2017.5%205.8%2015M9.8%2021.6C10.6%2019.5%209.4%2017.5%2010.2%2015'%20stroke='%2338bdf8'%20stroke-opacity='0.6'%20stroke-width='1.4'%20fill='none'%20stroke-linecap='round'/%3E%3C/svg%3E\")";

const CSS = `
.at-mem-divider { display:flex; align-items:center; gap:16px; margin:28px 0 20px; }
.at-mem-divider__line { flex:1; height:1px;
  background:linear-gradient(90deg, transparent, rgba(148,163,184,0.28)); }
.at-mem-divider__line:last-child {
  background:linear-gradient(90deg, rgba(148,163,184,0.28), transparent); }
.at-mem-divider__patch { position:relative; flex:none; width:108px; height:30px;
  background:${LIPID_TILE} repeat-x center; background-size:16px 30px; opacity:.9;
  -webkit-mask-image:linear-gradient(90deg,transparent,#000 22%,#000 78%,transparent);
  mask-image:linear-gradient(90deg,transparent,#000 22%,#000 78%,transparent); }
.at-mem-divider__node { position:absolute; left:50%; top:50%;
  transform:translate(-50%,-50%); width:9px; height:9px; border-radius:50%;
  background:radial-gradient(circle,#fde68a,#fbbf24 55%,#f59e0b);
  box-shadow:0 0 11px 3px rgba(251,191,36,.55);
  animation:at-node-breathe 3.4s ease-in-out infinite; }
@keyframes at-node-breathe {
  0%,100% { transform:translate(-50%,-50%) scale(1); opacity:.9; }
  50%     { transform:translate(-50%,-50%) scale(1.25); opacity:1; } }

/* ---- loader ---- */
.at-load { position:relative; width:100%; height:190px; overflow:hidden;
  display:flex; align-items:center; justify-content:center; }
.at-load__membrane { position:absolute; left:0; right:0; top:50%;
  transform:translateY(-50%); height:38px;
  background:${LIPID_TILE} repeat-x center; background-size:16px 38px; opacity:.55;
  -webkit-mask-image:linear-gradient(90deg,transparent,#000 18%,#000 82%,transparent);
  mask-image:linear-gradient(90deg,transparent,#000 18%,#000 82%,transparent);
  animation:at-lipid-drift 24s linear infinite; }
@keyframes at-lipid-drift { to { background-position-x:-208px; } }
.at-load__core { position:relative; width:260px; height:180px;
  animation:at-core-bob 4.2s ease-in-out infinite; }
@keyframes at-core-bob {
  0%,100% { transform:translateY(0); } 50% { transform:translateY(-4px); } }
.at-load__field { position:absolute; left:50%; top:52%; width:170px; height:120px;
  transform:translate(-50%,-50%); border-radius:50%;
  background:radial-gradient(circle, rgba(56,189,248,.16), transparent 68%);
  animation:at-field-pulse 2.6s ease-in-out infinite; }
@keyframes at-field-pulse {
  0%,100% { opacity:.55; transform:translate(-50%,-50%) scale(1); }
  50%     { opacity:1;   transform:translate(-50%,-50%) scale(1.09); } }
.at-load .atpase-head { transform-origin:60px 33px; animation:at-head-spin 3.1s linear infinite; }
@keyframes at-head-spin { to { transform:rotate(360deg); } }
.at-load__p { position:absolute; left:50%; bottom:6px; width:7px; height:7px;
  border-radius:50%; background:radial-gradient(circle,#7dd3fc,#38bdf8 60%,#0ea5e9);
  box-shadow:0 0 8px 2px rgba(56,189,248,.5); opacity:0;
  animation:at-p-rise 3.4s ease-in infinite; }
@keyframes at-p-rise {
  0%   { opacity:0; transform:translate(-50%,0) scale(.7); }
  12%  { opacity:1; }
  70%  { opacity:1; }
  100% { opacity:0; transform:translate(calc(-50% + var(--dx,0px)),-104px) scale(.5); } }
.at-load__atp { position:absolute; left:50%; top:16px; width:9px; height:9px;
  border-radius:50%; background:radial-gradient(circle,#fde68a,#fbbf24 55%,#f59e0b);
  box-shadow:0 0 12px 3px rgba(251,191,36,.55); opacity:0;
  animation:at-atp-out 3.1s ease-out infinite; }
@keyframes at-atp-out {
  0%,55% { opacity:0; transform:translate(-50%,0) scale(.6); }
  70%    { opacity:1; transform:translate(-50%,-14px) scale(1); }
  100%   { opacity:0; transform:translate(-50%,-40px) scale(.7); } }
@media (prefers-reduced-motion: reduce) {
  .at-mem-divider__node, .at-load__membrane, .at-load__core, .at-load__field,
  .at-load .atpase-head, .at-load__p, .at-load__atp { animation:none; }
  .at-load__p, .at-load__atp { opacity:.7; }
}
`;

function Styles() {
  return <style dangerouslySetInnerHTML={{ __html: CSS }} />;
}

/** A bilayer patch with an ATP node in transit — the app's section rule. */
export function MembraneDivider() {
  return (
    <>
      <Styles />
      <div className="at-mem-divider" aria-hidden="true">
        <span className="at-mem-divider__line" />
        <span className="at-mem-divider__patch"><span className="at-mem-divider__node" /></span>
        <span className="at-mem-divider__line" />
      </div>
    </>
  );
}

/** The transporter working in the membrane, for waits. */
export function MembraneLoader({ label = 'Loading questions…' }: { label?: string }) {
  const drift = [-14, -6, 0, 5, 11, 17];
  return (
    <div className="flex flex-col items-center">
      <Styles />
      <div className="at-load" role="status" aria-label={label}>
        <span className="at-load__membrane" aria-hidden="true" />
        <div className="at-load__core">
          <span className="at-load__field" aria-hidden="true" />
          <svg viewBox="0 0 260 180" aria-hidden="true">
            <g transform="translate(70,10)">
              <rect x="40" y="42" width="4.5" height="38" rx="2.2" fill="#38bdf8" opacity="0.4" />
              <ellipse cx="60" cy="80" rx="20" ry="16" fill="#0d7f76" opacity="0.92"
                       stroke="#38bdf8" strokeWidth="1.4" strokeOpacity="0.75" />
              <rect x="55" y="46" width="10" height="36" rx="5" fill="#38bdf8" opacity="0.85" />
              <g className="atpase-head">
                <ellipse cx="60" cy="33" rx="22" ry="16" fill="#fbbf24" opacity="0.28" />
                <circle cx="60" cy="22" r="10.5" fill="#fbbf24" opacity="0.85" />
                <circle cx="43" cy="31" r="10.5" fill="#f59e0b" opacity="0.82" />
                <circle cx="77" cy="31" r="10.5" fill="#f59e0b" opacity="0.82" />
                <circle cx="50" cy="43" r="9" fill="#fbbf24" opacity="0.82" />
                <circle cx="70" cy="43" r="9" fill="#fbbf24" opacity="0.82" />
              </g>
            </g>
          </svg>
          {drift.map((dx, i) => (
            <span key={i} className="at-load__p" aria-hidden="true"
                  style={{ animationDelay: `${i * 0.55}s`,
                           ['--dx' as string]: `${dx}px` } as React.CSSProperties} />
          ))}
          <span className="at-load__atp" aria-hidden="true" />
        </div>
      </div>
      <p className="text-slate-400 mt-1">{label}</p>
    </div>
  );
}
