import { z } from "zod";
import { TranslateFn } from "./translate";

// ---------------------------------------------------------------------------
// Essay answer
// ---------------------------------------------------------------------------

/**
 * Creates a Zod schema for validating essay answer submissions.
 * Three required fields: participantId, questionId, and answerText.
 *
 * @param t - Translation function for error messages
 * @returns Zod schema for essay answer creation
 */
export const createEssayAnswerSchema = (t: TranslateFn) =>
  z.object({
    participantId: z.string().min(1, t("Validation.participantIdRequired")),
    questionId: z.string().min(1, t("Validation.questionIdRequired")),
    /** Participant's written response. Empty string is allowed (skipped). */
    answerText: z.string(),
  });

export type EssayAnswerInput = z.infer<
  ReturnType<typeof createEssayAnswerSchema>
>;

/**
 * Creates a partial Zod schema for updating essay answers.
 * All fields are optional for PATCH operations.
 *
 * @param t - Translation function for error messages
 * @returns Partial Zod schema where all essay answer fields are optional
 */
export const updateEssayAnswerSchema = (t: TranslateFn) =>
  createEssayAnswerSchema(t).partial();

export type EssayAnswerUpdateInput = z.infer<
  ReturnType<typeof updateEssayAnswerSchema>
>;

// ---------------------------------------------------------------------------
// Choice answer
// ---------------------------------------------------------------------------

/**
 * Creates a Zod schema for validating choice answer submissions.
 * Three required fields: participantId, questionId, and optional selectedChoiceId.
 *
 * @param t - Translation function for error messages
 * @returns Zod schema for choice answer creation
 */
export const createChoiceAnswerSchema = (t: TranslateFn) =>
  z.object({
    participantId: z.string().min(1, t("Validation.participantIdRequired")),
    questionId: z.string().min(1, t("Validation.questionIdRequired")),
    /** null means the participant skipped the question. */
    selectedChoiceId: z.string().nullable().optional(),
  });

export type ChoiceAnswerInput = z.infer<
  ReturnType<typeof createChoiceAnswerSchema>
>;

/**
 * Creates a partial Zod schema for updating choice answers.
 * All fields are optional for PATCH operations.
 *
 * @param t - Translation function for error messages
 * @returns Partial Zod schema where all choice answer fields are optional
 */
export const updateChoiceAnswerSchema = (t: TranslateFn) =>
  createChoiceAnswerSchema(t).partial();

export type ChoiceAnswerUpdateInput = z.infer<
  ReturnType<typeof updateChoiceAnswerSchema>
>;

// ---------------------------------------------------------------------------
// Multiple-select answer
// ---------------------------------------------------------------------------

/**
 * Creates a Zod schema for validating multiple-select answer submissions.
 * Three required fields: participantId, questionId, and selectedChoiceIds array.
 *
 * @param t - Translation function for error messages
 * @returns Zod schema for multiple-select answer creation
 */
export const createMultipleSelectAnswerSchema = (t: TranslateFn) =>
  z.object({
    participantId: z.string().min(1, t("Validation.participantIdRequired")),
    questionId: z.string().min(1, t("Validation.questionIdRequired")),
    /** IDs of all selected choices. Empty array means skipped. */
    selectedChoiceIds: z.array(z.string()),
  });

export type MultipleSelectAnswerInput = z.infer<
  ReturnType<typeof createMultipleSelectAnswerSchema>
>;

/**
 * Creates a partial Zod schema for updating multiple-select answers.
 * All fields are optional for PATCH operations.
 *
 * @param t - Translation function for error messages
 * @returns Partial Zod schema where all multiple-select answer fields are optional
 */
export const updateMultipleSelectAnswerSchema = (t: TranslateFn) =>
  createMultipleSelectAnswerSchema(t).partial();

export type MultipleSelectAnswerUpdateInput = z.infer<
  ReturnType<typeof updateMultipleSelectAnswerSchema>
>;

// ---------------------------------------------------------------------------
// Batch answer submission
// Collects all answers for one participant in a single request.
// ---------------------------------------------------------------------------

/**
 * Creates a Zod schema for batch answer submission.
 * Collects all answers (essay, choice, multiple-select) for one participant in a single request.
 *
 * @param t - Translation function for error messages
 * @returns Zod schema for batch answer submission validation
 */
export const createSubmitAnswersSchema = (t: TranslateFn) =>
  z.object({
    participantId: z.string().min(1, t("Validation.participantIdRequired")),
    essayAnswers: z
      .array(
        z.object({
          questionId: z.string().min(1, t("Validation.questionIdRequired")),
          answerText: z.string(),
        }),
      )
      .default([]),
    choiceAnswers: z
      .array(
        z.object({
          questionId: z.string().min(1, t("Validation.questionIdRequired")),
          selectedChoiceId: z.string().nullable().optional(),
        }),
      )
      .default([]),
    multipleSelectAnswers: z
      .array(
        z.object({
          questionId: z.string().min(1, t("Validation.questionIdRequired")),
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

/**
 * Creates a Zod schema for manual grading of essay answers.
 * Validates the score and optional score explanation provided by the test creator.
 *
 * @param t - Translation function for error messages
 * @returns Zod schema for essay answer grading validation
 */
export const createGradeEssayAnswerSchema = (t: TranslateFn) =>
  z.object({
    score: z
      .number()
      .int(t("Validation.integer"))
      .min(0, t("Validation.scoreNonNegative")),
    scoreExplanation: z.string().optional(),
  });

export type GradeEssayAnswerInput = z.infer<
  ReturnType<typeof createGradeEssayAnswerSchema>
>;

/**
 * Creates a partial Zod schema for updating essay answer grades.
 * All fields are optional for PATCH operations.
 *
 * @param t - Translation function for error messages
 * @returns Partial Zod schema where all grade fields are optional
 */
export const updateGradeEssayAnswerSchema = (t: TranslateFn) =>
  createGradeEssayAnswerSchema(t).partial();

export type GradeEssayAnswerUpdateInput = z.infer<
  ReturnType<typeof updateGradeEssayAnswerSchema>
>;
