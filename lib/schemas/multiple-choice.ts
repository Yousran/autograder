import { z } from "zod";
import type { MultipleSelectChoice } from "../generated/prisma/client";

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
