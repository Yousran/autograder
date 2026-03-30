import { z } from "zod";
import { TranslateFn } from "./translate";

// ---------------------------------------------------------------------------
// TestPrerequisite schema
// ---------------------------------------------------------------------------

/**
 * Creates a Zod schema for test prerequisite objects.
 * Validates prerequisiteTestId and minScoreRequired.
 *
 * @param t - Translation function for error messages
 * @returns Zod schema for prerequisite object validation
 */
export const createTestPrerequisiteObjectSchema = (t: TranslateFn) =>
  z.object({
    prerequisiteTestId: z.string().min(1, t("prerequisiteTestIdRequired")),
    minScoreRequired: z
      .number()
      .min(0, t("minScoreMin"))
      .max(100, t("minScoreMax")),
  });

/**
 * Creates a Zod schema for test prerequisite creation.
 * Extends the base object with default minScoreRequired of 0.
 *
 * @param t - Translation function for error messages
 * @returns Zod schema for creating test prerequisites
 */
export const createTestPrerequisiteSchema = (t: TranslateFn) =>
  createTestPrerequisiteObjectSchema(t).extend({
    minScoreRequired: z
      .number()
      .min(0, t("minScoreMin"))
      .max(100, t("minScoreMax"))
      .default(0),
  });

/**
 * Creates a partial Zod schema for updating test prerequisites.
 * All fields are optional for PATCH operations.
 *
 * @param t - Translation function for error messages
 * @returns Partial Zod schema for patching test prerequisites
 */
export const updateTestPrerequisiteSchema = (t: TranslateFn) =>
  createTestPrerequisiteObjectSchema(t).partial();

export type TestPrerequisiteInput = z.infer<
  ReturnType<typeof createTestPrerequisiteSchema>
>;
export type TestPrerequisiteUpdateInput = z.infer<
  ReturnType<typeof updateTestPrerequisiteSchema>
>;
