import { z } from "zod";
import { QuestionType } from "../generated/prisma/enums";
import type {
  MultipleSelectQuestion,
  MultipleSelectChoice,
} from "../generated/prisma/client";

/**
 * A translation function accepting a key within the "Validation" namespace.
 * Pass the `t` from `useTranslations("Validation")` or `getTranslations("Validation")`.
 */
type TranslateFn = (key: string) => string;

// ---------------------------------------------------------------------------
// Multiple-select choice (option inside a MultipleSelectQuestion)
// ---------------------------------------------------------------------------

/**
 * Base object — no refinements, safe to call .partial() on.
 */
export const MultipleSelectChoiceValidationSchema = (t: TranslateFn) =>
  z.object({
    id: z.string().optional(),
    choiceText: z.string().min(1, t("choiceTextRequired")),
    isCorrect: z.boolean(),
  });

/** Full schema — same as base (no cross-field refinements needed). */
export const createMultipleSelectChoiceSchema = (t: TranslateFn) =>
  MultipleSelectChoiceValidationSchema(t);

export type MultipleSelectChoiceCreateInput = z.infer<
  ReturnType<typeof createMultipleSelectChoiceSchema>
>;

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
// Default data for optimistic updates
// ---------------------------------------------------------------------------

/** Default MultipleSelectChoice data — use as a placeholder before the real server response in optimistic updates. */
export const defaultMultipleSelectChoiceData: MultipleSelectChoice = {
  id: `temp-${crypto.randomUUID()}`,
  questionId: "",
  choiceText: "",
  isCorrect: false,
  createdAt: new Date(),
  updatedAt: new Date(),
};

/** Default MultipleSelectQuestion data — use as a placeholder before the real server response in optimistic updates. */
export const defaultMultipleSelectQuestionData: MultipleSelectQuestion = {
  id: `temp-${crypto.randomUUID()}`,
  isChoiceRandomized: false,
  maxScore: 1,
  createdAt: new Date(),
  updatedAt: new Date(),
};
