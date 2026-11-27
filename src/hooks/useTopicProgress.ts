import { useState, useEffect } from 'react';
import { TopicsIndex } from '../types/topic';
import { ProgressData } from '../types/progress';
import * as loader from '../utils/questionLoader';

// This file is shared by every QBank, and the single-tier ones (CV, Resp,
// Endocrine) have a loader that takes only the category ids. Passing a tier
// they ignore is harmless at runtime, so widen the type here rather than fork
// the hook per repo.
type Tier = string;
const loadMultipleCategories = loader.loadMultipleCategories as unknown as (
  ids: string[], tier?: Tier,
) => Promise<Array<{ questions: Array<{ id: string; topicId: string; hy?: boolean }> }>>;

export interface TopicStat {
  total: number;
  answered: number;
  remaining: number;
  complete: boolean;
  /** The same again for the high-yield picks, used in High Yield mode. */
  hyTotal: number;
  hyRemaining: number;
  hyComplete: boolean;
  /** ISO time of the latest answer in the topic; the picker opens the week
   *  holding the most recent one. */
  lastAt?: string;
}

/** Per-topic completion, so the picker can say what is left rather than just
 *  how big each topic is.
 *
 *  topics.json carries a questionCount but not the question IDs, and whether a
 *  question is done is keyed by ID — so the category files have to be read to
 *  connect the two. They are the same files a quiz loads and the browser caches
 *  them, so this is a warm fetch in practice. It runs in the background: until
 *  it lands, `stats` is null and the picker shows plain counts.
 */
export function useTopicProgress(
  topics: TopicsIndex | null,
  progress: ProgressData,
  tier: Tier = 'standard',
) {
  type TopicIds = { all: string[]; hy: string[] };
  const [idsByTopic, setIdsByTopic] = useState<Map<string, TopicIds> | null>(null);

  useEffect(() => {
    if (!topics) return;
    let live = true;
    setIdsByTopic(null);
    loadMultipleCategories(topics.categories.map(c => c.id), tier)
      .then(cats => {
        if (!live) return;
        const map = new Map<string, TopicIds>();
        for (const c of cats) {
          for (const q of c.questions) {
            let entry = map.get(q.topicId);
            if (!entry) { entry = { all: [], hy: [] }; map.set(q.topicId, entry); }
            entry.all.push(q.id);
            if (q.hy) entry.hy.push(q.id);
          }
        }
        setIdsByTopic(map);
      })
      .catch(() => { if (live) setIdsByTopic(new Map()); });
    return () => { live = false; };
  }, [topics, tier]);

  if (!idsByTopic || idsByTopic.size === 0) {
    return { stats: null as Map<string, TopicStat> | null, answeredIds: new Set<string>() };
  }

  const answers = progress.answers || {};
  const stats = new Map<string, TopicStat>();
  for (const [topicId, ids] of idsByTopic) {
    const answered = ids.all.reduce((n, id) => n + (answers[id] ? 1 : 0), 0);
    const hyAnswered = ids.hy.reduce((n, id) => n + (answers[id] ? 1 : 0), 0);
    let lastAt: string | undefined;
    for (const id of ids.all) {
      const at = answers[id]?.answeredAt;
      if (at && (!lastAt || at > lastAt)) lastAt = at;
    }
    stats.set(topicId, {
      total: ids.all.length,
      answered,
      remaining: ids.all.length - answered,
      complete: ids.all.length > 0 && answered >= ids.all.length,
      hyTotal: ids.hy.length,
      hyRemaining: ids.hy.length - hyAnswered,
      hyComplete: ids.hy.length > 0 && hyAnswered >= ids.hy.length,
      lastAt,
    });
  }
  return { stats, answeredIds: new Set(Object.keys(answers)) };
}
