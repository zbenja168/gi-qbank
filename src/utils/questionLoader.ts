import { CategoryQuestions } from '../types/question';

const cache = new Map<string, CategoryQuestions>();

export async function loadCategoryQuestions(categoryId: string): Promise<CategoryQuestions> {
  if (cache.has(categoryId)) {
    return cache.get(categoryId)!;
  }
  const resp = await fetch(`${import.meta.env.BASE_URL}data/questions/${categoryId}.json`);
  if (!resp.ok) throw new Error(`Failed to load questions for ${categoryId}`);
  const data: CategoryQuestions = await resp.json();
  cache.set(categoryId, data);
  return data;
}

export async function loadMultipleCategories(categoryIds: string[]): Promise<CategoryQuestions[]> {
  return Promise.all(categoryIds.map(loadCategoryQuestions));
}

export function clearCache(): void {
  cache.clear();
}
