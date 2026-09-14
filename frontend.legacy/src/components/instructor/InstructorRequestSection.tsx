import React from "react";

interface InstructorRequestSectionProps {
  instructorStatus: "approved" | "pending" | "none";
  requestInstructorRole: () => void;
}

const InstructorRequestSection: React.FC<InstructorRequestSectionProps> = ({
  instructorStatus,
  requestInstructorRole,
}) => {
  if (instructorStatus === "none") {
    return (
      <div className="text-center py-8">
        <h2 className="text-3xl font-bold mb-4">Become an Instructor</h2>
        <button
          onClick={requestInstructorRole}
          className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
        >
          Request Instructor Role
        </button>
      </div>
    );
  }

  if (instructorStatus === "pending") {
    return (
      <div className="text-center py-8">
        <h2 className="text-3xl font-bold mb-4">Application Under Review</h2>
        <p className="text-gray-600">
          Your instructor application is being reviewed by our team.
        </p>
      </div>
    );
  }

  return null;
};

export default InstructorRequestSection;
