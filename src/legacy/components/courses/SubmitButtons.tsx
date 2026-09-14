import React from "react";
import { motion } from "framer-motion";

interface SubmitButtonsProps {
  loading: boolean;
  onCancel: () => void;
}

const SubmitButtons: React.FC<SubmitButtonsProps> = ({ loading, onCancel }) => {
  return (
    <div className="flex justify-between">
      <motion.button
        type="button"
        onClick={onCancel}
        className="px-6 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600"
        whileHover={{ scale: 1.05 }}
      >
        Cancel
      </motion.button>
      <motion.button
        type="submit"
        disabled={loading}
        className="px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:bg-purple-300"
        whileHover={{ scale: loading ? 1 : 1.05 }}
      >
        {loading ? "Creating..." : "Create Course"}
      </motion.button>
    </div>
  );
};

export default SubmitButtons;
