import React from "react";
import { Users, BookOpen, GraduationCap, Star, UserCheck, DollarSign } from "lucide-react";
import StatsCard from "../ui/StatsCard";

interface InstructorStats {
  totalStudents: number;
  totalCourses: number;
  completionRate: number;
  activeEnrollments: number;
  averageRating: number;
  totalRevenue: number;
}

interface StatsGridProps {
  stats: InstructorStats | null;
}

const StatsGrid: React.FC<StatsGridProps> = ({ stats }) => (
  <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
    <StatsCard
      icon={<Users className="w-8 h-8 text-blue-500" />}
      label="Total Students"
      value={stats?.totalStudents || 0}
    />
    <StatsCard
      icon={<BookOpen className="w-8 h-8 text-green-500" />}
      label="Active Courses"
      value={stats?.totalCourses || 0}
    />
    <StatsCard
      icon={<GraduationCap className="w-8 h-8 text-purple-500" />}
      label="Completion Rate"
      value={`${stats?.completionRate || 0}%`}
    />
    <StatsCard
      icon={<Star className="w-8 h-8 text-yellow-500" />}
      label="Average Rating"
      value={stats?.averageRating?.toFixed(1) || "0.0"}
    />
    <StatsCard
      icon={<UserCheck className="w-8 h-8 text-indigo-500" />}
      label="Active Enrollments"
      value={stats?.activeEnrollments || 0}
    />
    <StatsCard
      icon={<DollarSign className="w-8 h-8 text-green-600" />}
      label="Total Revenue"
      value={`${stats?.totalRevenue?.toLocaleString() || "0"}`}
    />
  </div>
);

export default StatsGrid;
