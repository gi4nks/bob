-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Developer" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "avatarUrl" TEXT NOT NULL,
    "capacity" REAL NOT NULL DEFAULT 1.0,
    "dailyRate" REAL NOT NULL DEFAULT 0,
    "isPlaceholder" BOOLEAN NOT NULL DEFAULT false
);
INSERT INTO "new_Developer" ("avatarUrl", "capacity", "id", "isPlaceholder", "name", "role") SELECT "avatarUrl", "capacity", "id", "isPlaceholder", "name", "role" FROM "Developer";
DROP TABLE "Developer";
ALTER TABLE "new_Developer" RENAME TO "Developer";
CREATE TABLE "new_Project" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "client" TEXT NOT NULL,
    "color" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'Active',
    "budget" REAL NOT NULL DEFAULT 0,
    "startDate" TEXT,
    "endDate" TEXT
);
INSERT INTO "new_Project" ("client", "color", "endDate", "id", "name", "startDate", "status") SELECT "client", "color", "endDate", "id", "name", "startDate", "status" FROM "Project";
DROP TABLE "Project";
ALTER TABLE "new_Project" RENAME TO "Project";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
