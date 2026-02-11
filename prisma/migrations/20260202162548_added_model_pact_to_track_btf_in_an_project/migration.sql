-- CreateEnum
CREATE TYPE "PactType" AS ENUM ('BUG', 'TASK', 'FEATURE');

-- CreateEnum
CREATE TYPE "PactStatus" AS ENUM ('PENDING', 'IN_PROGRESS', 'COMPLETED');

-- CreateTable
CREATE TABLE "Pact" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "type" "PactType" NOT NULL,
    "status" "PactStatus" NOT NULL DEFAULT 'PENDING',
    "head" TEXT NOT NULL,
    "body" TEXT,
    "githubIssue" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Pact_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Pact_projectId_type_idx" ON "Pact"("projectId", "type");

-- AddForeignKey
ALTER TABLE "Pact" ADD CONSTRAINT "Pact_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;
