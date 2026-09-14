// src/pages/CreateCourse.tsx
import { useState, useEffect } from "react";
import { useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import api from "../utils/api";
// Import new wizard components
import CreateCourseWizard from "../components/courses/CreateCourseWizard";
import BasicInfoStep from "../components/courses/steps/BasicInfoStep";
import ContentStep from "../components/courses/steps/ContentStep";

// Types
import type { CreateCourseData } from "../components/courses/CourseBasicInfo";
import type { Module, Lesson, Assessment } from "../types/course";
import FinalAssessmentSection from "../components/courses/FinalAssessmentSection";


interface RootState {
  auth: {
    user: {
      id: string;
      role: string;
    } | null;
    token: string | null;
  };
}

interface CodeExercise {
  language: 'python' | 'javascript' | 'typescript' | 'html' | 'css';
  initialCode: string;
  expectedOutput?: string;
}

const CreateCourse: React.FC = () => {
  const navigate = useNavigate();
  const { user, token } = useSelector((state: RootState) => state.auth);
  const [mode, setMode] = useState<"wizard" | "json" | "markdown">("wizard");

  // `api` automatically attaches token from localStorage via interceptor in `src/utils/api.ts`

  useEffect(() => {
    // Redirect if not an instructor
    if (!user || user.role !== "instructor") {
      navigate("/dashboard");
    }
  }, [user, navigate]);

  // Initialize finalAssessment as null (type: Assessment | null)
  const [courseData, setCourseData] = useState<CreateCourseData>({
    title: "",
    description: "",
    category: "",
    price: 0,
    isFree: false,
    thumbnail: "",
    duration: "",
    modules: [],
    finalAssessment: null,
  });
  const [error, setError] = useState("");
  const [thumbnailPreview, setThumbnailPreview] = useState<string | null>(null);
  const [currentStep, setCurrentStep] = useState(0);
  const [jsonPayload, setJsonPayload] = useState<string>("");
  const [markdownFile, setMarkdownFile] = useState<File | null>(null);
  const [importLoading, setImportLoading] = useState(false);
  const [importMessage, setImportMessage] = useState<string>("");
  type CategoryDTO = { id: string; name: string };
  const [availableCategories, setAvailableCategories] = useState<CategoryDTO[]>([]);

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const { data } = await api.get("/categories");
        const list: CategoryDTO[] = Array.isArray(data)
          ? data
              .map((c: any) => ({ id: c?.id || c?._id, name: c?.name }))
              .filter((c: any): c is CategoryDTO => Boolean(c.id && c.name))
          : [];
        setAvailableCategories(list);
        // If no category selected yet, default to first
        setCourseData((prev) => ({ ...prev, category: prev.category || (list[0]?.id || "") }));
      } catch (e) {
        console.warn("Could not load categories; falling back to defaults");
      }
    };
    fetchCategories();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!user?.id) {
      setError("User not authenticated");
      return;
    }

    // Validate thumbnail
    if (!courseData.thumbnail) {
      setError("Course thumbnail is required");
      return;
    }

    // Validate modules and lessons
    const invalidModules = courseData.modules.filter(
      module => !module.title || !module.description
    );
    if (invalidModules.length > 0) {
      setError("All modules must have a title and description");
      return;
    }

    // Validate lessons in each module
    for (const module of courseData.modules) {
      const invalidLessons = module.lessons.filter(
        (lesson: Lesson) => !lesson.title || !lesson.description || !lesson.content
      );
      if (invalidLessons.length > 0) {
        setError(`All lessons in module "${module.title}" must have a title, description, and content`);
        return;
      }
    }

    // Transform modules data to match backend schema
    const formattedModules = courseData.modules.map(module => ({
      title: module.title,
      description: module.description || "", // Ensure description is never empty
      order: module.order,
      lessons: module.lessons.map((lesson: Lesson) => ({
        title: lesson.title,
        description: lesson.description || "", // Ensure description is never empty
        lessonType: lesson.lessonType,
        content: lesson.content || "", // Ensure content is never empty
        videoUrl: lesson.videoUrl || "",
        order: lesson.order,
        quizQuestion: lesson.quizQuestion || "",
        quizOptions: lesson.quizOptions || [],
        correctAnswer: lesson.correctAnswer || "",
      })),
      assessment: module.assessment ? {
        ...module.assessment,
        title: module.assessment.title || "",
        description: module.assessment.description || "",
      } : undefined,
    }));

    try {
      // Normalize finalAssessment questions/options before submit
      const normalizedFinalAssessment = courseData.finalAssessment?.title?.trim() ? {
        ...courseData.finalAssessment,
        questions: (courseData.finalAssessment.questions || []).map(q => ({
          ...q,
          options: Array.isArray(q.options) ? q.options.filter((o) => o && o.trim()) : [],
        }))
      } : null;

      const response = await api.post(
        "/courses",
        {
          ...courseData,
          finalAssessment: normalizedFinalAssessment,
          modules: formattedModules,
          instructor: user.id,
        }
      );

      console.log("Course created successfully:", response.data);
      navigate("/instructor/dashboard");
    } catch (error: any) {
      if (error.response?.status === 401) {
        setError("Session expired. Please log in again.");
        navigate("/login");
      } else {
        console.error("Error creating course:", error);
        const errorMessage = error.response?.data?.message || 
                           error.response?.data?.error || 
                           "Failed to create course";
        setError(Array.isArray(errorMessage) ? errorMessage.join(", ") : errorMessage);
      }
    } finally {
      // no-op
    }
  };

  const handleJsonFile = async (file: File | null) => {
    if (!file) return;
    const text = await file.text();
    setJsonPayload(text);
  };

  const handleJsonImport = async () => {
    setError("");
    setImportMessage("");
    if (!jsonPayload.trim()) {
      setError("Please paste a course JSON payload.");
      return;
    }
    try {
      const parsed = JSON.parse(jsonPayload);
      setImportLoading(true);
      await api.post("/courses/import", parsed);
      setImportMessage("Course imported successfully.");
      setJsonPayload("");
    } catch (e: any) {
      console.error("Import failed", e);
      setError(e?.response?.data?.error || e?.response?.data?.message || e?.message || "Failed to import course.");
    } finally {
      setImportLoading(false);
    }
  };

  const handleMarkdownImport = async () => {
    setError("");
    setImportMessage("");
    if (!markdownFile) {
      setError("Please select a Markdown course template.");
      return;
    }
    try {
      const formData = new FormData();
      formData.append("course", markdownFile);
      setImportLoading(true);
      await api.post("/courses/import-markdown", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      setImportMessage("Course imported successfully from Markdown.");
      setMarkdownFile(null);
    } catch (e: any) {
      console.error("Markdown import failed", e);
      setError(e?.response?.data?.error || e?.message || "Failed to import Markdown course.");
    } finally {
      setImportLoading(false);
    }
  };

  const handleCourseDataChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setCourseData(prev => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleThumbnailChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.append("thumbnail", file);

    try {
      const response = await api.post(
        "/courses/upload-thumbnail",
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        }
      );
      
      const imageUrl = response.data.imageUrl;
      setCourseData(prev => ({ ...prev, thumbnail: imageUrl }));
      const previewUrl = URL.createObjectURL(file);
      setThumbnailPreview(previewUrl);
    } catch (error: any) {
      if (error.response?.status === 401) {
        setError("Session expired. Please log in again.");
        navigate("/login");
      } else {
        console.error("Error uploading thumbnail:", error);
        setError(error.response?.data?.message || "Failed to upload thumbnail");
      }
    }
  };

  // Clean up preview URL when component unmounts
  useEffect(() => {
    return () => {
      if (thumbnailPreview) {
        URL.revokeObjectURL(thumbnailPreview);
      }
    };
  }, [thumbnailPreview]);

  // Modules related functions
  const addNewModule = () => {
    const newModule: Module = {
      _id: Date.now().toString(),
      title: "",
      description: "",
      order: courseData.modules.length,
      lessons: [],
      assessment: undefined,
      courseId: "",
    };
    setCourseData(prev => ({
      ...prev,
      modules: [...prev.modules, newModule],
    }));
  };

  const updateModule = (moduleIndex: number, data: Partial<Module>) => {
    setCourseData(prev => ({
      ...prev,
      modules: prev.modules.map((module, index) =>
        index === moduleIndex ? { ...module, ...data } : module
      ),
    }));
  };

  const addLessonToModule = (moduleIndex: number) => {
    const newLesson: Lesson = {
      title: "",
      description: "",
      content: "",
      type: "text",
      lessonType: "text-only",
      order: courseData.modules[moduleIndex].lessons.length,
      videoUrl: "",
      quizQuestion: "",
      quizOptions: [],
      correctAnswer: "",
    };

    const updatedModules = [...courseData.modules];
    updatedModules[moduleIndex].lessons.push(newLesson);
    setCourseData(prev => ({
      ...prev,
      modules: updatedModules,
    }));
  };

  const deleteLesson = (moduleIndex: number, lessonIndex: number) => {
    setCourseData(prev => ({
      ...prev,
      modules: prev.modules.map((module, index) =>
        index === moduleIndex
          ? { ...module, lessons: module.lessons.filter((_lesson: Lesson, currentIndex: number) => currentIndex !== lessonIndex) }
          : module
      ),
    }));
  };

  const updateLesson = (moduleIndex: number, lessonIndex: number, data: Partial<Lesson>) => {
    const updatedLessons = [...courseData.modules[moduleIndex].lessons];
    updatedLessons[lessonIndex] = { ...updatedLessons[lessonIndex], ...data };
    updateModule(moduleIndex, { lessons: updatedLessons });
  };

  // Deprecated: module-level assessments are currently handled within the wizard steps
  // and may be reintroduced later. Keeping this removed to avoid lints.
  // const addAssessmentToModule = (moduleIndex: number) => {
  //   const newAssessment: Assessment = {
  //     id: Date.now().toString(),
  //     title: "",
  //     description: "",
  //     timeLimit: 30,
  //     passingScore: 80,
  //     questions: [],
  //     completed: false,
  //   };
  //   updateModule(moduleIndex, { assessment: newAssessment });
  // };

  const handleFreeCourseChange = (checked: boolean) => {
    setCourseData(prev => ({
      ...prev,
      isFree: checked,
      price: checked ? 0 : prev.price,
    }));
  };

  const deleteModule = (moduleIndex: number) => {
    setCourseData(prev => ({
      ...prev,
      modules: prev.modules.filter((_, idx: number) => idx !== moduleIndex),
    }));
  };

  const handleLessonTypeChange = (moduleId: string, lessonIndex: number, type: 'text' | 'code' | 'video') => {
    const updatedModules = courseData.modules.map(module => {
      if (module._id === moduleId) {
        const updatedLessons = [...module.lessons];
        updatedLessons[lessonIndex] = {
          ...updatedLessons[lessonIndex],
          type,
          lessonType: type === 'code' ? 'code' : type === 'video' ? 'video' : 'text-only'
        };
        return { ...module, lessons: updatedLessons };
      }
      return module;
    });
    setCourseData(prev => ({
      ...prev,
      modules: updatedModules,
    }));
  };



  // Step validation logic
  const isStepValid = (step: number): boolean => {
    switch (step) {
      case 0: // Basic Info
        return !!(courseData.title && courseData.description && courseData.category);
      case 1: // Content
        return courseData.modules.length > 0 && 
               courseData.modules.every(module => 
                 module.title && module.description && module.lessons.length > 0 &&
                 module.lessons.every((lesson: Lesson) => lesson.title && lesson.content)
                 );
      case 2: // Media & Assets
        return !!courseData.thumbnail;
      case 3: // Assessment
        return true; // Assessment is optional
      case 4: // Publish
        return isStepValid(0) && isStepValid(1) && isStepValid(2);
      default:
        return false;
    }
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 0:
        return (
          <BasicInfoStep
            courseData={courseData}
            handleCourseDataChange={handleCourseDataChange}
            onFreeCourseChange={handleFreeCourseChange}
            categories={availableCategories}
          />
        );
      case 1:
        return (
          <ContentStep
            modules={courseData.modules}
            addNewModule={addNewModule}
            updateModule={updateModule}
            addLessonToModule={addLessonToModule}
            deleteLesson={deleteLesson}
            updateLesson={updateLesson}
            deleteModule={deleteModule}
            onLessonTypeChange={handleLessonTypeChange}
          />
        );
      case 2:
        return (
          <div className="space-y-8">
            <div className="text-center">
              <div className="w-20 h-20 bg-gradient-to-r from-purple-500 to-pink-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
              <h2 className="text-3xl font-bold text-gray-800 mb-2">Media & Assets</h2>
              <p className="text-gray-600 max-w-2xl mx-auto">Upload your course thumbnail and any additional media assets.</p>
            </div>
            <div className="max-w-md mx-auto">
              <label className="block text-sm font-medium text-gray-700 mb-2">Course Thumbnail *</label>
              <input
                type="file"
                accept="image/*"
                onChange={handleThumbnailChange}
                className="w-full px-3 py-2 border-2 border-gray-200 rounded-lg focus:border-purple-500 focus:outline-none transition-all duration-300"
              />
              {thumbnailPreview && (
                <div className="mt-4">
                  <img 
                    src={thumbnailPreview} 
                    alt="Course thumbnail preview" 
                    className="w-full h-48 object-cover rounded-lg"
                  />
                </div>
              )}
            </div>
          </div>
        );
      case 3:
        return (
          <FinalAssessmentSection
            finalAssessment={courseData.finalAssessment || null}
            updateFinalAssessment={(data) =>
              setCourseData(prev => ({
                ...prev,
                finalAssessment: {
                  title: prev.finalAssessment?.title || "",
                  description: prev.finalAssessment?.description || "",
                  timeLimit: prev.finalAssessment?.timeLimit ?? 30,
                  passingScore: prev.finalAssessment?.passingScore ?? 80,
                  questions: Array.isArray(prev.finalAssessment?.questions) ? prev.finalAssessment!.questions : [],
                  completed: false,
                  ...data
                } as Assessment,
              }))
            }
            addQuestion={() =>
              setCourseData(prev => ({
                ...prev,
                finalAssessment: {
                  title: prev.finalAssessment?.title || "",
                  description: prev.finalAssessment?.description || "",
                  timeLimit: prev.finalAssessment?.timeLimit ?? 30,
                  passingScore: prev.finalAssessment?.passingScore ?? 80,
                  completed: false,
                  questions: [
                    ...(Array.isArray(prev.finalAssessment?.questions) ? prev.finalAssessment!.questions : []),
                    { question: "", options: ["", "", "", ""], correctAnswer: "" },
                  ],
                } as Assessment,
              }))
            }
            updateQuestion={(qIndex, field, value) => {
              setCourseData(prev => {
                const qs = Array.isArray(prev.finalAssessment?.questions) ? [...prev.finalAssessment!.questions] : [];
                if (!qs[qIndex]) qs[qIndex] = { question: "", options: ["", "", "", ""], correctAnswer: "" };
                if (field === 'options' && value && typeof value === 'object') {
                  const { optionIndex, text } = value as { optionIndex: number; text: string };
                  const opts = Array.isArray(qs[qIndex].options) ? [...qs[qIndex].options] : [];
                  opts[optionIndex] = text;
                  qs[qIndex] = { ...qs[qIndex], options: opts };
                } else {
                  qs[qIndex] = { ...qs[qIndex], [field]: value } as any;
                }
                return {
                  ...prev,
                  finalAssessment: { ...prev.finalAssessment, questions: qs } as Assessment,
                };
              });
            }}
            deleteQuestion={(qIndex) => {
              setCourseData(prev => {
                const qs = Array.isArray(prev.finalAssessment?.questions) ? [...prev.finalAssessment!.questions] : [];
                const updatedQuestions = qs.filter((_, idx) => idx !== qIndex);
                return {
                  ...prev,
                  finalAssessment: { ...prev.finalAssessment, questions: updatedQuestions } as Assessment,
                };
              });
            }}
          />
        );
      case 4:
        return (
          <div className="space-y-8 text-center">
            <div className="w-20 h-20 bg-gradient-to-r from-pink-500 to-rose-600 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h2 className="text-3xl font-bold text-gray-800 mb-2">Ready to Publish!</h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              Your course is ready to go live. Review everything one more time before publishing.
            </p>
            <div className="max-w-2xl mx-auto bg-gradient-to-r from-blue-50 to-purple-50 rounded-2xl p-6 border border-blue-200">
              <h3 className="text-xl font-semibold mb-4">Course Summary</h3>
              <div className="text-left space-y-2">
                <p><strong>Title:</strong> {courseData.title}</p>
                <p><strong>Category:</strong> {courseData.category}</p>
                <p><strong>Price:</strong> {courseData.isFree ? 'Free' : `$${courseData.price}`}</p>
                <p><strong>Modules:</strong> {courseData.modules.length}</p>
                <p><strong>Total Lessons:</strong> {courseData.modules.reduce((total, module) => total + module.lessons.length, 0)}</p>
                <p><strong>Final Assessment:</strong> {courseData.finalAssessment?.questions?.length || 0} questions</p>
              </div>
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={() => (window.history.length > 1 ? navigate(-1) : navigate("/instructor/dashboard"))}
          className="text-sm text-indigo-600 hover:text-indigo-700 flex items-center gap-2"
        >
          Back to Dashboard
        </button>
      </div>

      <div className="flex gap-2 mb-2">
        <button
          type="button"
          onClick={() => setMode("wizard")}
          className={`px-4 py-2 rounded-lg border text-sm ${mode === "wizard" ? "bg-indigo-600 text-white border-indigo-600" : "bg-white text-gray-700 border-gray-200"}`}
        >
          Course Maker
        </button>
        <button
          type="button"
          onClick={() => setMode("json")}
          className={`px-4 py-2 rounded-lg border text-sm ${mode === "json" ? "bg-indigo-600 text-white border-indigo-600" : "bg-white text-gray-700 border-gray-200"}`}
        >
          Import from JSON
        </button>
        <button
          type="button"
          onClick={() => setMode("markdown")}
          className={`px-4 py-2 rounded-lg border text-sm ${mode === "markdown" ? "bg-indigo-600 text-white border-indigo-600" : "bg-white text-gray-700 border-gray-200"}`}
        >
          Upload Markdown
        </button>
      </div>

      {mode === "wizard" ? (
        <form onSubmit={handleSubmit} className="space-y-4">
          <CreateCourseWizard
            currentStep={currentStep}
            setCurrentStep={setCurrentStep}
            isStepValid={isStepValid}
          >
            {renderStepContent()}
          </CreateCourseWizard>
          {error && (
            <div className="fixed bottom-4 right-4 max-w-md p-4 bg-red-100 text-red-700 rounded-lg shadow-lg border border-red-200">
              {error}
            </div>
          )}
        </form>
      ) : mode === "json" ? (
        <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-4 space-y-3">
          <p className="text-sm text-gray-600 dark:text-gray-300">Paste your full course JSON below, or select a JSON file.</p>
          <textarea
            value={jsonPayload}
            onChange={(e) => setJsonPayload(e.target.value)}
            rows={14}
            className="w-full rounded-lg border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-950 p-3 text-sm font-mono"
            placeholder={`{
  "title": "Course title",
  "description": "Course description",
  "category": "Web Development",
  "modules": []
}`}
          />
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <label className="inline-flex items-center gap-2 text-sm text-gray-700 dark:text-gray-200 cursor-pointer">
              <input
                type="file"
                accept="application/json,text/plain"
                onChange={(e) => handleJsonFile(e.target.files?.[0] || null)}
              />
              <span>Select JSON file</span>
            </label>
            <button
              type="button"
              onClick={handleJsonImport}
              disabled={importLoading}
              className="inline-flex items-center justify-center px-4 py-2 rounded-lg bg-indigo-600 text-white hover:bg-indigo-700 disabled:opacity-60"
            >
              {importLoading ? "Importing..." : "Create Course from JSON"}
            </button>
          </div>
          {importMessage && (
            <div className="text-sm text-emerald-600">{importMessage}</div>
          )}
          {error && (
            <div className="text-sm text-red-600">{error}</div>
          )}
        </div>
      ) : (
        <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-4 space-y-4">
          <div>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Upload Markdown Course</h2>
            <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">
              Select a completed Markdown course template. The file must follow the format in docs/course_template.md.
            </p>
          </div>
          <input
            type="file"
            accept=".md,.markdown,text/markdown,text/plain"
            onChange={(e) => setMarkdownFile(e.target.files?.[0] || null)}
            className="w-full rounded-lg border border-gray-200 dark:border-gray-800 p-3 text-sm"
          />
          {markdownFile && (
            <p className="text-sm text-gray-600 dark:text-gray-300">Selected: {markdownFile.name}</p>
          )}
          <button
            type="button"
            onClick={handleMarkdownImport}
            disabled={importLoading || !markdownFile}
            className="inline-flex items-center justify-center px-4 py-2 rounded-lg bg-indigo-600 text-white hover:bg-indigo-700 disabled:opacity-60"
          >
            {importLoading ? "Importing..." : "Create Course from Markdown"}
          </button>
          {importMessage && <div className="text-sm text-emerald-600">{importMessage}</div>}
          {error && <div className="text-sm text-red-600">{error}</div>}
        </div>
      )}
    </div>
  );
};

export default CreateCourse;
