import React from "react";
import { motion } from "framer-motion";

interface NavigationButtonsProps {
  onBack: () => void;
  onStartLearning: () => void;
  showStartLearning: boolean;
}

const NavigationButtons: React.FC<NavigationButtonsProps> = ({
  onBack,
  onStartLearning,
  showStartLearning,
}) => {
  return (
    <motion.div
      className="mt-6 flex justify-between"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: 0.5 }}
    >
      <motion.button
        onClick={onBack}
        className="px-6 py-3 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors"
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
      >
        Back to Courses
      </motion.button>
      
      {showStartLearning && (
        <motion.button
          onClick={onStartLearning}
          className="px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          Start Learning
        </motion.button>
      )}
    </motion.div>
  );
};

export default NavigationButtons;
