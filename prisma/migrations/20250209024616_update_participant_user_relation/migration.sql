-- DropForeignKey
ALTER TABLE `Participant` DROP FOREIGN KEY `Participant_user_id_fkey`;

-- DropIndex
DROP INDEX `Participant_user_id_fkey` ON `Participant`;

-- AlterTable
ALTER TABLE `Participant` MODIFY `user_id` INTEGER NULL,
    MODIFY `username` VARCHAR(191) NULL;

-- AddForeignKey
ALTER TABLE `Participant` ADD CONSTRAINT `Participant_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `User`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
