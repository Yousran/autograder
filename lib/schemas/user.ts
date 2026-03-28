import { z } from "zod";

/**
 * A translation function accepting a key within the "Validation" namespace.
 * Pass the `t` from `useTranslations("Validation")` or `getTranslations("Validation")`.
 */
type TranslateFn = (key: string) => string;

// ---------------------------------------------------------------------------
// Sign-in schema
// ---------------------------------------------------------------------------

/**
 * Base object — no refinements, safe to call .partial() on.
 */
export const SignInValidationSchema = (t: TranslateFn) =>
  z.object({
    email: z.email({ error: t("invalidEmail") }).min(1, t("emailRequired")),
    password: z.string().min(1, t("passwordRequired")),
  });

/** Full schema — used for sign-in. */
export const createSignInSchema = (t: TranslateFn) => SignInValidationSchema(t);

export type SignInCreateInput = z.infer<ReturnType<typeof createSignInSchema>>;

// ---------------------------------------------------------------------------
// Sign-up schema
// ---------------------------------------------------------------------------

/**
 * Base object — no refinements, safe to call .partial() on.
 */
export const SignUpValidationSchema = (t: TranslateFn) =>
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
  SignUpValidationSchema(t).refine(
    (data) => data.password === data.confirmPassword,
    {
      error: t("passwordMismatch"),
      path: ["confirmPassword"],
    },
  );

export type SignUpCreateInput = z.infer<ReturnType<typeof createSignUpSchema>>;

// ---------------------------------------------------------------------------
// Update profile schema
// ---------------------------------------------------------------------------

/**
 * Base object — no refinements, safe to call .partial() on.
 */
export const UpdateProfileValidationSchema = (t: TranslateFn) =>
  z.object({
    name: z.string().min(1, t("nameRequired")).min(2, t("nameTooShort")),
    image: z
      .url(t("invalidUrl"))
      .optional()
      .or(z.literal("").transform(() => undefined)),
  });

/** Full schema — used for updating a user profile. */
export const createUpdateProfileSchema = (t: TranslateFn) =>
  UpdateProfileValidationSchema(t);

/** Partial schema for PATCH — all fields optional, no refinements. */
export const patchUpdateProfileSchema = (t: TranslateFn) =>
  UpdateProfileValidationSchema(t).partial();

export type UpdateProfileCreateInput = z.infer<
  ReturnType<typeof createUpdateProfileSchema>
>;
export type UpdateProfilePatchInput = z.infer<
  ReturnType<typeof patchUpdateProfileSchema>
>;
