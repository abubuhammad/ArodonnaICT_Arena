import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import dotenv from "dotenv";
import path from "path";
import enrollmentRoutes from "./routes/enrollment.routes";
import userRoutes from "./routes/user.routes";
import courseRoutes from "./routes/course.routes";
import adminRoutes from "./routes/admin.routes";
import instructorRoutes from "./routes/instructor.routes";
import studentRoutes from "./routes/student.routes";
import adminEnrollmentRoutes from "./routes/adminEnrollment.routes";
import categoryRoutes from "./routes/category.routes";
import themeRoutes from "./routes/theme.routes";
import certificateRoutes from "./routes/certificate.routes";
dotenv.config();

const app = express();

// Middleware
const allowedOrigins = [
  "http://localhost:3000",
  "http://localhost:3001",
  "http://127.0.0.1:3000",
  "http://127.0.0.1:3001",
];

app.use(cors({ 
  origin: (origin, callback) => {
    if (!origin) return callback(null, true);
    if (allowedOrigins.includes(origin)) return callback(null, true);
    return callback(new Error('Not allowed by CORS'));
  },
  credentials: true,
  methods: ["GET", "POST", "PATCH", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(cookieParser());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));
app.use("/api/admin", adminEnrollmentRoutes);
app.use("/api/categories", categoryRoutes);
app.use("/api/theme", themeRoutes);

// Static file serving
app.use('/uploads', express.static(path.join(__dirname, '../public/uploads')));
app.use("/api/certificates", certificateRoutes);


// API routes
app.use("/api/enrollments", enrollmentRoutes);
app.use("/api/users", userRoutes);
app.use("/api/courses", courseRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/instructors", instructorRoutes);
app.use("/api/students", studentRoutes);

console.log("✅ API Server is running...");
console.log("✅ Routes are being loaded...");

export default app;