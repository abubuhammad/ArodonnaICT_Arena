"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const cookie_parser_1 = __importDefault(require("cookie-parser"));
const dotenv_1 = __importDefault(require("dotenv"));
const path_1 = __importDefault(require("path"));
const enrollment_routes_1 = __importDefault(require("./routes/enrollment.routes"));
const user_routes_1 = __importDefault(require("./routes/user.routes"));
const course_routes_1 = __importDefault(require("./routes/course.routes"));
const admin_routes_1 = __importDefault(require("./routes/admin.routes"));
const instructor_routes_1 = __importDefault(require("./routes/instructor.routes"));
const student_routes_1 = __importDefault(require("./routes/student.routes"));
const adminEnrollment_routes_1 = __importDefault(require("./routes/adminEnrollment.routes"));
const category_routes_1 = __importDefault(require("./routes/category.routes"));
const theme_routes_1 = __importDefault(require("./routes/theme.routes"));
dotenv_1.default.config();
const app = (0, express_1.default)();
// Middleware
const allowedOrigins = [
    "http://localhost:3000",
    "http://localhost:3001",
    "http://127.0.0.1:3000",
    "http://127.0.0.1:3001",
];
app.use((0, cors_1.default)({
    origin: (origin, callback) => {
        if (!origin)
            return callback(null, true);
        if (allowedOrigins.includes(origin))
            return callback(null, true);
        return callback(new Error('Not allowed by CORS'));
    },
    credentials: true,
    methods: ["GET", "POST", "PATCH", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use((0, cookie_parser_1.default)());
app.use(express_1.default.json({ limit: '50mb' }));
app.use(express_1.default.urlencoded({ extended: true, limit: '50mb' }));
app.use("/api/admin", adminEnrollment_routes_1.default);
app.use("/api/categories", category_routes_1.default);
app.use("/api/theme", theme_routes_1.default);
// Static file serving
app.use('/uploads', express_1.default.static(path_1.default.join(__dirname, '../public/uploads')));
// API routes
app.use("/api/enrollments", enrollment_routes_1.default);
app.use("/api/users", user_routes_1.default);
app.use("/api/courses", course_routes_1.default);
app.use("/api/admin", admin_routes_1.default);
app.use("/api/instructors", instructor_routes_1.default);
app.use("/api/students", student_routes_1.default);
console.log("✅ API Server is running...");
console.log("✅ Routes are being loaded...");
exports.default = app;
