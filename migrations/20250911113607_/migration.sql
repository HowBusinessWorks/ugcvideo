/*
  Warnings:

  - You are about to drop the column `isAdmin` on the `User` table. All the data in the column will be lost.
  - You are about to drop the `DailyStats` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Logs` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `PageViewSource` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "PageViewSource" DROP CONSTRAINT "PageViewSource_dailyStatsId_fkey";

-- AlterTable
ALTER TABLE "User" DROP COLUMN "isAdmin";

-- DropTable
DROP TABLE "DailyStats";

-- DropTable
DROP TABLE "Logs";

-- DropTable
DROP TABLE "PageViewSource";
