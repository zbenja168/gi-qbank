export interface Topic {
  id: string;
  name: string;
  questionCount: number;
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
