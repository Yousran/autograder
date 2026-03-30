import { z } from "zod";
import { TranslateFn } from "./translate";
import { QuestionType } from "../generated/prisma/enums";
import type { ChoiceQuestion } from "../generated/prisma/client";
import { createChoiceSchema } from "./choice";
export {
  ChoiceValidationSchema,
  createChoiceSchema,
  defaultChoiceData,
} from "./choice";
export type { ChoiceCreateInput } from "./choice";

// ---------------------------------------------------------------------------
// Choice question
// ---------------------------------------------------------------------------

/**
 * Base validation schema for choice questions without refinements.
 * Safe to call .partial() on this schema.
 *
 * @param t - Translation function for error messages
 * @returns Zod schema for choice question validation
 */
export const ChoiceQuestionValidationSchema = (t: TranslateFn) =>
  z.object({
    type: z.literal(QuestionType.CHOICE),
    questionText: z.string().min(1, t("questionTextRequired")),
    isChoiceRandomized: z.boolean(),
    maxScore: z.number().int(t("integer")).positive(t("maxScorePositive")),
    choices: z.array(createChoiceSchema(t)).min(2, t("atLeastTwoChoices")),
  });

/**
 * Creates a Zod schema for choice questions with validation.
 * Includes cross-field refinement ensuring at least one choice is marked correct.
 *
 * @param t - Translation function for error messages
 * @returns Zod schema for creating choice questions with cross-field validation
 */
export const createChoiceQuestionSchema = (t: TranslateFn) =>
  ChoiceQuestionValidationSchema(t).refine(
    (data) => data.choices.some((c) => c.isCorrect),
    { error: t("atLeastOneCorrect") },
  );

/**
 * Partial schema for PATCH operations on choice questions.
 * Type remains required (discriminator), all other fields optional.
 *
 * @param t - Translation function for error messages
 * @returns Partial Zod schema with required type discriminator for patching choice questions
 */
export const patchChoiceQuestionSchema = (t: TranslateFn) =>
  ChoiceQuestionValidationSchema(t)
    .omit({ type: true })
    .partial()
    .extend({ type: z.literal(QuestionType.CHOICE) });

export type ChoiceQuestionCreateInput = z.infer<
  ReturnType<typeof ChoiceQuestionValidationSchema>
>;
export type ChoiceQuestionPatchInput = z.infer<
  ReturnType<typeof patchChoiceQuestionSchema>
>;

// ---------------------------------------------------------------------------
// Choice question details (for API responses with related data)
// ---------------------------------------------------------------------------

/**
 * Schema for choice question details in API responses.
 * Contains randomization flag, max score, and available choices.
 *
 * @returns Zod schema for choice question detail objects
 */
export const choiceQuestionDetailSchema = z.object({
  id: z.string(),
  isChoiceRandomized: z.boolean(),
  maxScore: z.number().int(),
  choices: z.array(
    z.object({
      id: z.string(),
      choiceText: z.string(),
      isCorrect: z.boolean(),
    }),
  ),
});

export type ChoiceQuestionDetail = z.infer<typeof choiceQuestionDetailSchema>;

// ---------------------------------------------------------------------------
// Default data for optimistic updates
// ---------------------------------------------------------------------------

/**
 * Default ChoiceQuestion data object for optimistic UI updates.
 * Use as a placeholder before receiving the real server response.
 *
 * @returns Default ChoiceQuestion object with empty/initial values
 */
export const defaultChoiceQuestionData: ChoiceQuestion = {
  id: "", // will be generated at creation time
  isChoiceRandomized: false,
  maxScore: 1,
  createdAt: new Date(),
  updatedAt: new Date(),
};
