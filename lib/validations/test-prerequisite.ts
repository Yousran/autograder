import { z } from "zod";

// Schema for test prerequisites
export const testPrerequisiteSchema = z.object({
  prerequisiteTestId: z.string().min(1, "Prerequisite test ID is required"),
  minScoreRequired: z.coerce
    .number()
    .min(0, "Minimum score cannot be negative")
    .max(100, "Minimum score cannot exceed 100")
    .default(0),
});

export type TestPrerequisiteValidation = z.infer<typeof testPrerequisiteSchema>;
