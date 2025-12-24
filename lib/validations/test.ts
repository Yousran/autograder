import { z } from "zod";
import { QuestionType } from "@/lib/generated/prisma/enums";

// Schema untuk Pilihan Ganda (Choice & Multiple Select)
const choiceSchema = z.object({
  choiceText: z.string().min(1, "Choice text is required"),
  isCorrect: z.boolean().default(false),
});

// Schema Utama Pertanyaan
// Kita menggunakan discriminate union berdasarkan 'type'
const questionSchema = z.discriminatedUnion("type", [
  z.object({
    type: z.literal(QuestionType.ESSAY),
    questionText: z.string().min(5, "Question text must be at least 5 chars"),
    order: z.number().default(0),
    // Field khusus Essay
    exactAnswer: z.boolean().default(false), // mapping ke isExactAnswer
    answerText: z.string().min(1, "Answer key is required"),
    maxScore: z.coerce.number().min(1),
  }),
  z.object({
    type: z.literal(QuestionType.CHOICE),
    questionText: z.string().min(5),
    order: z.number().default(0),
    // Field khusus Choice
    isChoiceRandomized: z.boolean().default(false),
    maxScore: z.coerce.number().min(1),
    choices: z.array(choiceSchema).min(2, "At least 2 choices required"),
  }),
  z.object({
    type: z.literal(QuestionType.MULTIPLE_SELECT),
    questionText: z.string().min(5),
    order: z.number().default(0),
    // Field khusus Multiple Select
    isChoiceRandomized: z.boolean().default(false),
    maxScore: z.coerce.number().min(1),
    choices: z.array(choiceSchema).min(2, "At least 2 choices required"),
  }),
]);

// Schema Utama Form Test
export const testFormSchema = z.object({
  title: z.string().min(3, "Title is too short"),
  description: z.string().optional(),
  testDuration: z.coerce.number().min(0).optional(), // dalam menit
  startTime: z.coerce.date().optional(),
  endTime: z.coerce.date().optional(),

  // Settings
  isAcceptingResponses: z.boolean().default(true),
  loggedInUserOnly: z.boolean().default(false),
  maxAttempts: z.coerce.number().min(1).default(1),
  showDetailedScore: z.boolean().default(true),
  showCorrectAnswers: z.boolean().default(false),
  isQuestionsOrdered: z.boolean().default(false),

  // Prerequisites (optional)
  prerequisites: z
    .array(
      z.object({
        prerequisiteTestId: z.string().min(1, "Test selection is required"),
        minScoreRequired: z.coerce
          .number()
          .min(0, "Minimum score must be at least 0")
          .max(100, "Minimum score cannot exceed 100")
          .default(0),
      })
    )
    .optional()
    .default([]),

  // Array of Questions
  questions: z.array(questionSchema),
});

export type TestFormValues = z.infer<typeof testFormSchema>;
