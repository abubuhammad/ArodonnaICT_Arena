import React from "react";

const variantClasses = {
  default: "bg-indigo-600 text-white shadow-sm hover:bg-indigo-700 focus-visible:ring-indigo-500",
  destructive: "bg-red-600 text-white shadow-sm hover:bg-red-700 focus-visible:ring-red-500",
  outline: "border border-slate-300 bg-transparent text-slate-700 hover:bg-slate-100 focus-visible:ring-indigo-500 dark:border-slate-700 dark:text-slate-100 dark:hover:bg-slate-800",
  secondary: "bg-slate-100 text-slate-900 hover:bg-slate-200 focus-visible:ring-indigo-500 dark:bg-slate-800 dark:text-slate-100 dark:hover:bg-slate-700",
  ghost: "text-slate-700 hover:bg-slate-100 focus-visible:ring-indigo-500 dark:text-slate-100 dark:hover:bg-slate-800",
  link: "text-indigo-600 underline-offset-4 hover:underline focus-visible:ring-indigo-500 dark:text-indigo-400",
} as const;

const sizeClasses = {
  sm: "h-9 px-3 text-sm",
  md: "h-10 px-4 text-sm",
  lg: "h-11 px-6 text-base",
  icon: "h-10 w-10",
} as const;

type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: keyof typeof variantClasses;
  size?: keyof typeof sizeClasses;
};

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className = "", variant = "default", size = "md", type = "button", ...props }, ref) => (
    <button
      ref={ref}
      type={type}
      className={`inline-flex items-center justify-center gap-2 rounded-lg font-medium transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-white disabled:pointer-events-none disabled:opacity-50 dark:focus-visible:ring-offset-slate-950 ${sizeClasses[size]} ${variantClasses[variant]} ${className}`}
      {...props}
    />
  )
);

Button.displayName = "Button";
