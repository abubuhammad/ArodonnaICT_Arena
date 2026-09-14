import React from "react";

type SkeletonLoaderProps = {
  lines?: number;
  className?: string;
};

const SkeletonLoader: React.FC<SkeletonLoaderProps> = ({ lines = 3, className = "" }) => (
  <div className={`space-y-3 ${className}`} role="status" aria-label="Loading" aria-busy="true">
    {Array.from({ length: lines }).map((_, index) => (
      <div
        key={index}
        className={`h-4 animate-pulse rounded-md bg-slate-200 dark:bg-slate-800 ${index === 0 ? "w-3/4" : "w-full"}`}
      />
    ))}
  </div>
);

export default React.memo(SkeletonLoader);
