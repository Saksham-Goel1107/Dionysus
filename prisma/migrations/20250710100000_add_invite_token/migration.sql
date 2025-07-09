-- Add inviteToken field to Project table
ALTER TABLE "Project" ADD COLUMN "inviteToken" TEXT;

-- Generate random tokens for existing projects
UPDATE "Project" SET "inviteToken" = md5(random()::text);

-- Make inviteToken non-nullable after filling existing rows
ALTER TABLE "Project" ALTER COLUMN "inviteToken" SET NOT NULL;

-- Add index for faster lookups by token
CREATE INDEX "Project_inviteToken_idx" ON "Project"("inviteToken");
