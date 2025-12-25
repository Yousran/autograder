import { z } from "zod";

// Schema for creating a participant (server-side)
export const createParticipantSchema = z.object({
  testId: z.string().min(1, "Test ID is required"),
  username: z.string().min(3, "Username is required").optional(),
});

// Schema for participant form (client-side)
export const participantFormSchema = z.object({
  username: z.string().min(3, "Username is required"),
});

export type ParticipantFormValues = z.infer<typeof participantFormSchema>;

// Schema for validating participant id (server-side)
export const participantIdSchema = z
  .string()
  .min(1, "Participant ID is required");

// Schema for validating test id (server-side)
export const participantTestIdSchema = z.string().min(1, "Test ID is required");
