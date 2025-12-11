-- CreateEnum
CREATE TYPE "AssetType" AS ENUM ('PERSON', 'COMPOSITE', 'VIDEO', 'FULL_PIPELINE');

-- AlterTable
ALTER TABLE "VideoGeneration" ADD COLUMN     "assetType" "AssetType" NOT NULL DEFAULT 'FULL_PIPELINE';

-- CreateIndex
CREATE INDEX "VideoGeneration_userId_assetType_createdAt_idx" ON "VideoGeneration"("userId", "assetType", "createdAt");
