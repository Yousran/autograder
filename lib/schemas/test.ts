import { z } from "zod";
import { TranslateFn } from "./translate";
import { type Test } from "@/lib/generated/prisma/client";

/**
 * Base validation schema for tests without refinements or defaults.
 * Safe to call .partial() on this schema.
 *
 * @param t - Translation function for error messages
 * @returns Zod schema for test validation
 */
export const TestValidationSchema = (t: TranslateFn) =>
  z.object({
    title: z
      .string()
      .min(1, t("Validation.titleRequired"))
      .min(3, t("Validation.titleTooShort")),
    description: z.string().optional(),
    testDuration: z
      .number()
      .int(t("Validation.integer"))
      .positive(t("Validation.positive"))
      .nullable()
      .optional(),
    startTime: z.date().nullable().optional(),
    endTime: z.date().nullable().optional(),
    maxAttempts: z
      .number()
      .int(t("Validation.integer"))
      .positive(t("Validation.positive"))
      .nullable()
      .optional(),
    essayGradingModelId: z.string().nullable().optional(),
    isAcceptingResponses: z.boolean(),
    isLoggedInUserOnly: z.boolean(),
    isShowDetailedScore: z.boolean(),
    isShowCorrectAnswers: z.boolean(),
    isQuestionsOrdered: z.boolean(),
  });

/**
 * Default test data object for optimistic UI updates.
 * Use as a placeholder before receiving the real server response.
 *
 * @returns Default Test object with empty/initial values
 */
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
  essayGradingModelId: null,
  isAcceptingResponses: true,
  isLoggedInUserOnly: false,
  isShowDetailedScore: true,
  isShowCorrectAnswers: false,
  isQuestionsOrdered: false,
  createdAt: new Date(),
  updatedAt: new Date(),
};

/**
 * Creates a Zod schema for test creation with validation.
 * Extends base schema with defaults and cross-field refinement (endTime > startTime).
 *
 * @param t - Translation function for error messages
 * @returns Zod schema for creating tests with full validation
 */
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
        message: t("Validation.endTimeAfterStart"),
        path: ["endTime"],
      },
    );

/**
 * Creates a partial Zod schema for updating tests.
 * All fields are optional for PATCH operations.
 *
 * @param t - Translation function for error messages
 * @returns Partial Zod schema for patching tests
 */
export const patchTestSchema = (t: TranslateFn) =>
  TestValidationSchema(t).partial();

export type TestCreateInput = z.infer<ReturnType<typeof createTestSchema>>;
export type TestPatchInput = z.infer<ReturnType<typeof patchTestSchema>>;

/**
 * Runtime schema for the Prisma Test model.
 * Typed as z.ZodType<Test> to enforce TypeScript compatibility with Prisma.
 *
 * @returns Zod schema that validates Test model objects
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
  essayGradingModelId: z.string().nullable(),
  isAcceptingResponses: z.boolean(),
  isLoggedInUserOnly: z.boolean(),
  isShowDetailedScore: z.boolean(),
  isShowCorrectAnswers: z.boolean(),
  isQuestionsOrdered: z.boolean(),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
});

export type TestSchema = z.infer<typeof TestSchema>;

export interface JoinStatusResponse {
  isAcceptingResponses: boolean;
  participantCount: number;
}

export interface TestInfo {
  id: string;
  title: string;
  description: string | null;
  testDuration: number | null;
  questionCount: number;
  participantCount: number;
  isAcceptingResponses: boolean;
  isLoggedInUserOnly: boolean;
  joinCode: string;
  prerequisiteError?: string | null;
}
