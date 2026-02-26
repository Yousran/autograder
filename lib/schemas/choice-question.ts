import { z } from "zod";
import { QuestionType } from "../generated/prisma/enums";
import type { ChoiceQuestion, Choice } from "../generated/prisma/client";

/**
 * A translation function accepting a key within the "Validation" namespace.
 * Pass the `t` from `useTranslations("Validation")` or `getTranslations("Validation")`.
 */
type TranslateFn = (key: string) => string;

// ---------------------------------------------------------------------------
// Choice (option inside a ChoiceQuestion)
// ---------------------------------------------------------------------------

/**
 * Base object — no refinements, safe to call .partial() on.
 */
export const ChoiceValidationSchema = (t: TranslateFn) =>
  z.object({
    id: z.string().optional(),
    choiceText: z.string().min(1, t("choiceTextRequired")),
    isCorrect: z.boolean(),
  });

/** Full schema — same as base (no cross-field refinements needed). */
export const createChoiceSchema = (t: TranslateFn) => ChoiceValidationSchema(t);

export type ChoiceCreateInput = z.infer<ReturnType<typeof createChoiceSchema>>;

// ---------------------------------------------------------------------------
// Choice question
// ---------------------------------------------------------------------------

/**
 * Base object — no refinements, safe to call .partial() on.
 */
export const ChoiceQuestionValidationSchema = (t: TranslateFn) =>
  z.object({
    type: z.literal(QuestionType.CHOICE),
    questionText: z.string().min(1, t("questionTextRequired")),
    isChoiceRandomized: z.boolean(),
    maxScore: z.number().int(t("integer")).positive(t("maxScorePositive")),
    choices: z.array(createChoiceSchema(t)).min(2, t("atLeastTwoChoices")),
  });

/** Full schema with cross-field refinement — used for creating a question. */
export const createChoiceQuestionSchema = (t: TranslateFn) =>
  ChoiceQuestionValidationSchema(t).refine(
    (data) => data.choices.some((c) => c.isCorrect),
    { error: t("atLeastOneCorrect") },
  );

/** Partial schema for PATCH — `type` stays required (discriminator), all other fields optional. */
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
// Default data for optimistic updates
// ---------------------------------------------------------------------------

/** Default Choice data — use as a placeholder before the real server response in optimistic updates. */
export const defaultChoiceData: Choice = {
  id: `temp-${crypto.randomUUID()}`,
  questionId: "",
  choiceText: "",
  isCorrect: false,
  createdAt: new Date(),
  updatedAt: new Date(),
};

/** Default ChoiceQuestion data — use as a placeholder before the real server response in optimistic updates. */
export const defaultChoiceQuestionData: ChoiceQuestion = {
  id: `temp-${crypto.randomUUID()}`,
  isChoiceRandomized: false,
  maxScore: 1,
  createdAt: new Date(),
  updatedAt: new Date(),
};
