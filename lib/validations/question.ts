import { z } from "zod";
import { QuestionType } from "@/lib/generated/prisma/enums";

// Schema untuk Pilihan Ganda (Choice & Multiple Select)
export const choiceSchema = z.object({
  choiceText: z.string().min(1, "Choice text is required"),
  isCorrect: z.boolean().default(false),
});

// Schema Utama Pertanyaan
// Kita menggunakan discriminate union berdasarkan 'type'
export const questionSchema = z.discriminatedUnion("type", [
  z.object({
    type: z.literal(QuestionType.ESSAY),
    questionText: z.string().min(5, "Question text must be at least 5 chars"),
    order: z.number().default(0),
    // Field khusus Essay
    isExactAnswer: z.boolean().default(false), // mapping ke isExactAnswer
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
export type QuestionValidation = z.infer<typeof questionSchema>;
