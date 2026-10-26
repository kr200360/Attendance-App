import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  LayoutDashboard,
  Users,
  GraduationCap,
  CalendarCheck,
  FileBarChart2,
  CalendarDays,
  FileCheck2,
  Settings,
  History,
  ClipboardList
} from 'lucide-react';
import { clsx } from 'clsx';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ isOpen, onClose }) => {
  const { user } = useAuth();

  const adminNav = [
    { to: '/admin/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { to: '/admin/attendance', label: 'Attendance Monitor', icon: CalendarCheck },
    { to: '/admin/students', label: 'Students', icon: GraduationCap },
    { to: '/admin/teachers', label: 'Teachers', icon: Users },
    { to: '/admin/classes', label: 'Classes & Sections', icon: ClipboardList },
    { to: '/admin/reports', label: 'Reports & Analytics', icon: FileBarChart2 },
    { to: '/admin/leave-approvals', label: 'Leave Requests', icon: FileCheck2 },
    { to: '/admin/audit-logs', label: 'Audit Trail', icon: History },
    { to: '/admin/settings', label: 'School Settings', icon: Settings }
  ];

  const teacherNav = [
    { to: '/teacher/dashboard', label: 'Overview', icon: LayoutDashboard },
    { to: '/teacher/mark-attendance', label: 'Mark Attendance', icon: CalendarCheck },
    { to: '/teacher/history', label: 'Attendance History', icon: History },
    { to: '/teacher/leaves', label: 'Student Leaves', icon: FileCheck2 }
  ];

  const parentNav = [
    { to: '/parent/dashboard', label: 'Child Attendance', icon: CalendarDays },
    { to: '/parent/leaves', label: 'Leave Requests', icon: FileCheck2 }
  ];

  const navItems = user?.role === 'admin'
    ? adminNav
    : user?.role === 'teacher'
    ? teacherNav
    : parentNav;

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-slate-900/40 backdrop-blur-sm lg:hidden"
          onClick={onClose}
        />
      )}

      <aside
        className={clsx(
          'fixed inset-y-0 left-0 z-50 flex w-64 flex-col border-r border-slate-200 bg-white transition-transform duration-200 ease-in-out lg:static lg:translate-x-0',
          isOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        <div className="flex h-16 items-center px-6 border-b border-slate-100 lg:hidden">
          <span className="text-base font-bold text-slate-800">Navigation Menu</span>
        </div>

        <nav className="flex-1 space-y-1.5 p-4 overflow-y-auto">
          <div className="px-3 pb-2 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
            {user?.role === 'admin' ? 'Administration' : user?.role === 'teacher' ? 'Classroom' : 'Parent Portal'}
          </div>

          {navItems.map(item => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.to}
                to={item.to}
                onClick={onClose}
                className={({ isActive }) =>
                  clsx(
                    'flex items-center space-x-3 rounded-lg px-3.5 py-2.5 text-sm font-medium transition-colors',
                    isActive
                      ? 'bg-blue-50 text-blue-700 font-semibold shadow-xs'
                      : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                  )
                }
              >
                <Icon className="h-4 w-4" />
                <span>{item.label}</span>
              </NavLink>
            );
          })}
        </nav>

        <div className="p-4 border-t border-slate-100 text-[11px] text-slate-400 text-center">
          EduTrack v1.0 • Academic 2026-2027
        </div>
      </aside>
    </>
  );
};
