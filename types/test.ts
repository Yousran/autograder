import { TestValidation } from "@/lib/validations/test";

// Complete Test type matching Prisma schema
export type Test = TestValidation & {
  id: string;
  creatorId: string;
  joinCode: string;
  createdAt: Date;
  updatedAt: Date;
};
