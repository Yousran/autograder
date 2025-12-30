import {
  EssayAnswerValidation,
  ChoiceAnswerValidation,
  MultipleSelectAnswerValidation,
  essayAnswerSchema,
  choiceAnswerSchema,
  multipleSelectAnswerSchema,
} from "@/lib/validations/answer";

// Re-export validation types and schemas
export {
  essayAnswerSchema,
  choiceAnswerSchema,
  multipleSelectAnswerSchema,
  type EssayAnswerValidation,
  type ChoiceAnswerValidation,
  type MultipleSelectAnswerValidation,
};

// --- ESSAY ANSWER TYPES ---
export interface EssayAnswer {
  id: string;
  participantId: string;
  questionId: string;
  answerText: string;
  score: number;
  scoreExplanation: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface EssayAnswerWithQuestion extends EssayAnswer {
  question: {
    id: string;
    questionText: string;
    essay: {
      answerText: string;
      isExactAnswer: boolean;
      maxScore: number;
    } | null;
  };
}

// --- CHOICE ANSWER TYPES ---
export interface ChoiceAnswer {
  id: string;
  questionId: string;
  participantId: string;
  selectedChoiceId: string | null;
  score: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface ChoiceAnswerWithDetails extends ChoiceAnswer {
  question: {
    id: string;
    questionText: string;
    choice: {
      maxScore: number;
      isChoiceRandomized: boolean;
      choices: Array<{
        id: string;
        choiceText: string;
        isCorrect: boolean;
      }>;
    } | null;
  };
  choice: {
    id: string;
    choiceText: string;
    isCorrect: boolean;
  } | null;
}

// --- MULTIPLE SELECT ANSWER TYPES ---
export interface MultipleSelectAnswer {
  id: string;
  questionId: string;
  participantId: string;
  score: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface MultipleSelectAnswerWithDetails extends MultipleSelectAnswer {
  question: {
    id: string;
    questionText: string;
    multipleSelect: {
      maxScore: number;
      isChoiceRandomized: boolean;
      multipleSelectChoices: Array<{
        id: string;
        choiceText: string;
        isCorrect: boolean;
      }>;
    } | null;
  };
  selectedChoices: Array<{
    id: string;
    choiceText: string;
    isCorrect: boolean;
  }>;
}

// --- UNIFIED ANSWER TYPE ---
// For displaying all answers together
export type Answer =
  | ({ type: "essay" } & EssayAnswerWithQuestion)
  | ({ type: "choice" } & ChoiceAnswerWithDetails)
  | ({ type: "multipleSelect" } & MultipleSelectAnswerWithDetails);

// Answer summary for a participant
export interface ParticipantAnswerSummary {
  participantId: string;
  totalQuestions: number;
  answeredQuestions: number;
  totalScore: number;
  maxPossibleScore: number;
  essayAnswers: EssayAnswer[];
  choiceAnswers: ChoiceAnswer[];
  multipleSelectAnswers: MultipleSelectAnswer[];
}

// Grading status for a test
export interface TestGradingStatus {
  testId: string;
  totalParticipants: number;
  totalEssayAnswers: number;
  gradedEssayAnswers: number;
  pendingEssayAnswers: number;
  percentageComplete: number;
}
