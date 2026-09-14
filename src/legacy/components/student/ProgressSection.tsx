import React from 'react';
import { Clock } from "lucide-react";
import { StudentStats } from '../../types';

interface ProgressSectionProps {
  stats: StudentStats | null;
}

const ProgressSection: React.FC<ProgressSectionProps> = ({ stats }) => {
  return (
    <div className="bg-white rounded-xl shadow-md p-6 mb-8">
      <h2 className="text-2xl font-semibold mb-4">Learning Progress</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <h3 className="text-lg font-medium mb-2">Overall Progress</h3>
          <div className="w-full bg-gray-200 rounded-full h-4">
            <div
              className="bg-blue-600 h-4 rounded-full"
              style={{ width: `${stats?.averageProgress || 0}%` }}
            />
          </div>
          <p className="text-sm text-gray-600 mt-2">
            {stats?.averageProgress || 0}% Complete
          </p>
        </div>
        <div>
          <h3 className="text-lg font-medium mb-2">Learning Time</h3>
          <div className="flex items-center">
            <Clock className="w-5 h-5 text-gray-500 mr-2" />
            <span>{stats?.totalHoursLearned || 0} hours spent learning</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProgressSection;
