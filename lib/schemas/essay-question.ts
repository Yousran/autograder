import { z } from "zod";
import { TranslateFn } from "./translate";
import { QuestionType } from "../generated/prisma/enums";
import type { EssayQuestion, Question } from "../generated/prisma/client";

// ---------------------------------------------------------------------------
// Essay question
// ---------------------------------------------------------------------------

/**
 * Base validation schema for essay questions without refinements.
 * Safe to call .partial() on this schema.
 *
 * @param t - Translation function for error messages
 * @returns Zod schema for essay question validation
 */
export const EssayQuestionValidationSchema = (t: TranslateFn) =>
  z.object({
    type: z.literal(QuestionType.ESSAY),
    questionText: z.string().min(1, t("Validation.questionTextRequired")),
    answerText: z.string().min(1, t("Validation.answerTextRequired")),
    isExactAnswer: z.boolean(),
    maxScore: z
      .number()
      .int(t("Validation.integer"))
      .positive(t("Validation.maxScorePositive")),
  });

/**
 * Creates a Zod schema for essay questions.
 * Same as the base schema with no cross-field refinements.
 *
 * @param t - Translation function for error messages
 * @returns Zod schema for creating essay question objects
 */
export const createEssayQuestionSchema = (t: TranslateFn) =>
  EssayQuestionValidationSchema(t);

/**
 * Partial schema for PATCH operations on essay questions.
 * Type remains required (discriminator), all other fields optional.
 *
 * @param t - Translation function for error messages
 * @returns Partial Zod schema with required type discriminator for patching essay questions
 */
export const patchEssayQuestionSchema = (t: TranslateFn) =>
  EssayQuestionValidationSchema(t)
    .omit({ type: true })
    .partial()
    .extend({ type: z.literal(QuestionType.ESSAY) });

export type EssayQuestionCreateInput = z.infer<
  ReturnType<typeof createEssayQuestionSchema>
>;
export type EssayQuestionPatchInput = z.infer<
  ReturnType<typeof patchEssayQuestionSchema>
>;

// ---------------------------------------------------------------------------
// Essay question details (for API responses with related data)
// ---------------------------------------------------------------------------

/**
 * Schema for essay question details in API responses.
 * Contains the reference answer text, exact match flag, and max score.
 *
 * @returns Zod schema for essay question detail objects
 */
export const essayQuestionDetailSchema = z.object({
  id: z.string(),
  answerText: z.string(),
  isExactAnswer: z.boolean(),
  maxScore: z.number().int(),
});

export type EssayQuestionDetail = z.infer<typeof essayQuestionDetailSchema>;

// ---------------------------------------------------------------------------
// Default data for optimistic updates
// ---------------------------------------------------------------------------

/**
 * Default Question data object for optimistic UI updates.
 * Use as a placeholder before receiving the real server response.
 *
 * @returns Default Question object with empty/initial values
 */
export const defaultQuestionData: Question = {
  id: "", // will be generated at creation time
  testId: "",
  questionText: "",
  type: QuestionType.ESSAY,
  order: "a0",
  createdAt: new Date(),
  updatedAt: new Date(),
};

/**
 * Default EssayQuestion data object for optimistic UI updates.
 * Use as a placeholder before receiving the real server response.
 *
 * @returns Default EssayQuestion object with empty/initial values
 */
export const defaultEssayQuestionData: EssayQuestion = {
  id: "", // will be generated at creation time
  answerText: "",
  isExactAnswer: false,
  maxScore: 1,
  createdAt: new Date(),
  updatedAt: new Date(),
};

/**
 * Schema for essay question details in API responses.
 * Contains the reference answer text, exact match flag, max score, and participant answers.
 *
 * @returns Zod schema for essay question detail objects
 */
export const essayQuestionWithAnswerSchema = z.object({
  id: z.string(),
  answerText: z.string(),
  isExactAnswer: z.boolean(),
  maxScore: z.number().int(),
  answers: z.array(
    z.object({
      id: z.string(),
      answerText: z.string(),
      score: z.number().int(),
      scoreExplanation: z.string().nullable(),
    }),
  ),
});
