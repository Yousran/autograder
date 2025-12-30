import {
  QuestionValidation,
  EssayQuestionValidation,
  ChoiceQuestionValidation,
  MultipleSelectQuestionValidation,
  QuestionsValidation,
  questionSchema,
  questionsSchema,
} from "@/lib/validations/question";
import { QuestionType } from "@/lib/generated/prisma/enums";

// Re-export validation types and schemas
export {
  questionSchema,
  questionsSchema,
  type QuestionValidation,
  type EssayQuestionValidation,
  type ChoiceQuestionValidation,
  type MultipleSelectQuestionValidation,
  type QuestionsValidation,
};

// Choice types for use in components
export interface Choice {
  id: string;
  questionId: string;
  choiceText: string;
  isCorrect: boolean;
}

export interface MultipleSelectChoice {
  id: string;
  questionId: string;
  choiceText: string;
  isCorrect: boolean;
}

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
): QuestionValidation {
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
): Omit<EssayQuestionValidation, "id">;
export function getDefaultQuestionFormData(
  type: typeof QuestionType.CHOICE,
  order: number
): Omit<ChoiceQuestionValidation, "id">;
export function getDefaultQuestionFormData(
  type: typeof QuestionType.MULTIPLE_SELECT,
  order: number
): Omit<MultipleSelectQuestionValidation, "id">;
export function getDefaultQuestionFormData(
  type: QuestionType,
  order: number
): Omit<QuestionValidation, "id"> {
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
    } as Omit<EssayQuestionValidation, "id">;
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
    } as Omit<ChoiceQuestionValidation, "id">;
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
    } as Omit<MultipleSelectQuestionValidation, "id">;
  }

  throw new Error(`Unknown question type: ${type}`);
}
