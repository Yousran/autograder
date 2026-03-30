import { z } from "zod";
import { TranslateFn } from "./translate";

// ---------------------------------------------------------------------------
// TestPrerequisite schema
// ---------------------------------------------------------------------------

/**
 * Base object — no defaults, safe to call .partial() on.
 */
export const createTestPrerequisiteObjectSchema = (t: TranslateFn) =>
  z.object({
    prerequisiteTestId: z.string().min(1, t("prerequisiteTestIdRequired")),
    minScoreRequired: z
      .number()
      .min(0, t("minScoreMin"))
      .max(100, t("minScoreMax")),
  });

/** Full schema with defaults — used for creating a prerequisite. */
export const createTestPrerequisiteSchema = (t: TranslateFn) =>
  createTestPrerequisiteObjectSchema(t).extend({
    minScoreRequired: z
      .number()
      .min(0, t("minScoreMin"))
      .max(100, t("minScoreMax"))
      .default(0),
  });

/** Partial schema for PATCH — all fields optional, no defaults. */
export const updateTestPrerequisiteSchema = (t: TranslateFn) =>
  createTestPrerequisiteObjectSchema(t).partial();

export type TestPrerequisiteInput = z.infer<
  ReturnType<typeof createTestPrerequisiteSchema>
>;
export type TestPrerequisiteUpdateInput = z.infer<
  ReturnType<typeof updateTestPrerequisiteSchema>
>;
