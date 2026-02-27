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
 * Base object — no refinements and no defaults, safe to call .partial() on.
 * Defaults are applied only in the create schema below.
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

/** Partial schema for PATCH — all fields optional, no refinements. */
export const patchMultipleSelectChoiceSchema = (t: TranslateFn) =>
  MultipleSelectChoiceValidationSchema(t).partial();

export type MultipleSelectChoiceCreateInput = z.infer<
  ReturnType<typeof createMultipleSelectChoiceSchema>
>;
export type MultipleSelectChoicePatchInput = z.infer<
  ReturnType<typeof patchMultipleSelectChoiceSchema>
>;

// ---------------------------------------------------------------------------
// MultipleSelectChoiceSchema — Zod schema typed against the Prisma MultipleSelectChoice model.
// Dates are coerced so the schema safely handles ISO strings from JSON as
// well as native Date objects returned directly from Prisma.
// ---------------------------------------------------------------------------

/**
 * Runtime schema for the Prisma `MultipleSelectChoice` model.
 * Typed as `z.ZodType<MultipleSelectChoice>` so TypeScript enforces that it matches the
 * Prisma model exactly. Use `MultipleSelectChoiceSchema.parse()` to validate API responses.
 */
export const MultipleSelectChoiceSchema: z.ZodType<MultipleSelectChoice> =
  z.object({
    id: z.string(),
    questionId: z.string(),
    choiceText: z.string(),
    isCorrect: z.boolean(),
    createdAt: z.coerce.date(),
    updatedAt: z.coerce.date(),
  });

export type MultipleSelectChoiceSchema = z.infer<
  typeof MultipleSelectChoiceSchema
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
