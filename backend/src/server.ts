import app from "./app";
import dotenv from "dotenv";
import { verifyDbConnection } from "./lib/prisma";
import { startAutoPublisher } from './lib/autoPublisher';

dotenv.config();

const PORT = process.env.PORT || 5000;

async function start() {
  try {
    await verifyDbConnection();
  } catch (e) {
    console.error("❌ Supabase database connection failed:", e);
    process.exit(1);
  }

  app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));

  // Start background auto-publisher that will publish courses left in REVIEW for 24+ hours
  try {
    startAutoPublisher();
  } catch (err) {
    console.error('Failed to start auto-publisher:', err);
  }

  // Run a non-blocking CourseProgress consistency backfill on startup.
  // This will fill missing `lessonProgress` arrays when modules are present but empty.
  try {
    // Import lazily to avoid startup ordering issues
    const cpService = await import('./services/courseProgressService');
    cpService.backfillMissingLessonProgress().then((res: any) => {
      console.log('CourseProgress backfill completed:', res);
    }).catch((e: any) => {
      console.error('CourseProgress backfill failed:', e);
    });
  } catch (e) {
    console.error('Failed to schedule CourseProgress backfill:', e);
  }
}

start();
