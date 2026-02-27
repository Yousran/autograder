import { z } from "zod";
import { QuestionType } from "../generated/prisma/enums";
import type { ChoiceQuestion } from "../generated/prisma/client";
import { createChoiceSchema, defaultChoiceData } from "./choice";
export {
  ChoiceValidationSchema,
  createChoiceSchema,
  defaultChoiceData,
} from "./choice";
export type { ChoiceCreateInput } from "./choice";

/**
 * A translation function accepting a key within the "Validation" namespace.
 * Pass the `t` from `useTranslations("Validation")` or `getTranslations("Validation")`.
 */
type TranslateFn = (key: string) => string;

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
// Choice question details (for API responses with related data)
// ---------------------------------------------------------------------------

/** Schema for the choice question record returned by the API. */
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

/** Default ChoiceQuestion data — use as a placeholder before the real server response in optimistic updates. */
export const defaultChoiceQuestionData: ChoiceQuestion = {
  id: defaultChoiceData.id,
  isChoiceRandomized: false,
  maxScore: 1,
  createdAt: new Date(),
  updatedAt: new Date(),
};
