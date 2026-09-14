import React from 'react';
import { Shield, Lock, CheckCircle } from 'lucide-react';
import { useUserPermissions, useRoleDisplay } from '../../hooks/useUserPermissions';

const RoleInfoBadge: React.FC = () => {
  const { role, permissions } = useUserPermissions();
  const { label, color } = useRoleDisplay(role);

  return (
    <div className="flex items-center gap-2 px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950">
      <Shield size={16} className="text-slate-600 dark:text-slate-400" />
      <div>
        <p className="text-xs text-slate-500 dark:text-slate-400">Current Role</p>
        <p className={`text-sm font-semibold bg-gradient-to-r ${color} bg-clip-text text-transparent`}>
          {label}
        </p>
      </div>
      <div className="hidden sm:flex items-center gap-1 ml-2 pl-2 border-l border-slate-200 dark:border-slate-800">
        <CheckCircle size={14} className="text-emerald-600 dark:text-emerald-400" />
        <span className="text-xs text-slate-600 dark:text-slate-400">{permissions.length} permissions</span>
      </div>
    </div>
  );
};

export const PermissionsMatrix: React.FC = () => {
  const { role, can } = useUserPermissions();

  const permissionGroups = [
    {
      name: 'User Management',
      permissions: ['list_users', 'create_user', 'update_user', 'delete_user', 'approve_instructor'],
    },
    {
      name: 'Course Management',
      permissions: ['list_courses', 'create_course', 'update_course', 'delete_course', 'publish_course'],
    },
    {
      name: 'Enrollment Management',
      permissions: ['list_enrollments', 'create_enrollment', 'delete_enrollment', 'grant_free_enrollment'],
    },
    {
      name: 'Analytics & Reporting',
      permissions: ['view_analytics', 'export_data', 'view_audit_logs'],
    },
  ];

  return (
    <div className="space-y-4">
      {permissionGroups.map((group) => (
        <div
          key={group.name}
          className="rounded-lg border border-slate-200 dark:border-slate-800 p-4 bg-white dark:bg-slate-950"
        >
          <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100 mb-3">
            {group.name}
          </h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {group.permissions.map((perm) => {
              const hasPermission = can(perm as any);
              return (
                <div
                  key={perm}
                  className={`flex items-center gap-2 px-3 py-2 rounded-md text-xs ${
                    hasPermission
                      ? 'bg-emerald-50 dark:bg-emerald-950/20 text-emerald-700 dark:text-emerald-300'
                      : 'bg-slate-100 dark:bg-slate-900/50 text-slate-400 dark:text-slate-500 opacity-50'
                  }`}
                >
                  {hasPermission ? (
                    <CheckCircle size={12} />
                  ) : (
                    <Lock size={12} />
                  )}
                  <span>{perm.replace(/_/g, ' ')}</span>
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
};

export default RoleInfoBadge;
