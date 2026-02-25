import { z } from "zod";

/**
 * A translation function accepting a key within the "Validation" namespace.
 * Pass the `t` from `useTranslations("Validation")` or `getTranslations("Validation")`.
 */
type TranslateFn = (key: string) => string;

// ---------------------------------------------------------------------------
// Test schema
// ---------------------------------------------------------------------------

export const createTestSchema = (t: TranslateFn) =>
  z
    .object({
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

export type TestInput = z.infer<ReturnType<typeof createTestSchema>>;
