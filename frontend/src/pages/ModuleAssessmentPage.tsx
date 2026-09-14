// src/pages/ModuleAssessmentPage.tsx
import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { useSelector, useDispatch } from "react-redux";
import api from "../utils/api";
import { RootState, AppDispatch } from "../store";
import { setEnrollment as setEnrollmentAction } from "../store/slices/enrollmentSlice";
import { getModuleAssessment, submitModuleAssessment, SanitizedQuiz } from "../services/progressService";

interface Module {
  _id: string;
  title: string;
  description: string;
  order: number;
}

interface Course {
  _id: string;
  title: string;
  modules: Module[];
}

const ModuleAssessmentPage: React.FC = () => {
  const { courseId, moduleId } = useParams<{ courseId: string; moduleId: string }>();
  const navigate = useNavigate();
  const dispatch = useDispatch<AppDispatch>();

  const enrollment = useSelector((state: RootState) => state.enrollment.currentEnrollment as { _id: string } | null);
  const enrollmentId = enrollment?._id;

  const [courseData, setCourseData] = useState<Course | null>(null);
  const [moduleData, setModuleData] = useState<Module | null>(null);
  // Sanitized assessment (answers stripped) — grading always happens server-side.
  const [assessment, setAssessment] = useState<SanitizedQuiz | null>(null);
  const [selectedAnswers, setSelectedAnswers] = useState<string[]>([]);
  const [score, setScore] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string>("");

  // Auto-load enrollment if the user landed here directly (e.g. page refresh).
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
      if (!courseId || !moduleId || !enrollmentId) return;
      setLoading(true);
      setError("");
      try {
        const courseResponse = await api.get(`/courses/${courseId}`);
        const course: Course = courseResponse.data;
        setCourseData(course);
        const mod = (course.modules || []).find((m: Module) => m._id === moduleId);
        setModuleData(mod || null);

        const sanitized = await getModuleAssessment(enrollmentId, moduleId);
        setAssessment(sanitized);
        setSelectedAnswers(new Array(sanitized.questions.length).fill(""));
      } catch (err: any) {
        console.error("Error fetching module assessment:", err);
        setError(err?.response?.data?.error || "Failed to load assessment. Please try again.");
      } finally {
        setLoading(false);
      }
    })();
  }, [courseId, moduleId, enrollmentId]);

  const handleAnswerSelect = (questionIndex: number, answer: string) => {
    setSelectedAnswers((prev) => {
      const updated = [...prev];
      updated[questionIndex] = answer;
      return updated;
    });
  };

  const handleSubmitAssessment = async () => {
    if (!enrollmentId || !moduleId || submitting) return;
    setSubmitting(true);
    setError("");
    try {
      const result = await submitModuleAssessment(enrollmentId, moduleId, selectedAnswers);
      setScore(result.score);
      if (!result.passed) {
        setError(`Your score (${result.score}%) is below the passing threshold (${result.passingScore}%). Please try again.`);
        return;
      }
      // Passed — advance to the next module's first lesson, or on to the final assessment.
      const nextModule = courseData && moduleData
        ? (courseData.modules || []).filter((m) => m.order > moduleData.order).sort((a, b) => a.order - b.order)[0]
        : undefined;
      if (nextModule) {
        navigate(`/courses/${courseId}/modules/${nextModule._id}/lessons/0`);
      } else {
        navigate(`/courses/${courseId}/final-assessment`);
      }
    } catch (err: any) {
      console.error("Error submitting module assessment", err);
      setError(err?.response?.data?.error || "Failed to submit assessment. Please try again later.");
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
        <h2 className="text-2xl font-bold mb-4">{assessment?.title || "Module Assessment"}</h2>
        {error && <p className="text-red-500 mb-4">{error}</p>}
        {loading && <p className="text-gray-500">Loading assessment…</p>}
        {!loading && assessment && assessment.questions.length > 0 ? (
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
              onClick={handleSubmitAssessment}
              className="w-full px-4 py-2 bg-green-600 text-white rounded disabled:opacity-50"
              disabled={selectedAnswers.includes("") || submitting}
            >
              {submitting ? "Submitting…" : "Submit Assessment"}
            </button>
            {score !== null && <p className="mt-4">Your score: {score}%</p>}
          </>
        ) : (
          !loading && <p>No assessment available for this module.</p>
        )}
      </div>
    </motion.div>
  );
};

export default ModuleAssessmentPage;
