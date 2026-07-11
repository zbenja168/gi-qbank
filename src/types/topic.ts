export interface Topic {
  id: string;
  name: string;
  questionCount: number;
}

export interface Category {
  id: string;
  name: string;
  topics: Topic[];
}

export interface TopicsIndex {
  categories: Category[];
  totalQuestions: number;
}
