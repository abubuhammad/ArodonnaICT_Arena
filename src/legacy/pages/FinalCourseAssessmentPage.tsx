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
      className="min-h-screen bg-slate-50 px-6 py-16 text-slate-950 dark:bg-slate-950 dark:text-slate-50"
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35 }}
    >
      <div className="mx-auto w-full max-w-3xl">
        <div className="mb-8">
          <p className="text-xs font-medium uppercase leading-4 tracking-[0.18em] text-cyan-600 dark:text-cyan-400">Final assessment</p>
          <h1 className="mt-2 text-4xl font-bold leading-tight text-slate-950 dark:text-slate-50">{assessment?.title || "Final Course Assessment"}</h1>
          <p className="mt-3 text-base font-normal leading-6 text-slate-600 dark:text-slate-400">Complete the course assessment to demonstrate what you have learned.</p>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
        {error && <p className="mb-6 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm leading-5 text-red-800 dark:border-red-500/30 dark:bg-red-950/30 dark:text-red-200" role="alert">{error}</p>}
        {loading && <p className="py-12 text-center text-sm font-normal leading-5 text-slate-500 dark:text-slate-400">Loading assessment...</p>}
        {!loading && assessment && assessment.unlocked !== false && assessment.questions.length > 0 ? (
          <>
            <div className="mb-8" aria-label="Assessment progress">
              <div className="flex items-center justify-between text-sm font-medium leading-5 text-slate-600 dark:text-slate-400">
                <span>{selectedAnswers.filter(Boolean).length} of {assessment.questions.length} answered</span>
                <span className="text-indigo-600 dark:text-indigo-400">{Math.round((selectedAnswers.filter(Boolean).length / assessment.questions.length) * 100)}%</span>
              </div>
              <div className="mt-2 h-3 overflow-hidden rounded-full bg-slate-200 dark:bg-slate-800" role="progressbar" aria-valuemin={0} aria-valuemax={assessment.questions.length} aria-valuenow={selectedAnswers.filter(Boolean).length} aria-label="Questions answered">
                <div className="h-full rounded-full bg-indigo-600 transition-[width] duration-300 dark:bg-indigo-400" style={{ width: `${(selectedAnswers.filter(Boolean).length / assessment.questions.length) * 100}%` }} />
              </div>
            </div>

            <div className="space-y-6">
            {assessment.questions.map((q, idx) => (
              <fieldset key={idx} className="rounded-xl border border-slate-200 p-6 dark:border-slate-800">
                <legend className="px-2 text-xs font-medium uppercase leading-4 tracking-[0.12em] text-indigo-600 dark:text-indigo-400">Question {idx + 1}</legend>
                <p className="text-base font-semibold leading-6 text-slate-950 dark:text-slate-50">{q.text}</p>
                <div className="mt-4 grid gap-3">
                  {(q.options || []).map((option) => (
                    <button
                      key={option}
                      onClick={() => handleAnswerSelect(idx, option)}
                      type="button"
                      className={`w-full rounded-lg border px-4 py-3 text-left text-sm font-medium leading-5 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 ${
                        selectedAnswers[idx] === option
                          ? "border-indigo-600 bg-indigo-50 text-indigo-700 ring-2 ring-indigo-500 dark:bg-indigo-500/10 dark:text-indigo-300"
                          : "border-slate-300 bg-white text-slate-700 hover:border-indigo-400 hover:bg-indigo-50/50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300 dark:hover:border-indigo-700 dark:hover:bg-indigo-500/10"
                      }`}
                    >
                      {option}
                    </button>
                  ))}
                </div>
              </fieldset>
            ))}
            </div>
            <button
              onClick={handleSubmitFinalAssessment}
              type="button"
              className="mt-8 h-11 w-full rounded-lg bg-indigo-600 px-6 text-sm font-medium leading-5 text-white shadow-sm transition-colors hover:bg-indigo-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 dark:focus-visible:ring-offset-slate-900"
              disabled={selectedAnswers.includes("") || submitting}
            >
              {submitting ? "Submitting..." : selectedAnswers.includes("") ? "Answer all questions to submit" : "Submit final assessment"}
            </button>
            {score !== null && <p className="mt-4 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium leading-5 text-emerald-800 dark:border-emerald-500/30 dark:bg-emerald-950/30 dark:text-emerald-200">Your score: {score}%</p>}
          </>
        ) : (
          !loading && !error && <div className="py-12 text-center"><h2 className="text-lg font-semibold leading-7 text-slate-950 dark:text-slate-50">No final assessment available</h2><p className="mt-2 text-sm font-normal leading-5 text-slate-500 dark:text-slate-400">There is no final assessment configured for this course.</p></div>
        )}
        </div>
      </div>
    </motion.div>
  );
};

export default FinalCourseAssessmentPage;
