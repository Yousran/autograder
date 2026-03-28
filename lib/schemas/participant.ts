import { z } from "zod";

// ---------------------------------------------------------------------------
// Participant summary — returned by GET /api/participants
// ---------------------------------------------------------------------------

export const participantSummarySchema = z.object({
  id: z.string(),
  name: z.string(),
  score: z.number(),
  isCompleted: z.boolean(),
});

export type ParticipantSummary = z.infer<typeof participantSummarySchema>;

export const getParticipantsResponseSchema = z.object({
  participants: z.array(participantSummarySchema),
  maxScore: z.number(),
});

export type GetParticipantsResponse = z.infer<
  typeof getParticipantsResponseSchema
>;

export const getParticipantsQuerySchema = z.object({
  testid: z.string().min(1),
});

/**
 * A translation function accepting a key within the "Validation" namespace.
 * Pass the `t` from `useTranslations("Validation")` or `getTranslations("Validation")`.
 */
type TranslateFn = (key: string) => string;

// ---------------------------------------------------------------------------
// Join test schema
// Used when a user (guest or logged-in) joins a test via a join code.
// ---------------------------------------------------------------------------

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

/** Partial schema for PATCH — all fields optional. */
export const updateJoinTestSchema = (t: TranslateFn) =>
  createJoinTestSchema(t).partial();

export type JoinTestUpdateInput = z.infer<
  ReturnType<typeof updateJoinTestSchema>
>;

// ---------------------------------------------------------------------------
// Guest join schema
// Like JoinTestSchema but explicitly for unauthenticated participants.
// ---------------------------------------------------------------------------

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

/** Partial schema for PATCH — all fields optional. */
export const updateGuestJoinSchema = (t: TranslateFn) =>
  createGuestJoinSchema(t).partial();

export type GuestJoinUpdateInput = z.infer<
  ReturnType<typeof updateGuestJoinSchema>
>;
