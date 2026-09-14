"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const auth_controller_1 = require("../controllers/auth.controller");
const auth_1 = require("../middlewares/auth");
const student_controller_1 = require("../controllers/student.controller");
const router = express_1.default.Router();
console.log("✅ User routes loaded");
// Auth routes
router.post("/register", auth_controller_1.register);
router.post("/login", auth_controller_1.login);
router.post("/refresh-token", auth_controller_1.refreshToken);
router.get("/me", auth_1.authenticateUser, auth_controller_1.getCurrentUser);
// Student routes with authentication
router.get("/student/stats", auth_1.authenticateUser, student_controller_1.getStudentStats);
router.get("/student/courses/enrolled", auth_1.authenticateUser, student_controller_1.getEnrolledCourses);
router.get("/student/certificates", auth_1.authenticateUser, student_controller_1.getCertificates);
exports.default = router;
