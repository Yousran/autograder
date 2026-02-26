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

export const createEssayQuestionSchema = (t: TranslateFn) =>
  z.object({
    type: z.literal(QuestionType.ESSAY),
    questionText: z.string().min(1, t("questionTextRequired")),
    answerText: z.string().min(1, t("answerTextRequired")),
    isExactAnswer: z.boolean(),
    maxScore: z.number().int(t("integer")).positive(t("maxScorePositive")),
  });

export type EssayQuestionInput = z.infer<
  ReturnType<typeof createEssayQuestionSchema>
>;

// ---------------------------------------------------------------------------
// Choice question
// ---------------------------------------------------------------------------

export const createChoiceQuestionSchema = (t: TranslateFn) =>
  z.object({
    type: z.literal(QuestionType.CHOICE),
    questionText: z.string().min(1, t("questionTextRequired")),
    isChoiceRandomized: z.boolean(),
    maxScore: z.number().int(t("integer")).positive(t("maxScorePositive")),
    choices: z
      .array(createChoiceSchema(t))
      .min(2, t("atLeastTwoChoices"))
      .refine((choices) => choices.some((c) => c.isCorrect), {
        message: t("atLeastOneCorrect"),
      }),
  });

export type ChoiceQuestionInput = z.infer<
  ReturnType<typeof createChoiceQuestionSchema>
>;

// ---------------------------------------------------------------------------
// Multiple-select question
// ---------------------------------------------------------------------------

export const createMultipleSelectQuestionSchema = (t: TranslateFn) =>
  z.object({
    type: z.literal(QuestionType.MULTIPLE_SELECT),
    questionText: z.string().min(1, t("questionTextRequired")),
    isChoiceRandomized: z.boolean(),
    maxScore: z.number().int(t("integer")).positive(t("maxScorePositive")),
    choices: z
      .array(createMultipleSelectChoiceSchema(t))
      .min(2, t("atLeastTwoChoices"))
      .refine((choices) => choices.some((c) => c.isCorrect), {
        message: t("atLeastOneCorrect"),
      }),
  });

export type MultipleSelectQuestionInput = z.infer<
  ReturnType<typeof createMultipleSelectQuestionSchema>
>;

// ---------------------------------------------------------------------------
// Discriminated union covering all question types
// ---------------------------------------------------------------------------

export const createQuestionSchema = (t: TranslateFn) =>
  z.discriminatedUnion("type", [
    createEssayQuestionSchema(t),
    createChoiceQuestionSchema(t),
    createMultipleSelectQuestionSchema(t),
  ]);

export type QuestionInput = z.infer<ReturnType<typeof createQuestionSchema>>;

// ---------------------------------------------------------------------------
// Create question request (API body — only testId; type is resolved server-side)
// ---------------------------------------------------------------------------

export const createQuestionRequestSchema = (t: TranslateFn) =>
  z.object({
    testId: z.string().cuid(t("testIdRequired")),
  });

export type CreateQuestionRequestInput = z.infer<
  ReturnType<typeof createQuestionRequestSchema>
>;

// ---------------------------------------------------------------------------
// Question ordering (used when reordering questions inside a test)
// ---------------------------------------------------------------------------

export const createQuestionOrderSchema = () =>
  z.object({
    id: z.string().cuid(),
    order: z.number().int().nonnegative(),
  });

export type QuestionOrderInput = z.infer<
  ReturnType<typeof createQuestionOrderSchema>
>;
