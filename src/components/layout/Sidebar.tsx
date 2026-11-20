import React from 'react';
import {
  Award,
  Bell,
  BookOpen,
  Calendar,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  ClipboardCheck,
  ClipboardList,
  Clock,
  DoorOpen,
  FileSpreadsheet,
  GraduationCap,
  History,
  LayoutDashboard,
  LogOut,
  Mail,
  QrCode,
  Repeat,
  Settings,
  Share2,
  Shield,
  ShieldAlert,
  UserCheck,
  Users,
} from 'lucide-react';
import { useERP } from '../../context/ERPContext';

interface SidebarProps {
  currentRoute: string;
  onNavigate: (route: string) => void;
  collapsed: boolean;
  onToggleCollapse: () => void;
  mobileOpen: boolean;
  onCloseMobile: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentRoute,
  onNavigate,
  collapsed,
  onToggleCollapse,
  mobileOpen,
  onCloseMobile,
}) => {
  const { session, state, logout } = useERP();

  if (!session) return null;

  // Compute live badges
  const pendingLeaves = state.leaveApplications.filter(
    (l) => l.status === 'with_chairman' || (session.role === 'teacher' && l.status === 'with_teacher')
  ).length;

  const pendingTeacherLeaves = state.teacherLeaveApplications.filter(
    (l) => l.status === 'with_chairman'
  ).length;

  const pendingSubs = state.substitutionRequests.filter(
    (r) =>
      r.status === 'pending' &&
      (session.role !== 'teacher' || (r.candidates || []).includes(session.linkedId || ''))
  ).length;

  const pendingRegs = state.accounts.filter((a) => a.status === 'Pending').length;
  const unreadNotifs = state.notifications.filter((n) => !n.read).length;

  interface NavItem {
    label: string;
    route: string;
    icon: React.ReactNode;
    badge?: number;
    roles?: string[];
  }

  interface NavGroup {
    title: string;
    items: NavItem[];
  }

  const navGroups: NavGroup[] = [
    {
      title: 'Main Portal',
      items: [
        { label: 'Dashboard', route: '#/app/dashboard', icon: <LayoutDashboard size={18} /> },
        {
          label: 'Notifications',
          route: '#/app/notifications',
          icon: <Bell size={18} />,
          badge: unreadNotifs > 0 ? unreadNotifs : undefined,
        },
      ],
    },
    {
      title: 'People & Faculty',
      items: [
        {
          label: 'Students Directory',
          route: '#/app/students',
          icon: <GraduationCap size={18} />,
          roles: ['sysadmin', 'chairman', 'hod', 'coordinator', 'clerk', 'assistant', 'teacher'],
        },
        {
          label: 'Faculty Members',
          route: '#/app/teachers',
          icon: <Users size={18} />,
          roles: ['sysadmin', 'chairman', 'hod', 'coordinator', 'assistant'],
        },
        {
          label: 'Staff & Roles',
          route: '#/app/staff',
          icon: <Shield size={18} />,
          roles: ['sysadmin', 'chairman', 'hod'],
        },
        {
          label: 'Registrations',
          route: '#/app/registrations-admin',
          icon: <UserCheck size={18} />,
          badge: pendingRegs > 0 ? pendingRegs : undefined,
          roles: ['sysadmin', 'chairman', 'hod'],
        },
      ],
    },
    {
      title: 'Academics & Timetable',
      items: [
        {
          label: 'Programs & Depts',
          route: '#/app/programs',
          icon: <Award size={18} />,
          roles: ['sysadmin'],
        },
        {
          label: 'Course Catalog',
          route: '#/app/courses',
          icon: <BookOpen size={18} />,
          roles: ['sysadmin', 'chairman', 'hod', 'clerk', 'assistant', 'teacher'],
        },
        {
          label: session.role === 'student' ? 'My Class Timetable' : 'College Timetable',
          route: '#/app/timetable',
          icon: <Calendar size={18} />,
          roles: ['sysadmin', 'chairman', 'hod', 'clerk', 'assistant', 'teacher', 'student'],
        },
        {
          label: session.role === 'student' ? 'My Coursework & Assignments' : 'Course Assignments',
          route: '#/app/assignments',
          icon: <ClipboardList size={18} />,
          roles: ['chairman', 'hod', 'coordinator', 'teacher', 'clerk', 'student'],
        },
      ],
    },
    {
      title: 'Attendance & QR Engine',
      items: [
        {
          label: 'Start Class / Live QR',
          route: '#/app/qr/start',
          icon: <QrCode size={18} />,
          roles: ['teacher'],
        },
        {
          label: 'Scan QR Code',
          route: '#/app/scan-qr',
          icon: <QrCode size={18} />,
          roles: ['student'],
        },
        {
          label: 'Live Monitor & Clearances',
          route: '#/app/live-monitor',
          icon: <Clock size={18} />,
          roles: ['sysadmin', 'chairman', 'hod'],
        },
        {
          label: 'Manual Attendance Register',
          route: '#/app/attendance/mark',
          icon: <ClipboardCheck size={18} />,
          roles: ['teacher', 'sysadmin', 'chairman', 'hod', 'clerk'],
        },
        {
          label: session.role === 'student' || session.role === 'parent' ? 'My Attendance Record' : 'Attendance Logs & Reports',
          route: '#/app/attendance',
          icon: <CheckCircle2 size={18} />,
          roles: ['sysadmin', 'chairman', 'hod', 'teacher', 'clerk', 'assistant', 'student', 'parent'],
        },
        {
          label: 'Gate Exit Records',
          route: '#/app/exit-records',
          icon: <DoorOpen size={18} />,
          roles: ['sysadmin', 'chairman', 'clerk', 'assistant'],
        },
      ],
    },
    {
      title: 'Leaves & Substitutions',
      items: [
        {
          label: session.role === 'student' ? 'My Leave Applications' : 'Leave Applications',
          route: '#/app/leaves',
          icon: <Mail size={18} />,
          badge:
            session.role === 'student'
              ? undefined
              : (pendingLeaves + pendingTeacherLeaves) > 0
              ? (pendingLeaves + pendingTeacherLeaves)
              : undefined,
          roles: ['sysadmin', 'chairman', 'hod', 'teacher', 'student'],
        },
        {
          label: 'Substitute Teachers',
          route: '#/app/substitutions',
          icon: <Repeat size={18} />,
          badge: pendingSubs > 0 ? pendingSubs : undefined,
          roles: ['sysadmin', 'chairman', 'hod', 'teacher'],
        },
      ],
    },
    {
      title: 'Institutional Governance',
      items: [
        {
          label: 'Committees & OBE Meetings',
          route: '#/app/committees',
          icon: <Users size={18} />,
          roles: ['sysadmin', 'chairman', 'hod', 'coordinator'],
        },
        {
          label: 'Parent-Teacher Meets',
          route: '#/app/parent-meetings',
          icon: <Users size={18} />,
          roles: ['sysadmin', 'chairman', 'hod', 'coordinator', 'parent', 'teacher'],
        },
        {
          label: 'Shared Documents',
          route: '#/app/shared-files',
          icon: <Share2 size={18} />,
        },
        {
          label: 'Semester Promotions',
          route: '#/app/promotions',
          icon: <History size={18} />,
          roles: ['sysadmin', 'chairman', 'hod', 'assistant', 'clerk'],
        },
        {
          label: session.role === 'student' ? 'My Attendance Warnings' : 'Attendance Warnings',
          route: '#/app/warnings',
          icon: <ShieldAlert size={18} />,
          roles: ['sysadmin', 'chairman', 'hod', 'student'],
        },
        {
          label: 'Excel/CSV Import',
          route: '#/app/import',
          icon: <FileSpreadsheet size={18} />,
          roles: ['sysadmin', 'chairman', 'hod', 'assistant', 'clerk'],
        },
      ],
    },
    {
      title: 'System & Reports',
      items: [
        {
          label: 'Official Reports',
          route: '#/app/reports',
          icon: <FileSpreadsheet size={18} />,
          roles: ['sysadmin', 'chairman', 'hod', 'clerk', 'assistant'],
        },
        {
          label: 'System Audit Logs',
          route: '#/app/audit',
          icon: <Clock size={18} />,
          roles: ['sysadmin', 'chairman'],
        },
        {
          label: 'College Settings',
          route: '#/app/settings',
          icon: <Settings size={18} />,
          roles: ['sysadmin', 'chairman'],
        },
      ],
    },
  ];

  return (
    <>
      {/* Mobile Backdrop */}
      {mobileOpen && (
        <div
          className="fixed inset-0 bg-slate-950/60 z-40 lg:hidden backdrop-blur-xs transition-opacity"
          onClick={onCloseMobile}
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-50 flex flex-col bg-gradient-to-b from-[#1e1b4b] via-[#15123d] to-[#0f172a] text-slate-300 transition-all duration-300 shadow-2xl border-r border-indigo-950/50 ${
          collapsed ? 'w-20' : 'w-72'
        } ${mobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}
      >
        {/* Brand Header */}
        <div className="flex items-center justify-between px-5 py-5 border-b border-indigo-900/40">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-amber-500 to-amber-300 flex items-center justify-center font-bold text-slate-950 shadow-lg shadow-amber-500/20 shrink-0">
              <GraduationCap size={22} className="stroke-[2.5]" />
            </div>
            {!collapsed && (
              <div className="min-w-0 leading-tight">
                <h1 className="font-extrabold text-white text-[15px] tracking-tight truncate font-sans">
                  GCT PESHAWAR
                </h1>
                <p className="text-[11px] font-medium text-amber-300/80 tracking-wide uppercase">
                  College ERP
                </p>
              </div>
            )}
          </div>

          <button
            onClick={onToggleCollapse}
            className="hidden lg:flex p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
            title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            {collapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
          </button>
        </div>

        {/* User Scope / Role Indicator */}
        {!collapsed && (
          <div className="mx-4 mt-4 p-3 rounded-xl bg-white/5 border border-white/10 flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-indigo-600/60 text-white font-bold flex items-center justify-center text-sm ring-2 ring-white/10 overflow-hidden shrink-0">
              {session.photoDataUrl ? (
                <img src={session.photoDataUrl} alt={session.displayName} className="w-full h-full object-cover" />
              ) : (
                session.displayName.slice(0, 2).toUpperCase()
              )}
            </div>
            <div className="min-w-0 flex-1">
              <div className="text-xs font-semibold text-white truncate">{session.displayName}</div>
              <div className="text-[10px] uppercase font-bold text-amber-400 tracking-wider">
                {session.role}
              </div>
            </div>
          </div>
        )}

        {/* Navigation List */}
        <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-6 scrollbar-thin scrollbar-thumb-indigo-900">
          {navGroups.map((group, gIdx) => {
            const filteredItems = group.items.filter(
              (item) => !item.roles || item.roles.includes(session.role)
            );
            if (filteredItems.length === 0) return null;

            return (
              <div key={gIdx} className="space-y-1">
                {!collapsed && (
                  <h2 className="px-3 text-[10px] font-bold uppercase tracking-wider text-indigo-300/60">
                    {group.title}
                  </h2>
                )}
                {filteredItems.map((item) => {
                  const normalizeNav = (r: string) => r.replace(/^[#/]+/, '').replace(/^app\/?/, '').split('?')[0];
                  const isActive = normalizeNav(currentRoute) === normalizeNav(item.route);
                  return (
                    <button
                      key={item.route}
                      onClick={() => {
                        onNavigate(item.route);
                        onCloseMobile();
                      }}
                      className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl font-medium text-xs transition-all duration-200 group relative ${
                        isActive
                          ? 'bg-gradient-to-r from-indigo-600 to-indigo-700 text-white shadow-lg shadow-indigo-600/30'
                          : 'text-slate-400 hover:text-white hover:bg-white/5'
                      }`}
                      title={collapsed ? item.label : undefined}
                    >
                      <span className={`shrink-0 ${isActive ? 'text-white' : 'text-slate-400 group-hover:text-amber-400'}`}>
                        {item.icon}
                      </span>
                      {!collapsed && <span className="truncate">{item.label}</span>}
                      {item.badge !== undefined && (
                        <span
                          className={`ml-auto text-[10px] font-bold px-2 py-0.5 rounded-full ${
                            isActive
                              ? 'bg-white text-indigo-700'
                              : 'bg-rose-500 text-white'
                          }`}
                        >
                          {item.badge}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            );
          })}
        </nav>

        {/* Footer / Logout */}
        <div className="p-3 border-t border-indigo-900/40 bg-slate-950/40">
          <button
            onClick={logout}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-rose-300 hover:bg-rose-500/10 hover:text-rose-200 text-xs font-semibold transition-colors"
          >
            <LogOut size={18} className="shrink-0" />
            {!collapsed && <span>Sign Out</span>}
          </button>
        </div>
      </aside>
    </>
  );
};
