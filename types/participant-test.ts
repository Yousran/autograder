// Types for the test-taking page
// These types represent the data structure used during a test session

import { QuestionType } from "@/lib/generated/prisma/enums";

// --- PARTICIPANT TYPES ---
export interface TestParticipant {
  id: string;
  testId: string;
  userId: string | null;
  name: string;
  score: number;
  createdAt: Date;
  updatedAt: Date;
}

// --- TEST TYPES (for test-taking context) ---
export interface TestInfo {
  id: string;
  creatorId: string;
  title: string;
  joinCode: string;
  description: string | null;
  testDuration: number | null;
  startTime: Date | null;
  endTime: Date | null;
  isAcceptingResponses: boolean;
  showDetailedScore: boolean;
  showCorrectAnswers: boolean;
  isQuestionsOrdered: boolean;
}

// --- ANSWER TYPES ---
export interface EssayAnswerData {
  id: string;
  participantId: string;
  questionId: string;
  answerText: string;
  score: number;
}

export interface ChoiceAnswerData {
  id: string;
  questionId: string;
  participantId: string;
  score: number;
  selectedChoiceId: string | null;
}

export interface MultipleSelectAnswerData {
  id: string;
  questionId: string;
  participantId: string;
  score: number;
  selectedChoices: MultipleSelectChoiceData[];
}

// --- CHOICE TYPES ---
export interface ChoiceData {
  id: string;
  questionId: string;
  choiceText: string;
}

export interface MultipleSelectChoiceData {
  id: string;
  questionId: string;
  choiceText: string;
}

// --- QUESTION WITH ANSWER TYPES ---
export interface EssayQuestionWithAnswer {
  id: string;
  answerText: string;
  isExactAnswer: boolean;
  maxScore: number;
  answer: EssayAnswerData;
}

export interface ChoiceQuestionWithAnswer {
  id: string;
  isChoiceRandomized: boolean;
  maxScore: number;
  choices: ChoiceData[];
  answer: ChoiceAnswerData;
}

export interface MultipleSelectQuestionWithAnswer {
  id: string;
  isChoiceRandomized: boolean;
  maxScore: number;
  multipleSelectChoices: MultipleSelectChoiceData[];
  answer: MultipleSelectAnswerData;
}

// --- UNIFIED QUESTION WITH ANSWER TYPE ---
export interface QuestionWithAnswer {
  id: string;
  testId: string;
  questionText: string;
  type: QuestionType;
  order: number;
  essay: EssayQuestionWithAnswer | null;
  choice: ChoiceQuestionWithAnswer | null;
  multipleSelect: MultipleSelectQuestionWithAnswer | null;
}

// --- FULL PARTICIPANT TEST DATA ---
export interface ParticipantTestData {
  participant: TestParticipant;
  test: TestInfo;
  questions: QuestionWithAnswer[];
}
