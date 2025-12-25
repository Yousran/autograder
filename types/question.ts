export type QuestionType = "ESSAY" | "CHOICE" | "MULTIPLE_SELECT";

export interface BaseQuestion {
  id: string;
  order: number;
  type: QuestionType;
  questionText: string;
  testId: string;
}

export interface EssayQuestion extends BaseQuestion {
  type: "ESSAY";
  answerText: string;
  isExactAnswer: boolean;
  maxScore: number;
}

export interface ChoiceQuestion extends BaseQuestion {
  type: "CHOICE";
  isChoiceRandomized: boolean;
  maxScore: number;
  choices: Array<{
    id: string;
    choiceText: string;
    isCorrect: boolean;
  }>;
}

export interface MultipleSelectQuestion extends BaseQuestion {
  type: "MULTIPLE_SELECT";
  isChoiceRandomized: boolean;
  maxScore: number;
  choices: Array<{
    id: string;
    choiceText: string;
    isCorrect: boolean;
  }>;
}

export type Question = EssayQuestion | ChoiceQuestion | MultipleSelectQuestion;
