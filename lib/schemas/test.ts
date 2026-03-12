import { z } from "zod";
import { type Test } from "@/lib/generated/prisma/client";

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
export const TestValidationSchema = (t: TranslateFn) =>
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

/** Default Test Data — use as a placeholder before the real server response in optimistic. */
export const defaultTestData: Test = {
  id: "", // will be generated at creation time
  creatorId: "",
  title: "Untitled Test",
  description: null,
  joinCode: null,
  joinCodeExpiresAt: null,
  testDuration: 60,
  startTime: null,
  endTime: null,
  maxAttempts: 1,
  isAcceptingResponses: true,
  isLoggedInUserOnly: false,
  isShowDetailedScore: true,
  isShowCorrectAnswers: false,
  isQuestionsOrdered: false,
  createdAt: new Date(),
  updatedAt: new Date(),
};

/** Full schema with cross-field refinement — used for creating a test. */
export const createTestSchema = (t: TranslateFn) =>
  TestValidationSchema(t)
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
export const patchTestSchema = (t: TranslateFn) =>
  TestValidationSchema(t).partial();

export type TestCreateInput = z.infer<ReturnType<typeof createTestSchema>>;
export type TestPatchInput = z.infer<ReturnType<typeof patchTestSchema>>;

// ---------------------------------------------------------------------------
// TestSchema — Zod schema typed against the Prisma Test model.
// Dates are coerced so the schema safely handles ISO strings from JSON as
// well as native Date objects returned directly from Prisma.
// ---------------------------------------------------------------------------

/**
 * Runtime schema for the Prisma `Test` model.
 * Typed as `z.ZodType<Test>` so TypeScript enforces that it matches the
 * Prisma model exactly. Use `TestSchema.parse()` to validate API responses.
 */
export const TestSchema: z.ZodType<Test> = z.object({
  id: z.string(),
  creatorId: z.string(),
  title: z.string(),
  description: z.string().nullable(),
  joinCode: z.string().nullable(),
  joinCodeExpiresAt: z.coerce.date().nullable(),
  testDuration: z.number().int().nullable(),
  startTime: z.coerce.date().nullable(),
  endTime: z.coerce.date().nullable(),
  maxAttempts: z.number().int().nullable(),
  isAcceptingResponses: z.boolean(),
  isLoggedInUserOnly: z.boolean(),
  isShowDetailedScore: z.boolean(),
  isShowCorrectAnswers: z.boolean(),
  isQuestionsOrdered: z.boolean(),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
});

export type TestSchema = z.infer<typeof TestSchema>;
