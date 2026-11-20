import React, { useState } from 'react';
import {
  Bell,
  Check,
  CheckCircle2,
  Clock,
  ExternalLink,
  Filter,
  Info,
  Mail,
  Plus,
  Search,
  Send,
  ShieldAlert,
  Trash2,
  Users,
  X,
} from 'lucide-react';
import { useERP } from '../context/ERPContext';
import { formatDateTime } from '../services/calculations';
import { UserRole } from '../types/erp';

interface NotificationsViewProps {
  onNavigate: (route: string) => void;
}

export const NotificationsView: React.FC<NotificationsViewProps> = ({ onNavigate }) => {
  const {
    state,
    session,
    markNotificationRead,
    markAllNotificationsRead,
    pushNotification,
    addToast,
  } = useERP();

  const [filterType, setFilterType] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<'all' | 'unread' | 'read'>('all');
  const [searchTerm, setSearchTerm] = useState('');

  // Announcement composer modal (for Chairman, HOD, Sysadmin)
  const [isBroadcastModalOpen, setIsBroadcastModalOpen] = useState(false);
  const [broadcastTitle, setBroadcastTitle] = useState('');
  const [broadcastMessage, setBroadcastMessage] = useState('');
  const [broadcastAudience, setBroadcastAudience] = useState<'all' | 'student' | 'teacher' | 'parent'>('all');
  const [broadcastType, setBroadcastType] = useState<'info' | 'warn' | 'success'>('info');

  if (!session) return null;

  const canBroadcast = ['sysadmin', 'chairman', 'hod', 'coordinator'].includes(session.role);

  // Filter notifications relevant to current user role and ID
  const userNotifs = state.notifications.filter((n) => {
    // If targeted to a specific role, ensure role matches
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

    // If targeted to a specific user/linked ID
    if (n.recipientId) {
      if (n.recipientId === session.userId || n.recipientId === session.linkedId) {
        return true;
      }
      // If current user is a parent, match against their linked ward student ID
      if (session.role === 'parent') {
        const parentLink = state.parentLinks.find(
          (l) => l.parentId === session.linkedId && l.verified
        );
        if (parentLink && parentLink.studentId === n.recipientId) {
          return true;
        }
      }
      return false;
    }

    // General broadcast notifications (no recipientRole specified) are visible to all
    return true;
  });

  const filteredNotifs = userNotifs.filter((n) => {
    if (filterStatus === 'unread' && n.read) return false;
    if (filterStatus === 'read' && !n.read) return false;
    if (filterType !== 'all' && n.type !== filterType) return false;

    if (searchTerm.trim()) {
      const q = searchTerm.toLowerCase();
      const match = `${n.title} ${n.message}`.toLowerCase();
      if (!match.includes(q)) return false;
    }
    return true;
  });

  const unreadCount = userNotifs.filter((n) => !n.read).length;

  const handleBroadcastSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!broadcastTitle.trim() || !broadcastMessage.trim()) {
      addToast('Please enter both title and announcement message', 'warn');
      return;
    }

    pushNotification({
      title: broadcastTitle.trim(),
      message: broadcastMessage.trim(),
      type: broadcastType,
      recipientRole: broadcastAudience === 'all' ? undefined : (broadcastAudience as UserRole),
      relatedRoute: broadcastAudience === 'student' ? '#/app/attendance' : undefined,
    });

    addToast('Institutional announcement dispatched successfully', 'success');
    setIsBroadcastModalOpen(false);
    setBroadcastTitle('');
    setBroadcastMessage('');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-slate-800 tracking-tight font-sans">
              Notifications & Announcements
            </h1>
            {unreadCount > 0 && (
              <span className="px-2.5 py-0.5 rounded-full bg-rose-100 text-rose-700 text-xs font-bold animate-pulse">
                {unreadCount} unread
              </span>
            )}
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Real-time administrative alerts, class schedule changes, and approval notifications
          </p>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          {canBroadcast && (
            <button
              type="button"
              onClick={() => setIsBroadcastModalOpen(true)}
              className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-700 hover:to-indigo-800 text-white font-bold text-xs shadow-md shadow-indigo-600/20 flex items-center gap-2 transition-all"
            >
              <Plus size={16} />
              <span>Broadcast Notice</span>
            </button>
          )}

          {unreadCount > 0 && (
            <button
              type="button"
              onClick={markAllNotificationsRead}
              className="px-4 py-2.5 rounded-xl bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 font-semibold text-xs transition-colors flex items-center gap-2 shadow-xs"
            >
              <Check size={16} />
              <span>Mark All as Read</span>
            </button>
          )}
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col md:flex-row items-center justify-between gap-3">
        <div className="relative w-full md:w-80">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search notification text or keyword..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium"
          />
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto flex-wrap">
          <div className="flex items-center bg-slate-100 p-1 rounded-xl text-xs font-bold">
            <button
              type="button"
              onClick={() => setFilterStatus('all')}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                filterStatus === 'all' ? 'bg-white text-indigo-700 shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              All ({userNotifs.length})
            </button>
            <button
              type="button"
              onClick={() => setFilterStatus('unread')}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                filterStatus === 'unread' ? 'bg-white text-indigo-700 shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Unread ({unreadCount})
            </button>
            <button
              type="button"
              onClick={() => setFilterStatus('read')}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                filterStatus === 'read' ? 'bg-white text-indigo-700 shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Read
            </button>
          </div>

          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="text-xs bg-white border border-slate-200 rounded-xl px-3 py-2 font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="all">All Categories</option>
            <option value="info">General Info</option>
            <option value="warn">Warnings & Requests</option>
            <option value="success">Approvals</option>
            <option value="error">Action Required</option>
          </select>
        </div>
      </div>

      {/* Notifications List */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs divide-y divide-slate-100 overflow-hidden">
        {filteredNotifs.length === 0 ? (
          <div className="p-12 text-center">
            <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center mx-auto mb-3">
              <Bell size={24} />
            </div>
            <h3 className="text-sm font-bold text-slate-800">No Notifications</h3>
            <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
              You are all caught up! There are no alerts matching your active filter criteria.
            </p>
          </div>
        ) : (
          filteredNotifs.map((n) => {
            const isWarn = n.type === 'warn';
            const isSuccess = n.type === 'success';
            const isError = n.type === 'error';

            return (
              <div
                key={n.id}
                className={`p-4 sm:p-5 flex items-start gap-4 transition-colors ${
                  !n.read ? 'bg-indigo-50/30 border-l-4 border-indigo-600' : 'hover:bg-slate-50/80'
                }`}
              >
                <div
                  className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 mt-0.5 ${
                    isWarn
                      ? 'bg-amber-100 text-amber-700'
                      : isSuccess
                      ? 'bg-emerald-100 text-emerald-700'
                      : isError
                      ? 'bg-rose-100 text-rose-700'
                      : 'bg-indigo-100 text-indigo-700'
                  }`}
                >
                  {isWarn && <ShieldAlert size={18} />}
                  {isSuccess && <CheckCircle2 size={18} />}
                  {isError && <ShieldAlert size={18} />}
                  {!isWarn && !isSuccess && !isError && <Info size={18} />}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h4 className="text-xs sm:text-sm font-bold text-slate-800 leading-snug">
                        {n.title}
                      </h4>
                      {!n.read && (
                        <span className="w-2 h-2 rounded-full bg-indigo-600 shrink-0" />
                      )}
                      {n.recipientRole && (
                        <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 text-[10px] font-bold uppercase">
                          {n.recipientRole}
                        </span>
                      )}
                    </div>
                    <span className="text-[11px] text-slate-400 shrink-0 flex items-center gap-1">
                      <Clock size={12} />
                      {formatDateTime(n.createdAt)}
                    </span>
                  </div>

                  <p className="text-xs text-slate-600 mt-1.5 leading-relaxed">
                    {n.message}
                  </p>

                  <div className="flex items-center gap-3 mt-3">
                    {n.relatedRoute && (
                      <button
                        type="button"
                        onClick={() => {
                          markNotificationRead(n.id);
                          onNavigate(n.relatedRoute!);
                        }}
                        className="inline-flex items-center gap-1.5 text-xs font-bold text-indigo-600 hover:text-indigo-800 transition-colors"
                      >
                        Open Linked Section
                        <ExternalLink size={13} />
                      </button>
                    )}

                    {!n.read && (
                      <button
                        type="button"
                        onClick={() => markNotificationRead(n.id)}
                        className="text-xs font-semibold text-slate-500 hover:text-slate-800 transition-colors"
                      >
                        Mark as read
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Broadcast Announcement Modal */}
      {isBroadcastModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 space-y-4 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <h2 className="font-black text-slate-900 text-sm flex items-center gap-2">
                <Bell size={16} className="text-indigo-600" />
                <span>Broadcast College Announcement</span>
              </h2>
              <button
                type="button"
                onClick={() => setIsBroadcastModalOpen(false)}
                className="w-7 h-7 rounded-lg hover:bg-slate-100 flex items-center justify-center text-slate-400 hover:text-slate-700 transition-colors"
              >
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleBroadcastSubmit} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Target Audience</label>
                <select
                  value={broadcastAudience}
                  onChange={(e) => setBroadcastAudience(e.target.value as any)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 font-medium text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="all">Campus-Wide (All Roles)</option>
                  <option value="student">Students Only</option>
                  <option value="teacher">Faculty Members Only</option>
                  <option value="parent">Parents & Guardians</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Alert Category</label>
                <select
                  value={broadcastType}
                  onChange={(e) => setBroadcastType(e.target.value as any)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 font-medium text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="info">General Information</option>
                  <option value="warn">Important Notice / Deadline</option>
                  <option value="success">Congratulations / Achievement</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Announcement Subject *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g., Mid-Term Examination Schedule Released..."
                  value={broadcastTitle}
                  onChange={(e) => setBroadcastTitle(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 font-medium text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Detailed Message *</label>
                <textarea
                  rows={3}
                  required
                  placeholder="Write the full announcement text dispatched to user portals..."
                  value={broadcastMessage}
                  onChange={(e) => setBroadcastMessage(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 font-medium text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsBroadcastModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 font-bold text-white shadow-md shadow-indigo-600/20 transition-all flex items-center gap-1.5"
                >
                  <Send size={14} />
                  <span>Send Broadcast</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
