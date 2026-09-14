import React, { ReactNode } from "react";

export const Card = ({ children, className = "" }: { children: ReactNode; className?: string }) => (
  <div className={`bg-white rounded-lg shadow-lg ${className}`}>{children}</div>
);

export const CardHeader = ({ children, className = "" }: { children: ReactNode; className?: string }) => (
  <div className={`p-4 border-b ${className}`}>{children}</div>
);

export const CardTitle = ({ children, className = "" }: { children: ReactNode; className?: string }) => (
  <h3 className={`text-lg font-semibold ${className}`}>{children}</h3>
);

export const CardContent = ({ children, className = "" }: { children: ReactNode; className?: string }) => (
  <div className={`p-4 ${className}`}>{children}</div>
);

// Added CardFooter component
export const CardFooter = ({ children, className = "" }: { children: ReactNode; className?: string }) => (
  <div className={`p-4 border-t ${className}`}>{children}</div>
);
