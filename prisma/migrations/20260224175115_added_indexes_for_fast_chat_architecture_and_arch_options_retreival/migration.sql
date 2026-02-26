-- CreateIndex
CREATE INDEX "ArchOptions_chatId_createdAt_idx" ON "ArchOptions"("chatId", "createdAt" DESC);

-- CreateIndex
CREATE INDEX "Architecture_chatId_createdAt_idx" ON "Architecture"("chatId", "createdAt" ASC);

-- CreateIndex
CREATE INDEX "Chat_userId_updatedAt_idx" ON "Chat"("userId", "updatedAt" DESC);
