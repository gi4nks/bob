-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Outcome" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "isDone" BOOLEAN NOT NULL DEFAULT false,
    "order" INTEGER NOT NULL DEFAULT 0,
    "phaseId" TEXT,
    "assigneeId" TEXT,
    CONSTRAINT "Outcome_phaseId_fkey" FOREIGN KEY ("phaseId") REFERENCES "Phase" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Outcome_assigneeId_fkey" FOREIGN KEY ("assigneeId") REFERENCES "Developer" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_Outcome" ("id", "isDone", "name", "order", "phaseId") SELECT "id", "isDone", "name", "order", "phaseId" FROM "Outcome";
DROP TABLE "Outcome";
ALTER TABLE "new_Outcome" RENAME TO "Outcome";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
