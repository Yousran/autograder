import { z } from "zod";
import { TranslateFn } from "./translate";

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

/**
 * Creates a Zod schema for user sign-in.
 * Validates email and password credentials.
 *
 * @param t - Translation function for error messages
 * @returns Zod schema for validating sign-in credentials
 */
export const createSignInSchema = (t: TranslateFn) => SignInValidationSchema(t);

export type SignInCreateInput = z.infer<ReturnType<typeof createSignInSchema>>;

// ---------------------------------------------------------------------------
// Sign-up schema
// ---------------------------------------------------------------------------

/**
 * Base validation schema for sign-up without refinements.
 * Safe to call .partial() on this schema.
 *
 * @param t - Translation function for error messages
 * @returns Zod schema for sign-up validation
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

/**
 * Creates a Zod schema for user sign-up.
 * Validates name, email, password, and password confirmation with cross-field refinement.
 *
 * @param t - Translation function for error messages
 * @returns Zod schema for validating sign-up data
 */
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
 * Base validation schema for profile updates without refinements.
 * Safe to call .partial() on this schema.
 *
 * @param t - Translation function for error messages
 * @returns Zod schema for profile update validation
 */
export const UpdateProfileValidationSchema = (t: TranslateFn) =>
  z.object({
    name: z.string().min(1, t("nameRequired")).min(2, t("nameTooShort")),
    image: z
      .url(t("invalidUrl"))
      .optional()
      .or(z.literal("").transform(() => undefined)),
  });

/**
 * Creates a Zod schema for user profile updates.
 * Same as the base schema with no cross-field refinements.
 *
 * @param t - Translation function for error messages
 * @returns Zod schema for validating profile updates
 */
export const createUpdateProfileSchema = (t: TranslateFn) =>
  UpdateProfileValidationSchema(t);

/**
 * Creates a partial Zod schema for patching user profiles.
 * All fields are optional for PATCH operations.
 *
 * @param t - Translation function for error messages
 * @returns Partial Zod schema for patching profiles
 */
export const patchUpdateProfileSchema = (t: TranslateFn) =>
  UpdateProfileValidationSchema(t).partial();

export type UpdateProfileCreateInput = z.infer<
  ReturnType<typeof createUpdateProfileSchema>
>;
export type UpdateProfilePatchInput = z.infer<
  ReturnType<typeof patchUpdateProfileSchema>
>;
