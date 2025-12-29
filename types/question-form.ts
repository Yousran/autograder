import { z } from "zod";
import { QuestionType } from "@/lib/generated/prisma/enums";

// Schema for individual choice items
export const choiceFormSchema = z.object({
  id: z.string().optional(), // Optional for new choices
  choiceText: z.string().min(1, "Choice text is required"),
  isCorrect: z.boolean().default(false),
});

export type ChoiceFormData = z.infer<typeof choiceFormSchema>;

// Base schema for all question types
const baseQuestionSchema = z.object({
  id: z.string().optional(), // Optional for new questions
  questionText: z
    .string()
    .min(5, "Question text must be at least 5 characters"),
  order: z.number().int().min(0),
  maxScore: z.coerce.number().min(1, "Max score must be at least 1"),
});

// Essay question schema
export const essayQuestionFormSchema = baseQuestionSchema.extend({
  type: z.literal(QuestionType.ESSAY),
  answerText: z.string().min(1, "Answer text is required"),
  isExactAnswer: z.boolean().default(false),
});

// Choice question schema
export const choiceQuestionFormSchema = baseQuestionSchema.extend({
  type: z.literal(QuestionType.CHOICE),
  isChoiceRandomized: z.boolean().default(false),
  choices: z
    .array(choiceFormSchema)
    .min(2, "At least 2 choices required")
    .refine(
      (choices) => choices.filter((c) => c.isCorrect).length === 1,
      "Exactly one choice must be marked as correct"
    ),
});

// Multiple select question schema
export const multipleSelectQuestionFormSchema = baseQuestionSchema.extend({
  type: z.literal(QuestionType.MULTIPLE_SELECT),
  isChoiceRandomized: z.boolean().default(false),
  choices: z
    .array(choiceFormSchema)
    .min(2, "At least 2 choices required")
    .refine(
      (choices) => choices.filter((c) => c.isCorrect).length >= 1,
      "At least one choice must be marked as correct"
    ),
});

// Union schema for any question type
export const questionFormSchema = z.discriminatedUnion("type", [
  essayQuestionFormSchema,
  choiceQuestionFormSchema,
  multipleSelectQuestionFormSchema,
]);

export type QuestionFormData = z.infer<typeof questionFormSchema>;
export type EssayQuestionFormData = z.infer<typeof essayQuestionFormSchema>;
export type ChoiceQuestionFormData = z.infer<typeof choiceQuestionFormSchema>;
export type MultipleSelectQuestionFormData = z.infer<
  typeof multipleSelectQuestionFormSchema
>;

// Form schema for the entire questions list
export const questionsFormSchema = z.object({
  questions: z.array(questionFormSchema),
});

export type QuestionsFormData = z.infer<typeof questionsFormSchema>;

// Helper type for transforming Prisma data to form data
export interface PrismaQuestionData {
  id: string;
  testId: string;
  questionText: string;
  type: QuestionType;
  order: number;
  essay?: {
    id: string;
    answerText: string;
    isExactAnswer: boolean;
    maxScore: number;
  } | null;
  choice?: {
    id: string;
    isChoiceRandomized: boolean;
    maxScore: number;
    choices: Array<{
      id: string;
      choiceText: string;
      isCorrect: boolean;
    }>;
  } | null;
  multipleSelect?: {
    id: string;
    isChoiceRandomized: boolean;
    maxScore: number;
    multipleSelectChoices: Array<{
      id: string;
      choiceText: string;
      isCorrect: boolean;
    }>;
  } | null;
}

// Transform Prisma question data to form data
export function transformPrismaToFormData(
  question: PrismaQuestionData
): QuestionFormData {
  const baseData = {
    id: question.id,
    questionText: question.questionText,
    order: question.order,
  };

  switch (question.type) {
    case QuestionType.ESSAY:
      if (!question.essay) {
        throw new Error("Essay question missing essay data");
      }
      return {
        ...baseData,
        type: QuestionType.ESSAY,
        answerText: question.essay.answerText,
        isExactAnswer: question.essay.isExactAnswer,
        maxScore: question.essay.maxScore,
      };

    case QuestionType.CHOICE:
      if (!question.choice) {
        throw new Error("Choice question missing choice data");
      }
      return {
        ...baseData,
        type: QuestionType.CHOICE,
        isChoiceRandomized: question.choice.isChoiceRandomized,
        maxScore: question.choice.maxScore,
        choices: question.choice.choices.map((c) => ({
          id: c.id,
          choiceText: c.choiceText,
          isCorrect: c.isCorrect,
        })),
      };

    case QuestionType.MULTIPLE_SELECT:
      if (!question.multipleSelect) {
        throw new Error("Multiple select question missing data");
      }
      return {
        ...baseData,
        type: QuestionType.MULTIPLE_SELECT,
        isChoiceRandomized: question.multipleSelect.isChoiceRandomized,
        maxScore: question.multipleSelect.maxScore,
        choices: question.multipleSelect.multipleSelectChoices.map((c) => ({
          id: c.id,
          choiceText: c.choiceText,
          isCorrect: c.isCorrect,
        })),
      };

    default:
      throw new Error(`Unknown question type: ${question.type}`);
  }
}

// Get default form data for a new question of a given type
export function getDefaultQuestionFormData(
  type: typeof QuestionType.ESSAY,
  order: number
): Omit<EssayQuestionFormData, "id">;
export function getDefaultQuestionFormData(
  type: typeof QuestionType.CHOICE,
  order: number
): Omit<ChoiceQuestionFormData, "id">;
export function getDefaultQuestionFormData(
  type: typeof QuestionType.MULTIPLE_SELECT,
  order: number
): Omit<MultipleSelectQuestionFormData, "id">;
export function getDefaultQuestionFormData(
  type: QuestionType,
  order: number
): Omit<QuestionFormData, "id"> {
  const baseData = {
    questionText: "Untitled Question",
    order,
    maxScore: 10,
  };

  if (type === QuestionType.ESSAY) {
    return {
      ...baseData,
      type: QuestionType.ESSAY,
      answerText: "",
      isExactAnswer: false,
    } as Omit<EssayQuestionFormData, "id">;
  }

  if (type === QuestionType.CHOICE) {
    return {
      ...baseData,
      type: QuestionType.CHOICE,
      isChoiceRandomized: false,
      choices: [
        { choiceText: "Option 1", isCorrect: true },
        { choiceText: "Option 2", isCorrect: false },
      ],
    } as Omit<ChoiceQuestionFormData, "id">;
  }

  if (type === QuestionType.MULTIPLE_SELECT) {
    return {
      ...baseData,
      type: QuestionType.MULTIPLE_SELECT,
      isChoiceRandomized: false,
      choices: [
        { choiceText: "Option 1", isCorrect: true },
        { choiceText: "Option 2", isCorrect: false },
      ],
    } as Omit<MultipleSelectQuestionFormData, "id">;
  }

  throw new Error(`Unknown question type: ${type}`);
}
