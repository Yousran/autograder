import { z } from "zod";
import type { Question } from "../generated/prisma/client";
import { QuestionType } from "../generated/prisma/enums";

export * from "./essay-question";
export * from "./choice-question";
export * from "./multiple-choice-question";

import {
  EssayQuestionValidationSchema,
  patchEssayQuestionSchema,
} from "./essay-question";
import {
  ChoiceQuestionValidationSchema,
  patchChoiceQuestionSchema,
  defaultChoiceQuestionData,
  defaultChoiceData,
} from "./choice-question";
import {
  MultipleSelectQuestionValidationSchema,
  patchMultipleSelectQuestionSchema,
} from "./multiple-choice-question";

/**
 * A translation function accepting a key within the "Validation" namespace.
 * Pass the `t` from `useTranslations("Validation")` or `getTranslations("Validation")`.
 */
type TranslateFn = (key: string) => string;

/** Full discriminated union — used for validating any question type on create. */
export const createQuestionSchema = (t: TranslateFn) =>
  z.discriminatedUnion("type", [
    EssayQuestionValidationSchema(t),
    ChoiceQuestionValidationSchema(t),
    MultipleSelectQuestionValidationSchema(t),
  ]);

/** Partial discriminated union for PATCH. */
export const patchQuestionSchema = (t: TranslateFn) =>
  z.union([
    z.discriminatedUnion("type", [
      patchEssayQuestionSchema(t),
      patchChoiceQuestionSchema(t),
      patchMultipleSelectQuestionSchema(t),
    ]),
    // Reorder: send the order of the item being displaced (the one that will
    // now sit after the moved question). null = moved to the very end.
    z.object({ order: z.string().nullable() }).strict(),
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

/** Minimal question shape used by the questions list UI (e.g. QuestionCard). */
export type QuestionSchema = Pick<Question, "id" | "type" | "questionText">;

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
