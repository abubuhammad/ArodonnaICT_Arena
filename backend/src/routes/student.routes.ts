import express, { RequestHandler } from "express";
import { 
  getStudentStats, 
  getEnrolledCourses, 
  getCertificates,
  getStudentProgress,
  updateStudentProfile 
} from "../controllers/student.controller";
import { authenticateUser } from "../middlewares/auth";

const router = express.Router();

console.log("✅ Loading Student Routes...");

router.get("/stats/:userId", authenticateUser, getStudentStats as RequestHandler);
router.get("/courses/enrolled", authenticateUser, getEnrolledCourses as RequestHandler);
router.get("/certificates", authenticateUser, getCertificates as RequestHandler);
router.get("/progress/:courseId", authenticateUser, getStudentProgress as RequestHandler);
router.put("/profile", authenticateUser, updateStudentProfile as RequestHandler);

export default router;