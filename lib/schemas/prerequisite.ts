import { z } from "zod";

/**
 * A translation function accepting a key within the "Validation" namespace.
 * Pass the `t` from `useTranslations("Validation")` or `getTranslations("Validation")`.
 */
type TranslateFn = (key: string) => string;

// ---------------------------------------------------------------------------
// TestPrerequisite schema
// ---------------------------------------------------------------------------

export const createTestPrerequisiteSchema = (t: TranslateFn) =>
  z.object({
    prerequisiteTestId: z.string().min(1, t("prerequisiteTestIdRequired")),
    minScoreRequired: z
      .number()
      .min(0, t("minScoreMin"))
      .max(100, t("minScoreMax"))
      .default(0),
  });

export type TestPrerequisiteInput = z.infer<
  ReturnType<typeof createTestPrerequisiteSchema>
>;
