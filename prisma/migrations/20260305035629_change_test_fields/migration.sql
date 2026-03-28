/*
  Warnings:

  - The columns `loggedInUserOnly`, `showCorrectAnswers`, `showDetailedScore` on the `Test` table will be renamed.
    Data will be migrated to the new columns before the old columns are dropped.

*/
BEGIN;

-- AlterTable
ALTER TABLE "ChoiceQuestion" ALTER COLUMN "maxScore" SET DEFAULT 1;

-- AlterTable
ALTER TABLE "EssayQuestion" ALTER COLUMN "maxScore" SET DEFAULT 1;

-- AlterTable
ALTER TABLE "MultipleSelectQuestion" ALTER COLUMN "maxScore" SET DEFAULT 1;

-- AlterTable: Step 1 - Add new columns with nullable defaults first
ALTER TABLE "Test"
ADD COLUMN     "isLoggedInUserOnly" BOOLEAN,
ADD COLUMN     "isShowCorrectAnswers" BOOLEAN,
ADD COLUMN     "isShowDetailedScore" BOOLEAN,
ADD COLUMN     "joinCodeExpiresAt" TIMESTAMP(3),
ALTER COLUMN "joinCode" DROP NOT NULL;

-- AlterTable: Step 2 - Migrate data from old columns to new columns
UPDATE "Test" SET
    "isLoggedInUserOnly"   = "loggedInUserOnly",
    "isShowCorrectAnswers" = "showCorrectAnswers",
    "isShowDetailedScore"  = "showDetailedScore",
    -- joinCode present → expire 7 days after the test was created (mirrors TTL_DAYS = 7 in create route)
    "joinCodeExpiresAt"    = CASE WHEN "joinCode" IS NOT NULL THEN "createdAt" + INTERVAL '7 days' ELSE NULL END;

-- AlterTable: Step 3 - Apply NOT NULL constraints and defaults after data migration
ALTER TABLE "Test"
ALTER COLUMN "isLoggedInUserOnly"  SET NOT NULL,
ALTER COLUMN "isLoggedInUserOnly"  SET DEFAULT false,
ALTER COLUMN "isShowCorrectAnswers" SET NOT NULL,
ALTER COLUMN "isShowCorrectAnswers" SET DEFAULT false,
ALTER COLUMN "isShowDetailedScore" SET NOT NULL,
ALTER COLUMN "isShowDetailedScore" SET DEFAULT true;

-- AlterTable: Step 4 - Drop old columns
ALTER TABLE "Test"
DROP COLUMN "loggedInUserOnly",
DROP COLUMN "showCorrectAnswers",
DROP COLUMN "showDetailedScore";

COMMIT;
