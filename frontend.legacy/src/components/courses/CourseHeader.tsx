import React from "react";
import { motion } from "framer-motion";

const CourseHeader: React.FC = () => (
  <motion.div
    className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white p-6 rounded-lg shadow-md mb-6"
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
  >
    <h1 className="text-3xl font-bold">Create New Course</h1>
    <p className="mt-2 text-lg">Build your comprehensive course curriculum</p>
  </motion.div>
);

export default CourseHeader;
