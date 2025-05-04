/*
  Warnings:

  - You are about to drop the `MultipleChoice` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `MultipleChoiceAnswer` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `MultipleChoiceQuestion` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `_MultipleChoiceAnswerSelectedChoices` table. If the table is not empty, all the data it contains will be lost.

*/
BEGIN;
-- CreateTable
CREATE TABLE "MultipleSelectQuestion" (
    "id" TEXT NOT NULL,
    "isChoiceRandomized" BOOLEAN NOT NULL,
    "maxScore" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MultipleSelectQuestion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MultipleSelect" (
    "id" TEXT NOT NULL,
    "questionId" TEXT NOT NULL,
    "choiceText" TEXT NOT NULL,
    "isCorrect" BOOLEAN NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MultipleSelect_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MultipleSelectAnswer" (
    "id" TEXT NOT NULL,
    "questionId" TEXT NOT NULL,
    "participantId" TEXT NOT NULL,
    "score" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MultipleSelectAnswer_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "_MultipleSelectAnswerSelectedChoices" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,

    CONSTRAINT "_MultipleSelectAnswerSelectedChoices_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateIndex
CREATE INDEX "MultipleSelect_questionId_idx" ON "MultipleSelect"("questionId");

-- CreateIndex
CREATE INDEX "MultipleSelectAnswer_participantId_idx" ON "MultipleSelectAnswer"("participantId");

-- CreateIndex
CREATE INDEX "MultipleSelectAnswer_questionId_idx" ON "MultipleSelectAnswer"("questionId");

-- CreateIndex
CREATE INDEX "_MultipleSelectAnswerSelectedChoices_B_index" ON "_MultipleSelectAnswerSelectedChoices"("B");

-- AddForeignKey
ALTER TABLE "MultipleSelectQuestion" ADD CONSTRAINT "MultipleSelectQuestion_id_fkey" FOREIGN KEY ("id") REFERENCES "Question"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MultipleSelect" ADD CONSTRAINT "MultipleSelect_questionId_fkey" FOREIGN KEY ("questionId") REFERENCES "MultipleSelectQuestion"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MultipleSelectAnswer" ADD CONSTRAINT "MultipleSelectAnswer_participantId_fkey" FOREIGN KEY ("participantId") REFERENCES "Participant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MultipleSelectAnswer" ADD CONSTRAINT "MultipleSelectAnswer_questionId_fkey" FOREIGN KEY ("questionId") REFERENCES "MultipleSelectQuestion"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_MultipleSelectAnswerSelectedChoices" ADD CONSTRAINT "_MultipleSelectAnswerSelectedChoices_A_fkey" FOREIGN KEY ("A") REFERENCES "MultipleSelect"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_MultipleSelectAnswerSelectedChoices" ADD CONSTRAINT "_MultipleSelectAnswerSelectedChoices_B_fkey" FOREIGN KEY ("B") REFERENCES "MultipleSelectAnswer"("id") ON DELETE CASCADE ON UPDATE CASCADE;

COMMIT;

BEGIN;

-- Pindahkan dari MultipleChoiceQuestion ke MultipleSelectQuestion
INSERT INTO "MultipleSelectQuestion" ("id", "isChoiceRandomized", "maxScore", "createdAt", "updatedAt")
SELECT "id", "isChoiceRandomized", "maxScore", "createdAt", "updatedAt"
FROM "MultipleChoiceQuestion";

-- Pindahkan dari MultipleChoice ke MultipleSelect
INSERT INTO "MultipleSelect" ("id", "questionId", "choiceText", "isCorrect", "createdAt", "updatedAt")
SELECT "id", "questionId", "choiceText", "isCorrect", "createdAt", "updatedAt"
FROM "MultipleChoice";

-- Pindahkan dari MultipleChoiceAnswer ke MultipleSelectAnswer
INSERT INTO "MultipleSelectAnswer" ("id", "questionId", "participantId", "score", "createdAt", "updatedAt")
SELECT "id", "questionId", "participantId", "score", "createdAt", "updatedAt"
FROM "MultipleChoiceAnswer";

-- Pindahkan dari relasi pivot _MultipleChoiceAnswerSelectedChoices ke _MultipleSelectAnswerSelectedChoices
INSERT INTO "_MultipleSelectAnswerSelectedChoices" ("A", "B")
SELECT "A", "B"
FROM "_MultipleChoiceAnswerSelectedChoices";

COMMIT;

BEGIN;

-- DropForeignKey
ALTER TABLE "MultipleChoice" DROP CONSTRAINT "MultipleChoice_questionId_fkey";

-- DropForeignKey
ALTER TABLE "MultipleChoiceAnswer" DROP CONSTRAINT "MultipleChoiceAnswer_participantId_fkey";

-- DropForeignKey
ALTER TABLE "MultipleChoiceAnswer" DROP CONSTRAINT "MultipleChoiceAnswer_questionId_fkey";

-- DropForeignKey
ALTER TABLE "MultipleChoiceQuestion" DROP CONSTRAINT "MultipleChoiceQuestion_id_fkey";

-- DropForeignKey
ALTER TABLE "_MultipleChoiceAnswerSelectedChoices" DROP CONSTRAINT "_MultipleChoiceAnswerSelectedChoices_A_fkey";

-- DropForeignKey
ALTER TABLE "_MultipleChoiceAnswerSelectedChoices" DROP CONSTRAINT "_MultipleChoiceAnswerSelectedChoices_B_fkey";

-- DropTable
DROP TABLE "MultipleChoice";

-- DropTable
DROP TABLE "MultipleChoiceAnswer";

-- DropTable
DROP TABLE "MultipleChoiceQuestion";

-- DropTable
DROP TABLE "_MultipleChoiceAnswerSelectedChoices";

COMMIT;