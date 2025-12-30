import { TestValidation } from "@/lib/validations/test";

// Complete Test type matching Prisma schema
// Note: Prisma returns null for optional fields, not undefined
export type Test = {
  id: string;
  joinCode: string;
  title: string;
  description: string | null;
  testDuration: number | null;
  maxAttempts: number | null;
  startTime: Date | null;
  endTime: Date | null;
  isAcceptingResponses: boolean;
  loggedInUserOnly: boolean;
  showDetailedScore: boolean;
  showCorrectAnswers: boolean;
  isQuestionsOrdered: boolean;
  creatorId: string;
  createdAt: Date;
  updatedAt: Date;
};

// For validation when creating/updating tests
export type { TestValidation };
