// src/pages/LessonPage.tsx
import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import api from "../utils/api";
import { getLessonQuiz, submitLessonQuiz, SanitizedQuiz } from "../services/progressService";
import { ChevronLeftIcon, ChevronRightIcon, CheckCircleIcon, LockClosedIcon } from "@heroicons/react/24/outline";
import CourseHeader from "../components/coursepage/CourseHeader";
import CourseProgress from "../components/coursepage/CourseProgress";
import InstructorInfo from "../components/coursepage/InstructorInfo";
import NavigationButtons from "../components/coursepage/NavigationButtons";
import { useSelector, useDispatch } from "react-redux";
import { RootState, AppDispatch } from "../store";
import { setEnrollment as setEnrollmentAction } from "../store/slices/enrollmentSlice";

// Extend your Lesson type to include quiz fields.
interface Lesson {
  id: string;
  _id?: string;  // Add _id as optional property
  title: string;
  description: string;
  lessonType: "text-only" | "text-and-video";
  content: string;
  videoUrl?: string;
  duration?: string;
  order: number;
  completed: boolean;
  hasQuiz?: boolean;
  // Legacy fields kept only for the instructor-builder form shape; the actual
  // quiz question/answer key is never trusted from the course payload — the
  // student-facing quiz is always fetched (answers stripped) from the backend.
  quizQuestion?: string;
  quizOptions?: string[];
  correctAnswer?: string;
}

interface Module {
  _id: string;
  title: string;
  description: string;
  lessons: Lesson[];
  assignment?: {
    title: string;
    description: string;
    completed: boolean;
  };
  assessment?: {
    title: string;
    description: string;
    completed: boolean;
  };
}

interface IModuleProgress {
  moduleId: string;
  lessons: {
    lessonId: string;
    completed: boolean;
  }[];
  completed: boolean;
}

interface IEnrollment {
  _id: string;
  userId: string;
  courseId: string;
  status: "enrolled" | "in-progress" | "completed";
  paymentStatus: "not-paid" | "pending" | "paid";
  progress: IModuleProgress[];
  progressPercentage: number;
}

const LessonPage: React.FC = () => {
  const { courseId, moduleId, lessonIndex } = useParams<{
    courseId: string;
    moduleId: string;
    lessonIndex: string;
  }>();
  const navigate = useNavigate();
  const dispatch = useDispatch<AppDispatch>();

  // Retrieve enrollment from Redux store with proper type
  const enrollment = useSelector((state: RootState) => state.enrollment.currentEnrollment as IEnrollment | null);
  const enrollmentId = enrollment?._id;

  const [currentModule, setCurrentModule] = useState<Module | null>(null);
  const [currentLesson, setCurrentLesson] = useState<Lesson | null>(null);
  const [progress, setProgress] = useState(0);
  const [enrollmentProgress, setEnrollmentProgress] = useState<any | null>(null);

  // Quiz-related state for interactive confirmation
  const [selectedAnswer, setSelectedAnswer] = useState<string>("");
  const [quizAnswered, setQuizAnswered] = useState(false);
  const [quizCorrect, setQuizCorrect] = useState(false);
  const [isQuizCompleted, setIsQuizCompleted] = useState(false);
  const [isCompletingLesson, setIsCompletingLesson] = useState<boolean>(false);

  // Sanitized quiz fetched from the server (never contains answer keys) and
  // whether it's currently loading/submitting.
  const [lessonQuiz, setLessonQuiz] = useState<SanitizedQuiz | null>(null);
  const [quizLoading, setQuizLoading] = useState(false);
  const [quizSubmitting, setQuizSubmitting] = useState(false);
  const [quizError, setQuizError] = useState<string | null>(null);

  const [course, setCourse] = useState<any>(null);

  const getProgressModule = (moduleId: string, moduleIndex?: number) => {
    const modules = Array.isArray(enrollmentProgress?.modules) ? enrollmentProgress.modules : [];
    return modules.find((module: any, index: number) =>
      String(module.moduleId ?? module.module) === String(moduleId) ||
      (moduleIndex !== undefined && index === moduleIndex)
    );
  };

  const getProgressLessons = (moduleProgress: any) => {
    const lessons = moduleProgress?.lessons ?? moduleProgress?.lessonProgress;
    return Array.isArray(lessons) ? lessons : [];
  };

  const goBack = () => {
    if (window.history.length > 1) navigate(-1);
    else navigate(`/courses/${courseId}`);
  };

  // Auto-load enrollment if missing
  useEffect(() => {
    (async () => {
      if (enrollmentId || !courseId) return;
      try {
        const token = localStorage.getItem('token');
        const resp = await api.get('/enrollments/my-courses', { headers: { Authorization: `Bearer ${token}` } });
        const myEnrollments = resp.data || [];
        const found = myEnrollments.find((e: any) => String(e.courseId) === String(courseId) || String(e.courseId?._id) === String(courseId));
        if (found) {
          console.log('Auto-loaded enrollment:', found._id);
          dispatch(setEnrollmentAction(found));
        } else {
          console.warn('No enrollment found for this course. Student may need to enroll first.');
        }
      } catch (err) {
        console.warn('Failed to auto-load enrollment', err);
      }
    })();
  }, [courseId, enrollmentId, dispatch]);

  useEffect(() => {
    const fetchModuleData = async () => {
      if (!courseId || !moduleId) return;
      try {
        console.log("📡 Fetching module data for course:", courseId, "module:", moduleId);
        const response = await api.get(`/courses/${courseId}`);
        const courseData = {
          ...response.data,
          modules: (response.data.modules || []).map((module: any) => ({
            ...module,
            _id: module._id || module.id,
            lessons: (module.lessons || []).map((lesson: any) => ({
              ...lesson,
              _id: lesson._id || lesson.id,
            })),
          })),
        };
        console.log("✅ Course data received:", courseData);
        
        setCourse(courseData);
        const mod: Module | undefined = (courseData.modules || []).find(
          (m: Module & { id?: string }) => String(m._id || m.id) === String(moduleId)
        );
        console.log("🔍 Found module:", mod);
        
        if (mod) {
          setCurrentModule(mod);
          const lessonIdx = parseInt(lessonIndex || "0", 10);
          console.log("📚 Current lesson index:", lessonIdx);
          const lesson = mod.lessons[lessonIdx];
          console.log("📖 Current lesson:", lesson);
          
          setCurrentLesson(lesson);
          // mark lesson as viewed (IN_PROGRESS) on open (defer if enrollmentId not yet loaded)
          setTimeout(() => {
            (async () => {
              try {
                const token = localStorage.getItem('token');
                const lid = lesson.id || lesson._id;
                const eid = enrollmentId || (enrollment?._id);
                if (eid && lid && token) {
                  await api.post(
                    `/enrollments/${eid}/lessons/${lid}/view`,
                    {},
                    { headers: { Authorization: `Bearer ${token}` } }
                  );
                  // refresh enrollment progress after view
                  try {
                    const resp = await api.get(`/enrollments/${eid}/progress`, { headers: { Authorization: `Bearer ${token}` } });
                    setEnrollmentProgress(resp.data);
                  } catch (e) {
                    console.warn('Failed to refresh enrollment progress', e);
                  }
                }
              } catch (e) {
                if ((e as any)?.response?.status !== 409) {
                  console.warn('Failed to mark lesson as viewed', e);
                }
              }
            })();
          }, 100);
          // Calculate progress (simple percentage based on lesson index)
          const calculatedProgress = (lessonIdx / mod.lessons.length) * 100;
          setProgress(calculatedProgress);
          // Reset quiz state when lesson changes
          setSelectedAnswer("");
          setQuizAnswered(false);
          setQuizCorrect(false);
          setIsQuizCompleted(false);
        } else {
          console.error("❌ Module not found:", moduleId);
        }
      } catch (error) {
        console.error("❌ Error fetching module data:", error);
      }
    };
    fetchModuleData();
  }, [courseId, moduleId, lessonIndex]);

  // refresh progress when enrollment changes
  useEffect(() => {
    (async () => {
      if (!enrollmentId) return;
      try {
        const token = localStorage.getItem('token');
        if (!token) return;
        const resp = await api.get(`/enrollments/${enrollmentId}/progress`, { headers: { Authorization: `Bearer ${token}` } });
        setEnrollmentProgress(resp.data);
      } catch (e) {
        // ignore
      }
    })();
  }, [enrollmentId]);

  // Fetch the sanitized quiz (answers stripped) whenever we land on a lesson
  // that has one. The correct-answer check always happens server-side.
  useEffect(() => {
    (async () => {
      setLessonQuiz(null);
      setQuizError(null);
      if (!currentLesson?.hasQuiz || !enrollmentId) return;
      const lessonId = currentLesson._id || currentLesson.id;
      if (!lessonId) return;
      setQuizLoading(true);
      try {
        const quiz = await getLessonQuiz(enrollmentId, lessonId);
        setLessonQuiz(quiz);
      } catch (err: any) {
        console.warn('Failed to load quiz for lesson', err);
        setQuizError(err?.response?.data?.error || 'Failed to load quiz for this lesson.');
      } finally {
        setQuizLoading(false);
      }
    })();
  }, [currentLesson, enrollmentId]);

  const handleAnswerSelect = (option: string) => {
    setSelectedAnswer(option);
  };

  /** Submits the learner's selected answer for server-side grading. Nothing
   * here compares against a correct answer locally — the backend is the only
   * source of truth for whether the quiz was passed. */
  const submitQuizAnswer = async () => {
    if (!lessonQuiz?.id || !enrollmentId || quizSubmitting) return;
    setQuizSubmitting(true);
    setQuizError(null);
    try {
      const result = await submitLessonQuiz(enrollmentId, lessonQuiz.id, [selectedAnswer]);
      setQuizAnswered(true);
      const passed = result.status === 'PASSED';
      setQuizCorrect(passed);
      setIsQuizCompleted(passed);
      if (passed) {
        const refreshedProgress = await refreshEnrollmentProgress();
        proceedAfterLessonComplete(refreshedProgress);
      } else if (result.status === 'FAILED') {
        setQuizError(`Not quite — you've used all your attempts for this quiz (score: ${result.score}%).`);
      } else {
        setQuizError(`Incorrect answer (score: ${result.score}%). ${result.attemptsRemaining ?? ''} attempt(s) remaining — try again.`);
      }
    } catch (err: any) {
      console.error('Quiz submit failed', err);
      const status = err?.response?.status;
      if (status === 409) {
        setQuizError(err?.response?.data?.error || 'No attempts remaining for this quiz.');
      } else {
        setQuizError(err?.response?.data?.error || 'Quiz submission failed. Please try again.');
      }
    } finally {
      setQuizSubmitting(false);
    }
  };

  /** Re-fetches the canonical enrollment progress from the server and syncs
   * local course/module lock state. Used after both a no-quiz completion and
   * a passed quiz submission, since either can unlock the next lesson/module. */
  const refreshEnrollmentProgress = async () => {
    const currentEnrollmentId = enrollment?._id || enrollmentId;
    if (!currentEnrollmentId) return null;
    const token = localStorage.getItem('token');
    try {
      const resp = await api.get(`/enrollments/${currentEnrollmentId}/progress`, { headers: { Authorization: `Bearer ${token}` } });
      const prog = resp.data;
      setEnrollmentProgress(prog);

      setCourse((prev: any) => {
        if (!prev) return prev;
        const modulesFromProgress = (prog && prog.modules) || [];
        return {
          ...prev,
          modules: prev.modules.map((m: Module) => {
            const mp = modulesFromProgress.find((x: any) => String(x.moduleId ?? x.module) === String(m._id));
            if (!mp) return m;
            return {
              ...m,
              lessons: m.lessons.map((l: Lesson) => {
                const lid = l._id || l.id;
                const lp = getProgressLessons(mp).find((ll: any) => String(ll.lessonId ?? ll.lesson) === String(lid));
                if (!lp) return l;
                return { ...l, completed: lp.status === 'PASSED' };
              })
            };
          })
        };
      });

      setCurrentModule((prev) => {
        if (!prev) return prev;
        const mp = (prog && prog.modules) ? prog.modules.find((x: any) => String(x.moduleId ?? x.module) === String(prev._id)) : undefined;
        if (!mp) return prev;
        return {
          ...prev,
          lessons: prev.lessons.map((l: Lesson) => {
            const lid = l._id || l.id;
            const lp = getProgressLessons(mp).find((ll: any) => String(ll.lessonId ?? ll.lesson) === String(lid));
            if (!lp) return l;
            return { ...l, completed: lp.status === 'PASSED' };
          })
        };
      });
      return prog;
    } catch (e) {
      console.warn('Failed to refresh enrollment progress:', e);
      return null;
    }
  };

  /** Once a lesson (quiz or non-quiz) is confirmed PASSED server-side, either
   * send the learner to the module assessment (if this was the module's last
   * lesson) or on to the next lesson. */
  const proceedAfterLessonComplete = (progressOverride?: any) => {
    const resolvedModule = currentModule || course?.modules?.find((module: Module) => String(module._id) === String(moduleId));
    if (!resolvedModule) return;
    const isLastLesson = resolvedModule.lessons.length - 1 === parseInt(lessonIndex || "0", 10);
    if (isLastLesson && resolvedModule.assessment) {
      navigate(`/courses/${courseId}/modules/${moduleId}/assessment`);
      return;
    }
    navigateToLesson("next", progressOverride);
  };

  const markLessonComplete = async () => {
    try {
      if (isCompletingLesson) return;
      setIsCompletingLesson(true);
      const token = localStorage.getItem("token");
      if (!token) {
        alert('Your session has expired. Please log in again.');
        navigate('/login');
        return;
      }

      // Wait for enrollmentId to be available (short polling)
      let currentEnrollmentId = enrollmentId;
      const start = Date.now();
      while (!currentEnrollmentId && Date.now() - start < 3000) {
        // wait up to 3s
        // eslint-disable-next-line no-await-in-loop
        await new Promise((r) => setTimeout(r, 200));
        currentEnrollmentId = (document && (window as any)) ? (enrollment?._id || enrollmentId) : enrollmentId;
      }
      if (!currentEnrollmentId) {
        alert('Enrollment not loaded yet. Please wait and try again.');
        setIsCompletingLesson(false);
        return;
      }

      const resolvedModule = currentModule || course?.modules?.find((module: Module) => String(module._id) === String(moduleId));
      const resolvedLesson = currentLesson || resolvedModule?.lessons?.[parseInt(lessonIndex || '0', 10)];
      const resolvedModuleId = resolvedModule?._id || moduleId;
      const resolvedLessonId = getLessonId(resolvedLesson || null);
      if (!resolvedModuleId || !resolvedLessonId) {
        console.error("Module or lesson is not ready", { moduleId, lessonIndex });
        alert('This lesson is still loading. Please try again in a moment.');
        return;
      }

      // Guard: ensure lesson is not LOCKED according to enrollmentProgress
      try {
        const moduleProg = getProgressModule(resolvedModuleId);
        const lessonIdKey = resolvedLessonId;
        const lessonProg = getProgressLessons(moduleProg).find((l: any) => String(l.lessonId ?? l.lesson) === String(lessonIdKey));
        if (lessonProg && lessonProg.status === 'LOCKED') {
          alert('This lesson is currently locked. Complete the previous lesson first.');
          setIsCompletingLesson(false);
          return;
        }
      } catch (e) {
        // non-fatal, continue to attempt
        console.warn('Could not verify lesson lock state before completing', e);
      }

      // This endpoint rejects lessons that have a quiz — those must go through
      // submitQuizAnswer instead, so there's no way to skip taking the quiz.
      await api.post(
        `/enrollments/${currentEnrollmentId}/lessons/${resolvedLessonId}/complete`,
        {
          moduleId: resolvedModuleId
        },
        { 
          headers: { 
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );

      // Refresh the canonical enrollment progress from server to avoid race conditions
      const refreshedProgress = await refreshEnrollmentProgress();
      proceedAfterLessonComplete(refreshedProgress);
    } catch (error: any) {
      console.error("Error updating progress", error);
      // Show friendly messages for known server responses
      const status = error?.response?.status;
      if (status === 409) {
        alert(error?.response?.data?.error || 'Cannot complete lesson: it is locked or requires a quiz.');
      } else if (status === 403) {
        alert('You are not authorized to complete this lesson.');
      } else {
        alert(`Failed to update progress: ${error?.response?.data?.error || error.message}`);
      }
    } finally {
      setIsCompletingLesson(false);
    }
  };

  const navigateToLesson = (direction: "prev" | "next", progressOverride?: any) => {
    if (!course || !currentModule) {
      console.error("❌ No course or module data available");
      return;
    }

    const activeProgress = progressOverride || enrollmentProgress;

    const currentModuleIndex = course.modules.findIndex((m: Module) => m._id === moduleId);
    const currentLessonIndex = parseInt(lessonIndex || "0", 10);

    // Check progress gating: require PASSED status for next step
    const moduleProg = (activeProgress && Array.isArray(activeProgress.modules))
      ? activeProgress.modules.find((x: any) => String(x.moduleId ?? x.module) === String(currentModule._id))
      : undefined;
    const lessonProg = getProgressLessons(moduleProg).find((l: any) => String(l.lessonId ?? l.lesson) === String(currentLesson?.id || currentLesson?._id));
    const lessonStatus = lessonProg?.status;

    if (direction === 'next') {
      // if lesson exists in progress and is locked or not passed, prevent moving forward
      if (lessonStatus && lessonStatus !== 'PASSED') {
        alert('You must complete this lesson before proceeding.');
        return;
      }
    }

    if (direction === "next") {
      const isLastLessonInModule = currentLessonIndex === currentModule.lessons.length - 1;

      if (isLastLessonInModule) {
        // Check if current module is completed
        // determine module completion from enrollmentProgress if available
        const isCurrentModuleCompleted = activeProgress
          ? getProgressLessons(
              (activeProgress.modules || []).find((x: any) => String(x.moduleId ?? x.module) === String(currentModule._id))
            ).every((l: any) => l.status === 'PASSED')
          : currentModule.lessons.every((lesson: Lesson) => lesson.completed);

        if (!isCurrentModuleCompleted) {
          // If we're on the last lesson and no assessment, allow progression by marking remaining lessons complete locally
          setCurrentModule((prev) => {
            if (!prev) return prev;
            return {
              ...prev,
              lessons: prev.lessons.map((l) => ({ ...l, completed: true }))
            };
          });
          setCourse((prev: any) => {
            if (!prev) return prev;
            return {
              ...prev,
              modules: prev.modules.map((m: Module) => m._id === currentModule._id
                ? { ...m, lessons: m.lessons.map((l: Lesson) => ({ ...l, completed: true })) }
                : m)
            };
          });
        }

        // If there's a module assignment
        if (currentModule.assessment) {
          navigate(`/courses/${courseId}/modules/${moduleId}/assessment`);
          return;
        }

        // Next module
        if (currentModuleIndex < course.modules.length - 1) {
          const nextModule = course.modules[currentModuleIndex + 1];
          navigate(`/courses/${courseId}/modules/${nextModule._id}/lessons/0`);
          return;
        }

        // Last module: go to assessment (if any) else stay
        if (currentModule.assessment) {
          navigate(`/courses/${courseId}/modules/${moduleId}/assessment`);
          return;
        }

        // No further modules/assessment; you may add completion behavior here
        return;
      }

      // Navigate to next lesson in current module
      const newPath = `/courses/${courseId}/modules/${moduleId}/lessons/${currentLessonIndex + 1}`;
      navigate(newPath);
    } else {
      // Previous navigation
      if (currentLessonIndex === 0) {
        // Check if there's a previous module
        if (currentModuleIndex > 0) {
          // Navigate to last lesson of previous module
          const prevModule = course.modules[currentModuleIndex - 1];
          const lastLessonIndex = prevModule.lessons.length - 1;
          console.log("🔄 Navigating to last lesson of previous module:", prevModule._id);
          navigate(`/courses/${courseId}/modules/${prevModule._id}/lessons/${lastLessonIndex}`);
          return;
        }
      } else {
        // Navigate to previous lesson in current module
        const newPath = `/courses/${courseId}/modules/${moduleId}/lessons/${currentLessonIndex - 1}`;
        console.log("🔄 Navigating to previous lesson:", newPath);
        navigate(newPath);
      }
    }
  };

  // Add this function to check if a lesson is completed
  const isLessonCompleted = (moduleId: string, lessonIndex: number) => {
    // prefer enrollmentProgress if available
    if (enrollmentProgress) {
      const mod = getProgressModule(moduleId);
      const lp = getProgressLessons(mod)[lessonIndex];
      return lp?.status === 'PASSED';
    }
    if (!course) return false;
    const module = course.modules.find((m: Module) => m._id === moduleId);
    if (!module) return false;
    return module.lessons[lessonIndex]?.completed || false;
  };

  // Normalize lesson id access
  const getLessonId = (lesson: Lesson | null) => {
    return lesson?._id || lesson?.id || undefined;
  };

  // Add this function to check if a module is unlocked
  const isModuleUnlocked = (moduleIndex: number) => {
    if (!course || moduleIndex === 0) return true;
    if (enrollmentProgress) {
      const prev = enrollmentProgress.modules?.[moduleIndex - 1];
      return getProgressLessons(prev).every((l: any) => l.status === 'PASSED');
    }
    const prevModule = course.modules[moduleIndex - 1];
    return prevModule.lessons.every((lesson: Lesson) => lesson.completed);
  };

  // Add this component for the sidebar
  const ModuleSidebar = () => (
    <div className="bg-white rounded-xl shadow-md p-6">
      <h3 className="text-lg font-semibold mb-4">Course Modules</h3>
      <div className="space-y-4">
        {course?.modules.map((module: Module, moduleIndex: number) => (
          <div key={module._id} className="border rounded-lg overflow-hidden">
            <div className={`p-3 ${module._id === moduleId ? 'bg-purple-50' : ''}`}>
              <h4 className="font-medium">{module.title}</h4>
            </div>
            <div className="divide-y">
              {module.lessons.map((lesson: Lesson, index: number) => {
                const isCompleted = isLessonCompleted(module._id, index);
                const isUnlocked = isModuleUnlocked(moduleIndex) && 
                  (index === 0 || isLessonCompleted(module._id, index - 1));
                const currentLessonIndex = parseInt(lessonIndex || "0", 10);
                const isCurrent = module._id === moduleId && currentLessonIndex === index;

                return (
                  <div
                    key={`${module._id}-${index}`}
                    className={`p-3 flex items-center justify-between ${
                      isCurrent ? 'bg-purple-100' : ''
                    }`}
                  >
                    <div className="flex items-center space-x-2">
                      {isCompleted ? (
                        <CheckCircleIcon className="w-5 h-5 text-green-500" />
                      ) : !isUnlocked ? (
                        <LockClosedIcon className="w-5 h-5 text-gray-400" />
                      ) : (
                        <div className="w-5 h-5" />
                      )}
                      <span className={`${!isUnlocked ? 'text-gray-400' : ''}`}>
                        {lesson.title}
                      </span>
                    </div>
                    {isUnlocked && !isCurrent && (
                      <button
                        onClick={() => navigate(`/courses/${courseId}/modules/${module._id}/lessons/${index}`)}
                        className="text-sm text-purple-600 hover:text-purple-800"
                      >
                        Go to
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  return (
    <motion.div
      className="min-h-screen bg-gray-50"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <button
          onClick={goBack}
          className="text-sm text-indigo-600 hover:text-indigo-700 flex items-center gap-2 mb-4"
        >
          ← Back
        </button>
        {/* Course Header */}
        <CourseHeader
          title={currentModule?.title || ""}
          description={currentLesson?.title || ""}
          totalLessons={currentModule?.lessons.length || 0}
          progress={progress}
        />

        {/* Main Content */}
        <div className="mt-8 grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Sidebar */}
          <div className="lg:col-span-1">
            <ModuleSidebar />
          </div>

          {/* Main Content */}
          <div className="lg:col-span-3">
          <motion.div
              className="bg-white rounded-xl shadow-md p-6"
            initial={{ y: 20 }}
            animate={{ y: 0 }}
          >
            {currentLesson?.videoUrl && (
              <div className="aspect-w-16 aspect-h-9 mb-6">
                <iframe
                  src={currentLesson.videoUrl}
                  title="Lesson Video"
                  className="w-full h-full rounded-lg"
                  allowFullScreen
                />
              </div>
            )}

            <div className="prose max-w-none">
              <h1 className="text-2xl font-bold mb-4">
                {currentLesson?.title}
              </h1>
              <div
                dangerouslySetInnerHTML={{
                  __html: currentLesson?.content || "",
                }}
              />
            </div>

            {/* Quiz Section: rendered from the sanitized quiz fetched from the
                server — the correct answer is never present in this payload,
                and grading always happens server-side in submitQuizAnswer. */}
            {currentLesson?.hasQuiz && (
              <div className="quiz-section mt-8 p-4 border rounded">
                <h3 className="text-xl font-bold mb-2">{lessonQuiz?.title || 'Quick Quiz'}</h3>
                {quizLoading && <p className="text-gray-500">Loading quiz…</p>}
                {!quizLoading && !lessonQuiz && (
                  <p className="text-red-600">{quizError || 'This quiz could not be loaded.'}</p>
                )}
                {!quizLoading && lessonQuiz && lessonQuiz.questions[0] && (
                  <>
                    <p className="mb-2">{lessonQuiz.questions[0].text}</p>
                    <div className="flex flex-wrap gap-2">
                      {lessonQuiz.questions[0].options?.map((option) => (
                        <button
                          key={option}
                          onClick={() => handleAnswerSelect(option)}
                          disabled={quizAnswered && quizCorrect}
                          className={`px-3 py-1 border rounded ${
                            selectedAnswer === option ? "bg-blue-200" : ""
                          }`}
                        >
                          {option}
                        </button>
                      ))}
                    </div>
                    {quizError && <p className="text-red-600 mt-2">{quizError}</p>}
                    {!(quizAnswered && quizCorrect) && (
                      <button
                        onClick={submitQuizAnswer}
                        className="mt-4 px-4 py-2 bg-yellow-500 text-white rounded disabled:opacity-50"
                        disabled={!selectedAnswer || quizSubmitting}
                      >
                        {quizSubmitting ? 'Submitting…' : 'Submit Answer'}
                      </button>
                    )}
                    {quizAnswered && quizCorrect && (
                      <p className="mt-4 text-green-700 font-medium">✓ Passed — moving on…</p>
                    )}
                  </>
                )}
              </div>
            )}

              {/* Non-quiz lessons: explicit mark-complete button */}
              {!currentLesson?.hasQuiz && (
                <div className="mt-4">
                  {!isLessonCompleted(currentModule?._id || '', parseInt(lessonIndex || '0', 10)) && (
                    <button
                      onClick={markLessonComplete}
                      disabled={isCompletingLesson || !currentModule || !currentLesson}
                      className="px-4 py-2 bg-green-600 text-white rounded disabled:opacity-50"
                    >
                      {isCompletingLesson ? 'Completing...' : 'Mark as Complete'}
                    </button>
                  )}
                </div>
              )}

            {/* Lesson Navigation */}
            <div className="mt-8 flex justify-between items-center">
              <button
                onClick={() => navigateToLesson("prev")}
                  className="flex items-center space-x-2 text-gray-600 hover:text-gray-900 disabled:opacity-50 disabled:cursor-not-allowed"
                  disabled={!course || !currentModule || (course.modules.findIndex((m: Module) => m._id === moduleId) === 0 && parseInt(lessonIndex || "0", 10) === 0)}
              >
                <ChevronLeftIcon className="w-5 h-5" />
                <span>Previous Lesson</span>
              </button>

              <button
                onClick={() => navigateToLesson("next")}
                  className="flex items-center space-x-2 text-gray-600 hover:text-gray-900 disabled:opacity-50 disabled:cursor-not-allowed"
                  disabled={!course || !currentModule || (course.modules.findIndex((m: Module) => m._id === moduleId) === course.modules.length - 1 && parseInt(lessonIndex || "0", 10) === currentModule.lessons.length - 1)}
              >
                <span>Next Lesson</span>
                <ChevronRightIcon className="w-5 h-5" />
              </button>
            </div>
          </motion.div>
          </div>
        </div>

        <NavigationButtons
          onBack={() => navigate(`/courses/${courseId}`)}
          onStartLearning={() => {}}
          showStartLearning={false}
        />
      </div>
    </motion.div>
  );
};

export default LessonPage;
