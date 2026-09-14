import React from "react";

interface ErrorMessageProps {
  message: string;
}

const ErrorMessage: React.FC<ErrorMessageProps> = ({ message }) => (
  <div className="p-6 max-w-7xl mx-auto">
    <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
      <p>{message}</p>
    </div>
  </div>
);

export default ErrorMessage;
