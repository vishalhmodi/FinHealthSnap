-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_CustomAssetLiability" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "quarterId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "detail" TEXT NOT NULL,
    "itemType" TEXT NOT NULL,
    "amount" REAL NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "updatedAt" DATETIME NOT NULL,
    "linkedAssetId" TEXT,
    CONSTRAINT "CustomAssetLiability_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "CustomAssetLiability_quarterId_fkey" FOREIGN KEY ("quarterId") REFERENCES "Quarter" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "CustomAssetLiability_linkedAssetId_fkey" FOREIGN KEY ("linkedAssetId") REFERENCES "CustomAssetLiability" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_CustomAssetLiability" ("amount", "detail", "id", "itemType", "name", "quarterId", "sortOrder", "updatedAt", "userId") SELECT "amount", "detail", "id", "itemType", "name", "quarterId", "sortOrder", "updatedAt", "userId" FROM "CustomAssetLiability";
DROP TABLE "CustomAssetLiability";
ALTER TABLE "new_CustomAssetLiability" RENAME TO "CustomAssetLiability";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
