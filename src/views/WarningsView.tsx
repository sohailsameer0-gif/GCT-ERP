import React, { useState } from 'react';
import {
  AlertTriangle,
  FileText,
  Filter,
  GraduationCap,
  Plus,
  Printer,
  Search,
  ShieldAlert,
  User,
  X,
  Clock,
  CheckCircle,
} from 'lucide-react';
import { useERP } from '../context/ERPContext';
import {
  calculateAttendanceSummary,
  formatDate,
  formatDateTime,
  openPrintDocument,
} from '../services/calculations';
import { Warning } from '../types/erp';

export const WarningsView: React.FC = () => {
  const { state, session, issueWarning, addToast, can } = useERP();
  const [searchTerm, setSearchTerm] = useState('');
  const [severityFilter, setSeverityFilter] = useState('all');
  const [isIssueModalOpen, setIsIssueModalOpen] = useState(false);

  // Form state for issuing a warning
  const [selectedStudentId, setSelectedStudentId] = useState('');
  const [severity, setSeverity] = useState<Warning['severity']>('Warning 1');
  const [reason, setReason] = useState('');

  if (!session) return null;

  const isStudent = session.role === 'student';
  const studentRecordId = session.linkedId;

  // Filter warnings
  const visibleWarnings = state.warnings.filter((w) => {
    if (isStudent) {
      return w.studentId === studentRecordId;
    }
    return true;
  });

  const filteredWarnings = visibleWarnings.filter((w) => {
    if (severityFilter !== 'all' && w.severity !== severityFilter) return false;

    if (searchTerm.trim()) {
      const q = searchTerm.toLowerCase();
      const stu = state.students.find((s) => s.id === w.studentId);
      const match = `${stu?.name} ${stu?.admissionNumber} ${stu?.classNumber} ${w.reason}`.toLowerCase();
      if (!match.includes(q)) return false;
    }
    return true;
  });

  // Shortage calculations for faculty reference
  const shortageStudents = state.students.filter((stu) => {
    const summary = calculateAttendanceSummary(stu.id, state);
    return summary.total > 0 && summary.isShortage;
  });

  const handleIssueSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStudentId) {
      addToast('Please select a student', 'warn');
      return;
    }
    if (!reason.trim()) {
      addToast('Please enter the reason for this warning notice', 'warn');
      return;
    }

    try {
      issueWarning(selectedStudentId, severity, reason.trim());
      setIsIssueModalOpen(false);
      setSelectedStudentId('');
      setReason('');
      addToast('Official warning issued and dispatched to both Student and Parent portals with tone alert', 'success');
    } catch (err: any) {
      addToast(err?.message || 'Failed to issue warning', 'error');
    }
  };

  const handlePrintWarning = (warn: Warning) => {
    const stu = state.students.find((s) => s.id === warn.studentId);
    const prog = state.programs.find((p) => p.id === stu?.programId);
    const dept = state.departments.find((d) => d.id === stu?.departmentId);
    const summary = stu ? calculateAttendanceSummary(stu.id, state) : null;

    const content = `
      <div style="font-family: Arial, sans-serif; padding: 24px;">
        <div style="text-align: center; border-bottom: 2px solid #0f172a; padding-bottom: 12px; margin-bottom: 20px;">
          <h2 style="margin: 0; font-size: 20px; font-weight: bold; text-transform: uppercase;">GOVERNMENT COLLEGE OF TECHNOLOGY PESHAWAR</h2>
          <p style="margin: 4px 0 0; font-size: 12px; color: #475569;">Directorate of Academics & Examination Cell · Attendance Compliance</p>
          <h3 style="margin: 12px 0 0; font-size: 16px; color: #b91c1c; text-decoration: underline;">OFFICIAL ATTENDANCE SHORTAGE NOTICE</h3>
        </div>

        <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px; font-size: 13px;">
          <tr>
            <td style="padding: 6px; font-weight: bold; width: 25%;">Student Name:</td>
            <td style="padding: 6px;">${stu?.name || 'N/A'}</td>
            <td style="padding: 6px; font-weight: bold; width: 25%;">Admission / Roll #:</td>
            <td style="padding: 6px;">${stu?.admissionNumber || stu?.classNumber || 'N/A'}</td>
          </tr>
          <tr>
            <td style="padding: 6px; font-weight: bold;">Program:</td>
            <td style="padding: 6px;">${prog?.name || 'N/A'}</td>
            <td style="padding: 6px; font-weight: bold;">Department:</td>
            <td style="padding: 6px;">${dept?.name || 'N/A'}</td>
          </tr>
          <tr>
            <td style="padding: 6px; font-weight: bold;">Notice Level:</td>
            <td style="padding: 6px; color: #b91c1c; font-weight: bold;">${warn.severity}</td>
            <td style="padding: 6px; font-weight: bold;">Date of Issuance:</td>
            <td style="padding: 6px;">${formatDate(warn.issuedAt)}</td>
          </tr>
          <tr>
            <td style="padding: 6px; font-weight: bold;">Cumulative Attendance:</td>
            <td style="padding: 6px; font-weight: bold; color: ${summary?.isShortage ? '#b91c1c' : '#15803d'};">
              ${summary ? `${summary.adjustedPercentage}% (${summary.present}/${summary.total} classes)` : 'N/A'}
            </td>
            <td style="padding: 6px; font-weight: bold;">Minimum Required:</td>
            <td style="padding: 6px;">${state.settings.shortageThreshold}%</td>
          </tr>
        </table>

        <div style="background: #fef2f2; border: 1px solid #fecaca; padding: 14px; border-radius: 8px; margin-bottom: 24px;">
          <h4 style="margin: 0 0 6px; font-size: 12px; color: #991b1b; text-transform: uppercase;">Reason / Observation:</h4>
          <p style="margin: 0; font-size: 13px; color: #1e293b; line-height: 1.5;">${warn.reason}</p>
        </div>

        <p style="font-size: 12px; line-height: 1.6; color: #334155;">
          <strong>Notice:</strong> In accordance with KP-TEVTA and University of Engineering and Technology (UET) regulations, candidates possessing less than <strong>${state.settings.shortageThreshold}%</strong> attendance shall be debarred from taking final term-end semester examinations. You are hereby directed to present yourself before your Department Head / Chairman.
        </p>

        <div style="margin-top: 48px; display: flex; justify-content: space-between; font-size: 12px;">
          <div style="border-top: 1px solid #64748b; width: 220px; text-align: center; padding-top: 6px;">
            Academic Coordinator
          </div>
          <div style="border-top: 1px solid #64748b; width: 220px; text-align: center; padding-top: 6px;">
            Chairman / Head of Department
          </div>
        </div>
      </div>
    `;

    openPrintDocument(`Attendance_Warning_${stu?.admissionNumber || 'Notice'}`, content);
  };

  const canManageWarnings =
    session.role === 'sysadmin' ||
    session.role === 'chairman' ||
    session.role === 'hod' ||
    can('warnings.manage');

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-800 tracking-tight font-sans">
            {isStudent ? 'My Attendance Warning Notices' : 'Official Attendance Warnings'}
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Compliance records for attendance falling below the mandatory {state.settings.shortageThreshold}% criteria
          </p>
        </div>

        {canManageWarnings && (
          <button
            type="button"
            onClick={() => setIsIssueModalOpen(true)}
            className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-semibold text-xs transition-colors flex items-center gap-2 shadow-xs"
          >
            <Plus size={16} />
            Issue Formal Warning
          </button>
        )}
      </div>

      {/* Metric Cards for Staff */}
      {!isStudent && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
              <ShieldAlert size={24} />
            </div>
            <div>
              <div className="text-2xs font-bold text-slate-400 uppercase tracking-wider">
                Total Warnings Issued
              </div>
              <div className="text-2xl font-black text-slate-900 mt-0.5 font-sans">
                {state.warnings.length}
              </div>
            </div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center shrink-0">
              <AlertTriangle size={24} />
            </div>
            <div>
              <div className="text-2xs font-bold text-slate-400 uppercase tracking-wider">
                Final / Debarment Notices
              </div>
              <div className="text-2xl font-black text-rose-600 mt-0.5 font-sans">
                {state.warnings.filter((w) => w.severity === 'Final Notice' || w.severity === 'Suspension').length}
              </div>
            </div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
              <GraduationCap size={24} />
            </div>
            <div>
              <div className="text-2xs font-bold text-slate-400 uppercase tracking-wider">
                Students in Shortage (&lt;{state.settings.shortageThreshold}%)
              </div>
              <div className="text-2xl font-black text-indigo-700 mt-0.5 font-sans">
                {shortageStudents.length}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col md:flex-row items-center justify-between gap-3">
        <div className="relative w-full md:w-80">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search by student name, roll #, reason..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto">
          <select
            value={severityFilter}
            onChange={(e) => setSeverityFilter(e.target.value)}
            className="text-xs bg-white border border-slate-200 rounded-xl px-3 py-2 font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 w-full sm:w-auto"
          >
            <option value="all">All Notice Levels</option>
            <option value="Warning 1">Warning 1 (Initial Caution)</option>
            <option value="Warning 2">Warning 2 (Escalated)</option>
            <option value="Final Notice">Final Notice (Debarment Risk)</option>
            <option value="Suspension">Suspension Order</option>
          </select>
        </div>
      </div>

      {/* Warnings List */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs divide-y divide-slate-100 overflow-hidden">
        {filteredWarnings.length === 0 ? (
          <div className="p-12 text-center">
            <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto mb-3">
              <CheckCircle size={24} />
            </div>
            <h3 className="text-sm font-bold text-slate-800">
              {isStudent ? 'No Attendance Warnings' : 'No Warning Notices Found'}
            </h3>
            <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
              {isStudent
                ? 'Your attendance compliance record is clear. Maintain regular class presence!'
                : 'No warning letters match your current filter criteria.'}
            </p>
          </div>
        ) : (
          filteredWarnings.map((warn) => {
            const stu = state.students.find((s) => s.id === warn.studentId);
            const isFinal = warn.severity === 'Final Notice' || warn.severity === 'Suspension';

            return (
              <div
                key={warn.id}
                className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-slate-50/60 transition-colors"
              >
                <div className="flex items-start gap-4">
                  <div
                    className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 mt-0.5 ${
                      isFinal ? 'bg-rose-100 text-rose-700' : 'bg-amber-100 text-amber-700'
                    }`}
                  >
                    <ShieldAlert size={20} />
                  </div>

                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <h4 className="text-sm font-bold text-slate-800">
                        {stu?.name || 'Student Record'}
                      </h4>
                      <span className="text-xs text-slate-400">
                        ({stu?.admissionNumber || stu?.classNumber || 'No Roll #'})
                      </span>
                      <span
                        className={`text-3xs px-2 py-0.5 rounded-full font-bold uppercase tracking-wider ${
                          isFinal
                            ? 'bg-rose-100 text-rose-800 border border-rose-200'
                            : 'bg-amber-100 text-amber-800 border border-amber-200'
                        }`}
                      >
                        {warn.severity}
                      </span>
                    </div>

                    <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                      {warn.reason}
                    </p>

                    <div className="flex items-center gap-3 mt-2 text-2xs text-slate-400 font-medium">
                      <span className="flex items-center gap-1">
                        <Clock size={11} />
                        Issued: {formatDateTime(warn.issuedAt)}
                      </span>
                      <span>•</span>
                      <span>Authorized: {warn.issuedBy}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 self-end sm:self-center">
                  <button
                    type="button"
                    onClick={() => handlePrintWarning(warn)}
                    className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs flex items-center gap-1.5 transition-colors"
                  >
                    <Printer size={13} />
                    Print Notice
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Issue Modal */}
      {isIssueModalOpen && (
        <div className="fixed inset-0 bg-slate-950/60 z-50 flex items-center justify-center p-4 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center">
                  <AlertTriangle size={18} />
                </div>
                <h3 className="text-base font-bold text-slate-800 font-sans">
                  Issue Attendance Warning Notice
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsIssueModalOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleIssueSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Target Student *
                </label>
                <select
                  required
                  value={selectedStudentId}
                  onChange={(e) => setSelectedStudentId(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
                >
                  <option value="">-- Choose Student Record --</option>
                  {state.students.map((st) => {
                    const sum = calculateAttendanceSummary(st.id, state);
                    return (
                      <option key={st.id} value={st.id}>
                        {st.name} ({st.admissionNumber || st.classNumber}) —{' '}
                        {sum.total > 0 ? `${sum.adjustedPercentage}% Attendance` : 'No classes'}
                      </option>
                    );
                  })}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Warning Notice Level *
                </label>
                <select
                  value={severity}
                  onChange={(e) => setSeverity(e.target.value as Warning['severity'])}
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
                >
                  <option value="Warning 1">Warning 1 — Formal Attendance Caution</option>
                  <option value="Warning 2">Warning 2 — Repeated Shortage / Guardian Notice</option>
                  <option value="Final Notice">Final Notice — Debarment From Examinations</option>
                  <option value="Suspension">Suspension Order — Academic Disqualification</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Official Reason & Academic Directives *
                </label>
                <textarea
                  required
                  rows={3}
                  placeholder="e.g. Cumulative attendance has dropped below 70% threshold in Fluid Mechanics and Applied Math. Contact Chairman office immediately."
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
                />
              </div>

              <div className="flex justify-end gap-2.5 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsIssueModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs transition-colors shadow-xs"
                >
                  Issue & Dispatch Warning
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
