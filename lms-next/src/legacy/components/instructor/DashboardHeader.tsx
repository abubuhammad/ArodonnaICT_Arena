import React from "react";
import { motion } from "framer-motion";

interface InstructorStats {
  totalStudents: number;
  totalCourses: number;
  completionRate: number;
  activeEnrollments: number;
  averageRating: number;
  totalRevenue: number;
}

interface DashboardHeaderProps {
  user: any;
  stats: InstructorStats | null;
}

const DashboardHeader: React.FC<DashboardHeaderProps> = ({ user, stats }) => (
  <motion.div
    initial={{ opacity: 0, y: -20 }}
    animate={{ opacity: 1, y: 0 }}
    className="mb-8"
  >
    <h1 className="text-3xl font-bold">Instructor Dashboard</h1>
    <p className="text-gray-600">Welcome back, {user?.name}</p>
    {stats && (
      <p className="text-sm text-gray-500 mt-2">
        Total Revenue: ${stats.totalRevenue.toLocaleString()}
      </p>
    )}
  </motion.div>
);

export default DashboardHeader;
