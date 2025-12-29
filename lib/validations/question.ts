import { z } from "zod";
import { QuestionType } from "@/lib/generated/prisma/enums";

// Schema for individual choice items
export const choiceSchema = z.object({
  id: z.string().optional(), // Optional for new choices
  choiceText: z.string().min(1, "Choice text is required"),
  isCorrect: z.boolean().default(false),
});

export type ChoiceValidation = z.infer<typeof choiceSchema>;

// Base schema for all question types (with id for forms)
const baseQuestionSchema = z.object({
  id: z.string().optional(), // Optional for new questions
  questionText: z
    .string()
    .min(5, "Question text must be at least 5 characters"),
  order: z.number().int().min(0),
  maxScore: z.coerce.number().min(1, "Max score must be at least 1"),
});

// Essay question schema
export const essayQuestionSchema = baseQuestionSchema.extend({
  type: z.literal(QuestionType.ESSAY),
  answerText: z.string().min(1, "Answer text is required"),
  isExactAnswer: z.boolean().default(false),
});

// Choice question schema - exactly one correct answer
export const choiceQuestionSchema = baseQuestionSchema.extend({
  type: z.literal(QuestionType.CHOICE),
  isChoiceRandomized: z.boolean().default(false),
  choices: z
    .array(choiceSchema)
    .min(2, "At least 2 choices required")
    .refine(
      (choices) => choices.filter((c) => c.isCorrect).length === 1,
      "Exactly one choice must be marked as correct"
    ),
});

// Multiple select question schema - at least one correct answer
export const multipleSelectQuestionSchema = baseQuestionSchema.extend({
  type: z.literal(QuestionType.MULTIPLE_SELECT),
  isChoiceRandomized: z.boolean().default(false),
  choices: z
    .array(choiceSchema)
    .min(2, "At least 2 choices required")
    .refine(
      (choices) => choices.filter((c) => c.isCorrect).length >= 1,
      "At least one choice must be marked as correct"
    ),
});

// Main question schema using discriminated union
export const questionSchema = z.discriminatedUnion("type", [
  essayQuestionSchema,
  choiceQuestionSchema,
  multipleSelectQuestionSchema,
]);

export type QuestionValidation = z.infer<typeof questionSchema>;
export type EssayQuestionValidation = z.infer<typeof essayQuestionSchema>;
export type ChoiceQuestionValidation = z.infer<typeof choiceQuestionSchema>;
export type MultipleSelectQuestionValidation = z.infer<
  typeof multipleSelectQuestionSchema
>;

// Form schema for the entire questions list
export const questionsSchema = z.object({
  questions: z.array(questionSchema),
});

export type QuestionsValidation = z.infer<typeof questionsSchema>;
