// src/components/courses/AssessmentSection.tsx
import React from "react";
import { XCircleIcon, PlusCircleIcon, BookOpenIcon } from "@heroicons/react/24/outline";
import { Module, Assessment } from "../../types/course";

interface AssessmentSectionProps {
  module: Module;
  moduleIndex: number;
  updateModule: (moduleIndex: number, data: Partial<Module>) => void;
  addAssessmentToModule: (moduleIndex: number) => void;
}

const AssessmentSection: React.FC<AssessmentSectionProps> = ({
  module,
  moduleIndex,
  updateModule,
  addAssessmentToModule,
}) => {
  const handleAssessmentChange = (field: keyof Assessment, value: any) => {
    updateModule(moduleIndex, {
      assessment: { ...module.assessment!, [field]: value },
    });
  };

  const handleQuestionChange = (
    qIndex: number,
    field: "question" | "options" | "correctAnswer",
    value: any
  ) => {
    if (!module.assessment) return;
    const updatedQuestions = module.assessment.questions.map((q, idx) => {
      if (idx !== qIndex) return q;
      if (field === "options") {
        // value should be an object with optionIndex and new text
        const { optionIndex, text } = value;
        const newOptions = [...q.options];
        newOptions[optionIndex] = text;
        return { ...q, options: newOptions };
      } else {
        return { ...q, [field]: value };
      }
    });
    handleAssessmentChange("questions", updatedQuestions);
  };

  const addNewQuestion = () => {
    if (!module.assessment) return;
    const newQuestion = {
      question: "",
      options: ["", "", "", ""],
      correctAnswer: "",
    };
    const updatedQuestions = [...module.assessment.questions, newQuestion];
    handleAssessmentChange("questions", updatedQuestions);
  };

  const deleteQuestion = (qIndex: number) => {
    if (!module.assessment) return;
    const updatedQuestions = module.assessment.questions.filter(
      (_, idx) => idx !== qIndex
    );
    handleAssessmentChange("questions", updatedQuestions);
  };

  return (
    <>
      {module.assessment ? (
        <div className="border-l-2 border-purple-200 pl-4">
          <div className="flex items-start space-x-2">
            <BookOpenIcon className="w-5 h-5 text-purple-500" />
            <div className="flex-1">
              {/* Assessment Basic Info */}
              <input
                type="text"
                value={module.assessment.title}
                onChange={(e) => handleAssessmentChange("title", e.target.value)}
                placeholder="Assessment Title"
                className="w-full p-2 border rounded-lg mb-2"
                required
              />
              <div className="grid grid-cols-2 gap-4 mb-2">
                <input
                  type="number"
                  value={module.assessment.timeLimit}
                  onChange={(e) =>
                    handleAssessmentChange("timeLimit", parseInt(e.target.value))
                  }
                  placeholder="Time Limit (minutes)"
                  className="p-2 border rounded-lg"
                  min="1"
                  required
                />
                <input
                  type="number"
                  value={module.assessment.passingScore}
                  onChange={(e) =>
                    handleAssessmentChange("passingScore", parseInt(e.target.value))
                  }
                  placeholder="Passing Score (%)"
                  className="p-2 border rounded-lg"
                  min="0"
                  max="100"
                  required
                />
              </div>
              <textarea
                value={module.assessment.description}
                onChange={(e) =>
                  handleAssessmentChange("description", e.target.value)
                }
                placeholder="Assessment Description"
                className="w-full p-2 border rounded-lg mb-2"
                rows={3}
                required
              />

              {/* Assessment Questions Section */}
              <div className="mt-4">
                <h4 className="text-lg font-semibold mb-2">Assessment Questions</h4>
                {module.assessment.questions && module.assessment.questions.length > 0 ? (
                  module.assessment.questions.map((q, qIndex) => (
                    <div key={qIndex} className="border p-4 rounded mb-4">
                      <div className="flex justify-between items-center mb-2">
                        <input
                          type="text"
                          value={q.question}
                          onChange={(e) =>
                            handleQuestionChange(qIndex, "question", e.target.value)
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
                        {[0, 1, 2, 3].map((optionIndex) => (
                          <div key={optionIndex} className="flex items-center space-x-2">
                            <input
                              type="radio"
                              name={`assessment-question-${qIndex}`}
                              checked={q.correctAnswer === q.options[optionIndex]}
                              onChange={() =>
                                handleQuestionChange(qIndex, "correctAnswer", q.options[optionIndex])
                              }
                              className="text-purple-600"
                            />
                            <input
                              type="text"
                              value={q.options[optionIndex]}
                              onChange={(e) =>
                                handleQuestionChange(qIndex, "options", {
                                  optionIndex,
                                  text: e.target.value,
                                })
                              }
                              placeholder={`Option ${optionIndex + 1}`}
                              className="w-full p-2 border rounded-lg"
                              required
                            />
                          </div>
                        ))}
                      </div>
                      {/* Manual Correct Answer Input */}
                      <div className="mt-2">
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Correct Answer (manual entry)
                        </label>
                        <input
                          type="text"
                          value={q.correctAnswer}
                          onChange={(e) =>
                            handleQuestionChange(qIndex, "correctAnswer", e.target.value)
                          }
                          placeholder="Enter correct answer"
                          className="w-full p-2 border rounded-lg"
                          required
                        />
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-gray-600">No questions added yet.</p>
                )}
                <button
                  type="button"
                  onClick={addNewQuestion}
                  className="flex items-center space-x-2 text-purple-600 hover:text-purple-700 mt-2"
                >
                  <PlusCircleIcon className="w-5 h-5" />
                  <span>Add Question</span>
                </button>
              </div>
            </div>
            <button
              type="button"
              onClick={() => updateModule(moduleIndex, { assessment: undefined })}
              className="text-red-500 hover:text-red-700"
            >
              <XCircleIcon className="w-5 h-5" />
            </button>
          </div>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => addAssessmentToModule(moduleIndex)}
          className="flex items-center space-x-2 text-purple-600 hover:text-purple-700 ml-2"
        >
          <PlusCircleIcon className="w-5 h-5" />
          <span>Add Assessment</span>
        </button>
      )}
    </>
  );
};

export default AssessmentSection;
