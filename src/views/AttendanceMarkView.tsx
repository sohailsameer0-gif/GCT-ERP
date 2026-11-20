import React, { useEffect, useState } from 'react';
import {
  AlertTriangle,
  Calendar,
  Check,
  CheckCircle2,
  Clock,
  Filter,
  Save,
  Users,
  XCircle,
  HelpCircle,
  UserCheck,
} from 'lucide-react';
import { useERP } from '../context/ERPContext';
import { formatDate, todayIso } from '../services/calculations';
import { AttendanceStatus } from '../types/erp';

export const AttendanceMarkView: React.FC = () => {
  const { state, session, markManualAttendance, addToast } = useERP();

  const [selectedCourse, setSelectedCourse] = useState(state.courses[0]?.id || '');
  const [selectedDate, setSelectedDate] = useState(todayIso());
  const [selectedSection, setSelectedSection] = useState<string>(''); // '' means all sections or auto-detected

  const currentCourse = state.courses.find((c) => c.id === selectedCourse);

  // Available sections for this course's program and semester
  const availableSections = state.sections.filter((sec) => {
    if (!currentCourse) return true;
    if (currentCourse.semesterId && sec.semesterId !== currentCourse.semesterId) return false;
    if (currentCourse.programId && sec.programId !== currentCourse.programId) return false;
    return true;
  });

  // Auto-sync selected section when availableSections changes
  useEffect(() => {
    if (availableSections.length > 0 && (!selectedSection || !availableSections.some((s) => s.id === selectedSection))) {
      setSelectedSection(availableSections[0].id);
    }
  }, [selectedCourse, availableSections, selectedSection]);

  // Filter enrolled students
  const enrolledStudents = state.students.filter((stu) => {
    if (stu.status !== 'Active') return false;
    if (currentCourse && currentCourse.semesterId && stu.currentSemesterId !== currentCourse.semesterId) return false;
    if (currentCourse && currentCourse.programId && stu.programId !== currentCourse.programId) return false;
    if (selectedSection && stu.currentSectionId !== selectedSection) return false;
    return true;
  });

  const [studentMarks, setStudentMarks] = useState<Record<string, AttendanceStatus>>({});
  const [remarks, setRemarks] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Pre-fill existing records whenever course, date, or section changes
  useEffect(() => {
    const existingForDate = state.attendanceRecords.filter(
      (r) => r.courseId === selectedCourse && r.date === selectedDate
    );
    const initialMarks: Record<string, AttendanceStatus> = {};
    const initialRemarks: Record<string, string> = {};

    existingForDate.forEach((r) => {
      initialMarks[r.studentId] = r.status;
      if (r.remarks) initialRemarks[r.studentId] = r.remarks;
    });

    setStudentMarks(initialMarks);
    setRemarks(initialRemarks);
  }, [selectedCourse, selectedDate, selectedSection, state.attendanceRecords]);

  const setStatusFor = (studentId: string, status: AttendanceStatus) => {
    setStudentMarks((prev) => ({ ...prev, [studentId]: status }));
  };

  const markAll = (status: AttendanceStatus) => {
    const marks: Record<string, AttendanceStatus> = {};
    enrolledStudents.forEach((stu) => {
      marks[stu.id] = status;
    });
    setStudentMarks(marks);
    addToast(
      `Marked all students as ${
        status === 'present' ? 'Present' : status === 'absent' ? 'Absent' : 'Late'
      }`,
      'info'
    );
  };

  const handleSaveAll = () => {
    if (enrolledStudents.length === 0) {
      addToast('No enrolled students in this section to mark', 'warn');
      return;
    }

    setIsSubmitting(true);
    try {
      enrolledStudents.forEach((stu) => {
        const status = studentMarks[stu.id] || 'present';
        markManualAttendance({
          studentId: stu.id,
          courseId: selectedCourse,
          teacherId: session?.linkedId || session?.userId || '',
          date: selectedDate,
          status,
          lateMinutes: status === 'late' ? 15 : 0,
          remarks: remarks[stu.id] || 'Manual attendance roll-call',
          correct: true,
        });
      });
      addToast(`Attendance saved successfully for ${enrolledStudents.length} students`, 'success');
    } catch (e: any) {
      addToast(e.message || 'Error saving attendance', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Live Metric Counters
  const presentCount = enrolledStudents.filter((s) => (studentMarks[s.id] || 'present') === 'present').length;
  const lateCount = enrolledStudents.filter((s) => studentMarks[s.id] === 'late').length;
  const absentCount = enrolledStudents.filter((s) => studentMarks[s.id] === 'absent').length;
  const leaveCount = enrolledStudents.filter((s) => studentMarks[s.id] === 'approved_leave').length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-800 tracking-tight font-sans">
            Manual Attendance Register
          </h1>
          <p className="text-xs text-slate-500">
            Official classroom roll-call, bulk absence marking, and attendance corrections
          </p>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          <button
            type="button"
            onClick={() => markAll('present')}
            className="px-3.5 py-2 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 font-bold text-xs transition-colors"
          >
            Mark All Present
          </button>
          <button
            type="button"
            onClick={() => markAll('absent')}
            className="px-3.5 py-2 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-800 border border-rose-200 font-bold text-xs transition-colors"
          >
            Mark All Absent
          </button>
          <button
            type="button"
            disabled={isSubmitting}
            onClick={handleSaveAll}
            className="px-4 py-2 rounded-xl bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-700 hover:to-indigo-800 text-white font-bold text-xs shadow-md shadow-indigo-600/20 flex items-center gap-2 transition-all active:scale-95"
          >
            <Save size={15} />
            <span>{isSubmitting ? 'Saving...' : 'Submit Register'}</span>
          </button>
        </div>
      </div>

      {/* SkoolZoom Top Summary Metric Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between text-xs text-slate-500 font-semibold mb-1">
            <span>Present</span>
            <CheckCircle2 size={16} className="text-emerald-600" />
          </div>
          <div className="text-2xl font-black text-emerald-700">{presentCount}</div>
          <div className="text-[11px] text-slate-400 font-medium mt-0.5">Students in class</div>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between text-xs text-slate-500 font-semibold mb-1">
            <span>Late Arrivals</span>
            <Clock size={16} className="text-amber-500" />
          </div>
          <div className="text-2xl font-black text-amber-600">{lateCount}</div>
          <div className="text-[11px] text-slate-400 font-medium mt-0.5">3 Lates = 1 Absence</div>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between text-xs text-slate-500 font-semibold mb-1">
            <span>Absent</span>
            <XCircle size={16} className="text-rose-600" />
          </div>
          <div className="text-2xl font-black text-rose-600">{absentCount}</div>
          <div className="text-[11px] text-slate-400 font-medium mt-0.5">Unexcused missed</div>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between text-xs text-slate-500 font-semibold mb-1">
            <span>Approved Leave</span>
            <UserCheck size={16} className="text-blue-600" />
          </div>
          <div className="text-2xl font-black text-blue-600">{leaveCount}</div>
          <div className="text-[11px] text-slate-400 font-medium mt-0.5">Official duty / medical</div>
        </div>
      </div>

      {/* Active Substituted Class Switcher for Faculty */}
      {state.substitutionRequests
        .filter(
          (r) =>
            r.status === 'accepted' &&
            r.substituteTeacherId === (session?.linkedId || session?.userId)
        )
        .map((subReq) => {
          const subCourse = state.courses.find((c) => c.id === subReq.courseId);
          const origTeacher = state.teachers.find((t) => t.id === subReq.originalTeacherId);
          if (!subCourse) return null;

          return (
            <div
              key={`sub_bar_${subReq.id}`}
              className="bg-amber-50 border border-amber-200 rounded-2xl p-3.5 flex flex-wrap items-center justify-between gap-3 text-xs"
            >
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded bg-amber-200 text-amber-900 font-black text-[10px] uppercase">
                  Substituted Class
                </span>
                <span className="font-bold text-slate-800">
                  {subCourse.code} — {subCourse.name}
                </span>
                <span className="text-slate-500">
                  (Covering for Engr. {origTeacher?.name || 'Colleague'} on {formatDate(subReq.date)})
                </span>
              </div>
              <button
                type="button"
                onClick={() => {
                  setSelectedCourse(subCourse.id);
                  setSelectedDate(subReq.date);
                  addToast(`Loaded substituted class for ${subCourse.code}`, 'info');
                }}
                className="px-3 py-1.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs transition-colors"
              >
                Mark Attendance for This Class
              </button>
            </div>
          );
        })}

      {/* Selector Options Bar */}
      <div className="bg-white p-5 rounded-2xl shadow-xs border border-slate-200/80 grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
        <div>
          <label className="block font-bold text-slate-700 mb-1">Subject / Course *</label>
          <select
            value={selectedCourse}
            onChange={(e) => setSelectedCourse(e.target.value)}
            className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 font-bold text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            {state.courses.map((c) => (
              <option key={c.id} value={c.id}>
                {c.code} — {c.name} ({c.type})
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block font-bold text-slate-700 mb-1">Attendance Date *</label>
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 font-bold text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 font-mono"
          />
        </div>

        <div>
          <label className="block font-bold text-slate-700 mb-1">Class Section *</label>
          <select
            value={selectedSection}
            onChange={(e) => setSelectedSection(e.target.value)}
            className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 font-bold text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            {availableSections.length > 0 ? (
              availableSections.map((sec) => (
                <option key={sec.id} value={sec.id}>
                  Section {sec.name}
                </option>
              ))
            ) : (
              state.sections.map((sec) => (
                <option key={sec.id} value={sec.id}>
                  Section {sec.name}
                </option>
              ))
            )}
          </select>
        </div>
      </div>

      {/* Student Marking Table */}
      <div className="bg-white rounded-2xl shadow-xs border border-slate-200/80 overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <h2 className="text-sm font-bold text-slate-800">
              Enrolled Students ({enrolledStudents.length})
            </h2>
            <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 text-2xs font-extrabold uppercase">
              {currentCourse?.code} · Section {availableSections.find((s) => s.id === selectedSection)?.name || 'A'}
            </span>
          </div>
          <span className="text-xs text-slate-500 font-medium">
            Date: <strong>{formatDate(selectedDate)}</strong>
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-200/80 text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                <th className="py-3 px-4">Roll #</th>
                <th className="py-3 px-4">Student Name</th>
                <th className="py-3 px-4 text-center">Present (P)</th>
                <th className="py-3 px-4 text-center">Late (L)</th>
                <th className="py-3 px-4 text-center">Absent (A)</th>
                <th className="py-3 px-4 text-center">Leave (Lv)</th>
                <th className="py-3 px-4">Remarks / Observation</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {enrolledStudents.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    No active students enrolled in this course semester/section.
                  </td>
                </tr>
              ) : (
                enrolledStudents.map((stu) => {
                  const currentStatus = studentMarks[stu.id] || 'present';

                  return (
                    <tr key={stu.id} className="hover:bg-indigo-50/20 transition-colors">
                      <td className="py-3 px-4 font-mono font-bold text-slate-700">
                        {stu.admissionNumber}
                      </td>
                      <td className="py-3 px-4">
                        <div className="font-bold text-slate-900">{stu.name}</div>
                        <div className="text-[10px] text-slate-400">Roll: {stu.classNumber}</div>
                      </td>
                      <td className="py-3 px-4 text-center">
                        <button
                          type="button"
                          onClick={() => setStatusFor(stu.id, 'present')}
                          className={`w-9 h-9 rounded-xl font-black text-xs transition-all ${
                            currentStatus === 'present'
                              ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/30 ring-2 ring-emerald-600/40'
                              : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
                          }`}
                        >
                          P
                        </button>
                      </td>
                      <td className="py-3 px-4 text-center">
                        <button
                          type="button"
                          onClick={() => setStatusFor(stu.id, 'late')}
                          className={`w-9 h-9 rounded-xl font-black text-xs transition-all ${
                            currentStatus === 'late'
                              ? 'bg-amber-500 text-white shadow-md shadow-amber-500/30 ring-2 ring-amber-500/40'
                              : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
                          }`}
                        >
                          L
                        </button>
                      </td>
                      <td className="py-3 px-4 text-center">
                        <button
                          type="button"
                          onClick={() => setStatusFor(stu.id, 'absent')}
                          className={`w-9 h-9 rounded-xl font-black text-xs transition-all ${
                            currentStatus === 'absent'
                              ? 'bg-rose-600 text-white shadow-md shadow-rose-600/30 ring-2 ring-rose-600/40'
                              : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
                          }`}
                        >
                          A
                        </button>
                      </td>
                      <td className="py-3 px-4 text-center">
                        <button
                          type="button"
                          onClick={() => setStatusFor(stu.id, 'approved_leave')}
                          className={`w-9 h-9 rounded-xl font-black text-xs transition-all ${
                            currentStatus === 'approved_leave'
                              ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30 ring-2 ring-blue-600/40'
                              : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
                          }`}
                        >
                          Lv
                        </button>
                      </td>
                      <td className="py-3 px-4">
                        <input
                          type="text"
                          placeholder="Optional remarks..."
                          value={remarks[stu.id] || ''}
                          onChange={(e) => setRemarks({ ...remarks, [stu.id]: e.target.value })}
                          className="w-full px-3 py-1.5 rounded-xl bg-slate-50 border border-slate-200 focus:bg-white text-xs font-medium"
                        />
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
