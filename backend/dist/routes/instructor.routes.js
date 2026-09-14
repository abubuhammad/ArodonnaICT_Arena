"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const instructor_controller_1 = require("../controllers/instructor.controller");
const instructor_onboarding_1 = require("../controllers/instructor.onboarding");
const auth_1 = require("../middlewares/auth");
const router = express_1.default.Router();
console.log("✅ Loading Instructor Routes...");
// ✅ Log each route registration
router.get("/request-status", auth_1.authenticateUser, (req, res) => {
    console.log("✅ /request-status route is registered and being called");
    (0, instructor_controller_1.getInstructorRequestStatus)(req, res);
});
router.post("/request-instructor", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    console.log("✅ /request-instructor route is registered");
    yield (0, instructor_controller_1.requestInstructorRole)(req, res);
}));
router.put("/approve-instructor/:userId", auth_1.authenticateAdmin, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    console.log("✅ /approve-instructor route is registered");
    yield (0, instructor_controller_1.approveInstructorRequest)(req, res);
}));
// ✅ ADD THESE LOGS
router.get("/stats/:instructorId", auth_1.authenticateUser, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    console.log(`✅ /stats/:instructorId route is registered`);
    console.log(`🔹 Fetching stats for instructor: ${req.params.instructorId}`);
    yield (0, instructor_controller_1.getInstructorStats)(req, res);
}));
router.get("/courses/:instructorId", auth_1.authenticateUser, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    console.log("✅ /courses/:instructorId route is registered");
    console.log(`🔹 Fetching courses for instructor: ${req.params.instructorId}`);
    yield (0, instructor_controller_1.getInstructorCourses)(req, res);
}));
router.get("/enrollment-progress/:instructorId", auth_1.authenticateUser, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    console.log("✅ /enrollment-progress/:instructorId route is registered");
    console.log(`🔹 Fetching enrollment progress for instructor: ${req.params.instructorId}`);
    yield (0, instructor_controller_1.getEnrollmentProgress)(req, res);
}));
router.get('/earnings/:instructorId', auth_1.authenticateUser, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    console.log('✅ /earnings/:instructorId route is registered');
    yield (0, instructor_controller_1.getInstructorEarnings)(req, res);
}));
// Get instructor profile
router.get("/:id", auth_1.authenticateUser, instructor_controller_1.getInstructorProfile);
// Update instructor profile
router.put("/:id", auth_1.authenticateUser, instructor_controller_1.updateInstructorProfile);
// Onboarding endpoints
router.post("/onboarding/:userId", auth_1.authenticateUser, instructor_onboarding_1.completeInstructorOnboarding);
router.get("/onboarding/profile/:userId", auth_1.authenticateUser, instructor_onboarding_1.getInstructorProfile);
router.get("/onboarding/countries", instructor_onboarding_1.getSupportedCountries);
exports.default = router;
