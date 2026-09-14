"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
// adminEnrollment.routes.ts
const express_1 = __importDefault(require("express"));
const admin_controller_1 = require("../controllers/admin.controller");
const enrollment_controller_1 = require("../controllers/enrollment.controller");
const auth_1 = require("../middlewares/auth");
const router = express_1.default.Router();
// Get all enrollments (Admins only)
router.get("/enrollments", auth_1.authenticateAdmin, admin_controller_1.getEnrollments);
// Delete a specific enrollment
router.delete("/enrollments/:id", auth_1.authenticateAdmin, admin_controller_1.deleteEnrollment);
// Grant free enrollment privileges
router.patch("/enrollments/:id/grant-free", auth_1.authenticateAdmin, admin_controller_1.grantFreeEnrollment);
// Create or update a free enrollment for a student on a course
router.post("/enrollments/grant-free", auth_1.authenticateAdmin, admin_controller_1.adminGrantFreeEnrollment);
// Verify payment for a specific enrollment
router.patch("/enrollments/:id/verify-payment", auth_1.authenticateAdmin, enrollment_controller_1.verifyPayment);
exports.default = router;
