import React, { useEffect, useState } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import api from "../utils/api";
import { motion } from "framer-motion";
import { useSelector, useDispatch } from "react-redux";
import { RootState, AppDispatch } from "../store";
import { setEnrollment as setEnrollmentAction } from "../store/slices/enrollmentSlice";
import { refreshToken } from "../store/slices/authSlice";

// Import modular components from coursepage folder
import CourseHeader from "../components/coursepage/CourseHeader";
import InstructorInfo from "../components/coursepage/InstructorInfo";
import CourseProgress from "../components/coursepage/CourseProgress";
import ModulesSection, { Module } from "../components/coursepage/ModulesSection";
import NavigationButtons from "../components/coursepage/NavigationButtons";
import LiveVideoChat from "../components/coursepage/LiveVideoChat";
import CodeExecutor from "../components/coursepage/CodeExecutor";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "/api";

interface CodeExercise {
  language: string;
  initialCode: string;
  expectedOutput?: string;
}

interface Lesson {
  _id: string;
  title: string;
  content: string;
  type: 'text' | 'code' | 'video';
  codeExercise?: CodeExercise;
  quizQuestion?: string;
  quizOptions?: string[];
  correctAnswer?: string;
  completed?: boolean;
}

interface ModuleType extends Module {
  lessons: Lesson[];
}

interface Instructor {
  _id: string;
  name: string;
  title: string;
  avatar: string;
  isAvailableForCall?: boolean;
}

interface Course {
  _id: string;
  title: string;
  description: string;
  category: string;
  instructor: Instructor;
  price: number;
  isFree: boolean;
  enrolledStudents: string[];
  modules: ModuleType[];
  thumbnail: string;
  progress?: number; // global progress if available
}

interface Enrollment {
  _id: string;
  userId: string;
  courseId: {
    _id: string;
    title: string;
  };
  status: "enrolled" | "in-progress" | "completed";
  paymentStatus: "not-paid" | "pending" | "paid";
  paymentMethod?: "paystack" | "bank-transfer";
  paymentReference?: string;
  createdAt: string;
  progressPercentage: number;
  progress?: {
    moduleId: string;
    lessons: {
      lessonId: string;
      completed: boolean;
    }[];
    completed: boolean;
  }[];
}

const CoursePage: React.FC = () => {
  const { courseId } = useParams<{ courseId: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const { user, token } = useSelector((state: RootState) => state.auth);
  const dispatch = useDispatch<AppDispatch>();
  const [course, setCourse] = useState<Course | null>(null);
  const [enrollment, setEnrollment] = useState<Enrollment | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [expandedModules, setExpandedModules] = useState<string[]>([]);
  const [showLiveChat, setShowLiveChat] = useState(false);
  const [showCodeExecutor, setShowCodeExecutor] = useState(false);
  const [currentCodeExercise, setCurrentCodeExercise] = useState<CodeExercise | null>(null);
  const isLearningRoute = location.pathname.endsWith("/learn");

  const goBack = () => {
    if (window.history.length > 1) navigate(-1);
    else navigate("/courses");
  };

  const goDashboard = () => navigate("/dashboard");

  // Only the learning route requires authentication. Course previews are public.
  useEffect(() => {
    if (isLearningRoute && (!user || !token)) {
      navigate('/login');
    }
  }, [isLearningRoute, user, token, navigate]);

  useEffect(() => {
    const fetchCourse = async () => {
      try {
        if (!courseId) {
          console.log("Missing courseId");
          return;
        }

        console.log("Fetching course data for:", courseId);
        const courseResponse = await api.get<Course>(
          user && token ? `/courses/${courseId}` : `/courses/public/${courseId}`,
          { withCredentials: true }
        );
        
        console.log("Raw course response:", courseResponse);
        console.log("Course data structure:", {
          hasData: !!courseResponse.data,
          hasInstructor: !!courseResponse.data?.instructor,
          instructorData: courseResponse.data?.instructor,
          fullCourseData: courseResponse.data
        });
        
        // Validate course data
        if (!courseResponse.data || !courseResponse.data.instructor) {
          throw new Error("Invalid course data: instructor information is missing");
        }
        
        console.log("Course data received:", courseResponse.data);

        const normalizedCourse = {
          ...courseResponse.data,
          modules: (courseResponse.data.modules || []).map((module: any) => ({
            ...module,
            _id: module._id || module.id,
            lessons: (module.lessons || []).map((lesson: any) => ({
              ...lesson,
              _id: lesson._id || lesson.id,
            })),
          })),
        };

        setCourse(normalizedCourse);

        if (user?.id) {
          console.log("Fetching enrollment status for:", { courseId, userId: user.id });
          const { data: enrollments } = await api.get<Enrollment[]>(`/enrollments/my-courses`, { withCredentials: true });
          const courseEnrollment = Array.isArray(enrollments)
            ? enrollments.find(e => e.courseId._id === courseId)
            : null;
          if (courseEnrollment) {
            setEnrollment(courseEnrollment);
            dispatch(setEnrollmentAction(courseEnrollment));
          }
        }
      } catch (error: any) {
        console.error("Error fetching course:", error);
        if (error.response?.status === 401) {
          // Try to refresh the token
          try {
            console.log("Attempting to refresh token...");
            const result = await dispatch(refreshToken()).unwrap();
            console.log("Token refresh result:", result);
            if (result.token) {
              // Retry the request after token refresh
              console.log("Retrying request with new token...");
              // Wait a moment for the Redux store to update
              setTimeout(() => {
                fetchCourse();
              }, 100);
            }
          } catch (refreshError) {
            console.error("Token refresh failed:", refreshError);
            // If refresh fails, redirect to login
            navigate('/login');
          }
        } else if (error.response?.status === 404) {
          // Course or enrollment not found, this is normal for non-enrolled users
          setEnrollment(null);
          dispatch(setEnrollmentAction(null));
        } else {
          setError("Failed to load course information. Please try again.");
        }
      } finally {
        setLoading(false);
      }
    };

    fetchCourse();
  }, [courseId, user, token, navigate, dispatch]);

  const toggleModule = (moduleId: string) => {
    setExpandedModules((prev) =>
      prev.includes(moduleId)
        ? prev.filter((id) => id !== moduleId)
        : [...prev, moduleId]
    );
  };

  // Helper: Compute next lesson based on enrollment progress.
  // This assumes enrollment.progress is a percentage (0-100) of total lessons completed.
  const computeNextLesson = (): { moduleId: string; lessonIndex: number } | null => {
    if (!course) return null;
    const totalLessons = course.modules.reduce(
      (total, module) => total + module.lessons.length,
      0
    );
    // Use enrollment progress if exists, else default to 0%
    const progressValue = enrollment ? enrollment.progressPercentage : (course.progress || 0);
    const lessonsCompleted = Math.floor((progressValue / 100) * totalLessons);
    let cumulative = 0;
    for (const mod of course.modules) {
      if (cumulative + mod.lessons.length > lessonsCompleted) {
        return { moduleId: mod._id, lessonIndex: lessonsCompleted - cumulative };
      }
      cumulative += mod.lessons.length;
    }
    // If progress is 100% or no matching lesson, return the last lesson of the last module.
    const lastModule = course.modules[course.modules.length - 1];
    return { moduleId: lastModule._id, lessonIndex: lastModule.lessons.length - 1 };
  };

  const startLesson = (moduleId: string, lessonIndex: number) => {
    // Find the module from the current course data.
    const currentModule = course?.modules.find((mod) => mod._id === moduleId);
    if (currentModule) {
      // Get the lesson using the lesson index.
      const lesson = currentModule.lessons[lessonIndex];
      // Navigate to the lesson page, passing the lesson data in state.
      navigate(`/courses/${courseId}/modules/${moduleId}/lessons/${lessonIndex}`, { state: { lesson } });
    } else {
      // Fallback: navigate without lesson data.
      navigate(`/courses/${courseId}/modules/${moduleId}/lessons/${lessonIndex}`);
    }
  };
  

  const startAssessment = (moduleId: string) => {
    navigate(`/courses/${courseId}/modules/${moduleId}/assessment`);
  };

  const handleBack = () => {
    navigate("/courses");
  };

  const handleStartLearning = () => {
    if (course) {
      if (enrollment) {
        // Continue from where the student left off.
        const nextLesson = computeNextLesson();
        if (nextLesson) {
          startLesson(nextLesson.moduleId, nextLesson.lessonIndex);
        } else if (course.modules.length > 0 && course.modules[0].lessons.length > 0) {
          startLesson(course.modules[0]._id, 0);
        }
      } else {
        // For new enrollees, start at the beginning.
        if (course.modules.length > 0 && course.modules[0].lessons.length > 0) {
          startLesson(course.modules[0]._id, 0);
        }
      }
    }
  };

  // Show live chat if instructor is available or upon student request.
  const handleLiveChat = () => {
    setShowLiveChat(true);
  };

  const handleCodeExercise = (exercise: CodeExercise | undefined) => {
    if (exercise) {
      setCurrentCodeExercise(exercise);
      setShowCodeExecutor(true);
    }
  };

  if (loading) {
    return (
      <motion.div
        className="flex justify-center items-center h-screen"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
      >
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
      </motion.div>
    );
  }

  if (error || !course) {
    return (
      <motion.div
        className="flex justify-center items-center h-screen"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
      >
        <p className="text-red-500 text-lg font-semibold">{error}</p>
      </motion.div>
    );
  }

  // Calculate the total number of lessons.
  const totalLessons = course.modules.reduce(
    (total, module) => total + module.lessons.length,
    0
  );
  // Use the enrollment progress if available; otherwise, default to course.progress (or 0).
  const displayedProgress = enrollment ? enrollment.progressPercentage : (course.progress || 0);

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-6 pt-6 flex items-center gap-4">
        <button
          onClick={goBack}
          className="text-sm text-indigo-600 hover:text-indigo-700 flex items-center gap-2"
        >
          ← Back
        </button>
        {user && (
          <button
            onClick={goDashboard}
            className="text-sm text-gray-700 hover:text-gray-900 flex items-center gap-2"
          >
            ← Back to Dashboard
          </button>
        )}
      </div>
      <motion.div
        className="max-w-4xl mx-auto p-6"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <CourseHeader
          title={course.title}
          description={course.description}
          totalLessons={totalLessons}
          progress={displayedProgress}
        />

        {course.instructor && <InstructorInfo instructor={course.instructor} />}

        {user && <CourseProgress progress={displayedProgress} />}

        {/* Live Video Chat Button (if instructor is available) */}
        {user && course?.instructor?.isAvailableForCall && (
          <button
            onClick={handleLiveChat}
            className="mt-4 px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
          >
            Join Live Video Call
          </button>
        )}

        {user ? (
          <ModulesSection
            modules={course.modules}
            expandedModules={expandedModules}
            toggleModule={toggleModule}
            startLesson={startLesson}
            startAssessment={startAssessment}
            onCodeExercise={handleCodeExercise}
          />
        ) : (
          <div className="mt-8 rounded-lg border border-indigo-100 bg-white p-6 text-center shadow-sm">
            <p className="text-gray-700">Ready to start learning? Create an account or sign in to enroll.</p>
            <button
              onClick={() => navigate(`/courses/${courseId}/enroll`)}
              className="mt-4 rounded-lg bg-indigo-600 px-5 py-3 font-semibold text-white hover:bg-indigo-700"
            >
              Enroll in this course
            </button>
          </div>
        )}

        {user && (
          <NavigationButtons
            onBack={handleBack}
            onStartLearning={handleStartLearning}
            showStartLearning={
              course.modules.length > 0 && course.modules[0].lessons.length > 0
            }
          />
        )}

        {showLiveChat && (
          <LiveVideoChat
            roomId={`course-${course._id}`}
            onClose={() => setShowLiveChat(false)}
          />
        )}

        {showCodeExecutor && currentCodeExercise && (
          <CodeExecutor
            language={currentCodeExercise.language}
            initialCode={currentCodeExercise.initialCode}
            onClose={() => {
              setShowCodeExecutor(false);
              setCurrentCodeExercise(null);
            }}
          />
        )}
      </motion.div>
    </div>
  );
};

export default CoursePage;