import { z } from "zod";
import { TranslateFn } from "./translate";
import type { Choice } from "../generated/prisma/client";

// ---------------------------------------------------------------------------
// Query schemas
// ---------------------------------------------------------------------------

/**
 * Schema for validating query parameters when fetching choices.
 * Validates that the questionId parameter is provided.
 *
 * @param t - Translation function for error messages
 * @returns Zod schema for query parameter validation
 */
export const getChoicesQuerySchema = (t: TranslateFn) =>
  z.object({
    questionid: z.string().min(1, t("questionIdRequired")),
  });

// ---------------------------------------------------------------------------
// Choice (option inside a ChoiceQuestion)
// ---------------------------------------------------------------------------

/**
 * Base validation schema for choices without defaults or refinements.
 * Safe to call .partial() on this schema.
 *
 * @param t - Translation function for error messages
 * @returns Zod schema for choice validation
 */
export const ChoiceValidationSchema = (t: TranslateFn) =>
  z.object({
    id: z.string().optional(),
    choiceText: z.string().min(1, t("choiceTextRequired")),
    isCorrect: z.boolean(),
  });

/**
 * Creates a Zod schema for choices.
 * Same as the base schema with no cross-field refinements.
 *
 * @param t - Translation function for error messages
 * @returns Zod schema for creating choice objects
 */
export const createChoiceSchema = (t: TranslateFn) => ChoiceValidationSchema(t);

/**
 * Creates a partial Zod schema for patching choices.
 * All fields are optional for partial updates.
 *
 * @param t - Translation function for error messages
 * @returns Partial Zod schema for patching choice objects
 */
export const patchChoiceSchema = (t: TranslateFn) =>
  ChoiceValidationSchema(t).partial();

export type ChoiceCreateInput = z.infer<ReturnType<typeof createChoiceSchema>>;
export type ChoicePatchInput = z.infer<ReturnType<typeof patchChoiceSchema>>;

// ---------------------------------------------------------------------------
// ChoiceSchema - Zod schema typed against the Prisma Choice model.
// Dates are coerced so the schema safely handles ISO strings from JSON as
// well as native Date objects returned directly from Prisma.
// ---------------------------------------------------------------------------

/**
 * Runtime schema for the Prisma Choice model.
 * Typed as z.ZodType<Choice> to enforce TypeScript compatibility with Prisma.
 * Handles both ISO string dates from JSON and native Date objects.
 *
 * @returns Zod schema that validates Choice model objects
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

/**
 * Default Choice data object for optimistic UI updates.
 * Use as a placeholder before receiving the real server response.
 *
 * @returns Default Choice object with empty/initial values
 */
export const defaultChoiceData: Choice = {
  id: "", // will be generated at creation time
  questionId: "",
  choiceText: "",
  isCorrect: false,
  createdAt: new Date(),
  updatedAt: new Date(),
};
