import express, { Request, Response } from "express";
import { 
  requestInstructorRole, 
  approveInstructorRequest,
  getInstructorStats,
  getInstructorCourses,
  getEnrollmentProgress,
  getInstructorEarnings,
  getInstructorRequestStatus,
  getInstructorProfile,
  updateInstructorProfile
} from "../controllers/instructor.controller";
import {
  completeInstructorOnboarding,
  getInstructorProfile as getOnboardingProfile,
  getSupportedCountries
} from "../controllers/instructor.onboarding";
import { authenticateUser, authenticateAdmin } from "../middlewares/auth";
import { AuthRequest } from "../middlewares/auth";

const router = express.Router();

console.log("✅ Loading Instructor Routes...");

// ✅ Log each route registration
router.get("/request-status", authenticateUser, (req, res) => {
  console.log("✅ /request-status route is registered and being called");
  getInstructorRequestStatus(req, res);
});

router.post("/request-instructor", async (req, res) => {
  console.log("✅ /request-instructor route is registered");
  await requestInstructorRole(req, res);
});

router.put("/approve-instructor/:userId", authenticateAdmin, async (req, res) => {
  console.log("✅ /approve-instructor route is registered");
  await approveInstructorRequest(req, res);
});

// ✅ ADD THESE LOGS
router.get("/stats/:instructorId", authenticateUser, async (req, res) => {
  console.log(`✅ /stats/:instructorId route is registered`);
  console.log(`🔹 Fetching stats for instructor: ${req.params.instructorId}`);
  await getInstructorStats(req, res);
});

router.get("/courses/:instructorId", authenticateUser, async (req, res) => {
  console.log("✅ /courses/:instructorId route is registered");
  console.log(`🔹 Fetching courses for instructor: ${req.params.instructorId}`);
  await getInstructorCourses(req, res);
});

router.get("/enrollment-progress/:instructorId", authenticateUser, async (req, res) => {
  console.log("✅ /enrollment-progress/:instructorId route is registered");
  console.log(`🔹 Fetching enrollment progress for instructor: ${req.params.instructorId}`);
  await getEnrollmentProgress(req, res);
});

router.get('/earnings/:instructorId', authenticateUser, async (req, res) => {
  console.log('✅ /earnings/:instructorId route is registered');
  await getInstructorEarnings(req, res);
});

// Get instructor profile
router.get("/:id", authenticateUser, getInstructorProfile);

// Update instructor profile
router.put("/:id", authenticateUser, updateInstructorProfile);

// Onboarding endpoints
router.post("/onboarding/:userId", authenticateUser, completeInstructorOnboarding);
router.get("/onboarding/profile/:userId", authenticateUser, getOnboardingProfile);
router.get("/onboarding/countries", getSupportedCountries);

export default router;
