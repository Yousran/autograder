import { z } from "zod";
import type { ChoiceAnswer } from "../generated/prisma/client";

/**
 * A translation function accepting a key within the "Validation" namespace.
 * Pass the `t` from `useTranslations("Validation")` or `getTranslations("Validation")`.
 */
type TranslateFn = (key: string) => string;

// ---------------------------------------------------------------------------
// Choice answer
// ---------------------------------------------------------------------------

/**
 * Base object — no refinements, safe to call .partial() on.
 */
export const ChoiceAnswerValidationSchema = (t: TranslateFn) =>
  z.object({
    participantId: z.string().min(1, t("participantIdRequired")),
    questionId: z.string().min(1, t("questionIdRequired")),
    /** null means the participant skipped the question. */
    selectedChoiceId: z.string().nullable().optional(),
  });

/** Full schema — same as base (no cross-field refinements needed). */
export const createChoiceAnswerSchema = (t: TranslateFn) =>
  ChoiceAnswerValidationSchema(t);

/** Partial schema for PATCH — all fields optional. */
export const patchChoiceAnswerSchema = (t: TranslateFn) =>
  ChoiceAnswerValidationSchema(t).partial();

export type ChoiceAnswerCreateInput = z.infer<
  ReturnType<typeof createChoiceAnswerSchema>
>;
export type ChoiceAnswerPatchInput = z.infer<
  ReturnType<typeof patchChoiceAnswerSchema>
>;

// ---------------------------------------------------------------------------
// Default data for optimistic updates
// ---------------------------------------------------------------------------

/** Default ChoiceAnswer data — use as a placeholder before the real server response in optimistic updates. */
export const defaultChoiceAnswerData: ChoiceAnswer = {
  id: "",
  questionId: "",
  participantId: "",
  selectedChoiceId: null,
  score: 0,
  createdAt: new Date(),
  updatedAt: new Date(),
};
