// src/pages/FinalCourseAssessmentPage.tsx
import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { useSelector, useDispatch } from "react-redux";
import api from "../utils/api";
import { RootState, AppDispatch } from "../store";
import { setEnrollment as setEnrollmentAction } from "../store/slices/enrollmentSlice";
import { getFinalAssessment, submitFinalAssessment, SanitizedQuiz } from "../services/progressService";

const FinalCourseAssessmentPage: React.FC = () => {
  const { courseId } = useParams<{ courseId: string }>();
  const navigate = useNavigate();
  const dispatch = useDispatch<AppDispatch>();

  const enrollment = useSelector((state: RootState) => state.enrollment.currentEnrollment as { _id: string } | null);
  const enrollmentId = enrollment?._id;

  // Sanitized assessment (answers stripped) — grading always happens server-side.
  const [assessment, setAssessment] = useState<SanitizedQuiz | null>(null);
  const [selectedAnswers, setSelectedAnswers] = useState<string[]>([]);
  const [score, setScore] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string>("");

  useEffect(() => {
    (async () => {
      if (enrollmentId || !courseId) return;
      try {
        const resp = await api.get("/enrollments/my-courses");
        const found = (resp.data || []).find(
          (e: any) => String(e.courseId) === String(courseId) || String(e.courseId?._id) === String(courseId)
        );
        if (found) dispatch(setEnrollmentAction(found));
      } catch (err) {
        console.warn("Failed to auto-load enrollment", err);
      }
    })();
  }, [courseId, enrollmentId, dispatch]);

  useEffect(() => {
    (async () => {
      if (!enrollmentId) return;
      setLoading(true);
      setError("");
      try {
        const sanitized = await getFinalAssessment(enrollmentId);
        if (sanitized.unlocked === false) {
          setError("You need to pass every module before attempting the final assessment.");
        }
        setAssessment(sanitized);
        setSelectedAnswers(new Array(sanitized.questions.length).fill(""));
      } catch (err: any) {
        console.error("Error fetching final assessment:", err);
        setError(err?.response?.data?.error || "Failed to load final assessment. Please try again.");
      } finally {
        setLoading(false);
      }
    })();
  }, [enrollmentId]);

  const handleAnswerSelect = (index: number, answer: string) => {
    setSelectedAnswers((prev) => {
      const updated = [...prev];
      updated[index] = answer;
      return updated;
    });
  };

  const handleSubmitFinalAssessment = async () => {
    if (!enrollmentId || submitting) return;
    setSubmitting(true);
    setError("");
    try {
      const result = await submitFinalAssessment(enrollmentId, selectedAnswers);
      setScore(result.score);
      if (!result.passed) {
        setError(`Your score (${result.score}%) is below the passing threshold (${result.passingScore}%). Please try again.`);
        return;
      }
      // Passed — the backend has already issued a certificate. Hand it to the
      // certificate page via navigation state rather than re-fetching.
      navigate(`/courses/${courseId}/certificate`, { state: { certificate: result.certificate } });
    } catch (err: any) {
      console.error("Error submitting final assessment:", err);
      setError(err?.response?.data?.error || "Failed to submit final assessment. Please try again later.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <motion.div
      className="min-h-screen bg-gray-50 flex items-center justify-center p-8"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
    >
      <div className="bg-white p-8 rounded-lg shadow-md max-w-xl w-full">
        <h2 className="text-2xl font-bold mb-4">{assessment?.title || "Final Course Assessment"}</h2>
        {error && <p className="text-red-500 mb-4">{error}</p>}
        {loading && <p className="text-gray-500">Loading final assessment…</p>}
        {!loading && assessment && assessment.unlocked !== false && assessment.questions.length > 0 ? (
          <>
            {assessment.questions.map((q, idx) => (
              <div key={idx} className="mb-4 border p-4 rounded">
                <p className="font-semibold">{q.text}</p>
                <div className="flex flex-wrap gap-2 mt-2">
                  {(q.options || []).map((option) => (
                    <button
                      key={option}
                      onClick={() => handleAnswerSelect(idx, option)}
                      className={`px-3 py-1 border rounded ${
                        selectedAnswers[idx] === option ? "bg-blue-200" : ""
                      }`}
                    >
                      {option}
                    </button>
                  ))}
                </div>
              </div>
            ))}
            <button
              onClick={handleSubmitFinalAssessment}
              className="w-full px-4 py-2 bg-green-600 text-white rounded disabled:opacity-50"
              disabled={selectedAnswers.includes("") || submitting}
            >
              {submitting ? "Submitting…" : "Submit Final Assessment"}
            </button>
            {score !== null && <p className="mt-4">Your score: {score}%</p>}
          </>
        ) : (
          !loading && !error && <p>No final assessment available.</p>
        )}
      </div>
    </motion.div>
  );
};

export default FinalCourseAssessmentPage;
