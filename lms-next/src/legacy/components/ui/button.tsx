import React from "react";

export const Button = React.forwardRef<HTMLButtonElement, React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "default" | "destructive" | "outline";
}>(({ className = "", variant = "default", ...props }, ref) => (
  <button
    ref={ref}
    className={`px-4 py-2 rounded-md ${className}`}
    {...props}
  />
));
