// file: app/test/[joinCode]/start/participant-response.ts
export type ParticipantResponse = {
  participant: Participant;
  test: Test;
  questions: QuestionWithAnswers[];
};

export type QuestionAnswer = EssayAnswer | ChoiceAnswer | MultipleChoiceAnswer;

export type Participant = {
  id: string;
  testId: string;
  userId: string | null;
  username: string;
  score: number;
};

export type Test = {
  id: string;
  creatorId: string;
  title: string;
  joinCode: string;
  description: string | null;
  testDuration: number | null;
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
  type: "ESSAY" | "CHOICE" | "MULTIPLE_CHOICE";
  order: number;

  essay: EssayQuestionWithAnswers | null;
  choice: ChoiceQuestionWithAnswers | null;
  multipleChoice: MultipleChoiceQuestionWithAnswers | null;
};

export type EssayQuestionWithAnswers = {
  id: string;
  answerText: string;
  isExactAnswer: boolean;
  maxScore: number;
  answers: EssayAnswer;
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
  answers: ChoiceAnswer;
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

export type MultipleChoiceQuestionWithAnswers = {
  id: string;
  isChoiceRandomized: boolean;
  maxScore: number;
  multipleChoices: MultipleChoice[];
  answers: MultipleChoiceAnswer[];
};

export type MultipleChoice = {
  id: string;
  questionId: string;
  choiceText: string;
};

export type MultipleChoiceAnswer = {
  id: string;
  questionId: string;
  participantId: string;
  score: number;
  selectedChoiceId: string | null;
};
