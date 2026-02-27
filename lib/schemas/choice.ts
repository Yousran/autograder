import { z } from "zod";
import type { Choice } from "../generated/prisma/client";

/**
 * A translation function accepting a key within the "Validation" namespace.
 * Pass the `t` from `useTranslations("Validation")` or `getTranslations("Validation")`.
 */
type TranslateFn = (key: string) => string;

// ---------------------------------------------------------------------------
// Query schemas
// ---------------------------------------------------------------------------

/** Schema for validating query parameters when fetching choices by question ID. */
export const getChoicesQuerySchema = (t: TranslateFn) =>
  z.object({
    questionid: z.string().min(1, t("questionIdRequired")),
  });

// ---------------------------------------------------------------------------
// Choice (option inside a ChoiceQuestion)
// ---------------------------------------------------------------------------

/**
 * Base object — no refinements and no defaults, safe to call .partial() on.
 * Defaults are applied only in the create schema below.
 */
export const ChoiceValidationSchema = (t: TranslateFn) =>
  z.object({
    id: z.string().optional(),
    choiceText: z.string().min(1, t("choiceTextRequired")),
    isCorrect: z.boolean(),
  });

/** Full schema — same as base (no cross-field refinements needed). */
export const createChoiceSchema = (t: TranslateFn) => ChoiceValidationSchema(t);

/** Partial schema for PATCH — all fields optional, no refinements. */
export const patchChoiceSchema = (t: TranslateFn) =>
  ChoiceValidationSchema(t).partial();

export type ChoiceCreateInput = z.infer<ReturnType<typeof createChoiceSchema>>;
export type ChoicePatchInput = z.infer<ReturnType<typeof patchChoiceSchema>>;

// ---------------------------------------------------------------------------
// ChoiceSchema — Zod schema typed against the Prisma Choice model.
// Dates are coerced so the schema safely handles ISO strings from JSON as
// well as native Date objects returned directly from Prisma.
// ---------------------------------------------------------------------------

/**
 * Runtime schema for the Prisma `Choice` model.
 * Typed as `z.ZodType<Choice>` so TypeScript enforces that it matches the
 * Prisma model exactly. Use `ChoiceSchema.parse()` to validate API responses.
 */
export const ChoiceSchema: z.ZodType<Choice> = z.object({
  id: z.string(),
  questionId: z.string(),
  choiceText: z.string(),
  isCorrect: z.boolean(),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
});

export type ChoiceSchema = z.infer<typeof ChoiceSchema>;

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
