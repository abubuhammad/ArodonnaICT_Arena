import React from "react";

type SurfaceProps = React.HTMLAttributes<HTMLDivElement>;

export const Card = ({ className = "", ...props }: SurfaceProps) => (
  <div
    className={`rounded-xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900 ${className}`}
    {...props}
  />
);

export const CardHeader = ({ className = "", ...props }: SurfaceProps) => (
  <div className={`border-b border-slate-200 p-6 dark:border-slate-800 ${className}`} {...props} />
);

export const CardTitle = ({ className = "", ...props }: React.HTMLAttributes<HTMLHeadingElement>) => (
  <h3 className={`text-lg font-semibold leading-7 text-slate-950 dark:text-slate-50 ${className}`} {...props} />
);

export const CardContent = ({ className = "", ...props }: SurfaceProps) => (
  <div className={`p-6 ${className}`} {...props} />
);

export const CardFooter = ({ className = "", ...props }: SurfaceProps) => (
  <div className={`border-t border-slate-200 p-6 dark:border-slate-800 ${className}`} {...props} />
);
