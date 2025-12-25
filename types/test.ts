import type {
  Test,
  Question,
  Choice,
  MultipleSelectChoice,
  Participant,
} from "@/lib/generated/prisma/client";

// Reusable type for questions with all possible answer types
export type QuestionWithAnswers = Question & {
  essay?: {
    id: string;
    answerText: string;
    isExactAnswer: boolean;
    maxScore: number;
  } | null;
  choice?: (Choice & { choices?: Choice[] }) | null;
  multipleSelect?:
    | (MultipleSelectChoice & {
        multipleSelectChoices?: MultipleSelectChoice[];
      })
    | null;
};

// Full test with all relations
export type TestWithRelations = Test & {
  questions: Question[];
  prerequisites: { prerequisiteTestId: string; minScoreRequired: number }[];
  user: { id: string; name?: string | null; email?: string | null };
  participants?: Pick<Participant, "id">[];
};
