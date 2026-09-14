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
    return <div className="flex min-h-[50vh] items-center justify-center bg-slate-50 p-6 text-sm text-slate-500 dark:bg-slate-950 dark:text-slate-400">Loading...</div>;
  }

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="mx-auto w-full max-w-md px-6 py-16"
    >
      <p className="text-xs font-medium uppercase leading-4 tracking-[0.18em] text-cyan-600 dark:text-cyan-400">Instructor application</p>
      <h1 className="mt-2 text-4xl font-bold leading-tight text-slate-950 dark:text-slate-50">Become an instructor</h1>
      
      {status === 'pending' ? (
        <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm leading-5 text-amber-800 dark:border-amber-500/30 dark:bg-amber-950/30 dark:text-amber-200" role="status">
          <p>
            Your instructor request is pending approval. We'll notify you once it's reviewed.
          </p>
        </div>
      ) : status === 'approved' ? (
        <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm leading-5 text-emerald-800 dark:border-emerald-500/30 dark:bg-emerald-950/30 dark:text-emerald-200" role="status">
          <p>
            You are now an instructor! Head to your dashboard to start creating courses.
          </p>
        </div>
      ) : (
        <div className="mt-8 rounded-xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <p className="text-base font-normal leading-6 text-slate-600 dark:text-slate-400">Share your knowledge with our community by becoming an instructor.</p>
          <button
            onClick={requestInstructorRole}
            className="mt-4 inline-flex h-10 items-center justify-center rounded-lg bg-indigo-600 px-4 text-sm font-medium leading-5 text-white transition-colors hover:bg-indigo-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-slate-950"
          >
            Request Instructor Role
          </button>
        </div>
      )}
    </motion.div>
  );
};

export default InstructorRequest;