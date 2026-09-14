import React, { useMemo, useState } from "react";
import { RefreshCw, Trash2, ShieldCheck, Search, User as UserIcon } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import SkeletonLoader from "../ui/SkeletonLoader";

interface User {
  _id: string;
  name: string;
  email: string;
  role: string;
}

interface UsersTableProps {
  users: User[];
  loading?: boolean;
  searchTerm: string;
  onSearchChange: (value: string) => void;
  onRefresh: () => void;
  onDelete: (user: User) => void;
  onApprove: (userId: string) => void;
  onViewProfile?: (userId: string) => void;
}

const UsersTable: React.FC<UsersTableProps> = ({
  users,
  loading,
  searchTerm,
  onSearchChange,
  onRefresh,
  onDelete,
  onApprove,
  onViewProfile,
}) => {
  const pendingCount = useMemo(
    () => users.filter((u) => (u.role || "").toLowerCase() === "pending").length,
    [users]
  );

  return (
    <div className="rounded-xl bg-white/80 dark:bg-slate-900/80 backdrop-blur border border-slate-200 dark:border-slate-800 shadow-sm">
      <div className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">User Management</h2>
          <p className="text-sm text-slate-500 dark:text-slate-400">Manage users and approve instructors ({pendingCount} pending)</p>
        </div>
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <label className="relative w-full sm:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              type="search"
              className="w-full pl-10 pr-3 py-2 rounded-lg border border-slate-200 dark:border-slate-800 bg-white/70 dark:bg-slate-950/70 text-sm focus:ring-2 focus:ring-indigo-500"
              placeholder="Search users..."
              value={searchTerm}
              onChange={(e) => onSearchChange(e.target.value)}
              aria-label="Search users"
            />
          </label>
          <button
            onClick={onRefresh}
            className="inline-flex items-center justify-center h-10 px-3 rounded-lg border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800"
            aria-label="Refresh users"
          >
            <RefreshCw size={18} />
          </button>
        </div>
      </div>

      <div className="px-4 pb-4">
        {loading ? (
          <SkeletonLoader lines={4} />
        ) : (
          <div className="overflow-hidden rounded-lg border border-slate-200 dark:border-slate-800">
            <div className="hidden md:block">
              <table className="w-full text-sm">
                <thead className="bg-slate-50 dark:bg-slate-900/60 text-slate-600 dark:text-slate-300">
                  <tr>
                    <th className="px-4 py-3 text-left">Name</th>
                    <th className="px-4 py-3 text-left">Email</th>
                    <th className="px-4 py-3 text-left">Role</th>
                    <th className="px-4 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 dark:divide-slate-800 bg-white dark:bg-slate-950">
                  {users.map((user) => (
                    <tr key={user._id} className="hover:bg-slate-50 dark:hover:bg-slate-900">
                      <td className="px-4 py-3 font-medium text-slate-900 dark:text-slate-100">{user.name || "No Name"}</td>
                      <td className="px-4 py-3 text-slate-600 dark:text-slate-300">{user.email || "No Email"}</td>
                      <td className="px-4 py-3 capitalize text-slate-600 dark:text-slate-300">{user.role || "student"}</td>
                      <td className="px-4 py-3">
                        <div className="flex justify-end gap-2">
                          {onViewProfile && (
                            <button
                              onClick={() => onViewProfile(user._id)}
                              className="inline-flex items-center gap-2 px-3 py-2 rounded-md bg-blue-50 text-blue-600 hover:bg-blue-100 border border-blue-100 text-xs"
                              aria-label={`View profile for ${user.name || user.email}`}
                            >
                              <UserIcon size={14} /> View
                            </button>
                          )}
                          {user.role?.toLowerCase() === "pending" && (
                            <button
                              onClick={() => onApprove(user._id)}
                              className="inline-flex items-center gap-2 px-3 py-2 rounded-md bg-emerald-600 text-white hover:bg-emerald-700 text-xs"
                              aria-label={`Approve ${user.name || user.email}`}
                            >
                              <ShieldCheck size={14} /> Approve
                            </button>
                          )}
                          <button
                            onClick={() => onDelete(user)}
                            className="inline-flex items-center gap-2 px-3 py-2 rounded-md bg-red-50 text-red-600 hover:bg-red-100 border border-red-100 text-xs"
                            aria-label={`Delete ${user.name || user.email}`}
                          >
                            <Trash2 size={14} /> Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="md:hidden space-y-3">
              <AnimatePresence>
                {users.map((user) => (
                  <motion.div
                    key={user._id}
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 6 }}
                    className="p-4 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 shadow-sm"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-semibold text-slate-900 dark:text-slate-100">{user.name || "No Name"}</p>
                        <p className="text-xs text-slate-500">{user.email || "No Email"}</p>
                        <p className="text-xs text-slate-400 mt-1">Role: {user.role || "student"}</p>
                      </div>
                      <div className="flex flex-col gap-2 text-right">
                        {onViewProfile && (
                          <button
                            onClick={() => onViewProfile(user._id)}
                            className="inline-flex items-center gap-1 px-2 py-1.5 rounded-md bg-blue-50 text-blue-600 border border-blue-100 text-xs"
                          >
                            <UserIcon size={12} /> View
                          </button>
                        )}
                        {user.role?.toLowerCase() === "pending" && (
                          <button
                            onClick={() => onApprove(user._id)}
                            className="inline-flex items-center gap-1 px-2 py-1.5 rounded-md bg-emerald-600 text-white text-xs"
                          >
                            <ShieldCheck size={12} /> Approve
                          </button>
                        )}
                        <button
                          onClick={() => onDelete(user)}
                          className="inline-flex items-center gap-1 px-2 py-1.5 rounded-md bg-red-50 text-red-600 border border-red-100 text-xs"
                        >
                          <Trash2 size={12} /> Delete
                        </button>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default React.memo(UsersTable);
