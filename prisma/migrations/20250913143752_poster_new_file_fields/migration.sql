/*
  Warnings:

  - You are about to drop the column `fileType` on the `Poster` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[filePath]` on the table `Poster` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `fileMime` to the `Poster` table without a default value. This is not possible if the table is not empty.
  - Added the required column `fileName` to the `Poster` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "public"."Poster" DROP COLUMN "fileType",
ADD COLUMN     "fileMime" TEXT NOT NULL,
ADD COLUMN     "fileName" TEXT NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "Poster_filePath_key" ON "public"."Poster"("filePath");
