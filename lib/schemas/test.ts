import { z } from "zod";

/**
 * A translation function accepting a key within the "Validation" namespace.
 * Pass the `t` from `useTranslations("Validation")` or `getTranslations("Validation")`.
 */
type TranslateFn = (key: string) => string;

// ---------------------------------------------------------------------------
// Test schema
// ---------------------------------------------------------------------------

/**
 * Base object — no refinements and no defaults, safe to call .partial() on.
 * Defaults are applied only in the create schema below.
 */
export const createTestObjectSchema = (t: TranslateFn) =>
  z.object({
    title: z.string().min(1, t("titleRequired")).min(3, t("titleTooShort")),
    description: z.string().optional(),
    testDuration: z
      .number()
      .int(t("integer"))
      .positive(t("positive"))
      .nullable()
      .optional(),
    startTime: z.date().nullable().optional(),
    endTime: z.date().nullable().optional(),
    maxAttempts: z
      .number()
      .int(t("integer"))
      .positive(t("positive"))
      .nullable()
      .optional(),
    isAcceptingResponses: z.boolean(),
    isLoggedInUserOnly: z.boolean(),
    isShowDetailedScore: z.boolean(),
    isShowCorrectAnswers: z.boolean(),
    isQuestionsOrdered: z.boolean(),
  });

/** Full schema with cross-field refinement — used for creating a test. */
export const createTestSchema = (t: TranslateFn) =>
  createTestObjectSchema(t)
    .extend({
      isAcceptingResponses: z.boolean().default(true),
      isLoggedInUserOnly: z.boolean().default(false),
      isShowDetailedScore: z.boolean().default(true),
      isShowCorrectAnswers: z.boolean().default(false),
      isQuestionsOrdered: z.boolean().default(false),
    })
    .refine(
      (data) => {
        if (data.startTime && data.endTime) {
          return data.endTime > data.startTime;
        }
        return true;
      },
      {
        message: t("endTimeAfterStart"),
        path: ["endTime"],
      },
    );

/** Partial schema for PATCH — all fields optional, no refinements. */
export const updateTestSchema = (t: TranslateFn) =>
  createTestObjectSchema(t).partial();

export type TestInput = z.infer<ReturnType<typeof createTestSchema>>;
export type TestUpdateInput = z.infer<ReturnType<typeof updateTestSchema>>;
