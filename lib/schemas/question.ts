import { z } from "zod";
import { QuestionType } from "../generated/prisma/enums";

/**
 * A translation function accepting a key within the "Validation" namespace.
 * Pass the `t` from `useTranslations("Validation")` or `getTranslations("Validation")`.
 */
type TranslateFn = (key: string) => string;

// ---------------------------------------------------------------------------
// Choice (option inside a ChoiceQuestion)
// ---------------------------------------------------------------------------

export const createChoiceSchema = (t: TranslateFn) =>
  z.object({
    id: z.string().optional(),
    choiceText: z.string().min(1, t("choiceTextRequired")),
    isCorrect: z.boolean(),
  });

export type ChoiceInput = z.infer<ReturnType<typeof createChoiceSchema>>;

// ---------------------------------------------------------------------------
// Multiple-select choice (option inside a MultipleSelectQuestion)
// ---------------------------------------------------------------------------

export const createMultipleSelectChoiceSchema = (t: TranslateFn) =>
  z.object({
    id: z.string().optional(),
    choiceText: z.string().min(1, t("choiceTextRequired")),
    isCorrect: z.boolean(),
  });

export type MultipleSelectChoiceInput = z.infer<
  ReturnType<typeof createMultipleSelectChoiceSchema>
>;

// ---------------------------------------------------------------------------
// Essay question
// ---------------------------------------------------------------------------

/**
 * Base object — no refinements, safe to call .partial() on.
 */
export const createEssayQuestionObjectSchema = (t: TranslateFn) =>
  z.object({
    type: z.literal(QuestionType.ESSAY),
    questionText: z.string().min(1, t("questionTextRequired")),
    answerText: z.string().min(1, t("answerTextRequired")),
    isExactAnswer: z.boolean(),
    maxScore: z.number().int(t("integer")).positive(t("maxScorePositive")),
  });

/** Full schema — same as base (no cross-field refinements needed). */
export const createEssayQuestionSchema = createEssayQuestionObjectSchema;

export type EssayQuestionInput = z.infer<
  ReturnType<typeof createEssayQuestionSchema>
>;

// ---------------------------------------------------------------------------
// Choice question
// ---------------------------------------------------------------------------

/**
 * Base object — no refinements, safe to call .partial() on.
 */
export const createChoiceQuestionObjectSchema = (t: TranslateFn) =>
  z.object({
    type: z.literal(QuestionType.CHOICE),
    questionText: z.string().min(1, t("questionTextRequired")),
    isChoiceRandomized: z.boolean(),
    maxScore: z.number().int(t("integer")).positive(t("maxScorePositive")),
    choices: z.array(createChoiceSchema(t)).min(2, t("atLeastTwoChoices")),
  });

/** Full schema with cross-field refinement — used for creating a question. */
export const createChoiceQuestionSchema = (t: TranslateFn) =>
  createChoiceQuestionObjectSchema(t).refine(
    (data) => data.choices.some((c) => c.isCorrect),
    { error: t("atLeastOneCorrect") },
  );

export type ChoiceQuestionInput = z.infer<
  ReturnType<typeof createChoiceQuestionObjectSchema>
>;

// ---------------------------------------------------------------------------
// Multiple-select question
// ---------------------------------------------------------------------------

/**
 * Base object — no refinements, safe to call .partial() on.
 */
export const createMultipleSelectQuestionObjectSchema = (t: TranslateFn) =>
  z.object({
    type: z.literal(QuestionType.MULTIPLE_SELECT),
    questionText: z.string().min(1, t("questionTextRequired")),
    isChoiceRandomized: z.boolean(),
    maxScore: z.number().int(t("integer")).positive(t("maxScorePositive")),
    choices: z
      .array(createMultipleSelectChoiceSchema(t))
      .min(2, t("atLeastTwoChoices")),
  });

/** Full schema with cross-field refinement — used for creating a question. */
export const createMultipleSelectQuestionSchema = (t: TranslateFn) =>
  createMultipleSelectQuestionObjectSchema(t).refine(
    (data) => data.choices.some((c) => c.isCorrect),
    { error: t("atLeastOneCorrect") },
  );

export type MultipleSelectQuestionInput = z.infer<
  ReturnType<typeof createMultipleSelectQuestionObjectSchema>
>;

// ---------------------------------------------------------------------------
// Discriminated union covering all question types
// ---------------------------------------------------------------------------

export const createQuestionSchema = (t: TranslateFn) =>
  z.discriminatedUnion("type", [
    createEssayQuestionObjectSchema(t),
    createChoiceQuestionObjectSchema(t),
    createMultipleSelectQuestionObjectSchema(t),
  ]);

export type QuestionInput = z.infer<ReturnType<typeof createQuestionSchema>>;

// ---------------------------------------------------------------------------
// Create question request (API body — only testId; type is resolved server-side)
// ---------------------------------------------------------------------------

export const createQuestionRequestSchema = (t: TranslateFn) =>
  z.object({
    testId: z.cuid(t("testIdRequired")),
  });

export type CreateQuestionRequestInput = z.infer<
  ReturnType<typeof createQuestionRequestSchema>
>;

// ---------------------------------------------------------------------------
// Question ordering (used when reordering questions inside a test)
// ---------------------------------------------------------------------------

export const createQuestionOrderSchema = () =>
  z.object({
    id: z.cuid(),
    order: z.number().int().nonnegative(),
  });

export type QuestionOrderInput = z.infer<
  ReturnType<typeof createQuestionOrderSchema>
>;

// ---------------------------------------------------------------------------
// Update question request (PATCH /api/questions/[id]) — partial update
// ---------------------------------------------------------------------------

/**
 * Partial update schemas — `type` stays required (discriminator) while all
 * other fields become optional, following the same pattern as updateTestSchema.
 */
export const updateEssayQuestionSchema = (t: TranslateFn) =>
  createEssayQuestionObjectSchema(t)
    .omit({ type: true })
    .partial()
    .extend({ type: z.literal(QuestionType.ESSAY) });

export const updateChoiceQuestionSchema = (t: TranslateFn) =>
  createChoiceQuestionObjectSchema(t)
    .omit({ type: true })
    .partial()
    .extend({ type: z.literal(QuestionType.CHOICE) });

export const updateMultipleSelectQuestionSchema = (t: TranslateFn) =>
  createMultipleSelectQuestionObjectSchema(t)
    .omit({ type: true })
    .partial()
    .extend({ type: z.literal(QuestionType.MULTIPLE_SELECT) });

export const updateQuestionSchema = (t: TranslateFn) =>
  z.discriminatedUnion("type", [
    updateEssayQuestionSchema(t),
    updateChoiceQuestionSchema(t),
    updateMultipleSelectQuestionSchema(t),
  ]);

export type UpdateQuestionInput = z.infer<
  ReturnType<typeof updateQuestionSchema>
>;

// ---------------------------------------------------------------------------
// GET /api/questions query params
// ---------------------------------------------------------------------------

export const getQuestionsQuerySchema = z.object({
  testid: z.cuid(),
});

export type GetQuestionsQueryInput = z.infer<typeof getQuestionsQuerySchema>;
