import React, { useMemo } from "react";
import { motion } from "framer-motion";
import { Menu, Search, Sun, Moon } from "lucide-react";

interface TopbarProps {
  onMenuToggle: () => void;
  adminUser?: { name?: string; email?: string } | null;
  onSearchChange?: (value: string) => void;
  searchTerm?: string;
  avatarLetter?: string;
}

const Topbar: React.FC<TopbarProps> = ({
  onMenuToggle,
  adminUser,
  onSearchChange,
  searchTerm,
  avatarLetter,
}) => {
  const [isDark, setIsDark] = React.useState(() => document.documentElement.classList.contains("dark"));

  const handleThemeToggle = () => {
    setIsDark((prev) => {
      const next = !prev;
      const root = document.documentElement;
      if (next) root.classList.add("dark");
      else root.classList.remove("dark");
      return next;
    });
  };

  const displayName = useMemo(() => adminUser?.name || adminUser?.email || "Admin", [adminUser]);

  return (
    <header className="sticky top-0 z-40 bg-white/75 dark:bg-slate-900/80 backdrop-blur border-b border-slate-200 dark:border-slate-800">
      <div className="max-w-7xl mx-auto flex items-center gap-4 px-4 sm:px-6 lg:px-8 h-16">
        <button
          onClick={onMenuToggle}
          className="lg:hidden inline-flex items-center justify-center w-10 h-10 rounded-lg border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
          aria-label="Toggle navigation"
        >
          <Menu size={20} />
        </button>

        {onSearchChange && (
          <label className="relative flex-1 max-w-xl">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              type="search"
              className="w-full pl-10 pr-3 py-2 rounded-lg border border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-slate-950/70 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              placeholder="Search users..."
              value={searchTerm || ""}
              onChange={(e) => onSearchChange?.(e.target.value)}
              aria-label="Search users"
            />
          </label>
        )}

        <div className="ml-auto flex items-center gap-3">
          <button
            onClick={handleThemeToggle}
            className="inline-flex items-center justify-center w-10 h-10 rounded-lg border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
            aria-label="Toggle color theme"
          >
            {isDark ? <Sun size={18} /> : <Moon size={18} />}
          </button>
          <div className="flex items-center gap-2">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 text-white flex items-center justify-center font-semibold"
              aria-label={`Logged in as ${displayName}`}
            >
              {avatarLetter || "A"}
            </motion.div>
            <div className="hidden sm:block">
              <p className="text-sm font-semibold text-slate-800 dark:text-slate-100">{displayName}</p>
              <p className="text-xs text-slate-500 dark:text-slate-400">Administrator</p>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};

export default React.memo(Topbar);
