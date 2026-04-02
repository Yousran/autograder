-- AlterTable
ALTER TABLE "Test" ADD COLUMN     "essayGradingModelId" TEXT;

-- CreateTable
CREATE TABLE "EssayGradingModel" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "baseUrl" TEXT NOT NULL,
    "model" TEXT NOT NULL,
    "apiKey" TEXT,
    "isDefault" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "EssayGradingModel_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "EssayGradingModel_userId_idx" ON "EssayGradingModel"("userId");

-- CreateIndex
CREATE INDEX "Test_essayGradingModelId_idx" ON "Test"("essayGradingModelId");

-- AddForeignKey
ALTER TABLE "EssayGradingModel" ADD CONSTRAINT "EssayGradingModel_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Test" ADD CONSTRAINT "Test_essayGradingModelId_fkey" FOREIGN KEY ("essayGradingModelId") REFERENCES "EssayGradingModel"("id") ON DELETE SET NULL ON UPDATE CASCADE;
