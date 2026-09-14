import React from 'react';
import { BookOpen, Award, CheckCircle } from "lucide-react";
import StatsCard from '../ui/StatsCard';
import { StudentStats } from '../../types';

interface StatsCardsSectionProps {
  stats: StudentStats | null;
}

const StatsCardsSection: React.FC<StatsCardsSectionProps> = ({ stats }) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
      <StatsCard
        icon={<BookOpen className="w-8 h-8 text-blue-500" />}
        label="Enrolled Courses"
        value={stats?.totalEnrolled || 0}
      />
      <StatsCard
        icon={<CheckCircle className="w-8 h-8 text-green-500" />}
        label="Completed Courses"
        value={stats?.coursesCompleted || 0}
      />
      <StatsCard
        icon={<Award className="w-8 h-8 text-purple-500" />}
        label="Certificates Earned"
        value={stats?.certificatesEarned || 0}
      />
    </div>
  );
};

export default StatsCardsSection;
