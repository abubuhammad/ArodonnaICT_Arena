import React from 'react';
import { motion } from 'framer-motion';

interface StatsCardProps {
  label: string;
  value: string | number;
  icon?: React.ReactNode;
  accent?: string;
}

const StatsCard: React.FC<StatsCardProps> = ({ label, value, icon, accent = "from-indigo-500 to-purple-500" }) => (
  <motion.div
    initial={{ opacity: 0, y: 10 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.2 }}
    className="rounded-xl bg-white/80 dark:bg-slate-900/80 backdrop-blur shadow-sm border border-slate-200/80 dark:border-slate-800/80 p-4"
  >
    <div className="flex items-center justify-between">
      <div>
        <p className="text-sm text-slate-500 dark:text-slate-400">{label}</p>
        <p className="text-2xl font-semibold text-slate-900 dark:text-slate-100">{value}</p>
      </div>
      {icon && (
        <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${accent} text-white flex items-center justify-center shadow`}>
          {icon}
        </div>
      )}
    </div>
  </motion.div>
);

export default StatsCard;
