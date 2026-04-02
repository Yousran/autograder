import { z } from "zod";
import { TranslateFn } from "./translate";
import type { MultipleSelectChoice } from "../generated/prisma/client";

// ---------------------------------------------------------------------------
// Multiple-select choice (option inside a MultipleSelectQuestion)
// ---------------------------------------------------------------------------

/**
 * Base validation schema for multiple-select choices without defaults or refinements.
 * Safe to call .partial() on this schema.
 *
 * @param t - Translation function for error messages
 * @returns Zod schema for multiple-select choice validation
 */
export const MultipleSelectChoiceValidationSchema = (t: TranslateFn) =>
  z.object({
    id: z.string().optional(),
    choiceText: z.string().min(1, t("Validation.choiceTextRequired")),
    isCorrect: z.boolean(),
  });

/**
 * Creates a Zod schema for multiple-select choices.
 * Same as the base schema with no cross-field refinements.
 *
 * @param t - Translation function for error messages
 * @returns Zod schema for creating multiple-select choice objects
 */
export const createMultipleSelectChoiceSchema = (t: TranslateFn) =>
  MultipleSelectChoiceValidationSchema(t);

/**
 * Partial schema for PATCH operations on multiple-select choices.
 * All fields are optional for partial updates.
 *
 * @param t - Translation function for error messages
 * @returns Partial Zod schema for patching multiple-select choices
 */
export const patchMultipleSelectChoiceSchema = (t: TranslateFn) =>
  MultipleSelectChoiceValidationSchema(t).partial();

export type MultipleSelectChoiceCreateInput = z.infer<
  ReturnType<typeof createMultipleSelectChoiceSchema>
>;
export type MultipleSelectChoicePatchInput = z.infer<
  ReturnType<typeof patchMultipleSelectChoiceSchema>
>;

// ---------------------------------------------------------------------------
// MultipleSelectChoiceSchema - Zod schema typed against the Prisma MultipleSelectChoice model.
// Dates are coerced so the schema safely handles ISO strings from JSON as
// well as native Date objects returned directly from Prisma.
// ---------------------------------------------------------------------------

/**
 * Runtime schema for the Prisma MultipleSelectChoice model.
 * Typed as z.ZodType<MultipleSelectChoice> to enforce TypeScript compatibility with Prisma.
 * Handles both ISO string dates from JSON and native Date objects.
 *
 * @returns Zod schema that validates MultipleSelectChoice model objects
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

/**
 * Default MultipleSelectChoice data object for optimistic UI updates.
 * Use as a placeholder before receiving the real server response.
 *
 * @returns Default MultipleSelectChoice object with empty/initial values
 */
export const defaultMultipleSelectChoiceData: MultipleSelectChoice = {
  id: "", // will be generated at creation time
  questionId: "",
  choiceText: "",
  isCorrect: false,
  createdAt: new Date(),
  updatedAt: new Date(),
};
