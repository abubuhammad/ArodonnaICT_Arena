import React from "react";

const variantClasses = {
  default: "bg-indigo-100 text-indigo-700 dark:bg-indigo-500/20 dark:text-indigo-300",
  secondary: "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300",
  success: "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-300",
  warning: "bg-amber-100 text-amber-800 dark:bg-amber-500/20 dark:text-amber-300",
  destructive: "bg-red-100 text-red-700 dark:bg-red-500/20 dark:text-red-300",
  outline: "border border-slate-300 text-slate-700 dark:border-slate-700 dark:text-slate-300",
} as const;

type BadgeProps = React.HTMLAttributes<HTMLSpanElement> & {
  variant?: keyof typeof variantClasses;
};

export const Badge = ({ children, variant = "default", className = "", ...props }: BadgeProps) => (
  <span
    className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium leading-4 ${variantClasses[variant]} ${className}`}
    {...props}
  >
    {children}
  </span>
);

export default Badge;
