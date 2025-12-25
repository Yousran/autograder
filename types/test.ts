import type {
  Test,
  Question,
  Participant,
  EssayQuestion,
  EssayAnswer,
  ChoiceQuestion,
  Choice,
  ChoiceAnswer,
  MultipleSelectQuestion,
  MultipleSelectChoice,
  MultipleSelectAnswer,
} from "@/lib/generated/prisma/client";

// Question types for public access (without correct answers)
export type PublicQuestionWithRelations = Question & {
  essay?: {
    id: string;
    isExactAnswer: boolean;
    maxScore: number;
  } | null;
  choice?: {
    id: string;
    isChoiceRandomized: boolean;
    maxScore: number;
    choices: { id: string; choiceText: string }[];
  } | null;
  multipleSelect?: {
    id: string;
    isChoiceRandomized: boolean;
    maxScore: number;
    multipleSelectChoices: { id: string; choiceText: string }[];
  } | null;
};

// Question types for creator access (with correct answers and submissions)
export type CreatorQuestionWithRelations = Question & {
  essay?:
    | (EssayQuestion & {
        answers: EssayAnswer[];
      })
    | null;
  choice?:
    | (ChoiceQuestion & {
        choices: Choice[];
        answers: ChoiceAnswer[];
      })
    | null;
  multipleSelect?:
    | (MultipleSelectQuestion & {
        multipleSelectChoices: MultipleSelectChoice[];
        answers: MultipleSelectAnswer[];
      })
    | null;
};

// Participant type for creator access (with all answers)
export type CreatorParticipantWithAnswers = Participant & {
  essayAnswers: EssayAnswer[];
  choiceAnswers: ChoiceAnswer[];
  multipleSelectAnswers: MultipleSelectAnswer[];
};

// Public test (for participants joining) - without correct answers
export type TestWithRelations = Test & {
  questions: PublicQuestionWithRelations[];
  prerequisites: { prerequisiteTestId: string; minScoreRequired: number }[];
  user: { id: string; name?: string | null; email?: string | null };
  participants?: Pick<Participant, "id">[];
};

// Full test for creator access - with all correct answers and submissions
export type CreatorTestWithRelations = Test & {
  questions: CreatorQuestionWithRelations[];
  prerequisites: { prerequisiteTestId: string; minScoreRequired: number }[];
  user: { id: string; name?: string | null; email?: string | null };
  participants: CreatorParticipantWithAnswers[];
};
