import React from 'react';
import { motion } from 'framer-motion';

interface DashboardHeaderProps {
  userName: string;
}

const DashboardHeader: React.FC<DashboardHeaderProps> = ({ userName }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      className="mb-8"
    >
      <h1 className="text-3xl font-bold">Student Dashboard</h1>
      <p className="text-gray-600">Welcome back, {userName}</p>
    </motion.div>
  );
};

export default DashboardHeader;
