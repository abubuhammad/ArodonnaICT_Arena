import React from 'react';
import { Users, BookOpen, Award, GraduationCap } from 'lucide-react';
import StatItem from '../common/StatItem';

const statsData = [
  {
    icon: Users,
    value: "5000+",
    label: "Active Learners"
  },
  {
    icon: BookOpen,
    value: "100+",
    label: "Courses"
  },
  {
    icon: Award,
    value: "2000+",
    label: "Certifications"
  },
  {
    icon: GraduationCap,
    value: "95%",
    label: "Success Rate"
  }
];

const StatsSection: React.FC = () => {
  return (
    <section className="py-12 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
          {statsData.map((stat, index) => (
            <StatItem
              key={index}
              icon={stat.icon}
              value={stat.value}
              label={stat.label}
            />
          ))}
        </div>
      </div>
    </section>
  );
};

export default StatsSection;