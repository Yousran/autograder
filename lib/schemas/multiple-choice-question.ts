import { z } from "zod";
import { QuestionType } from "../generated/prisma/enums";
import type { MultipleSelectQuestion } from "../generated/prisma/client";
import {
  createMultipleSelectChoiceSchema,
  defaultMultipleSelectChoiceData,
} from "./multiple-choice";
export {
  MultipleSelectChoiceValidationSchema,
  createMultipleSelectChoiceSchema,
  defaultMultipleSelectChoiceData,
} from "./multiple-choice";
export type { MultipleSelectChoiceCreateInput } from "./multiple-choice";

/**
 * A translation function accepting a key within the "Validation" namespace.
 * Pass the `t` from `useTranslations("Validation")` or `getTranslations("Validation")`.
 */
type TranslateFn = (key: string) => string;

// ---------------------------------------------------------------------------
// Multiple-select question
// ---------------------------------------------------------------------------

/**
 * Base object — no refinements, safe to call .partial() on.
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

/** Full schema with cross-field refinement — used for creating a question. */
export const createMultipleSelectQuestionSchema = (t: TranslateFn) =>
  MultipleSelectQuestionValidationSchema(t).refine(
    (data) => data.choices.some((c) => c.isCorrect),
    { error: t("atLeastOneCorrect") },
  );

/** Partial schema for PATCH — `type` stays required (discriminator), all other fields optional. */
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

/** Schema for the multiple select question record returned by the API. */
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

/** Default MultipleSelectQuestion data — use as a placeholder before the real server response in optimistic updates. */
export const defaultMultipleSelectQuestionData: MultipleSelectQuestion = {
  id: defaultMultipleSelectChoiceData.id,
  isChoiceRandomized: false,
  maxScore: 1,
  createdAt: new Date(),
  updatedAt: new Date(),
};
