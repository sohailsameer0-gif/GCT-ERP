import React, { useState } from 'react';
import {
  Bell,
  Check,
  ChevronDown,
  Globe,
  Menu,
  Sparkles,
  User,
  X,
} from 'lucide-react';
import { useERP } from '../../context/ERPContext';
import { formatDateTime } from '../../services/calculations';

interface TopBarProps {
  onOpenMobile: () => void;
  onNavigate: (route: string) => void;
}

export const TopBar: React.FC<TopBarProps> = ({ onOpenMobile, onNavigate }) => {
  const { session, state, markNotificationRead, markAllNotificationsRead } = useERP();
  const [showNotifMenu, setShowNotifMenu] = useState(false);

  if (!session) return null;

  const userNotifs = state.notifications.filter((n) => {
    if (n.recipientRole && n.recipientRole !== session.role && session.role !== 'sysadmin') {
      if (
        !(
          (n.recipientRole === 'chairman' || n.recipientRole === 'hod') &&
          (session.role === 'chairman' || session.role === 'hod')
        )
      ) {
        return false;
      }
    }
    if (n.recipientId) {
      if (n.recipientId === session.userId || n.recipientId === session.linkedId) return true;
      if (session.role === 'parent') {
        const parentLink = state.parentLinks.find(
          (l) => l.parentId === session.linkedId && l.verified
        );
        if (parentLink && parentLink.studentId === n.recipientId) return true;
      }
      return false;
    }
    return true;
  });

  const unreadNotifs = userNotifs.filter((n) => !n.read);

  return (
    <header className="sticky top-0 z-30 flex items-center justify-between px-4 lg:px-8 py-3.5 bg-white/80 backdrop-blur-md border-b border-slate-200/80 shadow-xs">
      {/* Left: Mobile Toggle & Page Title */}
      <div className="flex items-center gap-3">
        <button
          onClick={onOpenMobile}
          className="lg:hidden p-2 rounded-xl text-slate-600 hover:bg-slate-100 transition-colors"
          aria-label="Open navigation menu"
        >
          <Menu size={20} />
        </button>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <span className="hidden sm:inline-block w-2.5 h-2.5 rounded-full bg-emerald-500 ring-4 ring-emerald-500/20" />
            <h2 className="text-sm lg:text-base font-bold text-slate-800 tracking-tight font-sans">
              Government College of Technology Peshawar
            </h2>
          </div>

          <div className="hidden md:flex items-center gap-2 px-2.5 py-1 rounded-full bg-indigo-50 border border-indigo-100 text-indigo-700 text-[11px] font-semibold">
            <Sparkles size={12} />
            <span>{state.settings.currentTerm} {state.settings.currentYear}</span>
          </div>
        </div>
      </div>

      {/* Right: Quick actions, notifications, user profile */}
      <div className="flex items-center gap-2.5">
        {/* Online Indicator */}
        <div className="hidden sm:flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 text-xs font-semibold border border-emerald-200/60">
          <Globe size={13} className="text-emerald-500" />
          <span>Connected</span>
        </div>

        {/* Notifications Bell */}
        <div className="relative">
          <button
            onClick={() => setShowNotifMenu(!showNotifMenu)}
            className="relative p-2 rounded-xl text-slate-600 hover:text-indigo-600 hover:bg-indigo-50/80 transition-all"
            title="Notifications"
          >
            <Bell size={20} />
            {unreadNotifs.length > 0 && (
              <span className="absolute top-1.5 right-1.5 w-4 h-4 rounded-full bg-rose-500 text-white text-[10px] font-extrabold flex items-center justify-center ring-2 ring-white">
                {unreadNotifs.length}
              </span>
            )}
          </button>

          {/* Notifications Dropdown Popover */}
          {showNotifMenu && (
            <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white rounded-2xl shadow-2xl border border-slate-200/90 py-3 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
              <div className="flex items-center justify-between px-4 pb-2 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <h3 className="font-bold text-slate-800 text-sm">Notifications</h3>
                  {unreadNotifs.length > 0 && (
                    <span className="px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-700 text-[10px] font-bold">
                      {unreadNotifs.length} new
                    </span>
                  )}
                </div>
                {unreadNotifs.length > 0 && (
                  <button
                    onClick={() => {
                      markAllNotificationsRead();
                      setShowNotifMenu(false);
                    }}
                    className="text-[11px] text-indigo-600 hover:underline font-semibold"
                  >
                    Mark all read
                  </button>
                )}
              </div>

              <div className="max-h-80 overflow-y-auto divide-y divide-slate-100">
                {userNotifs.length === 0 ? (
                  <div className="py-8 text-center text-slate-400 text-xs">
                    No notifications right now.
                  </div>
                ) : (
                  userNotifs.slice(0, 10).map((n) => (
                    <div
                      key={n.id}
                      onClick={() => {
                        markNotificationRead(n.id);
                        if (n.relatedRoute) {
                          onNavigate(n.relatedRoute);
                          setShowNotifMenu(false);
                        }
                      }}
                      className={`p-3.5 hover:bg-slate-50 cursor-pointer transition-colors ${
                        !n.read ? 'bg-indigo-50/40 border-l-4 border-indigo-600' : ''
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <span className="text-xs font-semibold text-slate-800 leading-snug">
                          {n.title}
                        </span>
                        <span className="text-[10px] text-slate-400 shrink-0">
                          {formatDateTime(n.createdAt)}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-600 mt-1 line-clamp-2 leading-relaxed">
                        {n.message}
                      </p>
                    </div>
                  ))
                )}
              </div>

              <div className="pt-2 px-3 border-t border-slate-100 text-center">
                <button
                  onClick={() => {
                    onNavigate('#/app/notifications');
                    setShowNotifMenu(false);
                  }}
                  className="w-full py-1.5 rounded-lg text-xs font-bold text-indigo-600 hover:bg-indigo-50 transition-colors"
                >
                  View All Notifications
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Profile Chip */}
        <button
          onClick={() => onNavigate('#/app/profile-self')}
          className="flex items-center gap-2.5 pl-2 pr-3 py-1.5 rounded-full bg-slate-100 hover:bg-slate-200/80 transition-all border border-slate-200"
        >
          <div className="w-7 h-7 rounded-full bg-indigo-600 text-white font-bold text-xs flex items-center justify-center overflow-hidden shrink-0">
            {session.photoDataUrl ? (
              <img src={session.photoDataUrl} alt={session.displayName} className="w-full h-full object-cover" />
            ) : (
              <User size={14} />
            )}
          </div>
          <div className="hidden sm:flex flex-col text-left leading-tight">
            <span className="text-xs font-bold text-slate-800 max-w-[120px] truncate">
              {session.displayName.split(' ')[0]}
            </span>
            <span className="text-[10px] uppercase font-semibold text-indigo-600">
              {session.role}
            </span>
          </div>
          <ChevronDown size={14} className="text-slate-400" />
        </button>
      </div>
    </header>
  );
};
