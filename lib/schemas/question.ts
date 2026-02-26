import { z } from "zod";

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
  z.discriminatedUnion("type", [
    patchEssayQuestionSchema(t),
    patchChoiceQuestionSchema(t),
    patchMultipleSelectQuestionSchema(t),
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
// GET /api/questions query params
// ---------------------------------------------------------------------------

export const getQuestionsQuerySchema = z.object({
  testid: z.cuid(),
});

export type GetQuestionsQueryInput = z.infer<typeof getQuestionsQuerySchema>;
