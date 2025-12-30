import { z } from "zod";

// --- ESSAY ANSWER SCHEMA ---
export const essayAnswerSchema = z.object({
  participantId: z.string().min(1, "Participant ID is required"),
  questionId: z.string().min(1, "Question ID is required"),
  answerText: z
    .string()
    .min(1, "Answer text is required")
    .max(10000, "Answer text must be less than 10000 characters"),
});

export type EssayAnswerValidation = z.infer<typeof essayAnswerSchema>;

// --- CHOICE ANSWER SCHEMA ---
export const choiceAnswerSchema = z.object({
  participantId: z.string().min(1, "Participant ID is required"),
  questionId: z.string().min(1, "Question ID is required"),
  selectedChoiceId: z.string().min(1, "Selected choice ID is required"),
});

export type ChoiceAnswerValidation = z.infer<typeof choiceAnswerSchema>;

// --- MULTIPLE SELECT ANSWER SCHEMA ---
export const multipleSelectAnswerSchema = z.object({
  participantId: z.string().min(1, "Participant ID is required"),
  questionId: z.string().min(1, "Question ID is required"),
  selectedChoiceIds: z.array(z.string()).default([]),
});

export type MultipleSelectAnswerValidation = z.infer<
  typeof multipleSelectAnswerSchema
>;
