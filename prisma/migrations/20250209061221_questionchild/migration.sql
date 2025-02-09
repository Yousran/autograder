/*
  Warnings:

  - The primary key for the `ChoiceQuestion` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `id` on the `ChoiceQuestion` table. All the data in the column will be lost.
  - You are about to drop the column `question` on the `ChoiceQuestion` table. All the data in the column will be lost.
  - You are about to drop the column `test_id` on the `ChoiceQuestion` table. All the data in the column will be lost.
  - The primary key for the `EssayQuestion` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `id` on the `EssayQuestion` table. All the data in the column will be lost.
  - You are about to drop the column `question` on the `EssayQuestion` table. All the data in the column will be lost.
  - You are about to drop the column `test_id` on the `EssayQuestion` table. All the data in the column will be lost.
  - Added the required column `question_id` to the `ChoiceQuestion` table without a default value. This is not possible if the table is not empty.
  - Added the required column `question_id` to the `EssayQuestion` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE `Choice` DROP FOREIGN KEY `Choice_question_id_fkey`;

-- DropForeignKey
ALTER TABLE `ChoiceAnswer` DROP FOREIGN KEY `ChoiceAnswer_choice_question_id_fkey`;

-- DropForeignKey
ALTER TABLE `ChoiceQuestion` DROP FOREIGN KEY `ChoiceQuestion_test_id_fkey`;

-- DropForeignKey
ALTER TABLE `EssayAnswer` DROP FOREIGN KEY `EssayAnswer_essay_question_id_fkey`;

-- DropForeignKey
ALTER TABLE `EssayQuestion` DROP FOREIGN KEY `EssayQuestion_test_id_fkey`;

-- DropIndex
DROP INDEX `Choice_question_id_fkey` ON `Choice`;

-- DropIndex
DROP INDEX `ChoiceAnswer_choice_question_id_fkey` ON `ChoiceAnswer`;

-- DropIndex
DROP INDEX `ChoiceQuestion_test_id_fkey` ON `ChoiceQuestion`;

-- DropIndex
DROP INDEX `EssayAnswer_essay_question_id_fkey` ON `EssayAnswer`;

-- DropIndex
DROP INDEX `EssayQuestion_test_id_fkey` ON `EssayQuestion`;

-- AlterTable
ALTER TABLE `ChoiceQuestion` DROP PRIMARY KEY,
    DROP COLUMN `id`,
    DROP COLUMN `question`,
    DROP COLUMN `test_id`,
    ADD COLUMN `question_id` INTEGER NOT NULL AUTO_INCREMENT,
    ADD PRIMARY KEY (`question_id`);

-- AlterTable
ALTER TABLE `EssayQuestion` DROP PRIMARY KEY,
    DROP COLUMN `id`,
    DROP COLUMN `question`,
    DROP COLUMN `test_id`,
    ADD COLUMN `question_id` INTEGER NOT NULL AUTO_INCREMENT,
    ADD PRIMARY KEY (`question_id`);

-- CreateTable
CREATE TABLE `Question` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `test_id` INTEGER NOT NULL,
    `type` VARCHAR(191) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `Question` ADD CONSTRAINT `Question_test_id_fkey` FOREIGN KEY (`test_id`) REFERENCES `Test`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `EssayQuestion` ADD CONSTRAINT `EssayQuestion_question_id_fkey` FOREIGN KEY (`question_id`) REFERENCES `Question`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ChoiceQuestion` ADD CONSTRAINT `ChoiceQuestion_question_id_fkey` FOREIGN KEY (`question_id`) REFERENCES `Question`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Choice` ADD CONSTRAINT `Choice_question_id_fkey` FOREIGN KEY (`question_id`) REFERENCES `ChoiceQuestion`(`question_id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `EssayAnswer` ADD CONSTRAINT `EssayAnswer_essay_question_id_fkey` FOREIGN KEY (`essay_question_id`) REFERENCES `EssayQuestion`(`question_id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ChoiceAnswer` ADD CONSTRAINT `ChoiceAnswer_choice_question_id_fkey` FOREIGN KEY (`choice_question_id`) REFERENCES `ChoiceQuestion`(`question_id`) ON DELETE RESTRICT ON UPDATE CASCADE;
