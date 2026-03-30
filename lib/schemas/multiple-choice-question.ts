import { z } from "zod";
import { TranslateFn } from "./translate";
import { QuestionType } from "../generated/prisma/enums";
import type { MultipleSelectQuestion } from "../generated/prisma/client";
import { createMultipleSelectChoiceSchema } from "./multiple-choice";
export {
  MultipleSelectChoiceValidationSchema,
  createMultipleSelectChoiceSchema,
  defaultMultipleSelectChoiceData,
} from "./multiple-choice";
export type { MultipleSelectChoiceCreateInput } from "./multiple-choice";

// ---------------------------------------------------------------------------
// Multiple-select question
// ---------------------------------------------------------------------------

/**
 * Base validation schema for multiple-select questions without refinements.
 * Safe to call .partial() on this schema.
 *
 * @param t - Translation function for error messages
 * @returns Zod schema for multiple-select question validation
 */
export const MultipleSelectQuestionValidationSchema = (t: TranslateFn) =>
  z.object({
    type: z.literal(QuestionType.MULTIPLE_SELECT),
    questionText: z.string().min(1, t("questionTextRequired")),
    isChoiceRandomized: z.boolean(),
    maxScore: z.number().int(t("integer")).positive(t("maxScorePositive")),
    choices: z
      .array(createMultipleSelectChoiceSchema(t))
      .min(2, t("atLeastTwoChoices")),
  });

/**
 * Creates a Zod schema for multiple-select questions with validation.
 * Includes cross-field refinement ensuring at least one choice is marked correct.
 *
 * @param t - Translation function for error messages
 * @returns Zod schema for creating multiple-select questions with cross-field validation
 */
export const createMultipleSelectQuestionSchema = (t: TranslateFn) =>
  MultipleSelectQuestionValidationSchema(t).refine(
    (data) => data.choices.some((c) => c.isCorrect),
    { error: t("atLeastOneCorrect") },
  );

/**
 * Partial schema for PATCH operations on multiple-select questions.
 * Type remains required (discriminator), all other fields optional.
 *
 * @param t - Translation function for error messages
 * @returns Partial Zod schema with required type discriminator for patching multiple-select questions
 */
export const patchMultipleSelectQuestionSchema = (t: TranslateFn) =>
  MultipleSelectQuestionValidationSchema(t)
    .omit({ type: true })
    .partial()
    .extend({ type: z.literal(QuestionType.MULTIPLE_SELECT) });

export type MultipleSelectQuestionCreateInput = z.infer<
  ReturnType<typeof MultipleSelectQuestionValidationSchema>
>;
export type MultipleSelectQuestionPatchInput = z.infer<
  ReturnType<typeof patchMultipleSelectQuestionSchema>
>;

// ---------------------------------------------------------------------------
// Multiple select question details (for API responses with related data)
// ---------------------------------------------------------------------------

/**
 * Schema for multiple-select question details in API responses.
 * Contains randomization flag, max score, and available choices.
 *
 * @returns Zod schema for multiple-select question detail objects
 */
export const multipleSelectQuestionDetailSchema = z.object({
  id: z.string(),
  isChoiceRandomized: z.boolean(),
  maxScore: z.number().int(),
  multipleSelectChoices: z.array(
    z.object({
      id: z.string(),
      choiceText: z.string(),
      isCorrect: z.boolean(),
    }),
  ),
});

export type MultipleSelectQuestionDetail = z.infer<
  typeof multipleSelectQuestionDetailSchema
>;

// ---------------------------------------------------------------------------
// Default data for optimistic updates
// ---------------------------------------------------------------------------

/**
 * Default MultipleSelectQuestion data object for optimistic UI updates.
 * Use as a placeholder before receiving the real server response.
 *
 * @returns Default MultipleSelectQuestion object with empty/initial values
 */
export const defaultMultipleSelectQuestionData: MultipleSelectQuestion = {
  id: "", // will be generated at creation time
  isChoiceRandomized: false,
  maxScore: 1,
  createdAt: new Date(),
  updatedAt: new Date(),
};
