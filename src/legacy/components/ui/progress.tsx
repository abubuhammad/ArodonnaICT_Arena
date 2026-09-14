import React from 'react';

interface ProgressProps {
  value: number; // Expected value between 0 and 100
  className?: string;
}

export const Progress: React.FC<ProgressProps> = ({ value, className = "" }) => {
  return (
    <div className={`w-full bg-gray-200 rounded ${className}`} style={{ height: "0.5rem" }}>
      <div className="bg-indigo-600 h-full rounded" style={{ width: `${value}%` }}></div>
    </div>
  );
};

export default Progress;
