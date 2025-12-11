-- AlterTable
ALTER TABLE "VideoGeneration" ADD COLUMN     "canRetry" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "creditsRefunded" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "errorMessage" TEXT,
ADD COLUMN     "errorType" TEXT,
ADD COLUMN     "isRefundable" BOOLEAN NOT NULL DEFAULT false;
