import React from "react";

type LoadingSpinnerProps = {
  size?: "sm" | "md" | "lg";
  label?: string;
};

const sizes = {
  sm: "h-4 w-4 border-2",
  md: "h-7 w-7 border-2",
  lg: "h-10 w-10 border-[3px]",
} as const;

export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({ size = "md", label = "Loading" }) => (
  <div className="flex items-center justify-center gap-3 text-sm text-slate-500 dark:text-slate-400" role="status" aria-live="polite">
    <span className={`animate-spin rounded-full border-indigo-600 border-r-transparent ${sizes[size]}`} aria-hidden="true" />
    <span className="sr-only">{label}</span>
  </div>
);

export default LoadingSpinner;
