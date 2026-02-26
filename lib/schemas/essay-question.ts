import { z } from "zod";
import { QuestionType } from "../generated/prisma/enums";
import type { EssayQuestion, Question } from "../generated/prisma/client";

/**
 * A translation function accepting a key within the "Validation" namespace.
 * Pass the `t` from `useTranslations("Validation")` or `getTranslations("Validation")`.
 */
type TranslateFn = (key: string) => string;

// ---------------------------------------------------------------------------
// Essay question
// ---------------------------------------------------------------------------

/**
 * Base object — no refinements, safe to call .partial() on.
 */
export const EssayQuestionValidationSchema = (t: TranslateFn) =>
  z.object({
    type: z.literal(QuestionType.ESSAY),
    questionText: z.string().min(1, t("questionTextRequired")),
    answerText: z.string().min(1, t("answerTextRequired")),
    isExactAnswer: z.boolean(),
    maxScore: z.number().int(t("integer")).positive(t("maxScorePositive")),
  });

/** Full schema — same as base (no cross-field refinements needed). */
export const createEssayQuestionSchema = (t: TranslateFn) =>
  EssayQuestionValidationSchema(t);

/** Partial schema for PATCH — `type` stays required (discriminator), all other fields optional. */
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
// Default data for optimistic updates
// ---------------------------------------------------------------------------

/** Default Question data — use as a placeholder before the real server response in optimistic updates. */
export const defaultQuestionData: Question = {
  id: `temp-${crypto.randomUUID()}`,
  testId: "",
  questionText: "",
  type: QuestionType.ESSAY,
  order: "a0",
  createdAt: new Date(),
  updatedAt: new Date(),
};

/** Default EssayQuestion data — use as a placeholder before the real server response in optimistic updates. */
export const defaultEssayQuestionData: EssayQuestion = {
  id: defaultQuestionData.id,
  answerText: "",
  isExactAnswer: false,
  maxScore: 1,
  createdAt: new Date(),
  updatedAt: new Date(),
};
