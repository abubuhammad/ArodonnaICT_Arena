// src/components/courses/LessonItem.tsx
import React from "react";
import { Lesson } from "../../types/course";

interface LessonItemProps {
  lesson: Lesson;
  moduleIndex: number;
  lessonIndex: number;
  updateLesson: (
    moduleIndex: number,
    lessonIndex: number,
    data: Partial<Lesson>
  ) => void;
}

const LessonItem: React.FC<LessonItemProps> = ({
  lesson,
  moduleIndex,
  lessonIndex,
  updateLesson,
}) => {
  return (
    <div className="flex flex-col gap-4 border p-4 rounded-lg mb-4">
      {/* Lesson Basic Details */}
      <div className="flex flex-col">
        <input
          type="text"
          value={lesson.title}
          onChange={(e) =>
            updateLesson(moduleIndex, lessonIndex, { title: e.target.value })
          }
          placeholder="Lesson Title"
          className="w-full p-2 border rounded-lg mb-2"
          required
        />
        <textarea
          value={lesson.description}
          onChange={(e) =>
            updateLesson(moduleIndex, lessonIndex, {
              description: e.target.value,
            })
          }
          placeholder="Brief Lesson Description (summary)"
          className="w-full p-2 border rounded-lg mb-2"
          rows={2}
          required
        />
      </div>
      
      {/* Lesson Type Selector */}
      <div className="flex space-x-4 mb-4">
        <label className="flex items-center space-x-2">
          <input
            type="radio"
            name={`lessonType-${lesson.id}`}
            value="text-only"
            checked={lesson.lessonType === "text-only"}
            onChange={(e) =>
              updateLesson(moduleIndex, lessonIndex, {
                lessonType: e.target.value as "text-only" | "text-and-video",
              })
            }
            className="text-purple-600"
          />
          <span>Text Only</span>
        </label>
        <label className="flex items-center space-x-2">
          <input
            type="radio"
            name={`lessonType-${lesson.id}`}
            value="text-and-video"
            checked={lesson.lessonType === "text-and-video"}
            onChange={(e) =>
              updateLesson(moduleIndex, lessonIndex, {
                lessonType: e.target.value as "text-only" | "text-and-video",
              })
            }
            className="text-purple-600"
          />
          <span>Text & Video</span>
        </label>
      </div>
      
      {/* Lesson Content */}
      <div className="flex flex-col">
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Lesson Content
        </label>
        <textarea
          value={lesson.content}
          onChange={(e) =>
            updateLesson(moduleIndex, lessonIndex, { content: e.target.value })
          }
          placeholder="Enter the full lesson content here..."
          className="w-full p-2 border rounded-lg mb-2"
          rows={6}
          required
        />
      </div>
      
      {/* Conditional Video URL Input */}
      {lesson.lessonType === "text-and-video" && (
        <div className="flex flex-col">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Video URL
          </label>
          <input
            type="text"
            value={lesson.videoUrl || ""}
            onChange={(e) =>
              updateLesson(moduleIndex, lessonIndex, {
                videoUrl: e.target.value,
              })
            }
            placeholder="Enter video URL"
            className="w-full p-2 border rounded-lg"
            required
          />
        </div>
      )}

      {/* Lesson Quiz Section */}
      <div className="flex flex-col border-t pt-4">
        <h4 className="text-lg font-semibold mb-2">
          Lesson Quiz (Optional)
        </h4>
        <div className="flex flex-col mb-2">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Quiz Question
          </label>
          <input
            type="text"
            value={lesson.quizQuestion || ""}
            onChange={(e) =>
              updateLesson(moduleIndex, lessonIndex, {
                quizQuestion: e.target.value,
              })
            }
            placeholder="Enter quiz question"
            className="w-full p-2 border rounded-lg"
          />
        </div>
        <div className="flex flex-col mb-2">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Quiz Options (Comma Separated)
          </label>
          <input
            type="text"
            value={lesson.quizOptions ? lesson.quizOptions.join(", ") : ""}
            onChange={(e) =>
              updateLesson(moduleIndex, lessonIndex, {
                quizOptions: e.target.value
                  .split(",")
                  .map(opt => opt.trim())
              })
            }
            placeholder="Option1, Option2, Option3, Option4"
            className="w-full p-2 border rounded-lg"
          />
        </div>
        <div className="flex flex-col">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Correct Answer
          </label>
          <input
            type="text"
            value={lesson.correctAnswer || ""}
            onChange={(e) =>
              updateLesson(moduleIndex, lessonIndex, {
                correctAnswer: e.target.value,
              })
            }
            placeholder="Enter correct answer"
            className="w-full p-2 border rounded-lg"
          />
        </div>
      </div>
    </div>
  );
};

export default LessonItem;
