import { useState, useEffect, useCallback } from 'react';
import { TopicsIndex, Category } from '../types/topic';
import { Tier } from '../utils/questionLoader';

// Advanced uses a separate index (topics.advanced.json) listing only the bricks
// that already have advanced questions, so the tier rolls out brick by brick.
export function useTopics(tier: Tier = 'standard') {
  const [topics, setTopics] = useState<TopicsIndex | null>(null);
  const [selectedTopicIds, setSelectedTopicIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    const file = tier === 'advanced' ? 'topics.advanced.json' : 'topics.json';
    fetch(`${import.meta.env.BASE_URL}data/${file}`)
      .then(r => r.json())
      .then((data: TopicsIndex) => {
        setTopics(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
    // Selections don't carry across tiers — the topic sets differ.
    setSelectedTopicIds(new Set());
  }, [tier]);

  const toggleTopic = useCallback((topicId: string) => {
    setSelectedTopicIds(prev => {
      const next = new Set(prev);
      if (next.has(topicId)) next.delete(topicId);
      else next.add(topicId);
      return next;
    });
  }, []);

  const toggleCategory = useCallback((category: Category) => {
    setSelectedTopicIds(prev => {
      const next = new Set(prev);
      const allSelected = category.topics.every(t => next.has(t.id));
      for (const t of category.topics) {
        if (allSelected) next.delete(t.id);
        else next.add(t.id);
      }
      return next;
    });
  }, []);

  const selectAll = useCallback(() => {
    if (!topics) return;
    const all = new Set<string>();
    for (const cat of topics.categories) {
      for (const t of cat.topics) all.add(t.id);
    }
    setSelectedTopicIds(all);
  }, [topics]);

  const clearAll = useCallback(() => {
    setSelectedTopicIds(new Set());
  }, []);

  const selectedCount = topics
    ? topics.categories.reduce((sum, cat) =>
        sum + cat.topics.reduce((s, t) =>
          s + (selectedTopicIds.has(t.id) ? t.questionCount : 0), 0), 0)
    : 0;

  const categoriesForSelected = topics
    ? [...new Set(
        topics.categories
          .filter(cat => cat.topics.some(t => selectedTopicIds.has(t.id)))
          .map(cat => cat.id)
      )]
    : [];

  return {
    topics,
    loading,
    selectedTopicIds,
    selectedCount,
    categoriesForSelected,
    toggleTopic,
    toggleCategory,
    selectAll,
    clearAll,
    setSelectedTopicIds,
  };
}
