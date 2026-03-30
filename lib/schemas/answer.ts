import { z } from "zod";
import { TranslateFn } from "./translate";

// ---------------------------------------------------------------------------
// Essay answer
// ---------------------------------------------------------------------------

export const createEssayAnswerSchema = (t: TranslateFn) =>
  z.object({
    participantId: z.string().min(1, t("participantIdRequired")),
    questionId: z.string().min(1, t("questionIdRequired")),
    /** Participant's written response. Empty string is allowed (skipped). */
    answerText: z.string(),
  });

export type EssayAnswerInput = z.infer<
  ReturnType<typeof createEssayAnswerSchema>
>;

/** Partial schema for PATCH — all fields optional. */
export const updateEssayAnswerSchema = (t: TranslateFn) =>
  createEssayAnswerSchema(t).partial();

export type EssayAnswerUpdateInput = z.infer<
  ReturnType<typeof updateEssayAnswerSchema>
>;

// ---------------------------------------------------------------------------
// Choice answer
// ---------------------------------------------------------------------------

export const createChoiceAnswerSchema = (t: TranslateFn) =>
  z.object({
    participantId: z.string().min(1, t("participantIdRequired")),
    questionId: z.string().min(1, t("questionIdRequired")),
    /** null means the participant skipped the question. */
    selectedChoiceId: z.string().nullable().optional(),
  });

export type ChoiceAnswerInput = z.infer<
  ReturnType<typeof createChoiceAnswerSchema>
>;

/** Partial schema for PATCH — all fields optional. */
export const updateChoiceAnswerSchema = (t: TranslateFn) =>
  createChoiceAnswerSchema(t).partial();

export type ChoiceAnswerUpdateInput = z.infer<
  ReturnType<typeof updateChoiceAnswerSchema>
>;

// ---------------------------------------------------------------------------
// Multiple-select answer
// ---------------------------------------------------------------------------

export const createMultipleSelectAnswerSchema = (t: TranslateFn) =>
  z.object({
    participantId: z.string().min(1, t("participantIdRequired")),
    questionId: z.string().min(1, t("questionIdRequired")),
    /** IDs of all selected choices. Empty array means skipped. */
    selectedChoiceIds: z.array(z.string()),
  });

export type MultipleSelectAnswerInput = z.infer<
  ReturnType<typeof createMultipleSelectAnswerSchema>
>;

/** Partial schema for PATCH — all fields optional. */
export const updateMultipleSelectAnswerSchema = (t: TranslateFn) =>
  createMultipleSelectAnswerSchema(t).partial();

export type MultipleSelectAnswerUpdateInput = z.infer<
  ReturnType<typeof updateMultipleSelectAnswerSchema>
>;

// ---------------------------------------------------------------------------
// Batch answer submission
// Collects all answers for one participant in a single request.
// ---------------------------------------------------------------------------

export const createSubmitAnswersSchema = (t: TranslateFn) =>
  z.object({
    participantId: z.string().min(1, t("participantIdRequired")),
    essayAnswers: z
      .array(
        z.object({
          questionId: z.string().min(1, t("questionIdRequired")),
          answerText: z.string(),
        }),
      )
      .default([]),
    choiceAnswers: z
      .array(
        z.object({
          questionId: z.string().min(1, t("questionIdRequired")),
          selectedChoiceId: z.string().nullable().optional(),
        }),
      )
      .default([]),
    multipleSelectAnswers: z
      .array(
        z.object({
          questionId: z.string().min(1, t("questionIdRequired")),
          selectedChoiceIds: z.array(z.string()),
        }),
      )
      .default([]),
  });

export type SubmitAnswersInput = z.infer<
  ReturnType<typeof createSubmitAnswersSchema>
>;

// ---------------------------------------------------------------------------
// Grade essay answer (manual grading by the test creator)
// ---------------------------------------------------------------------------

export const createGradeEssayAnswerSchema = (t: TranslateFn) =>
  z.object({
    score: z.number().int(t("integer")).min(0, t("scoreNonNegative")),
    scoreExplanation: z.string().optional(),
  });

export type GradeEssayAnswerInput = z.infer<
  ReturnType<typeof createGradeEssayAnswerSchema>
>;

/** Partial schema for PATCH — all fields optional. */
export const updateGradeEssayAnswerSchema = (t: TranslateFn) =>
  createGradeEssayAnswerSchema(t).partial();

export type GradeEssayAnswerUpdateInput = z.infer<
  ReturnType<typeof updateGradeEssayAnswerSchema>
>;

// ---------------------------------------------------------------------------
// View models for displaying answers in QuestionDetailCard
// Used to display participant answers with scores and correctness information
// ---------------------------------------------------------------------------

export type ChoiceItemView = {
  id: string;
  text: string;
  isSelected: boolean;
  /** null means correctness is hidden from the viewer */
  isCorrect: boolean | null;
};

export type EssayAnswerView = {
  id: string;
  answerText: string;
  /** null means don't show correct answer */
  correctAnswer: string | null;
  score: number;
  maxScore: number;
  scoreExplanation: string | null;
};

export type ChoiceAnswerView = {
  id: string;
  choices: ChoiceItemView[];
  score: number;
  maxScore: number;
};

export type MultipleSelectAnswerView = {
  id: string;
  choices: ChoiceItemView[];
  score: number;
  maxScore: number;
};
