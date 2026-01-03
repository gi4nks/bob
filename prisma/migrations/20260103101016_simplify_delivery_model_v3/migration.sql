/*
  Warnings:

  - You are about to drop the `Output` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the column `endDate` on the `Outcome` table. All the data in the column will be lost.
  - You are about to drop the column `projectId` on the `Outcome` table. All the data in the column will be lost.
  - You are about to drop the column `startDate` on the `Outcome` table. All the data in the column will be lost.

*/
-- DropTable
PRAGMA foreign_keys=off;
DROP TABLE "Output";
PRAGMA foreign_keys=on;

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Outcome" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "isDone" BOOLEAN NOT NULL DEFAULT false,
    "order" INTEGER NOT NULL DEFAULT 0,
    "phaseId" TEXT,
    CONSTRAINT "Outcome_phaseId_fkey" FOREIGN KEY ("phaseId") REFERENCES "Phase" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_Outcome" ("id", "name", "order", "phaseId") SELECT "id", "name", "order", "phaseId" FROM "Outcome";
DROP TABLE "Outcome";
ALTER TABLE "new_Outcome" RENAME TO "Outcome";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
