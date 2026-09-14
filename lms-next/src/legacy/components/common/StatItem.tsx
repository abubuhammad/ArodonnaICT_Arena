import React from 'react';
import { StatItemProps } from '../../types';

const StatItem: React.FC<StatItemProps> = ({ icon: Icon, value, label }) => {
  return (
    <div className="text-center">
      <Icon className="w-8 h-8 mx-auto text-indigo-600 mb-2" />
      <h3 className="text-3xl font-bold text-gray-900">{value}</h3>
      <p className="text-gray-600">{label}</p>
    </div>
  );
};

export default StatItem;