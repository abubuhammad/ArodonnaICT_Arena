import React, { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import axios from "axios";
import { motion } from "framer-motion";

const InstructorRequest = () => {
  const { user } = useSelector((state: any) => state.auth);
  const [status, setStatus] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStatus = async () => {
      try {
        const token = localStorage.getItem('token');
        const { data } = await axios.get("/api/instructors/request-status", {
          headers: { Authorization: `Bearer ${token}` }
        });
        setStatus(data.status);
      } catch (error) {
        console.error("Error fetching request status:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchStatus();
  }, []);

  const requestInstructorRole = async () => {
    try {
      const token = localStorage.getItem('token');
      await axios.post("/api/instructors/request-instructor", 
        { userId: user._id },
        { headers: { Authorization: `Bearer ${token}` }}
      );
      setStatus('pending');
    } catch (error) {
      console.error('Request failed:', error);
    }
  };

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="max-w-2xl mx-auto p-6"
    >
      <h2 className="text-3xl font-bold mb-6">Become an Instructor</h2>
      
      {status === 'pending' ? (
        <div className="bg-yellow-50 p-4 rounded-lg">
          <p className="text-yellow-700">
            Your instructor request is pending approval. We'll notify you once it's reviewed.
          </p>
        </div>
      ) : status === 'approved' ? (
        <div className="bg-green-50 p-4 rounded-lg">
          <p className="text-green-700">
            You are now an instructor! Head to your dashboard to start creating courses.
          </p>
        </div>
      ) : (
        <div>
          <p className="mb-4">Share your knowledge with our community by becoming an instructor.</p>
          <button
            onClick={requestInstructorRole}
            className="bg-indigo-600 text-white px-6 py-2 rounded-lg hover:bg-indigo-700"
          >
            Request Instructor Role
          </button>
        </div>
      )}
    </motion.div>
  );
};

export default InstructorRequest;