-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Output" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "order" INTEGER NOT NULL DEFAULT 0,
    "priority" TEXT NOT NULL DEFAULT 'Medium',
    "status" TEXT NOT NULL DEFAULT 'Pending',
    "outcomeId" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "assigneeId" TEXT,
    CONSTRAINT "Output_outcomeId_fkey" FOREIGN KEY ("outcomeId") REFERENCES "Outcome" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Output_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Output_assigneeId_fkey" FOREIGN KEY ("assigneeId") REFERENCES "Developer" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_Output" ("assigneeId", "description", "id", "order", "outcomeId", "priority", "projectId", "title") SELECT "assigneeId", "description", "id", "order", "outcomeId", "priority", "projectId", "title" FROM "Output";
DROP TABLE "Output";
ALTER TABLE "new_Output" RENAME TO "Output";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
