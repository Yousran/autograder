// file: /app/participant/[participantId]/components/question-answer.ts

export type QuestionAnswerDetail = {
  id: string;
  questionText: string;
  type: "ESSAY" | "CHOICE" | "MULTIPLE_CHOICE";
  order: number;
  maxScore: number;

  essay: EssayQuestionDetail | null;
  choice: ChoiceQuestionDetail | null;
  multipleChoice: MultipleChoiceQuestionDetail | null;
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

export type MultipleChoiceQuestionDetail = {
  id: string;
  isChoiceRandomized: boolean;
  maxScore: number;
  multipleChoices: MultipleChoiceDetail[];
  participantAnswer: MultipleChoiceAnswerDetail | null;
};

export type MultipleChoiceDetail = {
  id: string;
  questionId: string;
  choiceText: string;
  isCorrect: boolean;
};

export type MultipleChoiceAnswerDetail = {
  id: string;
  questionId: string;
  participantId: string;
  selectedChoices: MultipleChoiceDetail[];
  score: number;
};
