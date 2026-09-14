import React from 'react';

interface BadgeProps {
  children: React.ReactNode;
  variant?: "default" | "outline";
  className?: string;
}

export const Badge: React.FC<BadgeProps> = ({ children, variant = "default", className = "" }) => {
  const baseStyles = "inline-block px-2 py-1 text-xs font-medium rounded";
  const variantStyles =
    variant === "outline"
      ? "border border-gray-300 text-gray-700"
      : "bg-gray-200 text-gray-800";
  return (
    <span className={`${baseStyles} ${variantStyles} ${className}`}>
      {children}
    </span>
  );
};

export default Badge;
