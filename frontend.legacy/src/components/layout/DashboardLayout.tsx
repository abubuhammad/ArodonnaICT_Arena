import React, { useState, ReactNode, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Sidebar from "./Sidebar";
import Topbar from "./Topbar";

interface DashboardLayoutProps {
  children: ReactNode;
  adminUser?: { name?: string; email?: string } | null;
  onSearchChange?: (value: string) => void;
  searchTerm?: string;
  activeItem?: string;
}

const DashboardLayout: React.FC<DashboardLayoutProps> = ({
  children,
  adminUser,
  onSearchChange,
  searchTerm,
  activeItem = "dashboard",
}) => {
  const [isSidebarOpen, setSidebarOpen] = useState(false);

  const toggleSidebar = () => setSidebarOpen((prev) => !prev);

  const avatar = useMemo(() => {
    const name = adminUser?.name || adminUser?.email || "Admin";
    return name.charAt(0).toUpperCase();
  }, [adminUser]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 text-slate-900 dark:text-slate-100">
      <div className="flex min-h-screen">
        <Sidebar activeItem={activeItem} isOpen={isSidebarOpen} onClose={() => setSidebarOpen(false)} />

        <div className="flex-1 flex flex-col">
          <Topbar
            onMenuToggle={toggleSidebar}
            adminUser={adminUser}
            onSearchChange={onSearchChange}
            searchTerm={searchTerm}
            avatarLetter={avatar}
          />

          <main className="px-4 sm:px-6 lg:px-8 pb-10">
            <AnimatePresence mode="wait">
              <motion.div
                key="dashboard-main"
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 12 }}
                transition={{ duration: 0.18, ease: "easeOut" }}
                className="max-w-7xl mx-auto w-full"
              >
                {children}
              </motion.div>
            </AnimatePresence>
          </main>
        </div>
      </div>
    </div>
  );
};

export default DashboardLayout;
