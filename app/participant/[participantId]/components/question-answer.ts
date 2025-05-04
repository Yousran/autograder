// file: /app/participant/[participantId]/components/question-answer.ts

export type QuestionAnswerDetail = {
  id: string;
  questionText: string;
  type: "ESSAY" | "CHOICE" | "MULTIPLE_SELECT";
  order: number;
  maxScore: number;

  essay: EssayQuestionDetail | null;
  choice: ChoiceQuestionDetail | null;
  multipleSelect: MultipleSelectQuestionDetail | null;
};

export type EssayQuestionDetail = {
  id: string;
  answerText: string;
  isExactAnswer: boolean;
  maxScore: number;
  participantAnswer: EssayAnswerDetail | null;
};

export type EssayAnswerDetail = {
  id: string;
  participantId: string;
  questionId: string;
  answerText: string;
  scoreExplanation: string;
  score: number;
};

export type ChoiceQuestionDetail = {
  id: string;
  isChoiceRandomized: boolean;
  maxScore: number;
  choices: ChoiceDetail[];
  participantAnswer: ChoiceAnswerDetail | null;
};

export type ChoiceDetail = {
  id: string;
  questionId: string;
  choiceText: string;
  isCorrect: boolean;
};

export type ChoiceAnswerDetail = {
  id: string;
  questionId: string;
  participantId: string;
  selectedChoiceId: string | null;
  score: number;
};

export type MultipleSelectQuestionDetail = {
  id: string;
  isChoiceRandomized: boolean;
  maxScore: number;
  multipleSelectChoices: MultipleSelectDetail[];
  participantAnswer: MultipleSelectAnswerDetail | null;
};

export type MultipleSelectDetail = {
  id: string;
  questionId: string;
  choiceText: string;
  isCorrect: boolean;
};

export type MultipleSelectAnswerDetail = {
  id: string;
  questionId: string;
  participantId: string;
  selectedChoices: MultipleSelectDetail[];
  score: number;
};
