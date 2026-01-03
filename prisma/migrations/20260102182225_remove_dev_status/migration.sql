/*
  Warnings:

  - You are about to drop the column `status` on the `Developer` table. All the data in the column will be lost.

*/
-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Developer" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "avatarUrl" TEXT NOT NULL,
    "capacity" REAL NOT NULL DEFAULT 1.0,
    "isPlaceholder" BOOLEAN NOT NULL DEFAULT false
);
INSERT INTO "new_Developer" ("avatarUrl", "capacity", "id", "isPlaceholder", "name", "role") SELECT "avatarUrl", "capacity", "id", "isPlaceholder", "name", "role" FROM "Developer";
DROP TABLE "Developer";
ALTER TABLE "new_Developer" RENAME TO "Developer";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
