// "Report this question" for QBank questions. Shared, byte-identical in every
// QBank (copied by _shared/sync_react.py; edit it there, not in a repo).
//
// Sends the report to Active Transport (/api/study-tools/report), which files
// it in the admin reports inbox under "Course QBanks". Signing in isn't needed;
// the ?at= token, when the student came from Active Transport, just says who.
import { useEffect, useState } from 'react';
import { Question } from '../types/question';

const API = 'https://activetransport.app';

const REASONS: { key: string; label: string }[] = [
  { key: 'wrong_answer', label: 'The answer key is wrong' },
  { key: 'explanation', label: 'The explanation has an error' },
  { key: 'ambiguous', label: 'More than one answer is right, or it’s unclear' },
  { key: 'image', label: 'The image is missing or wrong' },
  { key: 'typo', label: 'Typo or formatting problem' },
  { key: 'other', label: 'Something else' },
];

function tool(): string {
  try { return (location.pathname.split('/').filter(Boolean)[0] || 'qbank').toLowerCase().slice(0, 40); }
  catch { return 'qbank'; }
}

function token(): string | null {
  try {
    const m = (location.search || '').match(/[?&]at=([A-Za-z0-9._-]+)/);
    if (m) return m[1];
    return sessionStorage.getItem('at_tool_uid');
  } catch { return null; }
}

const sentKey = (qid: string) => `at-reported:${tool()}:${qid}`;

export function ReportQuestion({ question }: { question: Question }) {
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState('');
  const [details, setDetails] = useState('');
  const [state, setState] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle');
  const [error, setError] = useState('');
  const [already, setAlready] = useState(false);

  useEffect(() => {
    try { setAlready(!!sessionStorage.getItem(sentKey(question.id))); } catch { setAlready(false); }
    setOpen(false); setReason(''); setDetails(''); setState('idle'); setError('');
  }, [question.id]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpen(false); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open]);

  const send = async () => {
    if (!reason) { setError('Pick what’s wrong.'); return; }
    if (reason === 'other' && !details.trim()) { setError('Tell us what’s wrong.'); return; }
    setState('sending'); setError('');
    const t = token();
    try {
      const r = await fetch(`${API}/api/study-tools/report${t ? `?at=${encodeURIComponent(t)}` : ''}`, {
        method: 'POST',
        mode: 'cors',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tool: tool(),
          question_id: question.id,
          topic: question.topicName,
          reason,
          details: details.trim(),
          snapshot: {
            stem: question.stem,
            choices: question.choices,
            correctAnswer: question.correctAnswer,
            explanation: [question.explanation?.summary, question.explanation?.whyCorrect]
              .filter(Boolean).join('\n\n'),
          },
        }),
      });
      if (!r.ok) {
        const body = await r.json().catch(() => ({}));
        throw new Error(body.error || `Couldn’t send (${r.status}).`);
      }
      setState('sent');
      setAlready(true);
      try { sessionStorage.setItem(sentKey(question.id), '1'); } catch { /* ignore */ }
    } catch (e) {
      setState('error');
      setError(e instanceof Error && e.message !== 'Failed to fetch'
        ? e.message : 'Couldn’t reach the server. Check your connection and try again.');
    }
  };

  return (
    <>
      <button
        type="button"
        data-part="tool-btn"
        onClick={() => setOpen(true)}
        title="Report a problem with this question"
        className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium border border-slate-600 text-slate-400 hover:text-slate-200 transition-colors"
      >
        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z" /><line x1="4" y1="22" x2="4" y2="15" />
        </svg>
        {already ? 'Reported' : 'Report'}
      </button>

      {open && (
        <div
          data-part="report-overlay"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
          onClick={() => setOpen(false)}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="report-title"
            data-part="report-dialog"
            className="w-full max-w-md rounded-xl border border-slate-600 bg-slate-800 p-5 shadow-xl text-left"
            onClick={e => e.stopPropagation()}
          >
            {state === 'sent' ? (
              <>
                <h2 id="report-title" className="text-lg font-semibold text-slate-100 mb-2">Thanks for reporting it</h2>
                <p className="text-sm text-slate-400 mb-5">
                  We’ll check this question and fix it if it’s wrong. Reports like this make the QBank better for everyone.
                </p>
                <div className="flex justify-end">
                  <button type="button" onClick={() => setOpen(false)}
                    className="px-4 py-2 rounded-lg bg-blue-600 text-white text-sm hover:bg-blue-500">Done</button>
                </div>
              </>
            ) : (
              <>
                <h2 id="report-title" className="text-lg font-semibold text-slate-100 mb-1">Report this question</h2>
                <p className="text-xs text-slate-500 mb-4">What’s wrong with it?</p>
                <div className="space-y-1.5 mb-4">
                  {REASONS.map(r => (
                    <label key={r.key}
                      className={`flex items-center gap-2.5 px-3 py-2 rounded-lg border cursor-pointer text-sm transition-colors ${
                        reason === r.key ? 'border-blue-400 bg-blue-500/10 text-slate-100'
                                         : 'border-slate-700 text-slate-300 hover:border-slate-500'}`}>
                      <input type="radio" name="report-reason" value={r.key} checked={reason === r.key}
                        onChange={() => { setReason(r.key); setError(''); }} className="accent-blue-500" />
                      {r.label}
                    </label>
                  ))}
                </div>
                <textarea
                  value={details}
                  onChange={e => setDetails(e.target.value)}
                  maxLength={2000}
                  rows={3}
                  placeholder={reason === 'other' ? 'What’s wrong?' : 'Details (optional), e.g. which answer you think is right and why'}
                  className="w-full rounded-lg border border-slate-600 bg-slate-900 px-3 py-2 text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-blue-400 mb-3"
                />
                {error && <p className="text-sm text-red-400 mb-3">{error}</p>}
                <div className="flex justify-end gap-2">
                  <button type="button" onClick={() => setOpen(false)}
                    className="px-4 py-2 rounded-lg text-sm text-slate-400 hover:text-slate-200 hover:bg-slate-700">Cancel</button>
                  <button type="button" onClick={send} disabled={state === 'sending'}
                    className="px-4 py-2 rounded-lg bg-blue-600 text-white text-sm hover:bg-blue-500 disabled:opacity-50">
                    {state === 'sending' ? 'Sending…' : 'Send report'}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </>
  );
}
