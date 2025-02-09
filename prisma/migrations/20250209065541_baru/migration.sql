/*
  Warnings:

  - The primary key for the `ChoiceQuestion` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `question_id` on the `ChoiceQuestion` table. All the data in the column will be lost.
  - The primary key for the `EssayQuestion` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `question_id` on the `EssayQuestion` table. All the data in the column will be lost.
  - You are about to drop the `Question` table. If the table is not empty, all the data it contains will be lost.
  - Added the required column `id` to the `ChoiceQuestion` table without a default value. This is not possible if the table is not empty.
  - Added the required column `question` to the `ChoiceQuestion` table without a default value. This is not possible if the table is not empty.
  - Added the required column `test_id` to the `ChoiceQuestion` table without a default value. This is not possible if the table is not empty.
  - Added the required column `id` to the `EssayQuestion` table without a default value. This is not possible if the table is not empty.
  - Added the required column `question` to the `EssayQuestion` table without a default value. This is not possible if the table is not empty.
  - Added the required column `test_id` to the `EssayQuestion` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE `Choice` DROP FOREIGN KEY `Choice_question_id_fkey`;

-- DropForeignKey
ALTER TABLE `ChoiceAnswer` DROP FOREIGN KEY `ChoiceAnswer_choice_question_id_fkey`;

-- DropForeignKey
ALTER TABLE `ChoiceQuestion` DROP FOREIGN KEY `ChoiceQuestion_question_id_fkey`;

-- DropForeignKey
ALTER TABLE `EssayAnswer` DROP FOREIGN KEY `EssayAnswer_essay_question_id_fkey`;

-- DropForeignKey
ALTER TABLE `EssayQuestion` DROP FOREIGN KEY `EssayQuestion_question_id_fkey`;

-- DropForeignKey
ALTER TABLE `Question` DROP FOREIGN KEY `Question_test_id_fkey`;

-- DropIndex
DROP INDEX `Choice_question_id_fkey` ON `Choice`;

-- DropIndex
DROP INDEX `ChoiceAnswer_choice_question_id_fkey` ON `ChoiceAnswer`;

-- DropIndex
DROP INDEX `EssayAnswer_essay_question_id_fkey` ON `EssayAnswer`;

-- AlterTable
ALTER TABLE `ChoiceQuestion` DROP PRIMARY KEY,
    DROP COLUMN `question_id`,
    ADD COLUMN `id` INTEGER NOT NULL AUTO_INCREMENT,
    ADD COLUMN `question` VARCHAR(191) NOT NULL,
    ADD COLUMN `test_id` INTEGER NOT NULL,
    ADD PRIMARY KEY (`id`);

-- AlterTable
ALTER TABLE `EssayQuestion` DROP PRIMARY KEY,
    DROP COLUMN `question_id`,
    ADD COLUMN `id` INTEGER NOT NULL AUTO_INCREMENT,
    ADD COLUMN `question` VARCHAR(191) NOT NULL,
    ADD COLUMN `test_id` INTEGER NOT NULL,
    ADD PRIMARY KEY (`id`);

-- DropTable
DROP TABLE `Question`;

-- AddForeignKey
ALTER TABLE `EssayQuestion` ADD CONSTRAINT `EssayQuestion_test_id_fkey` FOREIGN KEY (`test_id`) REFERENCES `Test`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ChoiceQuestion` ADD CONSTRAINT `ChoiceQuestion_test_id_fkey` FOREIGN KEY (`test_id`) REFERENCES `Test`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Choice` ADD CONSTRAINT `Choice_question_id_fkey` FOREIGN KEY (`question_id`) REFERENCES `ChoiceQuestion`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `EssayAnswer` ADD CONSTRAINT `EssayAnswer_essay_question_id_fkey` FOREIGN KEY (`essay_question_id`) REFERENCES `EssayQuestion`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ChoiceAnswer` ADD CONSTRAINT `ChoiceAnswer_choice_question_id_fkey` FOREIGN KEY (`choice_question_id`) REFERENCES `ChoiceQuestion`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
