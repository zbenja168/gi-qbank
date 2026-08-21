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
) => Promise<Array<{ questions: Array<{ id: string; topicId: string }> }>>;

export interface TopicStat {
  total: number;
  answered: number;
  remaining: number;
  complete: boolean;
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
  const [idsByTopic, setIdsByTopic] = useState<Map<string, string[]> | null>(null);

  useEffect(() => {
    if (!topics) return;
    let live = true;
    setIdsByTopic(null);
    loadMultipleCategories(topics.categories.map(c => c.id), tier)
      .then(cats => {
        if (!live) return;
        const map = new Map<string, string[]>();
        for (const c of cats) {
          for (const q of c.questions) {
            const list = map.get(q.topicId);
            if (list) list.push(q.id);
            else map.set(q.topicId, [q.id]);
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
    const answered = ids.reduce((n, id) => n + (answers[id] ? 1 : 0), 0);
    stats.set(topicId, {
      total: ids.length,
      answered,
      remaining: ids.length - answered,
      complete: ids.length > 0 && answered >= ids.length,
    });
  }
  return { stats, answeredIds: new Set(Object.keys(answers)) };
}
