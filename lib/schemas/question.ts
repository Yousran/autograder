import { z } from "zod";
import { TranslateFn } from "./translate";
import type { Question } from "../generated/prisma/client";
import { QuestionType } from "../generated/prisma/enums";

export * from "./essay-question";
export * from "./choice-question";
export * from "./multiple-choice-question";

import {
  EssayQuestionValidationSchema,
  patchEssayQuestionSchema,
  essayQuestionDetailSchema,
  essayQuestionWithAnswerSchema,
} from "./essay-question";
import {
  ChoiceQuestionValidationSchema,
  patchChoiceQuestionSchema,
  defaultChoiceQuestionData,
  defaultChoiceData,
  choiceQuestionDetailSchema,
  choiceQuestionWithAnswerSchema,
} from "./choice-question";
import {
  MultipleSelectQuestionValidationSchema,
  patchMultipleSelectQuestionSchema,
  multipleSelectQuestionDetailSchema,
  multipleSelectQuestionWithAnswerSchema,
} from "./multiple-choice-question";

/**
 * Creates a discriminated union schema for validating any question type on creation.
 * Supports essay, choice, and multiple-select question types.
 *
 * @param t - Translation function for error messages
 * @returns Zod schema for creating questions of any supported type
 */
export const createQuestionSchema = (t: TranslateFn) =>
  z.discriminatedUnion("type", [
    EssayQuestionValidationSchema(t),
    ChoiceQuestionValidationSchema(t),
    MultipleSelectQuestionValidationSchema(t),
  ]);

/**
 * Creates a partial discriminated union schema for PATCH operations on questions.
 * Supports patching any question type or reordering questions.
 *
 * @param t - Translation function for error messages
 * @returns Zod schema for patching questions with optional reordering
 */
export const patchQuestionSchema = (t: TranslateFn) =>
  z.union([
    z.discriminatedUnion("type", [
      patchEssayQuestionSchema(t),
      patchChoiceQuestionSchema(t),
      patchMultipleSelectQuestionSchema(t),
    ]),
    z
      .object({
        beforeId: z.string().nullable(),
        afterId: z.string().nullable(),
      })
      .strict(),
  ]);

export type QuestionCreateInput = z.infer<
  ReturnType<typeof createQuestionSchema>
>;
export type QuestionPatchInput = z.infer<
  ReturnType<typeof patchQuestionSchema>
>;

// ---------------------------------------------------------------------------
// Create question request (API body — only testId; type is resolved server-side)
// ---------------------------------------------------------------------------

/**
 * Creates a Zod schema for question creation API requests.
 * Validates testId and optional insertAfterId for question positioning.
 *
 * @param t - Translation function for error messages
 * @returns Zod schema for validating question creation requests
 */
export const createQuestionRequestSchema = (t: TranslateFn) =>
  z.object({
    testId: z.cuid(t("testIdRequired")),
    // Optional: ID of question to insert after. null = insert at start, omitted = append at end.
    insertAfterId: z.cuid(t("questionIdRequired")).nullable().optional(),
  });

export type QuestionRequestCreateInput = z.infer<
  ReturnType<typeof createQuestionRequestSchema>
>;

// ---------------------------------------------------------------------------
// Question ordering (used when reordering questions inside a test)
// ---------------------------------------------------------------------------

/**
 * Creates a Zod schema for question ordering during reordering operations.
 * Validates question ID and order string for positioning.
 *
 * @returns Zod schema for validating question order objects
 */
export const createQuestionOrderSchema = () =>
  z.object({
    id: z.cuid(),
    order: z.string().min(1),
  });

export type QuestionOrderCreateInput = z.infer<
  ReturnType<typeof createQuestionOrderSchema>
>;

// ---------------------------------------------------------------------------
// Shared UI type for displaying a question in a list
// ---------------------------------------------------------------------------

/**
 * Runtime schema for the Prisma Question model.
 * Typed as z.ZodType<Question> to enforce TypeScript compatibility with Prisma.
 * Use QuestionSchema.parse() to validate API responses.
 *
 * @returns Zod schema that validates Question model objects
 */
const questionSchemaObject = z.object({
  id: z.string(),
  testId: z.string(),
  type: z.enum(QuestionType),
  order: z.string(),
  questionText: z.string(),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
});

export const QuestionSchema: z.ZodType<Question> = questionSchemaObject;

/**
 * Type for a question in the questions list UI.
 * Represents the minimal question shape with metadata.
 *
 * @returns Question type inferred from QuestionSchema
 */
export type QuestionSchema = z.infer<typeof QuestionSchema>;

// ---------------------------------------------------------------------------
// Question with related details (for full API responses)
// ---------------------------------------------------------------------------

/**
 * Extended question schema that includes optional related data (essay, choice, multipleSelect).
 * This is used for API responses that include question type-specific details.
 */
export const QuestionWithDetailsSchema = questionSchemaObject.extend({
  essay: essayQuestionDetailSchema.optional(),
  choice: choiceQuestionDetailSchema.optional(),
  multipleSelect: multipleSelectQuestionDetailSchema.optional(),
});

/** Question with optional related details (essay, choice, or multipleSelect data). */
export type QuestionWithDetails = z.infer<typeof QuestionWithDetailsSchema>;

// ---------------------------------------------------------------------------
// Shared default field values — single source of truth for optimistic UI +
// API route creation. The API always creates CHOICE type by default.
// ---------------------------------------------------------------------------

/**
 * Default field values for a newly created question.
 * Both the API route and the UI optimistic update should derive from this
 * so they stay in sync.
 */
export const defaultQuestionData = {
  id: "", // will be generated at creation time
  type: QuestionType.CHOICE,
  questionText: "",
  isChoiceRandomized: defaultChoiceQuestionData.isChoiceRandomized,
  maxScore: defaultChoiceQuestionData.maxScore,
  /** Two starter choices matching what the API seeds on creation. */
  defaultChoices: [
    { choiceText: defaultChoiceData.choiceText, isCorrect: true },
    { choiceText: defaultChoiceData.choiceText, isCorrect: false },
  ],
} as const;

// ---------------------------------------------------------------------------
// Question type display labels (i18n)
// ---------------------------------------------------------------------------

/** All available question types for iteration and display. */
export const QUESTION_TYPES = [
  QuestionType.ESSAY,
  QuestionType.CHOICE,
  QuestionType.MULTIPLE_SELECT,
] as const;

/**
 * Returns the i18n display label for a question type.
 * Pass `t` from `useTranslations("Components.questionsTab")`.
 */
export function getQuestionTypeLabel(
  type: QuestionType,
  t: TranslateFn,
): string {
  const map: Record<QuestionType, string> = {
    [QuestionType.ESSAY]: t("questionType.essay"),
    [QuestionType.CHOICE]: t("questionType.choice"),
    [QuestionType.MULTIPLE_SELECT]: t("questionType.multipleSelect"),
  };
  return map[type];
}

// ---------------------------------------------------------------------------
// GET /api/questions query params
// ---------------------------------------------------------------------------

export const getQuestionsQuerySchema = z.object({
  testid: z.cuid(),
});

export type GetQuestionsQueryInput = z.infer<typeof getQuestionsQuerySchema>;

/**
 * Extended question schema that includes optional related data (essay, choice, multipleSelect).
 * This is used for API responses that include question type-specific details.
 */
export const QuestionWithAnswerSchema = questionSchemaObject.extend({
  essay: essayQuestionWithAnswerSchema.optional(),
  choice: choiceQuestionWithAnswerSchema.optional(),
  multipleSelect: multipleSelectQuestionWithAnswerSchema.optional(),
});

/** Question with optional related details (essay, choice, or multipleSelect data). */
export type QuestionWithAnswer = z.infer<typeof QuestionWithAnswerSchema>;
