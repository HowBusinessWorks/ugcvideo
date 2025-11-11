-- CreateEnum
CREATE TYPE "VideoStatus" AS ENUM ('PENDING', 'PROCESSING', 'COMPLETED', 'FAILED');

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "videoCredits" INTEGER NOT NULL DEFAULT 3;

-- CreateTable
CREATE TABLE "VideoGeneration" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "userId" TEXT NOT NULL,
    "referenceImageUrl" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "generatedImageUrl" TEXT,
    "finalVideoUrl" TEXT,
    "thumbnailUrl" TEXT,
    "status" "VideoStatus" NOT NULL DEFAULT 'PENDING',
    "progress" INTEGER NOT NULL DEFAULT 0,
    "duration" INTEGER NOT NULL DEFAULT 8,
    "aspectRatio" TEXT NOT NULL DEFAULT '9:16',
    "fileSize" INTEGER,
    "s3Key" TEXT,
    "n8nExecutionId" TEXT,

    CONSTRAINT "VideoGeneration_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "VideoGeneration_userId_createdAt_idx" ON "VideoGeneration"("userId", "createdAt");

-- AddForeignKey
ALTER TABLE "VideoGeneration" ADD CONSTRAINT "VideoGeneration_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
