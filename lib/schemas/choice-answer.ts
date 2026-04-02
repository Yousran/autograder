import { z } from "zod";
import { TranslateFn } from "./translate";
import type { ChoiceAnswer } from "../generated/prisma/client";

// ---------------------------------------------------------------------------
// Choice answer
// ---------------------------------------------------------------------------

/**
 * Base validation schema for choice answers without refinements.
 * Safe to call .partial() on this schema.
 *
 * @param t - Translation function for error messages
 * @returns Zod schema for choice answer validation
 */
export const ChoiceAnswerValidationSchema = (t: TranslateFn) =>
  z.object({
    participantId: z.string().min(1, t("Validation.participantIdRequired")),
    questionId: z.string().min(1, t("Validation.questionIdRequired")),
    /** null means the participant skipped the question. */
    selectedChoiceId: z.string().nullable().optional(),
  });

/**
 * Creates a Zod schema for choice answers.
 * Same as the base schema with no cross-field refinements.
 *
 * @param t - Translation function for error messages
 * @returns Zod schema for creating choice answer objects
 */
export const createChoiceAnswerSchema = (t: TranslateFn) =>
  ChoiceAnswerValidationSchema(t);

/**
 * Partial schema for PATCH operations on choice answers.
 * All fields are optional for partial updates.
 *
 * @param t - Translation function for error messages
 * @returns Partial Zod schema for patching choice answers
 */
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

/**
 * Default ChoiceAnswer data object for optimistic UI updates.
 * Use as a placeholder before receiving the real server response.
 *
 * @returns Default ChoiceAnswer object with empty/initial values
 */
export const defaultChoiceAnswerData: ChoiceAnswer = {
  id: "",
  questionId: "",
  participantId: "",
  selectedChoiceId: null,
  score: 0,
  createdAt: new Date(),
  updatedAt: new Date(),
};
