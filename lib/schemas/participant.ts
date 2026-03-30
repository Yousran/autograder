import { z } from "zod";
import { TranslateFn } from "./translate";

// ---------------------------------------------------------------------------
// Participant summary — returned by GET /api/participants
// ---------------------------------------------------------------------------

/**
 * Schema for a participant summary in list responses.
 * Contains the participant's ID, name, score, and completion status.
 *
 * @returns Zod schema for participant summary objects
 */
export const participantSummarySchema = z.object({
  id: z.string(),
  name: z.string(),
  score: z.number(),
  isCompleted: z.boolean(),
});

export type ParticipantSummary = z.infer<typeof participantSummarySchema>;

/**
 * Schema for the GET /api/participants response.
 * Contains all participant summaries and the maximum possible score.
 *
 * @returns Zod schema for the participants list response
 */
export const getParticipantsResponseSchema = z.object({
  participants: z.array(participantSummarySchema),
  maxScore: z.number(),
});

export type GetParticipantsResponse = z.infer<
  typeof getParticipantsResponseSchema
>;

/**
 * Schema for validating query parameters when retrieving participants.
 * Validates that the testId is provided.
 *
 * @returns Zod schema for participants query parameter validation
 */
export const getParticipantsQuerySchema = z.object({
  testid: z.string().min(1),
});

// ---------------------------------------------------------------------------
// Join test schema
// Used when a user (guest or logged-in) joins a test via a join code.
// ---------------------------------------------------------------------------

/**
 * Creates a Zod schema for joining a test.
 * Validates participant name and 6-character join code.
 *
 * @param t - Translation function for error messages
 * @returns Zod schema for test join validation
 */
export const createJoinTestSchema = (t: TranslateFn) =>
  z.object({
    /** The participant's display name shown to the test creator. */
    name: z
      .string()
      .min(1, t("participantNameRequired"))
      .min(2, t("nameTooShort")),
    /** 6-character join code printed on / linked from the test. */
    joinCode: z
      .string()
      .min(1, t("joinCodeRequired"))
      .length(6, t("joinCodeLength")),
  });

export type JoinTestInput = z.infer<ReturnType<typeof createJoinTestSchema>>;

/**
 * Creates a partial Zod schema for updating test join data.
 * All fields are optional for PATCH operations.
 *
 * @param t - Translation function for error messages
 * @returns Partial Zod schema for patching test join data
 */
export const updateJoinTestSchema = (t: TranslateFn) =>
  createJoinTestSchema(t).partial();

export type JoinTestUpdateInput = z.infer<
  ReturnType<typeof updateJoinTestSchema>
>;

// ---------------------------------------------------------------------------
// Guest join schema
// Like JoinTestSchema but explicitly for unauthenticated participants.
// ---------------------------------------------------------------------------

/**
 * Creates a Zod schema for guest participants joining a test.
 * Validates guest name and 6-character join code.
 *
 * @param t - Translation function for error messages
 * @returns Zod schema for guest join validation
 */
export const createGuestJoinSchema = (t: TranslateFn) =>
  z.object({
    name: z
      .string()
      .min(1, t("participantNameRequired"))
      .min(2, t("nameTooShort")),
    joinCode: z
      .string()
      .min(1, t("joinCodeRequired"))
      .length(6, t("joinCodeLength")),
  });

export type GuestJoinInput = z.infer<ReturnType<typeof createGuestJoinSchema>>;

/**
 * Creates a partial Zod schema for updating guest join data.
 * All fields are optional for PATCH operations.
 *
 * @param t - Translation function for error messages
 * @returns Partial Zod schema for patching guest join data
 */
export const updateGuestJoinSchema = (t: TranslateFn) =>
  createGuestJoinSchema(t).partial();

export type GuestJoinUpdateInput = z.infer<
  ReturnType<typeof updateGuestJoinSchema>
>;
