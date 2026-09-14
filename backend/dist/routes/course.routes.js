"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const multer_1 = __importDefault(require("multer"));
const path_1 = __importDefault(require("path"));
const course_controller_1 = require("../controllers/course.controller");
const platform_controller_1 = require("../controllers/platform.controller");
const auth_1 = require("../middlewares/auth");
const storage = multer_1.default.diskStorage({
    destination: 'public/uploads/',
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, file.fieldname + '-' + uniqueSuffix + path_1.default.extname(file.originalname));
    }
});
const upload = (0, multer_1.default)({ storage });
const markdownUpload = (0, multer_1.default)({
    storage: multer_1.default.memoryStorage(),
    limits: { fileSize: 1024 * 1024 },
});
const router = express_1.default.Router();
// Public route for viewing available courses
router.get("/public", course_controller_1.getPublicCourses);
// Platform settings (admin)
router.get('/settings', auth_1.authenticateUser, platform_controller_1.getPlatformSettings);
router.put('/settings', auth_1.authenticateAdmin, platform_controller_1.updatePlatformSettings);
// Protected routes
router.get("/categories", auth_1.authenticateUser, course_controller_1.getCategories);
router.get("/:courseId", auth_1.authenticateUser, course_controller_1.getCourseById);
// Create a course (instructor only)
router.post("/", auth_1.authenticateInstructor, course_controller_1.createCourse);
// Import a course via JSON (instructor only) - same shape as createCourse body
router.post("/import", auth_1.authenticateInstructor, course_controller_1.importCourse);
// Import a course from the documented Markdown template (instructor only)
router.post("/import-markdown", auth_1.authenticateInstructor, markdownUpload.single("course"), course_controller_1.importMarkdownCourse);
// Upload thumbnail (instructor only)
router.post("/upload-thumbnail", auth_1.authenticateInstructor, upload.single('thumbnail'), course_controller_1.uploadThumbnail);
// Get all courses (instructor can see their own courses)
router.get("/", auth_1.authenticateUser, course_controller_1.getCourses);
// Enroll in a course
router.post("/enroll", auth_1.authenticateUser, course_controller_1.enrollInCourse);
// Get enrolled courses
router.get("/enrolled", auth_1.authenticateUser, course_controller_1.getEnrolledCourses);
// Delete a course (instructor only)
router.delete("/:courseId", auth_1.authenticateInstructorOrAdmin, course_controller_1.deleteCourse);
// Update a course (instructor only)
router.put("/:courseId", auth_1.authenticateInstructorOrAdmin, course_controller_1.updateCourse);
// Update course status (instructor: DRAFT/REVIEW, admin: any status)
router.patch("/:courseId/status", auth_1.authenticateInstructorOrAdmin, course_controller_1.updateCourseStatus);
// Log all routes for debugging
console.log("✅ Course Routes loaded:", router.stack.map(r => { var _a; return (_a = r.route) === null || _a === void 0 ? void 0 : _a.path; }).filter(Boolean));
exports.default = router;
