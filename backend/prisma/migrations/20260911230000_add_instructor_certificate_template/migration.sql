-- Add per-instructor certificate template configuration.
ALTER TABLE "User" ADD COLUMN "certificateTemplate" JSONB;
