// frontend/src/components/ui/LoadingSpinner.tsx
import React from "react";

interface LoadingSpinnerProps {
  size?: "sm" | "md" | "lg";
}

export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({ size = "md" }) => {
  let spinnerSizeClasses: string;
  switch (size) {
    case "sm":
      spinnerSizeClasses = "h-4 w-4";
      break;
    case "lg":
      spinnerSizeClasses = "h-12 w-12";
      break;
    case "md":
    default:
      spinnerSizeClasses = "h-8 w-8";
      break;
  }

  return (
    <div
      className={`animate-spin rounded-full border-b-2 border-indigo-600 ${spinnerSizeClasses}`}
    />
  );
};

export default LoadingSpinner;
