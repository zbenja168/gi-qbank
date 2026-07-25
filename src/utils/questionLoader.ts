import { CategoryQuestions } from '../types/question';

export type Tier = 'standard' | 'advanced';

// Advanced questions live in a parallel data tree so the standard bank is never
// touched. Cache is keyed by tier so switching tiers can't cross-contaminate.
const cache = new Map<string, CategoryQuestions>();

function dir(tier: Tier): string {
  return tier === 'advanced' ? 'questions-advanced' : 'questions';
}

export async function loadCategoryQuestions(
  categoryId: string,
  tier: Tier = 'standard',
): Promise<CategoryQuestions> {
  const key = `${tier}:${categoryId}`;
  if (cache.has(key)) {
    return cache.get(key)!;
  }
  const resp = await fetch(`${import.meta.env.BASE_URL}data/${dir(tier)}/${categoryId}.json`);
  if (!resp.ok) throw new Error(`Failed to load ${tier} questions for ${categoryId}`);
  const data: CategoryQuestions = await resp.json();
  cache.set(key, data);
  return data;
}

export async function loadMultipleCategories(
  categoryIds: string[],
  tier: Tier = 'standard',
): Promise<CategoryQuestions[]> {
  return Promise.all(categoryIds.map(id => loadCategoryQuestions(id, tier)));
}

export function clearCache(): void {
  cache.clear();
}
