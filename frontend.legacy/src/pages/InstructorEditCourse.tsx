import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";
import api from "../utils/api";
import BasicInfoStep from "../components/courses/steps/BasicInfoStep";
import ContentStep from "../components/courses/steps/ContentStep";
import FinalAssessmentSection from "../components/courses/FinalAssessmentSection";
import { Button } from "../components/ui/button";
import type { CreateCourseData } from "../components/courses/CourseBasicInfo";
import type { Lesson, Module, Assessment } from "../types/course";
import { Card } from "../components/ui/card";


interface RootState {
  auth: {
    user: { id: string; role: string } | null;
    token: string | null;
  };
}

const normalizeLesson = (lesson: any, idx: number): Lesson => ({
  title: lesson.title || "",
  description: lesson.description || "",
  content: lesson.content || "",
  lessonType: lesson.lessonType || "text-only",
  videoUrl: lesson.videoUrl || "",
  order: typeof lesson.order === "number" ? lesson.order : idx,
  quizQuestion: lesson.quizQuestion || "",
  quizOptions: lesson.quizOptions || [],
  correctAnswer: lesson.correctAnswer || "",
  duration: lesson.duration || "",
  type: (lesson.lessonType === "video" ? "video" : lesson.lessonType === "code" ? "code" : "text") as Lesson["type"],
});

const normalizeModule = (module: any, idx: number): Module => ({
  _id: module._id || module.id || `${idx}`,
  title: module.title || "",
  description: module.description || "",
  order: typeof module.order === "number" ? module.order : idx,
  lessons: Array.isArray(module.lessons)
    ? module.lessons.map((l: any, i: number) => normalizeLesson(l, i))
    : [],
  assessment: typeof module.assessment === "object" ? module.assessment : undefined,
  courseId: module.courseId,
  duration: module.duration,
  learningObjectives: module.learningObjectives || [],
});

const normalizeAssessment = (assessment: any): Assessment | null => {
  if (!assessment || typeof assessment !== "object") return null;
  const toNumber = (value: unknown, fallback: number) => {
    const parsed = Number(String(value ?? "").replace(/[^0-9.]/g, ""));
    return Number.isFinite(parsed) ? parsed : fallback;
  };
  return {
    ...assessment,
    title: assessment.title || "",
    description: assessment.description || "",
    timeLimit: toNumber(assessment.timeLimit, 30),
    passingScore: toNumber(assessment.passingScore, 80),
    questions: Array.isArray(assessment.questions) ? assessment.questions : [],
  } as Assessment;
};

const InstructorEditCourse: React.FC = () => {
  const { courseId } = useParams<{ courseId: string }>();
  const navigate = useNavigate();
  const { user, token } = useSelector((state: RootState) => state.auth);

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
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>("");
  const [thumbnailPreview, setThumbnailPreview] = useState<string | null>(null);
  const [availableCategories, setAvailableCategories] = useState<{ id: string; name: string }[]>([]);

  // `api` attaches token via interceptor from `src/utils/api.ts`

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const { data } = await api.get("/categories");
        const list = Array.isArray(data)
          ? data
              .map((c: any) => ({ id: c?.id || c?._id, name: c?.name }))
              .filter((c: any): c is { id: string; name: string } => Boolean(c.id && c.name))
          : [];
        setAvailableCategories(list);
        setCourseData((prev) => ({ ...prev, category: prev.category || (list[0]?.id || prev.category) }));
      } catch {
        // ignore
      }
    };
    fetchCategories();
  }, []);

  useEffect(() => {
    const fetchCourse = async () => {
      if (!courseId) return;
      try {
        const res = await api.get(`/courses/${courseId}`);
        const data = res.data;
        const modules = Array.isArray(data.modules)
          ? data.modules.map((m: any, idx: number) => normalizeModule(m, idx))
          : [];
        const finalAssessment = normalizeAssessment(data.finalAssessment);

        setCourseData({
          title: data.title || "",
          description: data.description || "",
          category: data.category || "",
          price: data.price || 0,
          isFree: Boolean(data.isFree),
          thumbnail: data.thumbnail && !/^\[.*\]$/.test(data.thumbnail) ? data.thumbnail : "",
          duration: data.duration || "",
          modules,
          finalAssessment,
        });
        setThumbnailPreview(data.thumbnail && !/^\[.*\]$/.test(data.thumbnail) ? data.thumbnail : null);
      } catch (err) {
        setError("Failed to fetch course details");
      } finally {
        setLoading(false);
      }
    };

    fetchCourse();
  }, [courseId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!courseId) {
      setError("Missing course id");
      return;
    }

    // Basic validation similar to create
    if (!courseData.title || !courseData.description) {
      setError("Title and description are required");
      return;
    }

    for (const m of courseData.modules) {
      if (!m.title || !m.description) {
        setError("All modules need title and description");
        return;
      }
      for (const l of m.lessons) {
        if (!l.title || !l.description || !l.content) {
          setError(`Lesson in module "${m.title}" is missing required fields`);
          return;
        }
      }
    }

    const formattedModules = courseData.modules.map((m, idx) => ({
      title: m.title,
      description: m.description,
      order: typeof m.order === "number" ? m.order : idx,
      assessment: m.assessment || null,
      lessons: m.lessons.map((l: Lesson, lidx: number) => ({
        title: l.title,
        description: l.description,
        lessonType: l.lessonType || "text-only",
        content: l.content,
        videoUrl: l.videoUrl || "",
        duration: l.duration || "",
        order: typeof l.order === "number" ? l.order : lidx,
        completed: Boolean(l.completed),
        quizQuestion: l.quizQuestion || "",
        quizOptions: l.quizOptions || [],
        correctAnswer: l.correctAnswer || "",
      })),
    }));

    const normalizedFinalAssessment = courseData.finalAssessment?.title?.trim()
      ? {
          ...courseData.finalAssessment,
          questions: (courseData.finalAssessment.questions || []).map((q) => ({
            ...q,
            options: Array.isArray(q.options) ? q.options.filter(Boolean) : [],
          })),
        }
      : null;

    try {
      await api.put(`/courses/${courseId}`, {
        ...courseData,
        modules: formattedModules,
        finalAssessment: normalizedFinalAssessment,
      });
      navigate("/instructor/dashboard");
    } catch (err: any) {
      const message = err?.response?.data?.error || "Failed to update course";
      setError(message);
    }
  };

  const handleCourseDataChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setCourseData((prev) => ({ ...prev, [name]: name === "price" ? Number(value) : value }));
  };

  const onFreeCourseChange = (checked: boolean) => {
    setCourseData((prev) => ({ ...prev, isFree: checked, price: checked ? 0 : prev.price }));
  };

  const handleThumbnailChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.append("thumbnail", file);
    setError("");
    try {
      const response = await api.post("/courses/upload-thumbnail", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      const imageUrl = response.data.imageUrl;
      setCourseData((prev) => ({ ...prev, thumbnail: imageUrl }));
      setThumbnailPreview(URL.createObjectURL(file));
    } catch (err: any) {
      setError(err?.response?.data?.error || err?.response?.data?.message || "Failed to upload course thumbnail");
    }
  };

  const addNewModule = () => {
    setCourseData((prev) => ({
      ...prev,
      modules: [
        ...prev.modules,
        {
          _id: `m-${Date.now()}`,
          title: "",
          description: "",
          lessons: [],
          order: prev.modules.length,
        } as Module,
      ],
    }));
  };

  const updateModule = (moduleIndex: number, data: Partial<Module>) => {
    setCourseData((prev) => ({
      ...prev,
      modules: prev.modules.map((m, idx) => (idx === moduleIndex ? { ...m, ...data } : m)),
    }));
  };

  const deleteModule = (moduleIndex: number) => {
    setCourseData((prev) => ({
      ...prev,
      modules: prev.modules.filter((_, idx) => idx !== moduleIndex),
    }));
  };

  const addLessonToModule = (moduleIndex: number) => {
    setCourseData((prev) => ({
      ...prev,
      modules: prev.modules.map((m, idx) =>
        idx === moduleIndex
          ? {
              ...m,
              lessons: [
                ...m.lessons,
                {
                  title: "",
                  description: "",
                  content: "",
                  lessonType: "text-only",
                  order: m.lessons.length,
                  type: "text",
                  quizQuestion: "",
                  quizOptions: [],
                  correctAnswer: "",
                } as Lesson,
              ],
            }
          : m
      ),
    }));
  };

  const deleteLesson = (moduleIndex: number, lessonIndex: number) => {
    setCourseData((prev) => ({
      ...prev,
      modules: prev.modules.map((module, index) =>
        index === moduleIndex
          ? { ...module, lessons: module.lessons.filter((_lesson: Lesson, currentIndex: number) => currentIndex !== lessonIndex) }
          : module
      ),
    }));
  };

  const updateLesson = (moduleIndex: number, lessonIndex: number, data: Partial<Lesson>) => {
    setCourseData((prev) => ({
      ...prev,
      modules: prev.modules.map((m, mIdx) =>
        mIdx === moduleIndex
          ? {
              ...m,
              lessons: m.lessons.map((l: Lesson, lIdx: number) => (lIdx === lessonIndex ? { ...l, ...data } : l)),
            }
          : m
      ),
    }));
  };

  const onLessonTypeChange = (moduleId: string, lessonIndex: number, type: "text" | "code" | "video") => {
    const moduleIndex = courseData.modules.findIndex((m) => m._id === moduleId);
    if (moduleIndex === -1) return;
    updateLesson(moduleIndex, lessonIndex, {
      type,
      lessonType: type === "video" ? "video" : type === "code" ? "code" : "text-only",
    });
  };

  const ensureFinalAssessment = () => {
    setCourseData((prev) =>
      prev.finalAssessment
        ? prev
        : {
            ...prev,
            finalAssessment: {
              id: "final",
              title: "Final Assessment",
              description: "",
              timeLimit: 30,
              passingScore: 50,
              questions: [],
            },
          }
    );
  };

  const updateFinalAssessment = (data: Partial<Assessment>) => {
    ensureFinalAssessment();
    setCourseData((prev) => ({
      ...prev,
      finalAssessment: { ...(prev.finalAssessment as Assessment), ...data },
    }));
  };

  const addQuestion = () => {
    ensureFinalAssessment();
    setCourseData((prev) => ({
      ...prev,
      finalAssessment: {
        ...(prev.finalAssessment as Assessment),
        questions: [
          ...((prev.finalAssessment?.questions as any[]) || []),
          { question: "", options: ["", ""], correctAnswer: "" },
        ],
      },
    }));
  };

  const updateQuestion = (
    qIndex: number,
    field: "question" | "options" | "correctAnswer",
    value: any
  ) => {
    ensureFinalAssessment();
    setCourseData((prev) => {
      const fa = prev.finalAssessment as Assessment;
      const questions = [...(fa.questions || [])];
      const q = { ...questions[qIndex] } as any;
      if (field === "options") {
        if (value?.add) {
          q.options = [...(q.options || []), ""];
        } else if (typeof value?.optionIndex === "number") {
          const opts = [...(q.options || [])];
          if (value.remove) {
            opts.splice(value.optionIndex, 1);
          } else {
            opts[value.optionIndex] = value.text;
          }
          q.options = opts;
        }
      } else {
        q[field] = value;
      }
      questions[qIndex] = q;
      return { ...prev, finalAssessment: { ...fa, questions } };
    });
  };

  const deleteQuestion = (qIndex: number) => {
    ensureFinalAssessment();
    setCourseData((prev) => {
      const fa = prev.finalAssessment as Assessment;
      const questions = [...(fa.questions || [])];
      questions.splice(qIndex, 1);
      return { ...prev, finalAssessment: { ...fa, questions } };
    });
  };

  if (loading) return <div className="p-6">Loading...</div>;
  if (error) return <div className="p-6 text-red-500">{error}</div>;

  return (
    <div className="max-w-5xl mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Edit Course</h1>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => navigate(-1)}>
            Cancel
          </Button>
          <Button onClick={handleSubmit}>Save Changes</Button>
        </div>
      </div>

      {error && <div className="text-red-500">{error}</div>}

      <Card className="p-4 space-y-6">
        <BasicInfoStep
          courseData={courseData}
          handleCourseDataChange={handleCourseDataChange}
          onFreeCourseChange={onFreeCourseChange}
          categories={availableCategories}
        />

        <div className="rounded-xl border border-gray-200 bg-white p-4 space-y-3">
          <div>
            <h2 className="text-lg font-semibold text-gray-800">Course Thumbnail</h2>
            <p className="text-sm text-gray-600">Upload a new image to replace the current thumbnail.</p>
          </div>
          <input
            type="file"
            accept="image/*"
            onChange={handleThumbnailChange}
            className="w-full p-2 border rounded-lg"
          />
          {thumbnailPreview && (
            <img
              src={thumbnailPreview}
              alt="Course thumbnail preview"
              className="w-full max-w-md h-48 object-cover rounded-lg"
            />
          )}
        </div>

        <ContentStep
          modules={courseData.modules as Module[]}
          addNewModule={addNewModule}
          updateModule={updateModule}
          addLessonToModule={addLessonToModule}
          deleteLesson={deleteLesson}
          updateLesson={updateLesson}
          deleteModule={deleteModule}
          onLessonTypeChange={onLessonTypeChange}
        />

        <FinalAssessmentSection
          finalAssessment={courseData.finalAssessment ?? null}
          updateFinalAssessment={updateFinalAssessment}
          addQuestion={addQuestion}
          updateQuestion={updateQuestion}
          deleteQuestion={deleteQuestion}
        />
      </Card>

      <div className="flex justify-end gap-2">
        <Button variant="outline" onClick={() => navigate(-1)}>
          Cancel
        </Button>
        <Button onClick={handleSubmit}>Save Changes</Button>
      </div>
    </div>
  );
};

export default InstructorEditCourse;