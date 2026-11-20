import React, { useState } from 'react';
import {
  Calendar,
  CheckCircle2,
  Clock,
  Download,
  Filter,
  Search,
  UserCheck,
  AlertTriangle,
  GraduationCap,
} from 'lucide-react';
import { useERP } from '../context/ERPContext';
import { calculateAttendanceSummary, formatDate } from '../services/calculations';
import { AttendanceStatus } from '../types/erp';

export const AttendanceView: React.FC = () => {
  const { state, session, can } = useERP();

  const [search, setSearch] = useState('');
  const [filterCourse, setFilterCourse] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('');
  const [filterDate, setFilterDate] = useState('');

  // Role-based student resolution
  const isStudent = session?.role === 'student';
  const isParent = session?.role === 'parent';
  const parentLink = isParent ? state.parentLinks.find((l) => l.parentId === session?.linkedId && l.verified) : null;
  const effectiveStudentId = isStudent ? session?.linkedId : isParent ? parentLink?.studentId : null;
  const linkedStudent = effectiveStudentId ? state.students.find((s) => s.id === effectiveStudentId) : null;
  const studentSummary = effectiveStudentId ? calculateAttendanceSummary(effectiveStudentId, state) : null;

  const records = state.attendanceRecords.filter((rec) => {
    if (effectiveStudentId && rec.studentId !== effectiveStudentId) return false;
    if (filterCourse && rec.courseId !== filterCourse) return false;
    if (filterStatus && rec.status !== filterStatus) return false;
    if (filterDate && rec.date !== filterDate) return false;

    if (search.trim()) {
      const q = search.toLowerCase();
      const student = state.students.find((s) => s.id === rec.studentId);
      const course = state.courses.find((c) => c.id === rec.courseId);
      const match = `${student?.name} ${student?.admissionNumber} ${course?.code} ${course?.name}`.toLowerCase();
      if (!match.includes(q)) return false;
    }
    return true;
  });

  const exportCsv = () => {
    const headers = [
      'Record ID',
      'Date',
      'Student Name',
      'Admission #',
      'Course Code',
      'Status',
      'Arrival Time',
      'Exit Time',
      'Late Minutes',
      'Method',
    ];
    const rows = records.map((r) => {
      const student = state.students.find((s) => s.id === r.studentId);
      const course = state.courses.find((c) => c.id === r.courseId);
      return [
        r.id,
        r.date,
        student?.name || '',
        student?.admissionNumber || '',
        course?.code || '',
        r.status,
        r.arrivalTime || '',
        r.exitTime || '',
        r.lateMinutes || 0,
        r.manual ? 'Manual' : 'QR Scan',
      ];
    });

    const csvContent = [headers, ...rows]
      .map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(','))
      .join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `GCT_Attendance_Log_${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-800 tracking-tight font-sans">
            {effectiveStudentId
              ? `${linkedStudent?.name || 'Student'}'s Attendance Record`
              : 'Attendance Log & Register'}
          </h1>
          <p className="text-xs text-slate-500">
            {effectiveStudentId
              ? `Personal attendance compliance and class presence record for ${linkedStudent?.classNumber || linkedStudent?.admissionNumber || 'current semester'}`
              : 'Official chronological attendance entries recorded via live QR and faculty manuals'}
          </p>
        </div>

        <div className="flex items-center gap-2">
          {['teacher', 'chairman', 'hod', 'sysadmin', 'clerk'].includes(session?.role || '') && (
            <button
              onClick={() => { window.location.hash = '#/app/attendance/mark'; }}
              className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-md shadow-indigo-600/20 flex items-center gap-2 transition-colors"
            >
              <CheckCircle2 size={15} />
              <span>Mark Manual Attendance</span>
            </button>
          )}
          <button
            onClick={exportCsv}
            className="px-4 py-2.5 rounded-xl bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 font-bold text-xs shadow-xs flex items-center gap-2 self-start sm:self-auto transition-colors"
          >
            <Download size={15} />
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      {/* Student Personal Attendance Summary KPI Card */}
      {studentSummary && linkedStudent && (
        <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold">
                <GraduationCap size={24} />
              </div>
              <div>
                <h3 className="font-bold text-slate-900 text-sm">
                  {linkedStudent.name}
                </h3>
                <p className="text-xs text-slate-500">
                  Roll / Class #: {linkedStudent.classNumber || linkedStudent.admissionNumber} · Status: {linkedStudent.status}
                </p>
              </div>
            </div>

            <div>
              {studentSummary.isShortage ? (
                <span className="px-3 py-1.5 rounded-xl bg-rose-100 text-rose-800 font-bold text-xs flex items-center gap-1.5 border border-rose-200">
                  <AlertTriangle size={15} /> Shortage Risk ({studentSummary.adjustedPercentage}%)
                </span>
              ) : (
                <span className="px-3 py-1.5 rounded-xl bg-emerald-100 text-emerald-800 font-bold text-xs flex items-center gap-1.5 border border-emerald-200">
                  <CheckCircle2 size={15} /> Compliance Good ({studentSummary.adjustedPercentage}%)
                </span>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 pt-2">
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 text-center">
              <div className="text-2xs font-semibold text-slate-400 uppercase">Classes Held</div>
              <div className="text-lg font-black text-slate-800 font-mono mt-0.5">{studentSummary.total}</div>
            </div>
            <div className="p-3 rounded-xl bg-emerald-50/60 border border-emerald-100 text-center">
              <div className="text-2xs font-semibold text-emerald-700 uppercase">Present</div>
              <div className="text-lg font-black text-emerald-700 font-mono mt-0.5">{studentSummary.present}</div>
            </div>
            <div className="p-3 rounded-xl bg-amber-50/60 border border-amber-100 text-center">
              <div className="text-2xs font-semibold text-amber-700 uppercase">Late (3=1 Abs)</div>
              <div className="text-lg font-black text-amber-700 font-mono mt-0.5">{studentSummary.late}</div>
            </div>
            <div className="p-3 rounded-xl bg-rose-50/60 border border-rose-100 text-center">
              <div className="text-2xs font-semibold text-rose-700 uppercase">Absences</div>
              <div className="text-lg font-black text-rose-700 font-mono mt-0.5">{studentSummary.absent}</div>
            </div>
            <div className="p-3 rounded-xl bg-indigo-50/60 border border-indigo-100 text-center col-span-2 sm:col-span-1">
              <div className="text-2xs font-semibold text-indigo-700 uppercase">Adjusted %</div>
              <div className="text-lg font-black text-indigo-700 font-mono mt-0.5">{studentSummary.adjustedPercentage}%</div>
            </div>
          </div>

          {studentSummary.isShortage && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-800 flex items-center gap-2">
              <AlertTriangle size={16} className="shrink-0 text-rose-600" />
              <span>
                <strong>Warning:</strong> Your cumulative attendance is below the college mandatory {state.settings.shortageThreshold}% requirement. Please attend remaining classes or contact your Department Chairman.
              </span>
            </div>
          )}
        </div>
      )}

      {/* Filters Toolbar */}
      <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-200/80 flex flex-col md:flex-row gap-3 text-xs">
        <div className="flex-1 relative">
          <Search size={15} className="absolute left-3.5 top-3 text-slate-400" />
          <input
            type="text"
            placeholder="Search student name, roll number, course..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 rounded-xl bg-slate-50 border border-slate-200 focus:bg-white focus:outline-hidden"
          />
        </div>

        <select
          value={filterCourse}
          onChange={(e) => setFilterCourse(e.target.value)}
          className="px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 focus:bg-white focus:outline-hidden"
        >
          <option value="">All Courses</option>
          {state.courses.map((c) => (
            <option key={c.id} value={c.id}>
              {c.code} — {c.name}
            </option>
          ))}
        </select>

        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          className="px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 focus:bg-white focus:outline-hidden"
        >
          <option value="">All Statuses</option>
          <option value="present">Present</option>
          <option value="late">Late Arrival</option>
          <option value="absent">Absent</option>
          <option value="approved_leave">Approved Leave</option>
        </select>

        <input
          type="date"
          value={filterDate}
          onChange={(e) => setFilterDate(e.target.value)}
          className="px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 focus:bg-white focus:outline-hidden"
        />
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200/80 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-200/80 text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                <th className="py-3 px-4">Date</th>
                <th className="py-3 px-4">Student</th>
                <th className="py-3 px-4">Subject</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Punch-In</th>
                <th className="py-3 px-4">Punch-Out</th>
                <th className="py-3 px-4">Method</th>
                <th className="py-3 px-4">Remarks</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {records.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400">
                    No attendance records match your filter criteria.
                  </td>
                </tr>
              ) : (
                records
                  .slice()
                  .reverse()
                  .map((rec) => {
                    const student = state.students.find((s) => s.id === rec.studentId);
                    const course = state.courses.find((c) => c.id === rec.courseId);

                    return (
                      <tr key={rec.id} className="hover:bg-indigo-50/20 transition-colors">
                        <td className="py-2.5 px-4 font-mono text-slate-600 font-semibold">
                          {formatDate(rec.date)}
                        </td>
                        <td className="py-2.5 px-4">
                          <div className="font-bold text-slate-900">{student?.name || 'Student'}</div>
                          <div className="text-[10px] font-mono text-slate-400">
                            {student?.admissionNumber}
                          </div>
                        </td>
                        <td className="py-2.5 px-4 font-semibold text-slate-700">
                          {course?.code} — {course?.name}
                        </td>
                        <td className="py-2.5 px-4">
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                              rec.status === 'present'
                                ? 'bg-emerald-100 text-emerald-800'
                                : rec.status === 'late'
                                ? 'bg-amber-100 text-amber-800'
                                : rec.status === 'absent'
                                ? 'bg-rose-100 text-rose-800'
                                : 'bg-blue-100 text-blue-800'
                            }`}
                          >
                            {rec.status.replace('_', ' ')}
                          </span>
                        </td>
                        <td className="py-2.5 px-4 font-mono text-slate-600">
                          {rec.arrivalTime || '—'}
                          {rec.lateMinutes > 0 && (
                            <span className="text-[10px] text-amber-600 ml-1">
                              (+{rec.lateMinutes}m)
                            </span>
                          )}
                        </td>
                        <td className="py-2.5 px-4 font-mono text-slate-500">
                          {rec.exitTime || '—'}
                        </td>
                        <td className="py-2.5 px-4 text-slate-500">
                          {rec.manual ? 'Manual' : 'QR Scan'}
                        </td>
                        <td className="py-2.5 px-4 text-slate-400 italic">
                          {rec.remarks || '—'}
                        </td>
                      </tr>
                    );
                  })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
