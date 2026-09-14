import React, { ReactNode } from "react";

interface AlertDialogProps {
  children: ReactNode;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface DialogComponentProps {
  children: ReactNode;
  className?: string;
}

export const AlertDialog = ({ children, open, onOpenChange }: AlertDialogProps) => {
  if (!open) return null;

  return (
    <div 
      className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center"
      onClick={() => onOpenChange(false)}
    >
      <div onClick={(e) => e.stopPropagation()}>
        {children}
      </div>
    </div>
  );
};

export const AlertDialogContent = ({ children }: DialogComponentProps) => (
  <div className="bg-white dark:bg-slate-900 rounded-lg shadow-lg max-w-sm w-full mx-4">
    {children}
  </div>
);

export const AlertDialogHeader = ({ children }: DialogComponentProps) => (
  <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800">
    {children}
  </div>
);

export const AlertDialogTitle = ({ children }: DialogComponentProps) => (
  <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
    {children}
  </h3>
);

export const AlertDialogDescription = ({ children }: DialogComponentProps) => (
  <p className="text-sm text-slate-600 dark:text-slate-400 mt-2">
    {children}
  </p>
);

export const AlertDialogFooter = ({ children }: DialogComponentProps) => (
  <div className="px-6 py-4 border-t border-slate-200 dark:border-slate-800 flex justify-end gap-3">
    {children}
  </div>
);

export const AlertDialogAction = ({ children, ...props }: React.ButtonHTMLAttributes<HTMLButtonElement>) => (
  <button 
    className="inline-flex items-center justify-center px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 font-medium text-sm disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
    {...props}
  >
    {children}
  </button>
);

export const AlertDialogCancel = ({ children, ...props }: React.ButtonHTMLAttributes<HTMLButtonElement>) => (
  <button 
    className="inline-flex items-center justify-center px-4 py-2 bg-slate-200 dark:bg-slate-800 text-slate-900 dark:text-slate-100 rounded-md hover:bg-slate-300 dark:hover:bg-slate-700 font-medium text-sm transition-colors"
    {...props}
  >
    {children}
  </button>
);
