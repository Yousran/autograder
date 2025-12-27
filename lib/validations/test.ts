import { z } from "zod";

// Schema for creating/updating a test
export const testSchema = z
  .object({
    title: z
      .string()
      .min(1, "Title is required")
      .max(255, "Title must be less than 255 characters"),
    description: z.string().optional(),
    testDuration: z.coerce
      .number()
      .int()
      .positive("Test duration must be positive")
      .optional(),
    maxAttempts: z.coerce
      .number()
      .int()
      .positive("Max attempts must be positive")
      .optional(),
    startTime: z.coerce.date().optional(),
    endTime: z.coerce.date().optional(),
    isAcceptingResponses: z.boolean().optional(),
    loggedInUserOnly: z.boolean().optional(),
    showDetailedScore: z.boolean().optional(),
    showCorrectAnswers: z.boolean().optional(),
    isQuestionsOrdered: z.boolean().optional(),
  })
  .refine(
    (data) => {
      // Validate that endTime is after startTime if both are provided
      if (data.startTime && data.endTime) {
        return data.endTime > data.startTime;
      }
      return true;
    },
    {
      message: "End time must be after start time",
      path: ["endTime"],
    }
  );
export type TestValidation = z.infer<typeof testSchema>;
