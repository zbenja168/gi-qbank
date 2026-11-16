export interface Topic {
  id: string;
  name: string;
  questionCount: number;
  /** High-yield questions across the whole topic, and within the public core.
   *  This bank has no core/extra split, so the two are equal. */
  hyCount?: number;
  hyCoreCount?: number;
}

export interface Category {
  id: string;
  name: string;
  /** Teaching week this category belongs to; the picker groups by it. */
  week?: number;
  weekName?: string;
  weekSubtitle?: string;
  topics: Topic[];
}

export interface TopicsIndex {
  categories: Category[];
  totalQuestions: number;
}
