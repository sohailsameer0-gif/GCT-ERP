import React, { useState } from 'react';
import {
  Check,
  Clock,
  Plus,
  Repeat,
  UserCheck,
  X,
  AlertCircle,
  Calendar,
  BookOpen,
  Send,
  ShieldAlert,
  CheckCircle2,
  Filter,
  User,
  ArrowRight,
  Play,
  Trash2,
} from 'lucide-react';
import { useERP } from '../context/ERPContext';
import { formatDate, getDayOfWeek, timeToMinutes, todayIso } from '../services/calculations';
import { ConfirmModal } from '../components/common/ConfirmModal';
import { SubstitutionRequest } from '../types/erp';

export const SubstitutionsView: React.FC = () => {
  const {
    state,
    session,
    createSubstitutionRequest,
    acceptSubstitution,
    declineSubstitution,
    assignSubstitute,
    can,
    addToast,
  } = useERP();

  const [activeTab, setActiveTab] = useState<'all' | 'received' | 'sent'>('all');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedSlotId, setSelectedSlotId] = useState('');
  const [subDate, setSubDate] = useState(todayIso());
  const [subReason, setSubReason] = useState('Approved Medical Leave / Personal Emergency');
  const [customReason, setCustomReason] = useState('');
  const [selectedCandidateId, setSelectedCandidateId] = useState('broadcast');
  const [requestToDelete, setRequestToDelete] = useState<SubstitutionRequest | null>(null);

  if (!session) return null;

  const isTeacher = session.role === 'teacher';
  const isChairmanOrAdmin = ['sysadmin', 'chairman', 'hod'].includes(session.role);
  const teacherId = session.linkedId || session.userId;

  // Timetable slots that can be substituted:
  // If teacher, their own slots; if chairman/admin, all slots in the department/college
  const availableSlots = isTeacher
    ? state.timetable.filter((t) => t.teacherId === teacherId)
    : state.timetable;

  // Selected slot details
  const activeSlot = state.timetable.find((t) => t.id === selectedSlotId) || availableSlots[0];

  // Helper to check if a teacher has a clash at this slot's time
  const isTeacherFreeAtSlot = (tId: string, slotId?: string) => {
    const targetSlot = state.timetable.find((t) => t.id === (slotId || selectedSlotId)) || activeSlot;
    if (!targetSlot) return true;

    const slotStart = timeToMinutes(targetSlot.startTime);
    const slotEnd = timeToMinutes(targetSlot.endTime);

    // Check if this teacher has any slot on the same day overlapping this interval
    const clashes = state.timetable.filter(
      (t) =>
        t.teacherId === tId &&
        t.day === targetSlot.day &&
        t.id !== targetSlot.id &&
        timeToMinutes(t.startTime) < slotEnd &&
        timeToMinutes(t.endTime) > slotStart
    );

    return clashes.length === 0;
  };

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const slotIdToUse = selectedSlotId || availableSlots[0]?.id;
    if (!slotIdToUse) {
      addToast('Please select a timetable class period to substitute', 'warn');
      return;
    }

    const finalReason = customReason.trim() ? `${subReason}: ${customReason.trim()}` : subReason;

    try {
      createSubstitutionRequest(
        slotIdToUse,
        subDate,
        finalReason,
        selectedCandidateId === 'broadcast' ? undefined : selectedCandidateId
      );
      setIsModalOpen(false);
      setCustomReason('');
      setSelectedCandidateId('broadcast');
    } catch (err: any) {
      addToast(err?.message || 'Failed to create substitution request', 'error');
    }
  };

  // Filter requests based on tab
  const filteredRequests = state.substitutionRequests.filter((req) => {
    if (activeTab === 'received') {
      return (
        (req.candidates || []).includes(teacherId) ||
        req.substituteTeacherId === teacherId
      );
    }
    if (activeTab === 'sent') {
      return req.originalTeacherId === teacherId || req.requestedBy === session.userId;
    }
    return true;
  });

  const myPendingReceivedCount = state.substitutionRequests.filter(
    (r) =>
      r.status === 'pending' &&
      (r.candidates || []).includes(teacherId) &&
      !(r.declinedBy || []).includes(teacherId)
  ).length;

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-800 tracking-tight font-sans flex items-center gap-2">
            <Repeat className="w-6 h-6 text-indigo-600" />
            Teacher Substitution & Class Coverage
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Real-time conflict-free replacement for faculty on leave, delayed transit, or administrative duty
          </p>
        </div>

        {(isTeacher || isChairmanOrAdmin) && (
          <button
            onClick={() => {
              setSelectedSlotId(availableSlots[0]?.id || '');
              setIsModalOpen(true);
            }}
            className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-md shadow-indigo-600/20 flex items-center gap-2 self-start sm:self-auto transition-all"
          >
            <Plus size={16} />
            <span>Request Class Substitute</span>
          </button>
        )}
      </div>

      {/* Action Notification Banner for Received Requests */}
      {myPendingReceivedCount > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex items-center justify-between gap-3 shadow-xs animate-in fade-in">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center shrink-0">
              <AlertCircle size={20} />
            </div>
            <div>
              <h4 className="text-xs font-bold text-amber-900">
                Action Required: You Have {myPendingReceivedCount} Pending Substitution Request{myPendingReceivedCount > 1 ? 's' : ''}!
              </h4>
              <p className="text-[11px] text-amber-700 mt-0.5">
                A faculty colleague has requested you to cover their lecture. Please accept or decline below.
              </p>
            </div>
          </div>
          <button
            onClick={() => setActiveTab('received')}
            className="px-3.5 py-1.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold shrink-0 transition-colors"
          >
            Review Now
          </button>
        </div>
      )}

      {/* Tabs */}
      <div className="flex items-center gap-2 p-1 rounded-2xl bg-white border border-slate-200/80 w-fit text-xs font-bold">
        <button
          onClick={() => setActiveTab('all')}
          className={`px-4 py-2 rounded-xl transition-all ${
            activeTab === 'all'
              ? 'bg-indigo-600 text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-50'
          }`}
        >
          All Requests ({state.substitutionRequests.length})
        </button>
        {isTeacher && (
          <button
            onClick={() => setActiveTab('received')}
            className={`px-4 py-2 rounded-xl transition-all flex items-center gap-1.5 ${
              activeTab === 'received'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'text-slate-600 hover:bg-slate-50'
            }`}
          >
            <span>Received by Me</span>
            {myPendingReceivedCount > 0 && (
              <span className="px-1.5 py-0.2 rounded-full bg-amber-400 text-slate-900 text-[10px] font-black">
                {myPendingReceivedCount}
              </span>
            )}
          </button>
        )}
        <button
          onClick={() => setActiveTab('sent')}
          className={`px-4 py-2 rounded-xl transition-all ${
            activeTab === 'sent'
              ? 'bg-indigo-600 text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-50'
          }`}
        >
          My Created Requests
        </button>
      </div>

      {/* Requests List */}
      <div className="space-y-4">
        {filteredRequests.length === 0 ? (
          <div className="py-16 text-center text-slate-400 text-xs bg-white rounded-2xl border border-slate-200/80 shadow-xs">
            <Repeat className="w-10 h-10 mx-auto text-slate-300 mb-2" />
            <p className="font-semibold text-slate-600">No substitution requests found</p>
            <p className="text-2xs text-slate-400 mt-0.5">
              {activeTab === 'received'
                ? 'You do not have any pending substitution requests from colleagues.'
                : 'Click "Request Class Substitute" above to request coverage during leave or delayed transit.'}
            </p>
          </div>
        ) : (
          filteredRequests.map((req) => {
            const slot = state.timetable.find((t) => t.id === req.timetableId);
            const course = state.courses.find((c) => c.id === req.courseId);
            const originalTeacher = state.teachers.find((t) => t.id === req.originalTeacherId);
            const substituteTeacher = state.teachers.find((t) => t.id === req.substituteTeacherId);
            const dept = state.departments.find((d) => d.id === req.departmentId || d.id === slot?.departmentId);

            const isCandidate = (req.candidates || []).includes(teacherId);
            const hasDeclined = (req.declinedBy || []).includes(teacherId);
            const isAssignedSub = req.substituteTeacherId === teacherId;
            const isChairman = isChairmanOrAdmin;

            return (
              <div
                key={req.id}
                className="bg-white rounded-2xl p-5 shadow-xs border border-slate-200/80 hover:shadow-md transition-all flex flex-col md:flex-row md:items-center justify-between gap-5"
              >
                <div className="space-y-2 text-xs flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-bold text-slate-900 text-sm">
                      {course?.code} — {course?.name}
                    </span>
                    <span
                      className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                        req.status === 'accepted'
                          ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                          : req.status === 'declined' || req.status === 'no_candidates'
                          ? 'bg-rose-100 text-rose-800 border border-rose-200'
                          : 'bg-amber-100 text-amber-800 border border-amber-200'
                      }`}
                    >
                      {req.status === 'accepted' ? 'Accepted & Confirmed' : req.status.replace('_', ' ')}
                    </span>
                    {dept && (
                      <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 text-[10px] font-semibold">
                        {dept.name}
                      </span>
                    )}
                  </div>

                  <div className="text-slate-600 flex flex-wrap items-center gap-x-4 gap-y-1">
                    <div>
                      <span className="text-slate-400">Original Faculty:</span>{' '}
                      <strong className="text-slate-800">{originalTeacher?.name || 'Assigned Faculty'}</strong>
                    </div>
                    <div>
                      <span className="text-slate-400">Class Period:</span>{' '}
                      <strong className="text-indigo-700 font-mono">
                        {slot?.startTime}–{slot?.endTime}
                      </strong>{' '}
                      ({slot?.day || 'Scheduled'})
                    </div>
                    <div>
                      <span className="text-slate-400">Date:</span>{' '}
                      <strong className="text-slate-800">{formatDate(req.date)}</strong>
                    </div>
                  </div>

                  <div className="text-slate-600 bg-slate-50 p-2.5 rounded-xl border border-slate-100 text-[11px] leading-relaxed">
                    <span className="font-bold text-slate-700">Reason for Substitution:</span>{' '}
                    {req.reason || 'Approved leave / academic duty'}
                  </div>

                  {substituteTeacher && (
                    <div className="text-emerald-700 font-bold flex items-center gap-1.5 pt-0.5">
                      <UserCheck size={15} className="text-emerald-600" />
                      <span>
                        Confirmed Substitute: {substituteTeacher.name} ({substituteTeacher.designation})
                      </span>
                    </div>
                  )}
                </div>

                {/* Action Buttons for Candidate, Substitute, or Chairman */}
                <div className="flex flex-wrap items-center gap-2 self-end md:self-center shrink-0">
                  {/* Nominated Candidate Accept/Decline */}
                  {isCandidate && !hasDeclined && req.status === 'pending' && (
                    <>
                      <button
                        onClick={() => acceptSubstitution(req.id)}
                        className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center gap-1.5 shadow-md shadow-emerald-600/20 active:scale-95 transition-all"
                      >
                        <Check size={14} /> Accept Class (قبول کریں)
                      </button>
                      <button
                        onClick={() => declineSubstitution(req.id)}
                        className="px-3.5 py-2 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold text-xs border border-rose-200 active:scale-95 transition-all"
                      >
                        Decline (معذرت)
                      </button>
                    </>
                  )}

                  {/* If Logged-in Teacher is Confirmed Substitute: Direct Start Class Live QR Button */}
                  {isAssignedSub && req.status === 'accepted' && (
                    <a
                      href="#/app/qr/start"
                      className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs flex items-center gap-1.5 shadow-sm transition-all"
                    >
                      <Play size={13} /> Launch Live QR
                    </a>
                  )}

                  {/* Chairman / HOD Override Direct Assignment */}
                  {isChairman && req.status !== 'accepted' && (
                    <div className="flex items-center gap-2">
                      <select
                        onChange={(e) => {
                          if (e.target.value) assignSubstitute(req.id, e.target.value);
                        }}
                        defaultValue=""
                        className="px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs font-semibold text-slate-700"
                      >
                        <option value="" disabled>
                          Chairman: Assign Faculty...
                        </option>
                        {state.teachers
                          .filter((t) => t.id !== req.originalTeacherId && t.active)
                          .map((t) => {
                            const isFree = isTeacherFreeAtSlot(t.id, req.timetableId);
                            return (
                              <option key={t.id} value={t.id}>
                                {t.name} {isFree ? '✓ (Free / No Clash)' : '⚠ (Busy)'}
                              </option>
                            );
                          })}
                      </select>
                    </div>
                  )}

                  {/* Chairman delete request option */}
                  {isChairman && (
                    <button
                      onClick={() => setRequestToDelete(req)}
                      className="p-2 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50"
                      title="Cancel Substitution Request"
                    >
                      <Trash2 size={15} />
                    </button>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Request Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl shadow-2xl max-w-lg w-full p-6 sm:p-7 space-y-4 border border-slate-200 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold">
                  <Repeat size={18} />
                </div>
                <div>
                  <h2 className="font-bold text-slate-900 text-base">Request Class Substitution</h2>
                  <p className="text-2xs text-slate-400">
                    Notify free faculty colleagues or Chairman for class coverage
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleCreateSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Select Timetable Period to Cover *
                </label>
                <select
                  value={selectedSlotId}
                  onChange={(e) => setSelectedSlotId(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  {availableSlots.map((slot) => {
                    const c = state.courses.find((x) => x.id === slot.courseId);
                    const t = state.teachers.find((x) => x.id === slot.teacherId);
                    return (
                      <option key={slot.id} value={slot.id}>
                        {slot.day} · {slot.startTime}–{slot.endTime} ({c?.code} — {c?.name}) · {t?.name}
                      </option>
                    );
                  })}
                </select>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Coverage Date *</label>
                  <input
                    type="date"
                    required
                    value={subDate}
                    onChange={(e) => setSubDate(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 font-medium"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Nominate Substitute Teacher *
                  </label>
                  <select
                    value={selectedCandidateId}
                    onChange={(e) => setSelectedCandidateId(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 font-medium text-xs"
                  >
                    <option value="broadcast">-- Broadcast to All Free Faculty --</option>
                    {state.teachers
                      .filter((t) => t.id !== (activeSlot?.teacherId || teacherId) && t.active)
                      .map((t) => {
                        const isFree = isTeacherFreeAtSlot(t.id, selectedSlotId);
                        return (
                          <option key={t.id} value={t.id}>
                            {t.name} {isFree ? '✓ (Free / No Clash)' : '⚠ (Has Clash)'}
                          </option>
                        );
                      })}
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Reason for Substitution *
                </label>
                <select
                  value={subReason}
                  onChange={(e) => setSubReason(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 font-medium"
                >
                  <option value="Approved Medical Leave">Approved Medical Leave (بیماری / میڈیکل رخصت)</option>
                  <option value="Late Transit / Road Delay">Late Transit / Road Delay (آمد میں تاخیر)</option>
                  <option value="Official KP-TEVTA Meeting / Duty">Official KP-TEVTA Meeting / Training Duty</option>
                  <option value="Examinations Invigilation Duty">Examinations Invigilation Duty</option>
                  <option value="Personal Emergency">Personal Emergency (ہنگامی مجبوری)</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Additional Instructions / Remarks (Optional)
                </label>
                <input
                  type="text"
                  placeholder="e.g. Please cover Chapter 4 numerical problems in Lecture Hall A"
                  value={customReason}
                  onChange={(e) => setCustomReason(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200"
                />
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 font-semibold text-slate-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 font-bold text-white shadow-md shadow-indigo-600/20 flex items-center gap-1.5"
                >
                  <Send size={14} />
                  <span>Send Substitution Request</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Cancel Request Modal */}
      <ConfirmModal
        isOpen={!!requestToDelete}
        title="Cancel Substitution Request"
        message="Are you sure you want to cancel this substitution request? Any pending notifications to faculty will be voided."
        confirmLabel="Yes, Cancel Request"
        onConfirm={() => {
          if (requestToDelete) {
            declineSubstitution(requestToDelete.id);
            setRequestToDelete(null);
          }
        }}
        onCancel={() => setRequestToDelete(null)}
      />
    </div>
  );
};
