// file: src/types/question.ts
export type QuestionType = "ESSAY" | "CHOICE" | "MULTIPLE_CHOICE";

export const QuestionType = {
  ESSAY: "ESSAY",
  CHOICE: "CHOICE",
  MULTIPLE_CHOICE: "MULTIPLE_CHOICE",
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
  multipleChoice?: {
    id: string;
    isChoiceRandomized: boolean;
    maxScore: number;
    createdAt: string;
    updatedAt: string;
    multipleChoices: MultipleChoice[];
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

export type MultipleChoiceQuestion = Question & {
  type: "MULTIPLE_CHOICE";
  isChoiceRandomized: boolean;
  maxScore: number;
  choices: MultipleChoice[];
};

export type MultipleChoice = {
  id: string;
  questionId: string;
  choiceText: string;
  isCorrect: boolean;
  createdAt: Date;
  updatedAt: Date;
};

export type MultipleChoiceAnswer = {
  id: string;
  questionId: string;
  participantId: string;
  score: number;
  selectedChoices: MultipleChoice[];
  createdAt: Date;
  updatedAt: Date;
};
