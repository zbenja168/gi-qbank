export interface Choice {
  label: string;
  text: string;
}

export interface Explanation {
  summary: string;
  whyCorrect: string;
  whyWrongByChoice: Record<string, string>;
}

export interface Question {
  id: string;
  topicId: string;
  topicName: string;
  stem: string;
  choices: Choice[];
  correctAnswer: string;
  explanation: Explanation;
  difficulty: string;
  imageRef: string | null;
  tags: string[];
}

export interface CategoryQuestions {
  categoryId: string;
  categoryName: string;
  questions: Question[];
}
