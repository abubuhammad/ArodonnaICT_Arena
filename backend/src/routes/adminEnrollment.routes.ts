// adminEnrollment.routes.ts
import express from "express";
import { getEnrollments, deleteEnrollment, grantFreeEnrollment, adminGrantFreeEnrollment } from "../controllers/admin.controller";
import { verifyPayment } from "../controllers/enrollment.controller";
import { authenticateAdmin } from "../middlewares/auth";

const router = express.Router();

// Get all enrollments (Admins only)
router.get("/enrollments", authenticateAdmin, getEnrollments);

// Delete a specific enrollment
router.delete("/enrollments/:id", authenticateAdmin, deleteEnrollment);

// Grant free enrollment privileges
router.patch("/enrollments/:id/grant-free", authenticateAdmin, grantFreeEnrollment);

// Create or update a free enrollment for a student on a course
router.post("/enrollments/grant-free", authenticateAdmin, adminGrantFreeEnrollment);

// Verify payment for a specific enrollment
router.patch("/enrollments/:id/verify-payment", authenticateAdmin, verifyPayment);

export default router;
