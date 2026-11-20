/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useState } from 'react';
import { ShieldAlert } from 'lucide-react';
import { ERPProvider, useERP } from './context/ERPContext';
import { AppLayout } from './components/layout/AppLayout';
import { ErrorBoundary } from './components/common/ErrorBoundary';
import { UserRole } from './types/erp';

// All ERP Views
import { DashboardView } from './views/DashboardView';
import { StudentsView } from './views/StudentsView';
import { TeachersView } from './views/TeachersView';
import { StaffView } from './views/StaffView';
import { RegistrationsAdminView } from './views/RegistrationsAdminView';
import { ProgramsView } from './views/ProgramsView';
import { CoursesView } from './views/CoursesView';
import { TimetableView } from './views/TimetableView';
import { AttendanceView } from './views/AttendanceView';
import { AttendanceMarkView } from './views/AttendanceMarkView';
import { QRAttendanceView } from './views/QRAttendanceView';
import { LeavesView } from './views/LeavesView';
import { SubstitutionsView } from './views/SubstitutionsView';
import { CommitteesView } from './views/CommitteesView';
import { ParentMeetingsView } from './views/ParentMeetingsView';
import { AssignmentsView } from './views/AssignmentsView';
import { ReportsView } from './views/ReportsView';
import { SettingsView } from './views/SettingsView';
import { AuditLogsView } from './views/AuditLogsView';
import { PromotionsView } from './views/PromotionsView';
import { ExitRecordsView } from './views/ExitRecordsView';
import { ImportView } from './views/ImportView';
import { ProfileView } from './views/ProfileView';
import { LoginView } from './views/LoginView';
import { NotificationsView } from './views/NotificationsView';
import { SharedFilesView } from './views/SharedFilesView';
import { WarningsView } from './views/WarningsView';

export const normalizeRoute = (raw: string): string => {
  if (!raw) return 'dashboard';
  let clean = raw.trim();
  // Strip leading hashes and slashes
  clean = clean.replace(/^[#/]+/, '');
  // Strip leading 'app/' prefix
  clean = clean.replace(/^app\/?/, '');
  // Strip query parameters or inner hashes
  clean = clean.split('?')[0].split('#')[0];
  return clean || 'dashboard';
};

// Central Route Configuration
export interface RouteConfig {
  id: string;
  render: (onNavigate: (route: string) => void) => React.ReactNode;
  allowedRoles?: UserRole[];
  aliases?: string[];
}

export const ROUTE_DEFINITIONS: RouteConfig[] = [
  {
    id: 'dashboard',
    render: (onNavigate) => <DashboardView onNavigate={onNavigate} />,
  },
  {
    id: 'students',
    render: () => <StudentsView />,
    allowedRoles: ['sysadmin', 'chairman', 'hod', 'coordinator', 'clerk', 'assistant', 'teacher'],
  },
  {
    id: 'teachers',
    render: () => <TeachersView />,
    allowedRoles: ['sysadmin', 'chairman', 'hod', 'coordinator', 'assistant'],
  },
  {
    id: 'staff',
    render: () => <StaffView />,
    allowedRoles: ['sysadmin', 'chairman', 'hod'],
  },
  {
    id: 'registrations-admin',
    aliases: ['registrations'],
    render: () => <RegistrationsAdminView />,
    allowedRoles: ['sysadmin', 'chairman', 'hod'],
  },
  {
    id: 'programs',
    render: () => <ProgramsView />,
    allowedRoles: ['sysadmin'],
  },
  {
    id: 'courses',
    render: () => <CoursesView />,
    allowedRoles: ['sysadmin', 'chairman', 'hod', 'clerk', 'assistant', 'teacher'],
  },
  {
    id: 'timetable',
    aliases: ['my-timetable'],
    render: () => <TimetableView />,
    allowedRoles: ['sysadmin', 'chairman', 'hod', 'clerk', 'assistant', 'teacher', 'student'],
  },
  {
    id: 'assignments',
    aliases: ['my-assignments'],
    render: () => <AssignmentsView />,
    allowedRoles: ['chairman', 'hod', 'coordinator', 'teacher', 'clerk', 'student'],
  },
  {
    id: 'shared-files',
    render: () => <SharedFilesView />,
  },
  {
    id: 'attendance',
    aliases: ['academics'], // Merged duplicate
    render: () => <AttendanceView />,
  },
  {
    id: 'attendance/mark',
    aliases: ['attendance_mark', 'mark-attendance'],
    render: () => <AttendanceMarkView />,
    allowedRoles: ['sysadmin', 'chairman', 'hod', 'teacher', 'clerk'],
  },
  {
    id: 'qr/start',
    aliases: ['qr_attendance', 'qr-attendance'],
    render: () => <QRAttendanceView mode="start" />,
    allowedRoles: ['teacher'],
  },
  {
    id: 'scan-qr',
    render: () => <QRAttendanceView mode="scan" />,
    allowedRoles: ['student'],
  },
  {
    id: 'live-monitor',
    aliases: ['late-scan-requests'],
    render: () => <QRAttendanceView mode="monitor" />,
    allowedRoles: ['sysadmin', 'chairman', 'hod'],
  },
  {
    id: 'leaves',
    aliases: ['my-leave'],
    render: () => <LeavesView initialTab="student" />,
  },
  {
    id: 'teacher-leaves',
    render: () => <LeavesView initialTab="teacher" />,
    allowedRoles: ['sysadmin', 'chairman', 'hod', 'teacher'],
  },
  {
    id: 'substitutions',
    render: () => <SubstitutionsView />,
    allowedRoles: ['sysadmin', 'chairman', 'hod', 'teacher'],
  },
  {
    id: 'committees',
    render: () => <CommitteesView initialTab="committees" />,
    allowedRoles: ['sysadmin', 'chairman', 'hod', 'coordinator'],
  },
  {
    id: 'parent-meetings',
    aliases: ['meetings', 'parent_meetings'], // Merged duplicates
    render: () => <ParentMeetingsView />,
    allowedRoles: ['sysadmin', 'chairman', 'hod', 'coordinator', 'teacher', 'parent'],
  },
  {
    id: 'promotions',
    render: () => <PromotionsView />,
    allowedRoles: ['sysadmin', 'chairman', 'hod', 'assistant', 'clerk'],
  },
  {
    id: 'warnings',
    aliases: ['my-warnings'],
    render: () => <WarningsView />,
  },
  {
    id: 'exit-records',
    aliases: ['exit_records'],
    render: () => <ExitRecordsView />,
    allowedRoles: ['sysadmin', 'chairman', 'clerk', 'assistant'],
  },
  {
    id: 'import',
    render: () => <ImportView />,
    allowedRoles: ['sysadmin', 'chairman', 'hod', 'assistant', 'clerk'],
  },
  {
    id: 'reports',
    render: () => <ReportsView />,
    allowedRoles: ['sysadmin', 'chairman', 'hod', 'coordinator', 'clerk', 'assistant', 'teacher'],
  },
  {
    id: 'audit-logs',
    aliases: ['audit', 'audit_logs'],
    render: () => <AuditLogsView />,
    allowedRoles: ['sysadmin'],
  },
  {
    id: 'settings',
    render: () => <SettingsView />,
    allowedRoles: ['sysadmin', 'chairman'],
  },
  {
    id: 'profile',
    aliases: ['profile-self'],
    render: () => <ProfileView />,
  },
  {
    id: 'notifications',
    render: (onNavigate) => <NotificationsView onNavigate={onNavigate} />,
  },
];

// Helper to resolve route config by primary ID or alias
const resolveRoute = (key: string): RouteConfig => {
  const match = ROUTE_DEFINITIONS.find(
    (r) => r.id === key || (r.aliases && r.aliases.includes(key))
  );
  return match || ROUTE_DEFINITIONS[0]; // fallback to dashboard
};

const getInitialRoute = (): string => {
  return normalizeRoute(window.location.hash);
};

const MainRouter: React.FC = () => {
  const { session } = useERP();
  const [currentRoute, setCurrentRoute] = useState<string>(getInitialRoute);

  // Sync hash with route state
  useEffect(() => {
    const handleHashChange = () => {
      const normalized = normalizeRoute(window.location.hash);
      setCurrentRoute(normalized);
    };

    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  const navigateTo = (route: string) => {
    const normalized = normalizeRoute(route);
    window.location.hash = `#/app/${normalized}`;
    setCurrentRoute(normalized);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // If unauthenticated, show login view
  if (!session) {
    return <LoginView onLoginSuccess={() => navigateTo('dashboard')} />;
  }

  // View dispatcher via central route configuration
  const renderView = () => {
    const key = normalizeRoute(currentRoute);
    const route = resolveRoute(key);

    // Permission check against user role
    if (route.allowedRoles && !route.allowedRoles.includes(session.role)) {
      return (
        <div className="bg-white rounded-2xl p-10 text-center max-w-md mx-auto my-12 border border-slate-200/80 shadow-sm animate-in fade-in zoom-in-95 duration-200">
          <div className="w-14 h-14 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center mx-auto mb-4 font-bold">
            <ShieldAlert size={28} />
          </div>
          <h2 className="text-lg font-bold text-slate-800 mb-1">Access Restricted</h2>
          <p className="text-xs text-slate-500 mb-6">
            This module is reserved for authorized institutional roles. Your current role is <strong>{session.role}</strong>.
          </p>
          <button
            type="button"
            onClick={() => navigateTo('dashboard')}
            className="px-5 py-2.5 rounded-xl bg-indigo-600 text-white font-bold text-xs hover:bg-indigo-700 transition-colors shadow-md shadow-indigo-600/20"
          >
            Return to My Dashboard
          </button>
        </div>
      );
    }

    return route.render(navigateTo);
  };

  return (
    <AppLayout currentRoute={currentRoute} onNavigate={navigateTo}>
      <ErrorBoundary
        key={currentRoute}
        isolateScope
        fallbackTitle="Section Unavailable"
        fallbackMessage={`An unexpected issue occurred while loading this section (${currentRoute}). You can retry or return to your dashboard.`}
      >
        {renderView()}
      </ErrorBoundary>
    </AppLayout>
  );
};

export default function App() {
  return (
    <ErrorBoundary
      fallbackTitle="Application Error"
      fallbackMessage="A critical error prevented the college portal from loading. You can recover your session or reload the page."
    >
      <ERPProvider>
        <MainRouter />
      </ERPProvider>
    </ErrorBoundary>
  );
}
