// file: app/test/[joinCode]/start/participant-response.ts
export type ParticipantResponse = {
  participant: Participant;
  test: Test;
  questions: QuestionWithAnswers[];
};

export type QuestionAnswer = EssayAnswer | ChoiceAnswer | MultipleSelectAnswer;

export type Participant = {
  id: string;
  testId: string;
  userId: string | null;
  username: string;
  score: number;
  createdAt: string;
  updatedAt: string;
};

export type Test = {
  id: string;
  creatorId: string;
  title: string;
  joinCode: string;
  description: string | null;
  testDuration: number;
  startTime: string | null;
  endTime: string | null;
  acceptResponses: boolean;
  showDetailedScore: boolean;
  showCorrectAnswers: boolean;
  isOrdered: boolean;
};

export type QuestionWithAnswers = {
  id: string;
  testId: string;
  questionText: string;
  type: "ESSAY" | "CHOICE" | "MULTIPLE_SELECT";
  order: number;

  essay: EssayQuestionWithAnswers | null;
  choice: ChoiceQuestionWithAnswers | null;
  multipleSelect: MultipleSelectQuestionWithAnswers | null;
};

export type EssayQuestionWithAnswers = {
  id: string;
  answerText: string;
  isExactAnswer: boolean;
  maxScore: number;
  answer: EssayAnswer;
};

export type EssayAnswer = {
  id: string;
  participantId: string;
  questionId: string;
  answerText: string;
  score: number;
};

export type ChoiceQuestionWithAnswers = {
  id: string;
  isChoiceRandomized: boolean;
  maxScore: number;
  choices: Choice[];
  answer: ChoiceAnswer;
};

export type Choice = {
  id: string;
  questionId: string;
  choiceText: string;
};

export type ChoiceAnswer = {
  id: string;
  questionId: string;
  participantId: string;
  score: number;
  selectedChoiceId: string | null;
};

export type MultipleSelectQuestionWithAnswers = {
  id: string;
  isChoiceRandomized: boolean;
  maxScore: number;
  multipleSelectChoices: MultipleSelect[];
  answer: MultipleSelectAnswer;
};

export type MultipleSelect = {
  id: string;
  questionId: string;
  choiceText: string;
};

export type MultipleSelectAnswer = {
  id: string;
  questionId: string;
  participantId: string;
  score: number;
  selectedChoices: MultipleSelect[];
};
