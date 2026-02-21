-- CreateEnum ChatRole (safe, skips if already exists)
DO $$ BEGIN
    CREATE TYPE "ChatRole" AS ENUM ('ADMIN', 'MEMBER');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- AddColumn: role to chat_members (safe, skips if already exists)
ALTER TABLE "chat_members" ADD COLUMN IF NOT EXISTS "role" "ChatRole" NOT NULL DEFAULT 'MEMBER';

-- AddColumn: directKey to chats (safe, skips if already exists)
ALTER TABLE "chats" ADD COLUMN IF NOT EXISTS "directKey" TEXT;

-- AddUniqueIndex: chats_directKey_key (safe, skips if already exists)
CREATE UNIQUE INDEX IF NOT EXISTS "chats_directKey_key" ON "chats"("directKey");
