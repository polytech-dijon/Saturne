/*
  Warnings:

  - The values [SCHEDULED,PUBLISHED,ARCHIVED] on the enum `PosterStatus` will be removed. If these variants are still used in the database, this will fail.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "public"."PosterStatus_new" AS ENUM ('DRAFT', 'READY', 'DISABLED');
ALTER TABLE "public"."Poster" ALTER COLUMN "status" DROP DEFAULT;
ALTER TABLE "public"."Poster" ALTER COLUMN "status" TYPE "public"."PosterStatus_new" USING ("status"::text::"public"."PosterStatus_new");
ALTER TYPE "public"."PosterStatus" RENAME TO "PosterStatus_old";
ALTER TYPE "public"."PosterStatus_new" RENAME TO "PosterStatus";
DROP TYPE "public"."PosterStatus_old";
ALTER TABLE "public"."Poster" ALTER COLUMN "status" SET DEFAULT 'DRAFT';
COMMIT;
