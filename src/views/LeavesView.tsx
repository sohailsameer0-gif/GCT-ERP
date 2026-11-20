import React, { useState } from 'react';
import {
  ArrowRight,
  Check,
  CheckCircle2,
  Clock,
  Filter,
  GraduationCap,
  Mail,
  Plus,
  Send,
  Shield,
  UserCheck,
  Users,
  X,
  XCircle,
} from 'lucide-react';
import { useERP } from '../context/ERPContext';
import { formatDate, formatDateTime, todayIso } from '../services/calculations';
import { LeaveApplication, TeacherLeaveApplication } from '../types/erp';

interface LeavesViewProps {
  initialTab?: 'student' | 'teacher';
  autoApply?: boolean;
}

export const LeavesView: React.FC<LeavesViewProps> = ({
  initialTab = 'student',
}) => {
  const {
    state,
    session,
    can,
    submitStudentLeave,
    forwardStudentLeave,
    decideStudentLeave,
    submitTeacherLeave,
    decideTeacherLeave,
    addToast,
  } = useERP();

  const isStudent = session?.role === 'student';
  const isParent = session?.role === 'parent';
  const isTeacher = session?.role === 'teacher';
  const isApprover = ['chairman', 'hod', 'sysadmin'].includes(session?.role || '');

  // Tab state
  const [activeTab, setActiveTab] = useState<'student' | 'teacher'>(
    isStudent || isParent ? 'student' : initialTab
  );

  // Modal strictly starts closed - never ambush user with popup
  const [isApplyModalOpen, setIsApplyModalOpen] = useState(false);

  // Status Filter - Default to 'pending' for decision-makers, 'all' for students
  const [statusFilter, setStatusFilter] = useState<'pending' | 'approved' | 'rejected' | 'all'>(
    isApprover || isTeacher ? 'pending' : 'all'
  );

  const parentLink = isParent ? state.parentLinks.find((l) => l.parentId === session?.linkedId && l.verified) : null;
  const effectiveStudentId = isStudent
    ? session?.linkedId || state.students.find((s) => s.email.toLowerCase() === session?.email.toLowerCase())?.id
    : isParent
    ? parentLink?.studentId
    : null;

  // Student apply form state
  const [leaveType, setLeaveType] = useState('Medical');
  const [startDate, setStartDate] = useState(todayIso());
  const [endDate, setEndDate] = useState(todayIso());
  const [reason, setReason] = useState('');
  const [description, setDescription] = useState('');

  // Remarks dialog for forwarding or approving
  const [decisionModal, setDecisionModal] = useState<{
    leaveId: string;
    action: 'forward' | 'approve' | 'reject';
    isTeacherLeave?: boolean;
    applicantName?: string;
  } | null>(null);

  const [remarksInput, setRemarksInput] = useState('');

  const handleApplySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!reason.trim()) {
      addToast('Please enter a reason for the leave application', 'warn');
      return;
    }

    if (session?.role === 'teacher') {
      submitTeacherLeave({ leaveType, startDate, endDate, reason, description });
    } else {
      submitStudentLeave({ leaveType, startDate, endDate, reason, description });
    }
    setIsApplyModalOpen(false);
    setReason('');
    setDescription('');
  };

  const handleQuickApprove = (leaveId: string, isTeacherLeave: boolean = false) => {
    if (isTeacherLeave) {
      decideTeacherLeave(leaveId, 'approve', 'Approved by Chairman / HOD');
    } else {
      decideStudentLeave(leaveId, 'approve', 'Approved by Chairman / HOD');
    }
  };

  const handleDecisionConfirm = () => {
    if (!decisionModal) return;

    if (decisionModal.isTeacherLeave) {
      decideTeacherLeave(
        decisionModal.leaveId,
        decisionModal.action === 'approve' ? 'approve' : 'reject',
        remarksInput || (decisionModal.action === 'approve' ? 'Approved by Chairman' : 'Rejected by Chairman')
      );
    } else {
      if (decisionModal.action === 'forward') {
        forwardStudentLeave(decisionModal.leaveId, remarksInput || 'Verified and recommended to Chairman');
      } else {
        decideStudentLeave(
          decisionModal.leaveId,
          decisionModal.action === 'approve' ? 'approve' : 'reject',
          remarksInput || (decisionModal.action === 'approve' ? 'Approved by Chairman' : 'Rejected by Chairman')
        );
      }
    }

    setDecisionModal(null);
    setRemarksInput('');
  };

  // Filter student leaves
  const rawStudentLeaves = isStudent || isParent
    ? state.leaveApplications.filter((l) => l.studentId === effectiveStudentId)
    : session?.role === 'teacher'
    ? state.leaveApplications.filter(
        (l) => l.status === 'with_teacher' || l.status === 'with_chairman' || l.status === 'approved' || l.status === 'rejected'
      )
    : state.leaveApplications;

  const filteredStudentLeaves = rawStudentLeaves.filter((l) => {
    if (statusFilter === 'pending') {
      return l.status === 'with_chairman' || l.status === 'with_teacher';
    }
    if (statusFilter === 'approved') return l.status === 'approved';
    if (statusFilter === 'rejected') return l.status === 'rejected';
    return true;
  });

  // Filter faculty leaves
  const rawFacultyLeaves = session?.role === 'teacher'
    ? state.teacherLeaveApplications.filter((l) => l.teacherId === session.linkedId || isApprover)
    : state.teacherLeaveApplications;

  const filteredFacultyLeaves = rawFacultyLeaves.filter((l) => {
    if (statusFilter === 'pending') return l.status === 'with_chairman';
    if (statusFilter === 'approved') return l.status === 'approved';
    if (statusFilter === 'rejected') return l.status === 'rejected';
    return true;
  });

  // Counters
  const pendingStudentLeavesCount = state.leaveApplications.filter(
    (l) => l.status === 'with_chairman' || (isTeacher && l.status === 'with_teacher')
  ).length;

  const pendingFacultyLeavesCount = state.teacherLeaveApplications.filter(
    (l) => l.status === 'with_chairman'
  ).length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-slate-800 tracking-tight font-sans">
              {isStudent ? 'My Leave Applications' : isParent ? "Ward's Leave Applications" : 'Leave Applications & Approvals Queue'}
            </h1>
            {(pendingStudentLeavesCount + pendingFacultyLeavesCount > 0) && isApprover && (
              <span className="px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-800 text-xs font-bold animate-pulse">
                {pendingStudentLeavesCount + pendingFacultyLeavesCount} Awaiting Decision
              </span>
            )}
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            {isStudent || isParent
              ? 'Submit official absence requests and monitor multi-stage verification status'
              : 'Institutional review workflow: Student Submission → Faculty Verification → Chairman Approval'}
          </p>
        </div>

        {['student', 'teacher'].includes(session?.role || '') && (
          <button
            type="button"
            onClick={() => setIsApplyModalOpen(true)}
            className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-700 hover:to-indigo-800 text-white font-bold text-xs shadow-md shadow-indigo-600/20 flex items-center gap-2 self-start sm:self-auto transition-transform active:scale-95"
          >
            <Plus size={16} />
            <span>Apply for Leave</span>
          </button>
        )}
      </div>

      {/* SkoolZoom Top Summary Metric Cards for Approvers */}
      {!isStudent && !isParent && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div
            onClick={() => { setActiveTab('student'); setStatusFilter('pending'); }}
            className={`p-4 rounded-2xl border transition-all cursor-pointer ${
              activeTab === 'student' && statusFilter === 'pending'
                ? 'bg-amber-50 border-amber-300 shadow-sm'
                : 'bg-white border-slate-200/80 hover:bg-slate-50'
            }`}
          >
            <div className="flex items-center justify-between text-xs text-slate-500 font-semibold mb-1">
              <span>Student Leaves Pending</span>
              <GraduationCap size={16} className="text-amber-600" />
            </div>
            <div className="text-2xl font-black text-slate-900">{pendingStudentLeavesCount}</div>
            <div className="text-[11px] text-amber-700 font-medium mt-1">Awaiting approval queue</div>
          </div>

          <div
            onClick={() => { setActiveTab('teacher'); setStatusFilter('pending'); }}
            className={`p-4 rounded-2xl border transition-all cursor-pointer ${
              activeTab === 'teacher' && statusFilter === 'pending'
                ? 'bg-purple-50 border-purple-300 shadow-sm'
                : 'bg-white border-slate-200/80 hover:bg-slate-50'
            }`}
          >
            <div className="flex items-center justify-between text-xs text-slate-500 font-semibold mb-1">
              <span>Faculty Leaves Pending</span>
              <Users size={16} className="text-purple-600" />
            </div>
            <div className="text-2xl font-black text-slate-900">{pendingFacultyLeavesCount}</div>
            <div className="text-[11px] text-purple-700 font-medium mt-1">Awaiting Chairman decision</div>
          </div>

          <div
            onClick={() => setStatusFilter('approved')}
            className={`p-4 rounded-2xl border transition-all cursor-pointer ${
              statusFilter === 'approved'
                ? 'bg-emerald-50 border-emerald-300 shadow-sm'
                : 'bg-white border-slate-200/80 hover:bg-slate-50'
            }`}
          >
            <div className="flex items-center justify-between text-xs text-slate-500 font-semibold mb-1">
              <span>Approved Applications</span>
              <CheckCircle2 size={16} className="text-emerald-600" />
            </div>
            <div className="text-2xl font-black text-slate-900">
              {state.leaveApplications.filter((l) => l.status === 'approved').length +
                state.teacherLeaveApplications.filter((l) => l.status === 'approved').length}
            </div>
            <div className="text-[11px] text-emerald-700 font-medium mt-1">Cleared this semester</div>
          </div>

          <div
            onClick={() => setStatusFilter('all')}
            className={`p-4 rounded-2xl border transition-all cursor-pointer ${
              statusFilter === 'all'
                ? 'bg-indigo-50 border-indigo-300 shadow-sm'
                : 'bg-white border-slate-200/80 hover:bg-slate-50'
            }`}
          >
            <div className="flex items-center justify-between text-xs text-slate-500 font-semibold mb-1">
              <span>Total Applications</span>
              <Mail size={16} className="text-indigo-600" />
            </div>
            <div className="text-2xl font-black text-slate-900">
              {state.leaveApplications.length + state.teacherLeaveApplications.length}
            </div>
            <div className="text-[11px] text-slate-500 font-medium mt-1">All semester submissions</div>
          </div>
        </div>
      )}

      {/* Control Bar: Tabs and Status Filters */}
      <div className="bg-white p-3.5 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col md:flex-row items-center justify-between gap-3">
        {/* Category Tabs (Student vs Faculty) */}
        {!isStudent && !isParent ? (
          <div className="flex items-center gap-1.5 p-1 bg-slate-100 rounded-xl text-xs font-bold w-full md:w-auto">
            <button
              type="button"
              onClick={() => setActiveTab('student')}
              className={`px-4 py-1.5 rounded-lg transition-all ${
                activeTab === 'student' ? 'bg-white text-indigo-700 shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Student Leaves ({rawStudentLeaves.length})
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('teacher')}
              className={`px-4 py-1.5 rounded-lg transition-all ${
                activeTab === 'teacher' ? 'bg-white text-indigo-700 shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Faculty Leaves ({rawFacultyLeaves.length})
            </button>
          </div>
        ) : (
          <div className="text-xs font-bold text-slate-700 flex items-center gap-2">
            <Mail size={16} className="text-indigo-600" />
            <span>My Registered Leaves ({rawStudentLeaves.length})</span>
          </div>
        )}

        {/* Status Filters */}
        <div className="flex items-center gap-1.5 overflow-x-auto w-full md:w-auto">
          <button
            type="button"
            onClick={() => setStatusFilter('pending')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 whitespace-nowrap ${
              statusFilter === 'pending'
                ? 'bg-amber-600 text-white shadow-xs'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            <Clock size={13} />
            Pending Review
          </button>
          <button
            type="button"
            onClick={() => setStatusFilter('approved')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 whitespace-nowrap ${
              statusFilter === 'approved'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            <CheckCircle2 size={13} />
            Approved
          </button>
          <button
            type="button"
            onClick={() => setStatusFilter('rejected')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 whitespace-nowrap ${
              statusFilter === 'rejected'
                ? 'bg-rose-600 text-white shadow-xs'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            <XCircle size={13} />
            Rejected
          </button>
          <button
            type="button"
            onClick={() => setStatusFilter('all')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 whitespace-nowrap ${
              statusFilter === 'all'
                ? 'bg-slate-800 text-white shadow-xs'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            All Submissions
          </button>
        </div>
      </div>

      {/* ---------------- STUDENT LEAVES LIST ---------------- */}
      {(activeTab === 'student' || isStudent || isParent) && (
        <div className="space-y-4">
          {filteredStudentLeaves.length === 0 ? (
            <div className="py-16 text-center text-slate-400 text-xs bg-white rounded-2xl border border-slate-200/80 p-8">
              <Mail className="mx-auto text-slate-300 mb-2" size={32} />
              <div className="font-bold text-slate-700 text-sm">No Student Leave Applications Found</div>
              <p className="mt-1 text-slate-400">
                {statusFilter === 'pending'
                  ? 'There are currently no student leaves pending approval under this filter.'
                  : 'No records match your selected status filter.'}
              </p>
            </div>
          ) : (
            filteredStudentLeaves.map((leave) => {
              const student = state.students.find((s) => s.id === leave.studentId);
              const program = state.programs.find((p) => p.id === leave.programId);
              const section = student ? state.sections.find((sec) => sec.id === student.currentSectionId) : null;

              const isPendingTeacher = leave.status === 'with_teacher';
              const isPendingChairman = leave.status === 'with_chairman';

              const canTeacherForward = isTeacher && isPendingTeacher;
              const canChairmanDecide = isApprover && isPendingChairman;

              return (
                <div
                  key={leave.id}
                  className={`bg-white rounded-2xl p-5 shadow-xs border transition-all ${
                    isPendingChairman
                      ? 'border-amber-200 hover:shadow-md'
                      : isPendingTeacher
                      ? 'border-indigo-200 hover:shadow-md'
                      : 'border-slate-200/80 hover:shadow-sm'
                  }`}
                >
                  <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                    {/* Left: Applicant Details and Reason */}
                    <div className="space-y-2 flex-1 min-w-0">
                      <div className="flex items-center gap-2.5 flex-wrap">
                        <span className="font-black text-slate-900 text-sm sm:text-base">
                          {student?.name || 'Student Applicant'}
                        </span>
                        <span className="px-2 py-0.5 rounded-md text-[10px] font-extrabold uppercase bg-indigo-50 text-indigo-700 border border-indigo-100">
                          {leave.leaveType} Leave
                        </span>
                        <span
                          className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase flex items-center gap-1 ${
                            leave.status === 'approved'
                              ? 'bg-emerald-100 text-emerald-800'
                              : leave.status === 'rejected'
                              ? 'bg-rose-100 text-rose-800'
                              : leave.status === 'with_chairman'
                              ? 'bg-amber-100 text-amber-900 border border-amber-200'
                              : 'bg-indigo-100 text-indigo-900'
                          }`}
                        >
                          {leave.status === 'with_chairman'
                            ? 'Pending Chairman Decision'
                            : leave.status === 'with_teacher'
                            ? 'Under Teacher Verification'
                            : leave.status}
                        </span>
                      </div>

                      <div className="text-xs text-slate-600 flex items-center gap-3 flex-wrap">
                        <span>
                          <strong>Registration:</strong> {student?.registrationNumber || 'BT-2026'}
                        </span>
                        <span>·</span>
                        <span>
                          <strong>Class Roll:</strong> {student?.classNumber || 'ME-1A-01'}
                        </span>
                        <span>·</span>
                        <span>
                          <strong>Section:</strong> {section?.name || 'A'} ({program?.code || 'B.Tech'})
                        </span>
                        <span>·</span>
                        <span>
                          <strong>Duration:</strong> {formatDate(leave.startDate)} to {formatDate(leave.endDate)} ({leave.days} day(s))
                        </span>
                      </div>

                      <div className="text-xs text-slate-700 bg-slate-50 p-3 rounded-xl border border-slate-100 leading-relaxed">
                        <span className="font-bold text-slate-900">Reason for Absence: </span>
                        {leave.reason}
                        {leave.description && (
                          <div className="mt-1 text-[11px] text-slate-500 italic">
                            Details: {leave.description}
                          </div>
                        )}
                      </div>

                      {/* Recommendation & Approval Notes */}
                      {leave.teacherRemarks && (
                        <div className="text-xs text-indigo-900 bg-indigo-50/70 p-2.5 rounded-xl border border-indigo-100 flex items-start gap-2">
                          <CheckCircle2 size={15} className="text-indigo-600 shrink-0 mt-0.5" />
                          <div>
                            <span className="font-bold">Subject Faculty Recommendation: </span>
                            {leave.teacherRemarks}
                          </div>
                        </div>
                      )}

                      {leave.chairmanRemarks && (
                        <div className="text-xs text-emerald-900 bg-emerald-50/70 p-2.5 rounded-xl border border-emerald-100 flex items-start gap-2">
                          <Shield size={15} className="text-emerald-600 shrink-0 mt-0.5" />
                          <div>
                            <span className="font-bold">Chairman / HOD Decision Note: </span>
                            {leave.chairmanRemarks}
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Right: Direct Actions for Reviewers / Approvers */}
                    <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 shrink-0 pt-2 md:pt-0">
                      {/* Teacher action */}
                      {canTeacherForward && (
                        <button
                          type="button"
                          onClick={() =>
                            setDecisionModal({
                              leaveId: leave.id,
                              action: 'forward',
                              applicantName: student?.name,
                            })
                          }
                          className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-md shadow-indigo-600/20 flex items-center justify-center gap-1.5 transition-colors"
                        >
                          <Send size={14} />
                          <span>Recommend & Forward</span>
                        </button>
                      )}

                      {/* Chairman / HOD / Admin actions */}
                      {canChairmanDecide && (
                        <>
                          <button
                            type="button"
                            onClick={() => handleQuickApprove(leave.id, false)}
                            className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md shadow-emerald-600/20 flex items-center justify-center gap-1.5 transition-colors"
                          >
                            <Check size={14} />
                            <span>Approve Leave</span>
                          </button>
                          <button
                            type="button"
                            onClick={() =>
                              setDecisionModal({
                                leaveId: leave.id,
                                action: 'reject',
                                applicantName: student?.name,
                              })
                            }
                            className="px-3.5 py-2 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold text-xs border border-rose-200 flex items-center justify-center gap-1.5 transition-colors"
                          >
                            <X size={14} />
                            <span>Reject</span>
                          </button>
                        </>
                      )}

                      {/* Status indicator when already decided */}
                      {!canTeacherForward && !canChairmanDecide && (
                        <div className="text-[11px] text-slate-400 font-semibold text-right">
                          Submitted: {formatDate(leave.submittedAt)}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}

      {/* ---------------- FACULTY LEAVES LIST ---------------- */}
      {!isStudent && !isParent && activeTab === 'teacher' && (
        <div className="space-y-4">
          {filteredFacultyLeaves.length === 0 ? (
            <div className="py-16 text-center text-slate-400 text-xs bg-white rounded-2xl border border-slate-200/80 p-8">
              <Users className="mx-auto text-slate-300 mb-2" size={32} />
              <div className="font-bold text-slate-700 text-sm">No Faculty Leave Applications Found</div>
              <p className="mt-1 text-slate-400">
                {statusFilter === 'pending'
                  ? 'There are currently no faculty leave requests awaiting decision.'
                  : 'No faculty leaves match your selected filter.'}
              </p>
            </div>
          ) : (
            filteredFacultyLeaves.map((tLeave) => {
              const isPending = tLeave.status === 'with_chairman';
              const canDecide = isApprover && isPending;

              return (
                <div
                  key={tLeave.id}
                  className={`bg-white rounded-2xl p-5 shadow-xs border transition-all ${
                    isPending ? 'border-purple-200 hover:shadow-md' : 'border-slate-200/80 hover:shadow-sm'
                  }`}
                >
                  <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                    <div className="space-y-2 flex-1 min-w-0">
                      <div className="flex items-center gap-2.5 flex-wrap">
                        <span className="font-black text-slate-900 text-sm sm:text-base">
                          {tLeave.teacherName}
                        </span>
                        <span className="px-2 py-0.5 rounded-md text-[10px] font-extrabold uppercase bg-purple-50 text-purple-700 border border-purple-100">
                          {tLeave.leaveType} Leave
                        </span>
                        <span
                          className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase ${
                            tLeave.status === 'approved'
                              ? 'bg-emerald-100 text-emerald-800'
                              : tLeave.status === 'rejected'
                              ? 'bg-rose-100 text-rose-800'
                              : 'bg-amber-100 text-amber-900 border border-amber-200'
                          }`}
                        >
                          {tLeave.status === 'with_chairman' ? 'Awaiting Chairman Decision' : tLeave.status}
                        </span>
                      </div>

                      <div className="text-xs text-slate-600 flex items-center gap-3">
                        <span>
                          <strong>Duration:</strong> {formatDate(tLeave.startDate)} to {formatDate(tLeave.endDate)} ({tLeave.days} day(s))
                        </span>
                        <span>·</span>
                        <span>
                          <strong>Submitted:</strong> {formatDate(tLeave.submittedAt)}
                        </span>
                      </div>

                      <div className="text-xs text-slate-700 bg-slate-50 p-3 rounded-xl border border-slate-100 leading-relaxed">
                        <span className="font-bold text-slate-900">Reason / Official Purpose: </span>
                        {tLeave.reason}
                        {tLeave.description && (
                          <div className="mt-1 text-[11px] text-slate-500 italic">
                            Details: {tLeave.description}
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 shrink-0 pt-2 md:pt-0">
                      {canDecide ? (
                        <>
                          <button
                            type="button"
                            onClick={() => handleQuickApprove(tLeave.id, true)}
                            className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md shadow-emerald-600/20 flex items-center justify-center gap-1.5 transition-colors"
                          >
                            <Check size={14} />
                            <span>Approve Leave</span>
                          </button>
                          <button
                            type="button"
                            onClick={() =>
                              setDecisionModal({
                                leaveId: tLeave.id,
                                action: 'reject',
                                isTeacherLeave: true,
                                applicantName: tLeave.teacherName,
                              })
                            }
                            className="px-3.5 py-2 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold text-xs border border-rose-200 flex items-center justify-center gap-1.5 transition-colors"
                          >
                            <X size={14} />
                            <span>Reject</span>
                          </button>
                        </>
                      ) : (
                        <div className="text-[11px] text-slate-400 font-semibold text-right">
                          Status: {tLeave.status}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}

      {/* ---------------- APPLY LEAVE MODAL (ONLY WHEN BUTTON CLICKED) ---------------- */}
      {isApplyModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 space-y-4 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <h2 className="font-black text-slate-900 text-sm flex items-center gap-2">
                <Mail size={16} className="text-indigo-600" />
                <span>Submit Formal Leave Application</span>
              </h2>
              <button
                type="button"
                onClick={() => setIsApplyModalOpen(false)}
                className="w-7 h-7 rounded-lg hover:bg-slate-100 flex items-center justify-center text-slate-400 hover:text-slate-700 transition-colors"
              >
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleApplySubmit} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Leave Category *</label>
                <select
                  value={leaveType}
                  onChange={(e) => setLeaveType(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 font-medium text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option>Medical</option>
                  <option>Casual</option>
                  <option>Emergency</option>
                  <option>Family</option>
                  <option>Academic Event / Symposium</option>
                  <option>Other</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Start Date *</label>
                  <input
                    type="date"
                    required
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 font-medium text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">End Date *</label>
                  <input
                    type="date"
                    required
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 font-medium text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Reason for Absence *</label>
                <input
                  type="text"
                  required
                  placeholder="Severe fever / Medical consultation / Urgent family emergency..."
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 font-medium text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Explanatory Notes / Doctor Details</label>
                <textarea
                  rows={2}
                  placeholder="Optional details, clinic name, prescription summary..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 font-medium text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsApplyModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 font-bold text-white shadow-md shadow-indigo-600/20 transition-all"
                >
                  Submit Application
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ---------------- DECISION / REMARKS MODAL ---------------- */}
      {decisionModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl shadow-2xl max-w-sm w-full p-6 space-y-4 animate-in fade-in zoom-in-95 duration-200">
            <h3 className="font-black text-slate-900 text-sm capitalize flex items-center gap-2">
              {decisionModal.action === 'reject' ? (
                <XCircle size={18} className="text-rose-600" />
              ) : (
                <CheckCircle2 size={18} className="text-emerald-600" />
              )}
              <span>
                {decisionModal.action === 'forward'
                  ? 'Recommend & Forward to Chairman'
                  : `${decisionModal.action} Leave Application`}
              </span>
            </h3>
            {decisionModal.applicantName && (
              <p className="text-xs text-slate-500">
                Applicant: <strong>{decisionModal.applicantName}</strong>
              </p>
            )}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Official Remarks / Reason note
              </label>
              <textarea
                rows={3}
                placeholder={
                  decisionModal.action === 'reject'
                    ? 'State specific reason for refusal...'
                    : 'Recommended based on medical certificate / attendance standing...'
                }
                value={remarksInput}
                onChange={(e) => setRemarksInput(e.target.value)}
                className="w-full p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setDecisionModal(null)}
                className="px-3.5 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 font-semibold text-xs text-slate-700 transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDecisionConfirm}
                className={`px-4 py-1.5 rounded-xl font-bold text-xs text-white transition-colors ${
                  decisionModal.action === 'reject'
                    ? 'bg-rose-600 hover:bg-rose-700'
                    : 'bg-indigo-600 hover:bg-indigo-700'
                }`}
              >
                Confirm Decision
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
