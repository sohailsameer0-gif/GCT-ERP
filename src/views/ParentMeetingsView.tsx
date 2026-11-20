import React, { useState } from 'react';
import { useERP } from '../context/ERPContext';
import { ParentTeacherMeeting } from '../types/erp';
import {
  Users,
  Calendar,
  Clock,
  Plus,
  CheckCircle,
  FileText,
  Search,
  Filter,
  AlertCircle,
  MessageSquare,
  Building,
  GraduationCap
} from 'lucide-react';

export const ParentMeetingsView: React.FC = () => {
  const { state, session, can, createPTM, approvePTM, addToast } = useERP();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'Pending' | 'Approved'>('all');
  const [showCreateModal, setShowCreateModal] = useState(false);

  // Form state
  const [title, setTitle] = useState('');
  const [date, setDate] = useState('');
  const [time, setTime] = useState('10:00');
  const [venue, setVenue] = useState('Principal Conference Hall / Department Office');
  const [agenda, setAgenda] = useState('');
  const [notes, setNotes] = useState('');

  const canCreate = can('attendance_mark') || session?.role === 'sysadmin' || session?.role === 'chairman' || session?.role === 'hod';
  const canApprove = session?.role === 'sysadmin' || session?.role === 'chairman' || session?.role === 'hod';

  const meetings = state.parentTeacherMeetings || [];

  const filteredMeetings = meetings.filter((m) => {
    const searchMatch =
      !searchTerm ||
      m.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (m.agenda || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (m.createdByName || '').toLowerCase().includes(searchTerm.toLowerCase());

    const statusMatch = statusFilter === 'all' || m.status === statusFilter;
    return searchMatch && statusMatch;
  });

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !date || !agenda) {
      addToast('Please complete title, date, and agenda fields', 'error');
      return;
    }

    try {
      createPTM({
        title,
        date,
        time,
        venue,
        agenda,
        notes,
        status: 'Pending',
        createdByName: session?.displayName || 'Faculty Member'
      });
      setShowCreateModal(false);
      setTitle('');
      setDate('');
      setTime('10:00');
      setAgenda('');
      setNotes('');
      addToast('Parent-Teacher Conference scheduled successfully', 'success');
    } catch (err: any) {
      addToast(err?.message || 'Failed to schedule PTM', 'error');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
            <Users className="w-7 h-7 text-indigo-600" />
            Parent-Teacher Meetings (PTM)
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Schedule, monitor, and record official guardian conferences and academic reviews
          </p>
        </div>

        {canCreate && (
          <button
            onClick={() => setShowCreateModal(true)}
            className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-medium text-sm rounded-lg shadow-sm transition-all"
          >
            <Plus className="w-4 h-4" />
            Schedule Conference
          </button>
        )}
      </div>

      {/* KPI Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-xl border border-slate-200/80 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-lg bg-indigo-50 flex items-center justify-center text-indigo-600">
            <Calendar className="w-6 h-6" />
          </div>
          <div>
            <div className="text-2xl font-bold text-slate-800">{meetings.length}</div>
            <div className="text-xs font-medium text-slate-500">Total Recorded Conferences</div>
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200/80 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-lg bg-amber-50 flex items-center justify-center text-amber-600">
            <Clock className="w-6 h-6" />
          </div>
          <div>
            <div className="text-2xl font-bold text-amber-700">
              {meetings.filter((m) => m.status === 'Pending').length}
            </div>
            <div className="text-xs font-medium text-slate-500">Pending Review / Scheduled</div>
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200/80 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-lg bg-emerald-50 flex items-center justify-center text-emerald-600">
            <CheckCircle className="w-6 h-6" />
          </div>
          <div>
            <div className="text-2xl font-bold text-emerald-700">
              {meetings.filter((m) => m.status === 'Approved').length}
            </div>
            <div className="text-xs font-medium text-slate-500">Completed & Verified</div>
          </div>
        </div>
      </div>

      {/* Search & Filters */}
      <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-sm flex flex-col sm:flex-row gap-3 items-center justify-between">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search meetings by title, agenda, or convener..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Filter className="w-4 h-4 text-slate-400" />
          <select
            value={statusFilter}
            onChange={(e: any) => setStatusFilter(e.target.value)}
            className="px-3 py-2 border border-slate-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="all">All Statuses</option>
            <option value="Pending">Pending / Scheduled</option>
            <option value="Approved">Completed & Approved</option>
          </select>
        </div>
      </div>

      {/* Meetings List */}
      <div className="bg-white rounded-xl border border-slate-200/80 shadow-sm overflow-hidden">
        {filteredMeetings.length === 0 ? (
          <div className="p-12 text-center text-slate-400">
            <Users className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p className="font-medium text-slate-600">No Parent-Teacher Meetings found</p>
            <p className="text-xs text-slate-400 mt-1">
              Conferences will appear here once scheduled by faculty or department coordinators.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {filteredMeetings.map((m) => (
              <div key={m.id} className="p-5 hover:bg-slate-50/70 transition-colors flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="space-y-2 max-w-2xl">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold uppercase tracking-wider ${
                      m.status === 'Approved'
                        ? 'bg-emerald-100 text-emerald-800'
                        : 'bg-amber-100 text-amber-800'
                    }`}>
                      {m.status === 'Approved' ? 'Completed & Approved' : 'Scheduled / Pending'}
                    </span>
                    <span className="text-xs text-slate-400 flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5" />
                      {m.date} {m.time ? `at ${m.time}` : ''}
                    </span>
                    {m.venue && (
                      <span className="text-xs text-slate-500 bg-slate-100 px-2 py-0.5 rounded flex items-center gap-1">
                        <Building className="w-3 h-3 text-slate-400" />
                        {m.venue}
                      </span>
                    )}
                  </div>

                  <h3 className="text-base font-semibold text-slate-800">{m.title}</h3>

                  <div className="text-sm text-slate-600">
                    <strong>Convener / Faculty:</strong> {m.createdByName || 'Staff Member'}
                  </div>

                  <div className="text-sm bg-slate-50 p-2.5 rounded-lg border border-slate-100 text-slate-700">
                    <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-0.5">
                      Agenda & Discussion Topics
                    </div>
                    <p>{m.agenda}</p>
                    {m.notes && (
                      <div className="mt-2 pt-2 border-t border-slate-200/60 text-xs text-slate-500">
                        <strong>Meeting Minutes / Decisions:</strong> {m.notes}
                      </div>
                    )}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex md:flex-col items-center md:items-end gap-2">
                  {canApprove && m.status === 'Pending' && (
                    <button
                      onClick={() => approvePTM(m.id)}
                      className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-medium rounded-lg inline-flex items-center gap-1.5 shadow-sm transition-all"
                    >
                      <CheckCircle className="w-3.5 h-3.5" />
                      Approve & Complete
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Schedule Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 animate-in fade-in duration-200">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                <Users className="w-5 h-5 text-indigo-600" />
                Schedule Parent-Teacher Conference
              </h2>
              <button
                onClick={() => setShowCreateModal(false)}
                className="text-slate-400 hover:text-slate-600 text-lg font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateSubmit} className="space-y-4 mt-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Meeting Title *
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Sessional Performance & Attendance Review: Civil Dept"
                  required
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                    Scheduled Date *
                  </label>
                  <input
                    type="date"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    required
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                    Time
                  </label>
                  <input
                    type="time"
                    value={time}
                    onChange={(e) => setTime(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Venue / Location
                </label>
                <input
                  type="text"
                  value={venue}
                  onChange={(e) => setVenue(e.target.value)}
                  placeholder="e.g. Conference Hall / HOD Office"
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Agenda / Reason for Meeting *
                </label>
                <textarea
                  rows={3}
                  value={agenda}
                  onChange={(e) => setAgenda(e.target.value)}
                  placeholder="e.g. Discuss attendance shortfall, sessional examination results, behavioral notes..."
                  required
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Minutes / Decisions (Optional)
                </label>
                <textarea
                  rows={2}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Follow-up actions or remarks agreed with guardians..."
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 border border-slate-200 rounded-lg text-sm font-medium text-slate-600 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-medium shadow-sm transition-all"
                >
                  Schedule Conference
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
