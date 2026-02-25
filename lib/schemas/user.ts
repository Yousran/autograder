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
    email: z.string().min(1, t("emailRequired")).email(t("invalidEmail")),
    password: z.string().min(1, t("passwordRequired")),
  });

export type SignInInput = z.infer<ReturnType<typeof createSignInSchema>>;

// ---------------------------------------------------------------------------
// Sign-up schema
// ---------------------------------------------------------------------------

export const createSignUpSchema = (t: TranslateFn) =>
  z
    .object({
      name: z.string().min(1, t("nameRequired")).min(2, t("nameTooShort")),
      email: z.string().min(1, t("emailRequired")).email(t("invalidEmail")),
      password: z
        .string()
        .min(1, t("passwordRequired"))
        .min(8, t("passwordTooShort")),
      confirmPassword: z.string().min(1, t("confirmPasswordRequired")),
    })
    .refine((data) => data.password === data.confirmPassword, {
      message: t("passwordMismatch"),
      path: ["confirmPassword"],
    });

export type SignUpInput = z.infer<ReturnType<typeof createSignUpSchema>>;

// ---------------------------------------------------------------------------
// Update profile schema
// ---------------------------------------------------------------------------

export const createUpdateProfileSchema = (t: TranslateFn) =>
  z.object({
    name: z.string().min(1, t("nameRequired")).min(2, t("nameTooShort")),
    image: z
      .string()
      .url(t("invalidUrl"))
      .optional()
      .or(z.literal("").transform(() => undefined)),
  });

export type UpdateProfileInput = z.infer<
  ReturnType<typeof createUpdateProfileSchema>
>;
