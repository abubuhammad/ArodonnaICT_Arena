import React from "react";

type ErrorMessageProps = {
  message: string;
  title?: string;
  className?: string;
};

const ErrorMessage: React.FC<ErrorMessageProps> = ({ message, title = "Something went wrong", className = "" }) => (
  <div className={`mx-auto w-full max-w-7xl p-6 ${className}`} role="alert">
    <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800 dark:border-red-500/30 dark:bg-red-950/30 dark:text-red-200">
      <p className="font-medium">{title}</p>
      <p className="mt-1">{message}</p>
    </div>
  </div>
);

export default ErrorMessage;
