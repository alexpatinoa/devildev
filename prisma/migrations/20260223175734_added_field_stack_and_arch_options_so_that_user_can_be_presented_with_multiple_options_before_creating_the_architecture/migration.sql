-- AlterTable
ALTER TABLE "Architecture" ADD COLUMN     "stackId" TEXT;

-- CreateTable
CREATE TABLE "Stack" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "pros" TEXT[],
    "cons" TEXT[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Stack_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ArchOptions" (
    "id" TEXT NOT NULL,
    "chatId" TEXT NOT NULL,
    "requirement" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ArchOptions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "_ArchOptionsToStack" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,

    CONSTRAINT "_ArchOptionsToStack_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateIndex
CREATE INDEX "_ArchOptionsToStack_B_index" ON "_ArchOptionsToStack"("B");

-- AddForeignKey
ALTER TABLE "Architecture" ADD CONSTRAINT "Architecture_stackId_fkey" FOREIGN KEY ("stackId") REFERENCES "Stack"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ArchOptions" ADD CONSTRAINT "ArchOptions_chatId_fkey" FOREIGN KEY ("chatId") REFERENCES "Chat"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_ArchOptionsToStack" ADD CONSTRAINT "_ArchOptionsToStack_A_fkey" FOREIGN KEY ("A") REFERENCES "ArchOptions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_ArchOptionsToStack" ADD CONSTRAINT "_ArchOptionsToStack_B_fkey" FOREIGN KEY ("B") REFERENCES "Stack"("id") ON DELETE CASCADE ON UPDATE CASCADE;
