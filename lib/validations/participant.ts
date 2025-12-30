import { z } from "zod";

// Schema for creating a participant
export const participantSchema = z.object({
  testId: z.string().min(1, "Test ID is required"),
  userId: z.string().optional(), // Optional for guest users
  name: z
    .string()
    .min(1, "Name is required")
    .max(255, "Name must be less than 255 characters"),
});

export type ParticipantValidation = z.infer<typeof participantSchema>;

// Schema for joining a test (using join code instead of testId)
export const participantJoinSchema = z.object({
  joinCode: z.string().min(1, "Join code is required"),
  name: z
    .string()
    .min(1, "Name is required")
    .max(255, "Name must be less than 255 characters"),
});

export type ParticipantJoinValidation = z.infer<typeof participantJoinSchema>;
