import React, { useState } from 'react';
import {
  AlertTriangle,
  Building,
  CheckCircle,
  GraduationCap,
  Info,
  Shield,
  X,
  XCircle,
} from 'lucide-react';
import { useERP } from '../../context/ERPContext';
import { Sidebar } from './Sidebar';
import { TopBar } from './TopBar';

interface AppLayoutProps {
  currentRoute: string;
  onNavigate: (route: string) => void;
  children: React.ReactNode;
}

export const AppLayout: React.FC<AppLayoutProps> = ({
  currentRoute,
  onNavigate,
  children,
}) => {
  const { session, state, getScope, toasts, removeToast } = useERP();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  const scope = getScope();

  // Scope labels
  const scopeProgram = scope.programIds.length
    ? state.programs.find((p) => p.id === scope.programIds[0])
    : null;
  const scopeDepartment = scope.departmentIds.length
    ? state.departments.find((d) => d.id === scope.departmentIds[0])
    : null;

  return (
    <div className="min-h-screen bg-[#f4f7fe] flex text-slate-800 antialiased font-sans">
      {/* SkoolZoom Sidebar */}
      <Sidebar
        currentRoute={currentRoute}
        onNavigate={onNavigate}
        collapsed={sidebarCollapsed}
        onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
        mobileOpen={mobileSidebarOpen}
        onCloseMobile={() => setMobileSidebarOpen(false)}
      />

      {/* Main Container */}
      <div
        className={`flex-1 flex flex-col min-w-0 transition-all duration-300 ${
          sidebarCollapsed ? 'lg:pl-20' : 'lg:pl-72'
        }`}
      >
        <TopBar
          onOpenMobile={() => setMobileSidebarOpen(true)}
          onNavigate={onNavigate}
        />

        {/* Institutional Context Scope Bar */}
        {session && (
          <div className="bg-white/60 border-b border-slate-200/60 px-4 lg:px-8 py-2 flex items-center justify-between flex-wrap gap-2 text-xs">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-semibold text-slate-500 uppercase tracking-wider text-[10px]">
                Active Scope:
              </span>
              <span className="px-2.5 py-0.5 rounded-md bg-indigo-100 text-indigo-800 font-bold uppercase text-[11px] inline-flex items-center gap-1">
                <Shield size={12} />
                {session.role}
              </span>
              {scope.unrestricted ? (
                <span className="px-2.5 py-0.5 rounded-md bg-emerald-100 text-emerald-800 font-semibold text-[11px] inline-flex items-center gap-1">
                  <Building size={12} />
                  Institution-wide Access (All Programs)
                </span>
              ) : (
                <>
                  {scopeProgram && (
                    <span className="px-2.5 py-0.5 rounded-md bg-blue-100 text-blue-800 font-semibold text-[11px] inline-flex items-center gap-1">
                      <GraduationCap size={12} />
                      {scopeProgram.code} — {scopeProgram.name}
                    </span>
                  )}
                  {scopeDepartment && (
                    <span className="px-2.5 py-0.5 rounded-md bg-amber-100 text-amber-800 font-semibold text-[11px] inline-flex items-center gap-1">
                      <Building size={12} />
                      {scopeDepartment.name}
                    </span>
                  )}
                </>
              )}
            </div>

            <div className="text-[11px] font-medium text-slate-500 hidden sm:block">
              {state.settings.affiliation}
            </div>
          </div>
        )}

        {/* Viewport Content */}
        <main className="flex-1 p-4 lg:p-8 max-w-7xl w-full mx-auto">
          {children}
        </main>
      </div>

      {/* Toast Notifications Overlay */}
      <div className="fixed bottom-5 right-5 z-50 flex flex-col gap-2 max-w-md pointer-events-none">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={`pointer-events-auto flex items-start gap-3 p-4 rounded-xl shadow-xl border backdrop-blur-md transition-all animate-in slide-in-from-bottom-3 duration-200 ${
              toast.type === 'success'
                ? 'bg-emerald-950/90 border-emerald-500/40 text-emerald-100'
                : toast.type === 'error'
                ? 'bg-rose-950/90 border-rose-500/40 text-rose-100'
                : toast.type === 'warn'
                ? 'bg-amber-950/90 border-amber-500/40 text-amber-100'
                : 'bg-slate-900/90 border-indigo-500/40 text-slate-100'
            }`}
          >
            {toast.type === 'success' && <CheckCircle size={20} className="text-emerald-400 shrink-0 mt-0.5" />}
            {toast.type === 'error' && <XCircle size={20} className="text-rose-400 shrink-0 mt-0.5" />}
            {toast.type === 'warn' && <AlertTriangle size={20} className="text-amber-400 shrink-0 mt-0.5" />}
            {toast.type === 'info' && <Info size={20} className="text-indigo-400 shrink-0 mt-0.5" />}

            <div className="flex-1 min-w-0">
              {toast.title && <div className="font-bold text-xs">{toast.title}</div>}
              <div className="text-xs leading-relaxed opacity-95">{toast.message}</div>
            </div>

            <button
              onClick={() => removeToast(toast.id)}
              className="text-slate-400 hover:text-white transition-colors"
            >
              <X size={16} />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};
