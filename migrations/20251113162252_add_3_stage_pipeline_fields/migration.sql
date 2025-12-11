-- CreateEnum
CREATE TYPE "Stage1Mode" AS ENUM ('EASY', 'ADVANCED');

-- CreateEnum
CREATE TYPE "Veo3Mode" AS ENUM ('FAST', 'STANDARD');

-- AlterTable
ALTER TABLE "VideoGeneration" ADD COLUMN     "compositeImageUrl" TEXT,
ADD COLUMN     "compositePrompt" TEXT,
ADD COLUMN     "currentStage" INTEGER NOT NULL DEFAULT 1,
ADD COLUMN     "fallbackUsed" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "generatedPersonUrl" TEXT,
ADD COLUMN     "personAge" TEXT,
ADD COLUMN     "personBackground" TEXT,
ADD COLUMN     "personClothing" TEXT,
ADD COLUMN     "personEthnicity" TEXT,
ADD COLUMN     "personExpression" TEXT,
ADD COLUMN     "personGender" TEXT,
ADD COLUMN     "personPrompt" TEXT,
ADD COLUMN     "productImageUrl" TEXT,
ADD COLUMN     "s3KeyComposite" TEXT,
ADD COLUMN     "s3KeyPerson" TEXT,
ADD COLUMN     "s3KeyVideo" TEXT,
ADD COLUMN     "stage1Error" TEXT,
ADD COLUMN     "stage1Mode" "Stage1Mode",
ADD COLUMN     "stage2Error" TEXT,
ADD COLUMN     "stage3Error" TEXT,
ADD COLUMN     "veo3Mode" "Veo3Mode",
ADD COLUMN     "videoPrompt" TEXT,
ADD COLUMN     "videoProvider" TEXT,
ADD COLUMN     "videoThumbnailUrl" TEXT,
ALTER COLUMN "referenceImageUrl" DROP NOT NULL,
ALTER COLUMN "content" DROP NOT NULL;

-- CreateIndex
CREATE INDEX "VideoGeneration_userId_status_idx" ON "VideoGeneration"("userId", "status");
