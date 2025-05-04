/*
  Warnings:

  - The values [MULTIPLE_CHOICE] on the enum `QuestionType` will be removed. If these variants are still used in the database, this will fail.

*/
-- AlterEnum
BEGIN;
ALTER TABLE "Question" ALTER COLUMN "type" TYPE TEXT;
UPDATE "Question" SET "type" = 'MULTIPLE_SELECT' WHERE "type" = 'MULTIPLE_CHOICE';
CREATE TYPE "QuestionType_new" AS ENUM ('ESSAY', 'CHOICE', 'MULTIPLE_SELECT');
ALTER TABLE "Question" ALTER COLUMN "type" TYPE "QuestionType_new" USING ("type"::text::"QuestionType_new");
ALTER TYPE "QuestionType" RENAME TO "QuestionType_old";
ALTER TYPE "QuestionType_new" RENAME TO "QuestionType";
DROP TYPE "QuestionType_old";
COMMIT;

