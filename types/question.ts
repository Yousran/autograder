// file: src/types/question.ts
export type QuestionType = "ESSAY" | "CHOICE" | "MULTIPLE_SELECT";

export const QuestionType = {
  ESSAY: "ESSAY",
  CHOICE: "CHOICE",
  MULTIPLE_SELECT: "MULTIPLE_SELECT",
} as const;

export type RawQuestion = {
  id: string;
  testId?: string;
  type: QuestionType;
  questionText: string;
  order?: number;
  createdAt?: string;
  updatedAt?: string;
  essay?: {
    id: string;
    answerText: string;
    isExactAnswer: boolean;
    maxScore: number;
    createdAt: string;
    updatedAt: string;
  } | null;
  choice?: {
    id: string;
    isChoiceRandomized: boolean;
    maxScore: number;
    createdAt: string;
    updatedAt: string;
    choices: Choice[];
  } | null;
  multipleSelect?: {
    id: string;
    isChoiceRandomized: boolean;
    maxScore: number;
    createdAt: string;
    updatedAt: string;
    multipleSelectChoices: MultipleSelectChoice[];
  } | null;
};

export const defaultQuestion: EssayQuestion = {
  id: crypto.randomUUID(),
  testId: "",
  type: "ESSAY",
  questionText: "",
  answerText: "",
  order: 1,
  isExactAnswer: false,
  maxScore: 5,
  createdAt: new Date(),
  updatedAt: new Date(),
};

export type Question = {
  id: string;
  testId: string;
  type: QuestionType;
  questionText: string;
  order: number;
  createdAt: Date;
  updatedAt: Date;
};
export type EssayQuestion = Question & {
  type: "ESSAY";
  answerText: string;
  isExactAnswer: boolean;
  maxScore: number;
};

export type EssayAnswer = {
  id: string;
  participantId: string;
  questionId: string;
  answerText: string;
  score: number;
  createdAt: Date;
  updatedAt: Date;
};

export type ChoiceQuestion = Question & {
  type: "CHOICE";
  isChoiceRandomized: boolean;
  maxScore: number;
  choices: Choice[];
};

export type Choice = {
  id: string;
  questionId: string;
  choiceText: string;
  isCorrect: boolean;
  createdAt: Date;
  updatedAt: Date;
};

export type ChoiceAnswer = {
  id: string;
  questionId: string;
  participantId: string;
  selectedChoiceId?: string;
  score: number;
  createdAt: Date;
  updatedAt: Date;
};

export type MultipleSelectQuestion = Question & {
  type: "MULTIPLE_SELECT";
  isChoiceRandomized: boolean;
  maxScore: number;
  choices: MultipleSelectChoice[];
};

export type MultipleSelectChoice = {
  id: string;
  questionId: string;
  choiceText: string;
  isCorrect: boolean;
  createdAt: Date;
  updatedAt: Date;
};

export type MultipleSelectAnswer = {
  id: string;
  questionId: string;
  participantId: string;
  score: number;
  selectedChoices: MultipleSelectChoice[];
  createdAt: Date;
  updatedAt: Date;
};
