import { TestPrerequisiteValidation } from "@/lib/validations/test-prerequisite";

// Test prerequisite type matching Prisma schema
export type TestPrerequisite = {
  id: string;
  testId: string;
  prerequisiteTestId: string;
  minScoreRequired: number;
};

// Prerequisite with related test info for UI display
export type TestPrerequisiteWithTest = TestPrerequisite & {
  prerequisiteTest: {
    id: string;
    title: string;
    joinCode: string;
  };
};

// Available test for prerequisite selection (creator's other tests)
export type AvailablePrerequisiteTest = {
  id: string;
  title: string;
  joinCode: string;
};

// For validation when creating/updating prerequisites
export type { TestPrerequisiteValidation };
