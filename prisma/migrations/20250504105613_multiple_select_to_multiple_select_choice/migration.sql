/*
  Warnings:

  - You are about to drop the `MultipleSelect` table. If the table is not empty, all the data it contains will be lost.

*/
BEGIN;

-- 1. Buat tabel baru MultipleSelectChoice
CREATE TABLE "MultipleSelectChoice" (
    "id" TEXT NOT NULL,
    "questionId" TEXT NOT NULL,
    "choiceText" TEXT NOT NULL,
    "isCorrect" BOOLEAN NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MultipleSelectChoice_pkey" PRIMARY KEY ("id")
);

-- 2. Buat index untuk MultipleSelectChoice
CREATE INDEX "MultipleSelectChoice_questionId_idx" ON "MultipleSelectChoice"("questionId");

-- 3. Pindahkan data dari MultipleSelect ke MultipleSelectChoice
INSERT INTO "MultipleSelectChoice" ("id", "questionId", "choiceText", "isCorrect", "createdAt", "updatedAt")
SELECT "id", "questionId", "choiceText", "isCorrect", "createdAt", "updatedAt"
FROM "MultipleSelect";

-- 4. Update foreign key di _MultipleSelectAnswerSelectedChoices yang masih mengarah ke MultipleSelect
ALTER TABLE "_MultipleSelectAnswerSelectedChoices"
DROP CONSTRAINT IF EXISTS "_MultipleSelectAnswerSelectedChoices_A_fkey";

ALTER TABLE "_MultipleSelectAnswerSelectedChoices"
ADD CONSTRAINT "_MultipleSelectAnswerSelectedChoices_A_fkey" FOREIGN KEY ("A") REFERENCES "MultipleSelectAnswer"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "_MultipleSelectAnswerSelectedChoices"
DROP CONSTRAINT IF EXISTS "_MultipleSelectAnswerSelectedChoices_B_fkey";

ALTER TABLE "_MultipleSelectAnswerSelectedChoices"
ADD CONSTRAINT "_MultipleSelectAnswerSelectedChoices_B_fkey" FOREIGN KEY ("B") REFERENCES "MultipleSelectChoice"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- 5. Hapus tabel MultipleSelect setelah data dipindahkan
DROP TABLE "MultipleSelect";

-- 6. Tambahkan foreign key constraints pada MultipleSelectChoice
ALTER TABLE "MultipleSelectChoice"
ADD CONSTRAINT "MultipleSelectChoice_questionId_fkey" FOREIGN KEY ("questionId") REFERENCES "MultipleSelectQuestion"("id") ON DELETE CASCADE ON UPDATE CASCADE;

COMMIT;

-- Catatan tambahan: Pastikan untuk tidak menghapus constraint atau tabel sampai semua data telah dipindahkan dengan sukses dan foreign key baru diterapkan.