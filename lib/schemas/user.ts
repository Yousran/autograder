import { z } from "zod";

/**
 * A translation function accepting a key within the "Validation" namespace.
 * Pass the `t` from `useTranslations("Validation")` or `getTranslations("Validation")`.
 */
type TranslateFn = (key: string) => string;

// ---------------------------------------------------------------------------
// Sign-in schema
// ---------------------------------------------------------------------------

export const createSignInSchema = (t: TranslateFn) =>
  z.object({
    email: z.email({ error: t("invalidEmail") }).min(1, t("emailRequired")),
    password: z.string().min(1, t("passwordRequired")),
  });

export type SignInInput = z.infer<ReturnType<typeof createSignInSchema>>;

// ---------------------------------------------------------------------------
// Sign-up schema
// ---------------------------------------------------------------------------

/**
 * Base object — no refinements, safe to call .partial() on.
 */
export const createSignUpObjectSchema = (t: TranslateFn) =>
  z.object({
    name: z.string().min(1, t("nameRequired")).min(2, t("nameTooShort")),
    email: z.email({ error: t("invalidEmail") }).min(1, t("emailRequired")),
    password: z
      .string()
      .min(1, t("passwordRequired"))
      .min(8, t("passwordTooShort")),
    confirmPassword: z.string().min(1, t("confirmPasswordRequired")),
  });

/** Full schema with cross-field refinement — used for sign-up. */
export const createSignUpSchema = (t: TranslateFn) =>
  createSignUpObjectSchema(t).refine(
    (data) => data.password === data.confirmPassword,
    {
      error: t("passwordMismatch"),
      path: ["confirmPassword"],
    },
  );

export type SignUpInput = z.infer<ReturnType<typeof createSignUpSchema>>;

// ---------------------------------------------------------------------------
// Update profile schema
// ---------------------------------------------------------------------------

/**
 * Base object — no refinements, safe to call .partial() on.
 */
export const createUpdateProfileObjectSchema = (t: TranslateFn) =>
  z.object({
    name: z.string().min(1, t("nameRequired")).min(2, t("nameTooShort")),
    image: z
      .url(t("invalidUrl"))
      .optional()
      .or(z.literal("").transform(() => undefined)),
  });

/** Full schema — used for updating a user profile. */
export const createUpdateProfileSchema = createUpdateProfileObjectSchema;

/** Partial schema for PATCH — all fields optional, no refinements. */
export const updateProfileSchema = (t: TranslateFn) =>
  createUpdateProfileObjectSchema(t).partial();

export type UpdateProfileInput = z.infer<
  ReturnType<typeof createUpdateProfileSchema>
>;
export type UpdateProfilePatchInput = z.infer<
  ReturnType<typeof updateProfileSchema>
>;
