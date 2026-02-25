import { z } from "zod";

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
