import { z } from "zod";
import type { Question } from "../generated/prisma/client";
import { QuestionType } from "../generated/prisma/enums";

export * from "./essay-question";
export * from "./choice-question";
export * from "./multiple-choice-question";

import {
  EssayQuestionValidationSchema,
  patchEssayQuestionSchema,
  essayQuestionDetailSchema,
} from "./essay-question";
import {
  ChoiceQuestionValidationSchema,
  patchChoiceQuestionSchema,
  defaultChoiceQuestionData,
  defaultChoiceData,
  choiceQuestionDetailSchema,
} from "./choice-question";
import {
  MultipleSelectQuestionValidationSchema,
  patchMultipleSelectQuestionSchema,
  multipleSelectQuestionDetailSchema,
} from "./multiple-choice-question";

import type {
  EssayAnswerView,
  ChoiceAnswerView,
  MultipleSelectAnswerView,
} from "./answer";

/**
 * A translation function accepting a key within the "Validation" namespace.
 * Pass the `t` from `useTranslations("Validation")` or `getTranslations("Validation")`.
 */
type TranslateFn = (key: string) => string;

/** Full discriminated union — used for validating any question type on create. */
export const createQuestionSchema = (t: TranslateFn) =>
  z.discriminatedUnion("type", [
    EssayQuestionValidationSchema(t),
    ChoiceQuestionValidationSchema(t),
    MultipleSelectQuestionValidationSchema(t),
  ]);

/** Partial discriminated union for PATCH. */
export const patchQuestionSchema = (t: TranslateFn) =>
  z.union([
    z.discriminatedUnion("type", [
      patchEssayQuestionSchema(t),
      patchChoiceQuestionSchema(t),
      patchMultipleSelectQuestionSchema(t),
    ]),
    z
      .object({
        beforeId: z.string().nullable(),
        afterId: z.string().nullable(),
      })
      .strict(),
  ]);

export type QuestionCreateInput = z.infer<
  ReturnType<typeof createQuestionSchema>
>;
export type QuestionPatchInput = z.infer<
  ReturnType<typeof patchQuestionSchema>
>;

// ---------------------------------------------------------------------------
// Create question request (API body — only testId; type is resolved server-side)
// ---------------------------------------------------------------------------

export const createQuestionRequestSchema = (t: TranslateFn) =>
  z.object({
    testId: z.cuid(t("testIdRequired")),
    // Optional: ID of question to insert after. null = insert at start, omitted = append at end.
    insertAfterId: z.cuid(t("questionIdRequired")).nullable().optional(),
  });

export type QuestionRequestCreateInput = z.infer<
  ReturnType<typeof createQuestionRequestSchema>
>;

// ---------------------------------------------------------------------------
// Question ordering (used when reordering questions inside a test)
// ---------------------------------------------------------------------------

export const createQuestionOrderSchema = () =>
  z.object({
    id: z.cuid(),
    order: z.string().min(1),
  });

export type QuestionOrderCreateInput = z.infer<
  ReturnType<typeof createQuestionOrderSchema>
>;

// ---------------------------------------------------------------------------
// Shared UI type for displaying a question in a list
// ---------------------------------------------------------------------------

/**
 * Runtime schema for the Prisma `Question` model.
 * Typed as `z.ZodType<Question>` so TypeScript enforces that it matches the
 * Prisma model exactly. Use `QuestionSchema.parse()` to validate API responses.
 */
const questionSchemaObject = z.object({
  id: z.string(),
  testId: z.string(),
  type: z.enum(QuestionType),
  order: z.string(),
  questionText: z.string(),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
});

export const QuestionSchema: z.ZodType<Question> = questionSchemaObject;

/** Minimal question shape used by the questions list UI (e.g. QuestionCard). */
export type QuestionSchema = z.infer<typeof QuestionSchema>;

// ---------------------------------------------------------------------------
// Question with related details (for full API responses)
// ---------------------------------------------------------------------------

/**
 * Extended question schema that includes optional related data (essay, choice, multipleSelect).
 * This is used for API responses that include question type-specific details.
 */
export const QuestionWithDetailsSchema = questionSchemaObject.extend({
  essay: essayQuestionDetailSchema.optional(),
  choice: choiceQuestionDetailSchema.optional(),
  multipleSelect: multipleSelectQuestionDetailSchema.optional(),
});

/** Question with optional related details (essay, choice, or multipleSelect data). */
export type QuestionWithDetails = z.infer<typeof QuestionWithDetailsSchema>;

// ---------------------------------------------------------------------------
// Shared default field values — single source of truth for optimistic UI +
// API route creation. The API always creates CHOICE type by default.
// ---------------------------------------------------------------------------

/**
 * Default field values for a newly created question.
 * Both the API route and the UI optimistic update should derive from this
 * so they stay in sync.
 */
export const defaultQuestionData = {
  id: "", // will be generated at creation time
  type: QuestionType.CHOICE,
  questionText: "",
  isChoiceRandomized: defaultChoiceQuestionData.isChoiceRandomized,
  maxScore: defaultChoiceQuestionData.maxScore,
  /** Two starter choices matching what the API seeds on creation. */
  defaultChoices: [
    { choiceText: defaultChoiceData.choiceText, isCorrect: true },
    { choiceText: defaultChoiceData.choiceText, isCorrect: false },
  ],
} as const;

// ---------------------------------------------------------------------------
// Question type display labels (i18n)
// ---------------------------------------------------------------------------

/** All available question types for iteration and display. */
export const QUESTION_TYPES = [
  QuestionType.ESSAY,
  QuestionType.CHOICE,
  QuestionType.MULTIPLE_SELECT,
] as const;

/**
 * Returns the i18n display label for a question type.
 * Pass `t` from `useTranslations("Components.questionsTab")`.
 */
export function getQuestionTypeLabel(
  type: QuestionType,
  t: TranslateFn,
): string {
  const map: Record<QuestionType, string> = {
    [QuestionType.ESSAY]: t("questionType.essay"),
    [QuestionType.CHOICE]: t("questionType.choice"),
    [QuestionType.MULTIPLE_SELECT]: t("questionType.multipleSelect"),
  };
  return map[type];
}

// ---------------------------------------------------------------------------
// GET /api/questions query params
// ---------------------------------------------------------------------------

export const getQuestionsQuerySchema = z.object({
  testid: z.cuid(),
});

export type GetQuestionsQueryInput = z.infer<typeof getQuestionsQuerySchema>;

// ---------------------------------------------------------------------------
// Component props for QuestionDetailCard
// Combines question and answer view data for displaying a question with its answer
// ---------------------------------------------------------------------------

export interface QuestionDetailCardProps {
  questionNumber: number;
  questionText: string;
  type: "ESSAY" | "CHOICE" | "MULTIPLE_SELECT";
  essay?: EssayAnswerView | null;
  choice?: ChoiceAnswerView | null;
  multipleSelect?: MultipleSelectAnswerView | null;
  showDetailedScore: boolean;
  /** ReactNode slot — pass nothing for participant view, pass a score control for creator edit view */
  scoreControl?: React.ReactNode;
  labels: {
    essay: string;
    choice: string;
    multipleSelect: string;
    yourAnswer: string;
    correctAnswer: string;
    notAnswered: string;
    score: string;
    scoreExplanation: string;
    correct: string;
    incorrect: string;
  };
}
