import express, { RequestHandler } from "express";
import { register, login, refreshToken, getCurrentUser } from "../controllers/auth.controller";
import { authenticateUser } from "../middlewares/auth";
import { 
  getStudentStats, 
  getEnrolledCourses, 
  getCertificates 
} from "../controllers/student.controller";

const router = express.Router();

console.log("✅ User routes loaded"); 

// Auth routes
router.post("/register", register as RequestHandler);
router.post("/login", login as RequestHandler);
router.post("/refresh-token", refreshToken as RequestHandler);
router.get("/me", authenticateUser, getCurrentUser as RequestHandler);

// Student routes with authentication
router.get("/student/stats", authenticateUser, getStudentStats as RequestHandler);
router.get("/student/courses/enrolled", authenticateUser, getEnrolledCourses as RequestHandler);
router.get("/student/certificates", authenticateUser, getCertificates as RequestHandler);

export default router;