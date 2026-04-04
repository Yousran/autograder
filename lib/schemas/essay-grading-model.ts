import { z } from "zod";
import { TranslateFn } from "./translate";
import type { EssayGradingModel } from "../generated/prisma/client";

/**
 * Base validation schema for essay grading models without refinements or defaults.
 * Safe to call .partial() on this schema.
 *
 * @param t - Translation function for error messages
 * @returns Zod schema for essay grading model validation
 */
export const EssayGradingModelValidationSchema = (t: TranslateFn) =>
  z.object({
    name: z
      .string()
      .min(1, t("Validation.nameRequired"))
      .min(2, t("Validation.nameTooShort")),
    baseUrl: z.url(t("Validation.invalidUrl")).min(1, t("Validation.required")),
    model: z.string(),
    apiKey: z.string().optional().nullable(),
    isDefault: z.boolean().default(false),
  });

/**
 * Default essay grading model data object for optimistic UI updates.
 * Use as a placeholder before receiving the real server response.
 *
 * @returns Default EssayGradingModel object with empty/initial values
 */
export const defaultEssayGradingModelData: EssayGradingModel = {
  id: "", // will be generated at creation time
  userId: "",
  name: "Untitled Model",
  baseUrl: "",
  model: "",
  apiKey: null,
  isDefault: false,
  createdAt: new Date(),
  updatedAt: new Date(),
};

/**
 * Creates a Zod schema for creating a new essay grading model.
 *
 * @param t - Translation function for error messages
 * @returns Zod schema for essay grading model creation validation
 */
export const createEssayGradingModelSchema = (t: TranslateFn) =>
  EssayGradingModelValidationSchema(t);

export type CreateEssayGradingModelInput = z.infer<
  ReturnType<typeof createEssayGradingModelSchema>
>;
/**
 * Runtime schema for the Prisma Choice model.
 * Typed as z.ZodType<Choice> to enforce TypeScript compatibility with Prisma.
 * Handles both ISO string dates from JSON and native Date objects.
 *
 * @returns Zod schema that validates Choice model objects
 */
export const EssayGradingModelSchema: z.ZodType<EssayGradingModel> = z.object({
  id: z.string(),
  userId: z.string(),
  name: z.string().min(1).min(2),
  baseUrl: z.url().min(1),
  model: z.string(),
  apiKey: z.string().nullable(),
  isDefault: z.boolean().default(false),
  createdAt: z.date(),
  updatedAt: z.date(),
});
export type EssayGradingModelSchema = z.infer<typeof EssayGradingModelSchema>;

/**
 * Creates a Zod schema for updating an essay grading model.
 * All fields are optional.
 *
 * @param t - Translation function for error messages
 * @returns Zod schema for essay grading model update validation
 */
export const updateEssayGradingModelSchema = (t: TranslateFn) =>
  EssayGradingModelValidationSchema(t).partial();

export type UpdateEssayGradingModelInput = z.infer<
  ReturnType<typeof updateEssayGradingModelSchema>
>;

/**
 * Schema for a single essay grading model response.
 * Includes all fields returned from the database.
 * Handles both ISO string dates from JSON and native Date objects.
 *
 * @returns Zod schema for essay grading model response
 */
export const essayGradingModelResponseSchema = z.object({
  id: z.string(),
  userId: z.string(),
  name: z.string(),
  baseUrl: z.string(),
  model: z.string(),
  apiKey: z.string().nullable(),
  isDefault: z.boolean(),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
});

export type EssayGradingModelResponse = z.infer<
  typeof essayGradingModelResponseSchema
>;

/**
 * Schema for a list of essay grading models response.
 *
 * @returns Zod schema for essay grading models list response
 */
export const essayGradingModelsListResponseSchema = z.object({
  models: z.array(essayGradingModelResponseSchema),
});

export type EssayGradingModelsListResponse = z.infer<
  typeof essayGradingModelsListResponseSchema
>;
