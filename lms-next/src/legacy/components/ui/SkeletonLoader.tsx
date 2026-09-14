import React from "react";

interface SkeletonLoaderProps {
  lines?: number;
  className?: string;
}

const SkeletonLoader: React.FC<SkeletonLoaderProps> = ({ lines = 3, className = "" }) => {
  return (
    <div className={`space-y-3 ${className}`} role="status" aria-live="polite" aria-busy="true">
      {Array.from({ length: lines }).map((_, idx) => (
        <div
          key={idx}
          className="h-4 rounded bg-slate-200/80 dark:bg-slate-800/70 animate-pulse"
        />
      ))}
    </div>
  );
};

export default React.memo(SkeletonLoader);
