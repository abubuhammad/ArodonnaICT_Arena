import React from "react";
import { motion } from "framer-motion";

interface Instructor {
  _id: string;
  name: string;
  title: string;
  avatar: string;
  isAvailableForCall?: boolean; // optional flag to indicate live video availability
}

interface InstructorInfoProps {
  instructor: Instructor; // Remove the | null since instructor is required
}

const InstructorInfo: React.FC<InstructorInfoProps> = ({ instructor }) => {
  return (
    <motion.div
      className="mt-6 flex items-center space-x-4 p-6 bg-white rounded-lg shadow-md"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: 0.2 }}
    >
      <img
        src={instructor.avatar}
        alt={instructor.name}
        className="w-16 h-16 rounded-full object-cover"
      />
      <div>
        <h2 className="text-xl font-semibold">{instructor.name}</h2>
        <p className="text-gray-600">{instructor.title}</p>
      </div>
    </motion.div>
  );
};

export default InstructorInfo;
