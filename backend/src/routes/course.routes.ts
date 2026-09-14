import express, { Request, Response, RequestHandler } from "express";
import multer from "multer";
import path from "path";
import { 
  createCourse, 
  importCourse,
  importMarkdownCourse,
  getCourses, 
  enrollInCourse, 
  getCourseById,
  getCategories,
  uploadThumbnail,
  deleteCourse,
  getPublicCourses,
  getEnrolledCourses,
  updateCourse,
  updateCourseStatus,
  getPublicCourseById
} from "../controllers/course.controller";
import { getPlatformSettings, updatePlatformSettings } from '../controllers/platform.controller';
import { authenticateUser, authenticateInstructor, authenticateInstructorOrAdmin, authenticateAdmin } from "../middlewares/auth";

const storage = multer.diskStorage({
  destination: 'public/uploads/',
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ storage });
const markdownUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 1024 * 1024 },
});
const router = express.Router();

// Public route for viewing available courses
router.get("/public", getPublicCourses);
router.get("/public/:courseId", getPublicCourseById as RequestHandler);

// Platform settings (admin)
router.get('/settings', authenticateUser, getPlatformSettings as RequestHandler);
router.put('/settings', authenticateAdmin, updatePlatformSettings as RequestHandler);

// Protected routes
router.get("/categories", authenticateUser, getCategories as RequestHandler);
router.get("/:courseId", authenticateUser, getCourseById as RequestHandler);

// Create a course (instructor only)
router.post("/", authenticateInstructor, createCourse as RequestHandler);

// Import a course via JSON (instructor only) - same shape as createCourse body
router.post("/import", authenticateInstructor, importCourse as RequestHandler);

// Import a course from the documented Markdown template (instructor only)
router.post("/import-markdown", authenticateInstructor, markdownUpload.single("course"), importMarkdownCourse as RequestHandler);

// Upload thumbnail (instructor only)
router.post("/upload-thumbnail", authenticateInstructor, upload.single('thumbnail'), uploadThumbnail as RequestHandler);

// Get all courses (instructor can see their own courses)
router.get("/", authenticateUser, getCourses as RequestHandler);

// Enroll in a course
router.post("/enroll", authenticateUser, enrollInCourse as RequestHandler);

// Get enrolled courses
router.get("/enrolled", authenticateUser, getEnrolledCourses as RequestHandler);

// Delete a course (instructor only)
router.delete("/:courseId", authenticateInstructorOrAdmin, deleteCourse as RequestHandler);

// Update a course (instructor only)
router.put("/:courseId", authenticateInstructorOrAdmin, updateCourse as RequestHandler);

// Update course status (instructor: DRAFT/REVIEW, admin: any status)
router.patch("/:courseId/status", authenticateInstructorOrAdmin, updateCourseStatus as RequestHandler);

// Log all routes for debugging
console.log("✅ Course Routes loaded:", router.stack.map(r => r.route?.path).filter(Boolean));

export default router;
