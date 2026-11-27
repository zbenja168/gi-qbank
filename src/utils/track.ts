// Reports study engagement to Active Transport via the tracker loaded in
// index.html (https://activetransport.app/static/tool-track.js).
// Analytics must never break a study tool, so every call is guarded and any
// failure — including the tracker not being loaded at all — is swallowed.
type TrackProps = {
  topic?: string; score?: number; total?: number;
  /** Per-question detail on question_answered (tool-track.js forwards both). */
  qid?: string; correct?: boolean;
};

export function track(event: string, props: TrackProps = {}): void {
  try {
    const fn = (window as unknown as { atTrack?: (e: string, p?: TrackProps) => void }).atTrack;
    if (typeof fn === 'function') fn(event, props);
  } catch {
    /* ignore */
  }
}

/** The topic field for quiz_start / quiz_complete: the one topic id, or a short
 *  comma-joined list (tool-track.js keeps the first 120 characters). */
export function trackTopic(topicIds: Iterable<string>): string {
  return Array.from(topicIds).join(',').slice(0, 120);
}
