import React from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { LayoutDashboard, BookOpen, Users, Palette, Layers, X } from "lucide-react";

interface SidebarProps {
  activeItem?: string;
  isOpen?: boolean;
  onClose?: () => void;
}

const navItems = [
  { key: "dashboard", label: "Dashboard", icon: LayoutDashboard, path: "/admin/dashboard" },
  { key: "courses", label: "Courses", icon: BookOpen, path: "/admin/dashboard#courses" },
  { key: "users", label: "Users", icon: Users, path: "/admin/dashboard#users" },
  { key: "categories", label: "Categories", icon: Layers, path: "/admin/manage-categories" },
  { key: "theme", label: "Theme", icon: Palette, path: "/admin/manage-theme" },
];

const Sidebar: React.FC<SidebarProps> = ({ activeItem = "dashboard", isOpen = false, onClose }) => {
  const navigate = useNavigate();
  const location = useLocation();

  const handleNavigate = (path: string) => {
    navigate(path);
    onClose?.();
  };

  return (
    <aside
      className={`${isOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"} fixed lg:static z-50 inset-y-0 left-0 w-72 bg-white/80 dark:bg-slate-950/80 backdrop-blur border-r border-slate-200 dark:border-slate-800 transition-transform duration-200 ease-out`}
      aria-label="Sidebar navigation"
    >
      <div className="h-16 flex items-center justify-between px-4 border-b border-slate-200 dark:border-slate-800 lg:hidden">
        <span className="font-semibold text-slate-800 dark:text-slate-100">Menu</span>
        <button
          onClick={onClose}
          className="p-2 rounded-lg border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300"
          aria-label="Close navigation"
        >
          <X size={18} />
        </button>
      </div>
      <div className="p-4 space-y-2">
        {navItems.map(({ key, label, icon: Icon, path }) => {
          const current = `${location.pathname}${location.hash}`;
          const isActive = activeItem === key || current === path;
          return (
            <button
              key={key}
              onClick={() => handleNavigate(path)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
                isActive
                  ? "bg-indigo-50 text-indigo-700 border border-indigo-100 dark:bg-indigo-950/60 dark:text-indigo-100 dark:border-indigo-900"
                  : "text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-900"
              }`}
              aria-current={isActive ? "page" : undefined}
            >
              <Icon size={18} />
              <span className="font-medium text-sm">{label}</span>
            </button>
          );
        })}
      </div>
    </aside>
  );
};

export default React.memo(Sidebar);
