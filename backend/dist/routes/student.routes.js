"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const student_controller_1 = require("../controllers/student.controller");
const auth_1 = require("../middlewares/auth");
const router = express_1.default.Router();
console.log("✅ Loading Student Routes...");
router.get("/stats/:userId", auth_1.authenticateUser, student_controller_1.getStudentStats);
router.get("/courses/enrolled", auth_1.authenticateUser, student_controller_1.getEnrolledCourses);
router.get("/certificates", auth_1.authenticateUser, student_controller_1.getCertificates);
router.get("/progress/:courseId", auth_1.authenticateUser, student_controller_1.getStudentProgress);
router.put("/profile", auth_1.authenticateUser, student_controller_1.updateStudentProfile);
exports.default = router;
