import React from 'react';
import { Trophy } from 'lucide-react';

interface AchievementsSectionProps {
  achievements: number;
}

export const AchievementsSection: React.FC<AchievementsSectionProps> = ({ achievements }) => (
  <div className="bg-white rounded-xl shadow-md p-6 mt-8">
    <h2 className="text-2xl font-semibold mb-4">Achievements</h2>
    <div className="flex items-center space-x-4">
      <Trophy className="w-8 h-8 text-yellow-500" />
      <span className="text-lg">{achievements} achievements unlocked</span>
    </div>
  </div>
);
