// src/components/courses/FinalAssessmentSection.tsx
import React from "react";
import { XCircleIcon, PlusCircleIcon, BookOpenIcon } from "@heroicons/react/24/outline";
import type { Assessment } from "../../types/course";

interface FinalAssessmentSectionProps {
  finalAssessment: Assessment | null;
  updateFinalAssessment: (data: Partial<Assessment>) => void;
  addQuestion: () => void;
  updateQuestion: (
    qIndex: number,
    field: "question" | "options" | "correctAnswer",
    value: any
  ) => void;
  deleteQuestion: (qIndex: number) => void;
}

const FinalAssessmentSection: React.FC<FinalAssessmentSectionProps> = ({
  finalAssessment,
  updateFinalAssessment,
  addQuestion,
  updateQuestion,
  deleteQuestion,
}) => {
  return (
    <div className="border-l-2 border-purple-200 pl-4 my-4">
      {finalAssessment ? (
        <div className="space-y-4">
          {/* Header with basic details */}
          <div className="flex items-start space-x-2">
            <BookOpenIcon className="w-5 h-5 text-purple-500" />
            <div className="flex-1">
              <input
                type="text"
                value={finalAssessment.title}
                onChange={(e) =>
                  updateFinalAssessment({ title: e.target.value })
                }
                placeholder="Final Assessment Title"
                className="w-full p-2 border rounded-lg mb-2"
                required
              />
              <div className="grid grid-cols-2 gap-4 mb-2">
                <input
                  type="number"
                  value={finalAssessment.timeLimit}
                  onChange={(e) =>
                    updateFinalAssessment({ timeLimit: parseInt(e.target.value) })
                  }
                  placeholder="Time Limit (minutes)"
                  className="p-2 border rounded-lg"
                  min="1"
                  required
                />
                <input
                  type="number"
                  value={finalAssessment.passingScore}
                  onChange={(e) =>
                    updateFinalAssessment({ passingScore: parseInt(e.target.value) })
                  }
                  placeholder="Passing Score (%)"
                  className="p-2 border rounded-lg"
                  min="0"
                  max="100"
                  required
                />
              </div>
              <textarea
                value={finalAssessment.description}
                onChange={(e) =>
                  updateFinalAssessment({ description: e.target.value })
                }
                placeholder="Final Assessment Description"
                className="w-full p-2 border rounded-lg mb-2"
                rows={3}
                required
              />
            </div>
            <button
              type="button"
              onClick={() =>
                updateFinalAssessment({
                  title: "",
                  description: "",
                  timeLimit: 0,
                  passingScore: 0,
                  questions: [],
                })
              }
              className="text-red-500 hover:text-red-700"
            >
              <XCircleIcon className="w-5 h-5" />
            </button>
          </div>

          {/* Questions Section */}
          <div>
            <h4 className="text-lg font-semibold mb-2">Final Assessment Questions</h4>
            {Array.isArray(finalAssessment.questions) && finalAssessment.questions.length > 0 ? (
              (finalAssessment.questions as any[]).map((q: any, qIndex: number) => (
                <div key={qIndex} className="border p-4 rounded mb-4">
                  <div className="flex justify-between items-center mb-2">
                    <input
                      type="text"
                      value={q.question}
                      onChange={(e) =>
                        updateQuestion(qIndex, "question", e.target.value)
                      }
                      placeholder="Question"
                      className="w-full p-2 border rounded-lg"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => deleteQuestion(qIndex)}
                      className="ml-2 text-red-500 hover:text-red-700"
                    >
                      <XCircleIcon className="w-5 h-5" />
                    </button>
                  </div>
                  <div className="grid grid-cols-1 gap-2">
                    {Array.isArray(q.options) && q.options.length > 0 ? (
                      q.options.map((option: string, optionIndex: number) => (
                        <div key={optionIndex} className="flex items-center gap-2">
                          <input
                            type="text"
                            value={option}
                            onChange={(e) =>
                              updateQuestion(qIndex, "options", {
                                optionIndex,
                                text: e.target.value,
                              })
                            }
                            placeholder={`Option ${optionIndex + 1}`}
                            className="flex-1 p-2 border rounded-lg"
                            required
                          />
                          <button
                            type="button"
                            onClick={() => updateQuestion(qIndex, "options", { optionIndex, remove: true })}
                            className="text-red-500 hover:text-red-700"
                            aria-label={`Remove option ${optionIndex + 1}`}
                          >
                            <XCircleIcon className="w-5 h-5" />
                          </button>
                        </div>
                      ))
                    ) : (
                      <p className="text-sm text-gray-500">No options yet. Add one below.</p>
                    )}
                    <button
                      type="button"
                      onClick={() => updateQuestion(qIndex, "options", { add: true })}
                      className="flex items-center gap-2 text-purple-600 hover:text-purple-700"
                    >
                      <PlusCircleIcon className="w-5 h-5" />
                      Add Option
                    </button>
                  </div>
                  <div className="mt-2">
                    <input
                      type="text"
                      value={q.correctAnswer}
                      onChange={(e) =>
                        updateQuestion(qIndex, "correctAnswer", e.target.value)
                      }
                      placeholder="Correct Answer (must match one option)"
                      className="w-full p-2 border rounded-lg"
                      required
                    />
                  </div>
                  <div className="mt-1">
                    {!q.question?.trim() && (
                      <p className="text-xs text-red-500">Question text is required.</p>
                    )}
                    {(!Array.isArray(q.options) || q.options.filter((o: string) => o?.trim()).length < 2) && (
                      <p className="text-xs text-red-500">Provide at least two options.</p>
                    )}
                    {q.correctAnswer && Array.isArray(q.options) && !q.options.includes(q.correctAnswer) && (
                      <p className="text-xs text-amber-600">Correct answer should match one of the options.</p>
                    )}
                  </div>
                </div>
              ))
            ) : (
              <p className="text-sm text-gray-600">No questions added yet.</p>
            )}
            <button
              type="button"
              onClick={addQuestion}
              className="flex items-center space-x-2 text-purple-600 hover:text-purple-700 mt-2"
            >
              <PlusCircleIcon className="w-5 h-5" />
              <span>Add Question</span>
            </button>
          </div>
        </div>
      ) : (
        <button
          type="button"
          onClick={() =>
            updateFinalAssessment({
              title: "",
              description: "",
              timeLimit: 30,
              passingScore: 80,
              questions: [],
              completed: false,
            })
          }
          className="flex items-center space-x-2 text-purple-600 hover:text-purple-700"
        >
          <PlusCircleIcon className="w-5 h-5" />
          <span>Add Final Assessment</span>
        </button>
      )}
    </div>
  );
};

export default FinalAssessmentSection;
