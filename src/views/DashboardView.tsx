import React, { useState } from 'react';
import {
  AlertTriangle,
  AlertCircle,
  ArrowRight,
  Ban,
  BookOpen,
  Calendar,
  CheckCircle2,
  Clock,
  DoorOpen,
  FileSpreadsheet,
  GraduationCap,
  Mail,
  Play,
  QrCode,
  Repeat,
  Shield,
  ShieldAlert,
  Sparkles,
  TrendingUp,
  UserCheck,
  Users,
  X,
} from 'lucide-react';
import { useERP } from '../context/ERPContext';
import {
  calculateAttendanceSummary,
  formatDate,
  formatDateTime,
  getDayOfWeek,
  timeToMinutes,
  todayIso,
} from '../services/calculations';

interface DashboardViewProps {
  onNavigate: (route: string) => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({ onNavigate }) => {
  const { session, state, getScope, requestAdmissionCancellation } = useERP();
  const [isStudentCancelModalOpen, setIsStudentCancelModalOpen] = useState(false);
  const [studentCancelReason, setStudentCancelReason] = useState('');

  if (!session) return null;

  const today = todayIso();
  const todayDayName = getDayOfWeek(new Date());
  const shortageThreshold = state.settings.shortageThreshold || 70;

  // -------------------------------------------------------------
  // 1. STUDENT DASHBOARD
  // -------------------------------------------------------------
  if (session.role === 'student') {
    const student = state.students.find(
      (s) => s.id === session.linkedId || s.email.toLowerCase() === session.email.toLowerCase()
    );

    const program = student ? state.programs.find((p) => p.id === student.programId) : null;
    const dept = student ? state.departments.find((d) => d.id === student.departmentId) : null;
    const semester = student ? state.semesters.find((s) => s.id === student.currentSemesterId) : null;
    const section = student ? state.sections.find((s) => s.id === student.currentSectionId) : null;

    const studentSummary = student ? calculateAttendanceSummary(student.id, state) : null;

    // Student's enrolled courses in their current semester
    const myCourses = state.courses.filter(
      (c) =>
        c.programId === student?.programId &&
        (!student?.departmentId || !c.departmentId || c.departmentId === student.departmentId) &&
        (!c.semesterId || c.semesterId === student?.currentSemesterId)
    );

    // Timetable for student
    const studentTimetableToday = state.timetable
      .filter(
        (t) =>
          t.day === todayDayName &&
          t.status === 'Active' &&
          (t.sectionId === student?.currentSectionId || !t.sectionId || t.programId === student?.programId)
      )
      .sort((a, b) => timeToMinutes(a.startTime) - timeToMinutes(b.startTime));

    // Fallback timetable if today has no classes (show weekly schedule preview)
    const studentTimetableWeekly = state.timetable
      .filter(
        (t) =>
          t.status === 'Active' &&
          (t.sectionId === student?.currentSectionId || !t.sectionId || t.programId === student?.programId)
      )
      .sort((a, b) => a.day.localeCompare(b.day));

    // Check if any QR attendance session is currently open for this student
    const activeLiveSession = state.attendanceSessions.find(
      (s) =>
        s.status === 'open' &&
        s.date === today &&
        (s.sectionId === student?.currentSectionId || !s.sectionId)
    );

    // Student's leave applications
    const myLeaves = state.leaveApplications.filter((l) => l.studentId === student?.id);
    const pendingMyLeaves = myLeaves.filter(
      (l) => l.status === 'with_teacher' || l.status === 'with_chairman'
    );

    // Student's recent attendance records
    const myRecentRecords = state.attendanceRecords
      .filter((r) => r.studentId === student?.id)
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, 5);

    // Coursework / Assignments for student's program
    const myAssignments = state.assignments.filter(
      (a) => a.programId === student?.programId || myCourses.some((c) => c.id === a.courseId)
    );

    const isShortage = studentSummary?.isShortage ?? false;
    const adjustedPct = studentSummary?.adjustedPercentage ?? 100;

    return (
      <div className="space-y-6">
        {/* Student Header Banner */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 p-6 rounded-2xl text-white shadow-xl border border-indigo-900/40">
          <div>
            <div className="flex items-center gap-2 text-amber-400 text-xs font-bold uppercase tracking-wider mb-1">
              <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
              STUDENT ACADEMIC PORTAL · {state.settings.currentTerm} {state.settings.currentYear}
            </div>
            <h1 className="text-xl lg:text-2xl font-black font-sans tracking-tight">
              Welcome back, {student?.name || session.displayName}
            </h1>
            <p className="text-xs text-indigo-200/80 mt-1 max-w-xl">
              {program?.name || 'B.Tech / DAE'} ({dept?.name || 'Engineering'}) · Reg: {student?.registrationNumber || 'Pending'} · Roll: {student?.classNumber || 'Pending'} · {section ? `Section ${section.name}` : ''}
            </p>
            <div className="mt-2">
              <span
                className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase inline-flex items-center gap-1 ${
                  student?.status === 'Active'
                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                    : student?.status === 'StruckOff'
                    ? 'bg-rose-500/30 text-rose-300 border border-rose-500/50 animate-pulse'
                    : 'bg-amber-500/30 text-amber-300 border border-amber-500/50'
                }`}
              >
                Standing: {student?.status || 'Active'}
              </span>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <button
              onClick={() => onNavigate('#/app/scan-qr')}
              className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-slate-950 font-bold text-xs shadow-lg shadow-amber-500/20 transition-all flex items-center gap-2"
            >
              <QrCode size={16} />
              <span>Scan QR Attendance</span>
            </button>
            <button
              onClick={() => onNavigate('#/app/attendance')}
              className="px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white font-semibold text-xs transition-colors backdrop-blur-xs flex items-center gap-2"
            >
              <CheckCircle2 size={16} />
              <span>Attendance Log</span>
            </button>
            {student?.status === 'Active' && (
              <button
                type="button"
                onClick={() => setIsStudentCancelModalOpen(true)}
                className="px-3 py-2.5 rounded-xl bg-rose-500/20 hover:bg-rose-500/30 text-rose-200 hover:text-white font-semibold text-xs border border-rose-500/30 transition-colors flex items-center gap-1.5"
                title="Submit formal admission cancellation request"
              >
                <Ban size={14} />
                <span>Cancel Admission</span>
              </button>
            )}
          </div>
        </div>

        {/* 1. STRUCK OFF CRITICAL ALERT */}
        {student?.status === 'StruckOff' && (
          <div className="p-5 rounded-2xl bg-rose-600 text-white shadow-xl flex items-start gap-4 border-2 border-rose-300 animate-pulse">
            <AlertTriangle className="shrink-0 mt-0.5 text-white" size={28} />
            <div className="flex-1 text-xs">
              <div className="font-black text-base uppercase tracking-wide">CRITICAL: YOU ARE STRUCK OFF FROM COLLEGE ROLLS</div>
              <p className="mt-1 text-rose-100 text-xs leading-relaxed">
                Your admission has been struck off by the College Directorate due to excessive attendance shortage (&lt;70%) or academic irregularity. You are debarred from all academic sessions, QR attendance terminals, and examination registration. To appeal for restoration, please report immediately to the Chairman Directorate along with your parent/guardian.
              </p>
            </div>
          </div>
        )}

        {/* 2. ADMISSION CANCELLED NOTICE */}
        {student?.status === 'Cancelled' && (
          <div className="p-5 rounded-2xl bg-slate-900 text-white shadow-xl flex items-start gap-4 border-2 border-slate-700">
            <AlertCircle className="shrink-0 mt-0.5 text-amber-400" size={28} />
            <div className="flex-1 text-xs">
              <div className="font-black text-base text-amber-400 uppercase tracking-wide">ADMISSION CANCELLED</div>
              <p className="mt-1 text-slate-300 text-xs leading-relaxed">
                Your admission at Government College of Technology Peshawar has been officially cancelled. For clearance certificates or transcripts, contact the Academic Administration Directorate.
              </p>
            </div>
          </div>
        )}

        {/* 3. ACTIVE FORMAL WARNINGS ISSUED BY DIRECTORATE */}
        {state.warnings.filter((w) => w.studentId === student?.id).length > 0 && (
          <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-xs text-amber-950 space-y-2">
            <div className="flex items-center justify-between">
              <div className="font-bold flex items-center gap-2 text-amber-900">
                <AlertTriangle size={16} className="text-amber-600" />
                <span>Active Formal Warnings Issued by Directorate ({state.warnings.filter((w) => w.studentId === student?.id).length})</span>
              </div>
              <button
                type="button"
                onClick={() => onNavigate('#/app/my-warnings')}
                className="text-amber-800 font-bold underline text-[11px]"
              >
                View Warning Notices
              </button>
            </div>
            {state.warnings
              .filter((w) => w.studentId === student?.id)
              .map((w) => (
                <div key={w.id} className="p-2.5 rounded-xl bg-white border border-amber-200 flex items-center justify-between">
                  <div>
                    <span className="font-black text-rose-700">{w.severity}:</span>{' '}
                    <span className="text-slate-700 font-medium">{w.reason}</span>
                  </div>
                  <span className="text-[10px] text-slate-400 font-mono">{formatDate(w.issuedAt)}</span>
                </div>
              ))}
          </div>
        )}

        {/* Shortage Warning Notice if applicable */}
        {isShortage && student?.status === 'Active' && (
          <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 flex items-start gap-3">
            <AlertTriangle className="text-rose-600 shrink-0 mt-0.5" size={20} />
            <div className="flex-1 text-xs text-rose-900">
              <div className="font-bold text-sm">Attendance Shortage Alert ({adjustedPct.toFixed(1)}%)</div>
              <p className="mt-0.5 text-rose-800">
                Your cumulative adjusted attendance is below the mandatory <strong>{shortageThreshold}%</strong> threshold required by KP-BTE / UET for final exam clearance. Please consult your Academic Coordinator or Chairman immediately.
              </p>
            </div>
          </div>
        )}

        {/* Student SkoolZoom KPI Metric Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          {/* Card 1: Attendance Standing */}
          <div
            onClick={() => onNavigate('#/app/attendance')}
            className={`rounded-2xl p-5 text-white shadow-lg flex flex-col justify-between min-h-[130px] relative overflow-hidden group hover:-translate-y-1 transition-all cursor-pointer ${
              isShortage
                ? 'bg-gradient-to-br from-rose-600 to-rose-800 shadow-rose-500/10'
                : 'bg-gradient-to-br from-[#4361ee] to-[#3a0ca3] shadow-indigo-500/10'
            }`}
          >
            <div className="flex items-start justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-white/80">
                My Attendance
              </span>
              <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center shrink-0">
                <CheckCircle2 size={20} />
              </div>
            </div>
            <div>
              <div className="text-3xl font-black font-sans leading-none">{adjustedPct.toFixed(1)}%</div>
              <div className="text-[11px] font-medium text-white/80 mt-1 flex items-center gap-1">
                {isShortage ? 'Below Safe Threshold' : 'Eligible for Exams (Good)'}
              </div>
            </div>
          </div>

          {/* Card 2: Lectures Attended */}
          <div className="rounded-2xl p-5 bg-gradient-to-br from-[#10b981] to-[#047857] text-white shadow-lg shadow-emerald-500/10 flex flex-col justify-between min-h-[130px] relative overflow-hidden group hover:-translate-y-1 transition-all">
            <div className="flex items-start justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-white/80">
                Classes Attended
              </span>
              <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center shrink-0">
                <TrendingUp size={20} />
              </div>
            </div>
            <div>
              <div className="text-3xl font-black font-sans leading-none">
                {studentSummary?.present ?? 0}
                <span className="text-sm font-semibold text-white/70"> / {studentSummary?.total ?? 0}</span>
              </div>
              <div className="text-[11px] font-medium text-white/80 mt-1">
                {studentSummary?.late ?? 0} Late (3 Late = 1 Abs)
              </div>
            </div>
          </div>

          {/* Card 3: Today's Classes */}
          <div
            onClick={() => onNavigate('#/app/timetable')}
            className="rounded-2xl p-5 bg-gradient-to-br from-[#06b6d4] to-[#0e7490] text-white shadow-lg shadow-cyan-500/10 flex flex-col justify-between min-h-[130px] relative overflow-hidden group hover:-translate-y-1 transition-all cursor-pointer"
          >
            <div className="flex items-start justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-white/80">
                Today's Schedule
              </span>
              <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center shrink-0">
                <Clock size={20} />
              </div>
            </div>
            <div>
              <div className="text-3xl font-black font-sans leading-none">
                {studentTimetableToday.length}
              </div>
              <div className="text-[11px] font-medium text-white/80 mt-1">
                {activeLiveSession ? 'QR active now!' : `${todayDayName} lectures`}
              </div>
            </div>
          </div>

          {/* Card 4: Assignments */}
          <div
            onClick={() => onNavigate('#/app/assignments')}
            className="rounded-2xl p-5 bg-gradient-to-br from-[#8b5cf6] to-[#6d28d9] text-white shadow-lg shadow-purple-500/10 flex flex-col justify-between min-h-[130px] relative overflow-hidden group hover:-translate-y-1 transition-all cursor-pointer"
          >
            <div className="flex items-start justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-white/80">
                Coursework
              </span>
              <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center shrink-0">
                <BookOpen size={20} />
              </div>
            </div>
            <div>
              <div className="text-3xl font-black font-sans leading-none">
                {myAssignments.length}
              </div>
              <div className="text-[11px] font-medium text-white/80 mt-1">
                Semester assignments
              </div>
            </div>
          </div>

          {/* Card 5: Leave Requests */}
          <div
            onClick={() => onNavigate('#/app/leaves')}
            className="rounded-2xl p-5 bg-gradient-to-br from-[#f59e0b] to-[#b45309] text-white shadow-lg shadow-amber-500/10 flex flex-col justify-between min-h-[130px] relative overflow-hidden group hover:-translate-y-1 transition-all cursor-pointer"
          >
            <div className="flex items-start justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-white/80">
                My Leaves
              </span>
              <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center shrink-0">
                <Mail size={20} />
              </div>
            </div>
            <div>
              <div className="text-3xl font-black font-sans leading-none">
                {pendingMyLeaves.length}
              </div>
              <div className="text-[11px] font-medium text-white/80 mt-1">
                {pendingMyLeaves.length > 0 ? 'Pending decision' : 'All leaves updated'}
              </div>
            </div>
          </div>
        </div>

        {/* Student 2-Column Panels */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column (2 Cols): Enrolled Courses Attendance & Class Schedule */}
          <div className="lg:col-span-2 space-y-6">
            {/* My Course Attendance Standing */}
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200/80">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="text-base font-bold text-slate-800">My Subject Attendance Standing</h2>
                  <p className="text-xs text-slate-500">
                    Real-time compliance breakdown for {semester?.name || 'Current Semester'}
                  </p>
                </div>
                <button
                  onClick={() => onNavigate('#/app/attendance')}
                  className="text-xs font-bold text-indigo-600 hover:text-indigo-800 flex items-center gap-1"
                >
                  Full Log <ArrowRight size={14} />
                </button>
              </div>

              <div className="space-y-3.5">
                {myCourses.length === 0 ? (
                  <div className="py-8 text-center text-slate-400 text-xs">
                    No active course enrollments mapped to this semester.
                  </div>
                ) : (
                  myCourses.map((crs) => {
                    // Calculate records for this specific student in this specific course
                    const courseRecords = state.attendanceRecords.filter(
                      (r) => r.studentId === student?.id && r.courseId === crs.id
                    );
                    const totalHeld = courseRecords.length;
                    const presents = courseRecords.filter((r) => r.status === 'present').length;
                    const lates = courseRecords.filter((r) => r.status === 'late').length;
                    const excused = courseRecords.filter((r) => r.status === 'approved_leave').length;
                    const effectiveLates = Math.floor(lates / 3);
                    const effectivePresents = presents + excused - effectiveLates;
                    const pct = totalHeld > 0 ? Math.max(0, Math.min(100, (effectivePresents / totalHeld) * 100)) : 100;
                    const isCourseShort = totalHeld > 0 && pct < shortageThreshold;

                    return (
                      <div
                        key={crs.id}
                        className="p-4 rounded-xl bg-slate-50/80 border border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-slate-50 transition-colors"
                      >
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="px-2 py-0.5 rounded-md bg-indigo-100 text-indigo-800 text-[10px] font-extrabold uppercase">
                              {crs.code}
                            </span>
                            <span className="text-xs font-bold text-slate-800 truncate">
                              {crs.name}
                            </span>
                          </div>
                          <div className="text-[11px] text-slate-500 flex items-center gap-3">
                            <span>{crs.creditHours} Credit Hours ({crs.type})</span>
                            <span>·</span>
                            <span>{totalHeld > 0 ? `${presents} Present, ${lates} Late` : 'Classes starting soon'}</span>
                          </div>
                        </div>

                        <div className="w-full sm:w-48 shrink-0">
                          <div className="flex items-center justify-between mb-1 text-xs">
                            <span className={`font-bold ${isCourseShort ? 'text-rose-600' : 'text-slate-700'}`}>
                              {pct.toFixed(1)}%
                            </span>
                            <span className={`text-[10px] font-extrabold uppercase px-1.5 py-0.5 rounded ${
                              isCourseShort ? 'bg-rose-100 text-rose-700' : 'bg-emerald-100 text-emerald-700'
                            }`}>
                              {isCourseShort ? 'Shortage' : 'Safe'}
                            </span>
                          </div>
                          <div className="w-full h-2 rounded-full bg-slate-200 overflow-hidden">
                            <div
                              className={`h-full rounded-full transition-all duration-500 ${
                                isCourseShort ? 'bg-rose-500' : pct < 80 ? 'bg-amber-500' : 'bg-emerald-500'
                              }`}
                              style={{ width: `${Math.min(100, pct)}%` }}
                            />
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            {/* Today's Lectures & Live QR Radar */}
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200/80">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="text-base font-bold text-slate-800">
                    My Schedule for Today ({todayDayName})
                  </h2>
                  <p className="text-xs text-slate-500">Live classroom timetable and attendance gateway</p>
                </div>
                <button
                  onClick={() => onNavigate('#/app/timetable')}
                  className="text-xs font-bold text-indigo-600 hover:text-indigo-800 flex items-center gap-1"
                >
                  Full Weekly Timetable <ArrowRight size={14} />
                </button>
              </div>

              <div className="divide-y divide-slate-100">
                {studentTimetableToday.length === 0 ? (
                  <div className="py-8 text-center text-slate-400 text-xs">
                    No classes scheduled for {todayDayName}.
                  </div>
                ) : (
                  studentTimetableToday.map((slot) => {
                    const course = state.courses.find((c) => c.id === slot.courseId);
                    const teacher = state.teachers.find((t) => t.id === slot.teacherId);
                    const isLive = state.attendanceSessions.some(
                      (s) => s.status === 'open' && s.date === today && s.timetableId === slot.id
                    );

                    return (
                      <div key={slot.id} className="py-3.5 flex items-center justify-between gap-4">
                        <div className="flex items-center gap-3">
                          <div className="px-2.5 py-1.5 rounded-lg bg-slate-100 text-slate-700 font-mono text-xs font-bold shrink-0">
                            {slot.startTime}–{slot.endTime}
                          </div>
                          <div>
                            <div className="text-xs font-bold text-slate-800">
                              {course ? `${course.code} — ${course.name}` : 'Course Slot'}
                            </div>
                            <div className="text-[11px] text-slate-500">
                              {teacher?.name} · {slot.className || 'Lecture Room'}
                            </div>
                          </div>
                        </div>

                        <div>
                          {isLive ? (
                            <button
                              onClick={() => onNavigate('#/app/scan-qr')}
                              className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white font-extrabold text-[11px] shadow-md shadow-emerald-500/20 flex items-center gap-1.5 animate-pulse"
                            >
                              <QrCode size={14} />
                              <span>Scan QR Now</span>
                            </button>
                          ) : (
                            <span className="px-2.5 py-1 rounded-full bg-slate-100 text-slate-600 text-[10px] font-semibold">
                              Scheduled
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </div>

          {/* Right Column (1 Col): Student Tools & Regulations */}
          <div className="space-y-6">
            {/* Student Quick Actions (NO admin buttons!) */}
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200/80">
              <h2 className="text-base font-bold text-slate-800 mb-1">Student Shortcuts</h2>
              <p className="text-xs text-slate-500 mb-4">Quick academic tools and access points</p>

              <div className="grid grid-cols-2 gap-2.5">
                <button
                  onClick={() => onNavigate('#/app/scan-qr')}
                  className="p-3.5 rounded-xl bg-gradient-to-br from-amber-50 to-amber-100/50 hover:bg-amber-100 border border-amber-200/60 text-left transition-colors group"
                >
                  <QrCode size={20} className="text-amber-700 mb-2 group-hover:scale-110 transition-transform" />
                  <div className="text-xs font-bold text-slate-900">Scan QR</div>
                  <div className="text-[10px] text-amber-800 font-medium">Punch attendance</div>
                </button>

                <button
                  onClick={() => onNavigate('#/app/timetable')}
                  className="p-3.5 rounded-xl bg-gradient-to-br from-indigo-50 to-indigo-100/50 hover:bg-indigo-100 border border-indigo-200/60 text-left transition-colors group"
                >
                  <Calendar size={20} className="text-indigo-700 mb-2 group-hover:scale-110 transition-transform" />
                  <div className="text-xs font-bold text-slate-900">Timetable</div>
                  <div className="text-[10px] text-indigo-800 font-medium">Weekly schedule</div>
                </button>

                <button
                  onClick={() => onNavigate('#/app/leaves')}
                  className="p-3.5 rounded-xl bg-gradient-to-br from-purple-50 to-purple-100/50 hover:bg-purple-100 border border-purple-200/60 text-left transition-colors group"
                >
                  <Mail size={20} className="text-purple-700 mb-2 group-hover:scale-110 transition-transform" />
                  <div className="text-xs font-bold text-slate-900">Apply Leave</div>
                  <div className="text-[10px] text-purple-800 font-medium">Medical / General</div>
                </button>

                <button
                  onClick={() => onNavigate('#/app/shared-files')}
                  className="p-3.5 rounded-xl bg-gradient-to-br from-cyan-50 to-cyan-100/50 hover:bg-cyan-100 border border-cyan-200/60 text-left transition-colors group"
                >
                  <BookOpen size={20} className="text-cyan-700 mb-2 group-hover:scale-110 transition-transform" />
                  <div className="text-xs font-bold text-slate-900">Downloads</div>
                  <div className="text-[10px] text-cyan-800 font-medium">Notes & Syllabi</div>
                </button>
              </div>
            </div>

            {/* Academic Board Exam Eligibility Widget */}
            <div className="bg-gradient-to-br from-slate-900 to-indigo-950 rounded-2xl p-5 text-white shadow-md border border-indigo-900/40">
              <div className="flex items-center gap-2 mb-2 text-amber-400 font-bold text-xs">
                <Shield size={16} />
                <span>KP-BTE Examination Standing</span>
              </div>
              <div className="text-2xl font-black mb-1">
                {adjustedPct.toFixed(1)}% <span className="text-xs font-semibold text-slate-400">/ 70.0% Required</span>
              </div>
              <p className="text-[11px] text-slate-300 leading-relaxed mb-3">
                Students must maintain a minimum of 70% cumulative attendance to be permitted for final term examinations. Under college regulations, every 3 late punch-ins count as 1 absence.
              </p>
              <div className="p-2.5 rounded-xl bg-white/10 text-[11px] font-semibold flex items-center justify-between">
                <span>Current Status:</span>
                <span className={isShortage ? 'text-rose-400 font-bold' : 'text-emerald-400 font-bold'}>
                  {isShortage ? 'Debarred / Shortage Risk' : 'Eligible for Exams'}
                </span>
              </div>
            </div>

            {/* Recent Attendance Punch-ins */}
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200/80">
              <h2 className="text-base font-bold text-slate-800 mb-1">Recent Attendance</h2>
              <p className="text-xs text-slate-500 mb-3">Your latest punch-in records</p>

              <div className="space-y-2.5">
                {myRecentRecords.length === 0 ? (
                  <div className="py-4 text-center text-slate-400 text-xs">
                    No punch-in history recorded yet.
                  </div>
                ) : (
                  myRecentRecords.map((rec) => {
                    const crs = state.courses.find((c) => c.id === rec.courseId);
                    return (
                      <div
                        key={rec.id}
                        className="p-2.5 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-between text-xs"
                      >
                        <div>
                          <div className="font-bold text-slate-800">{crs?.code || 'Lecture'}</div>
                          <div className="text-[10px] text-slate-400">{formatDate(rec.date)} · {rec.arrivalTime || '--:--'}</div>
                        </div>
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase ${
                            rec.status === 'present'
                              ? 'bg-emerald-100 text-emerald-800'
                              : rec.status === 'late'
                              ? 'bg-amber-100 text-amber-800'
                              : 'bg-rose-100 text-rose-800'
                          }`}
                        >
                          {rec.status}
                        </span>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Student Admission Cancellation Modal */}
        {isStudentCancelModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-in fade-in duration-200">
            <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2 text-rose-700 font-bold text-sm">
                  <Ban size={18} />
                  <span>Request Admission Cancellation</span>
                </div>
                <button
                  type="button"
                  onClick={() => setIsStudentCancelModalOpen(false)}
                  className="p-1 rounded-lg text-slate-400 hover:text-slate-700"
                >
                  <X size={18} />
                </button>
              </div>

              <div className="p-3.5 rounded-2xl bg-amber-50 border border-amber-200 text-xs text-amber-900 space-y-1">
                <div className="font-bold">Important Notice:</div>
                <p>
                  Submitting this request will formally notify the Chairman Directorate and your parent/guardian. A clearance order will be initiated.
                </p>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Reason for Cancellation:
                </label>
                <textarea
                  rows={3}
                  required
                  value={studentCancelReason}
                  onChange={(e) => setStudentCancelReason(e.target.value)}
                  placeholder="e.g. Migration to another institution, personal reasons..."
                  className="w-full p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs focus:bg-white focus:outline-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsStudentCancelModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs"
                >
                  Close
                </button>
                <button
                  type="button"
                  disabled={!studentCancelReason.trim()}
                  onClick={() => {
                    if (student) {
                      requestAdmissionCancellation(student.id, studentCancelReason);
                      setIsStudentCancelModalOpen(false);
                      setStudentCancelReason('');
                    }
                  }}
                  className="px-5 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs shadow-md shadow-rose-600/20 disabled:opacity-50"
                >
                  Submit Request to Chairman
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  // -------------------------------------------------------------
  // 2. PARENT DASHBOARD
  // -------------------------------------------------------------
  if (session.role === 'parent') {
    const parentLink = state.parentLinks.find(
      (l) => l.parentId === session.linkedId && l.verified
    );
    const ward = parentLink
      ? state.students.find((s) => s.id === parentLink.studentId)
      : state.students[0];

    const wardSummary = ward ? calculateAttendanceSummary(ward.id, state) : null;
    const wardProgram = ward ? state.programs.find((p) => p.id === ward.programId) : null;
    const wardDept = ward ? state.departments.find((d) => d.id === ward.departmentId) : null;
    const wardSection = ward ? state.sections.find((s) => s.id === ward.currentSectionId) : null;

    const wardRecords = ward
      ? state.attendanceRecords
          .filter((r) => r.studentId === ward.id)
          .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
          .slice(0, 5)
      : [];

    return (
      <div className="space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-gradient-to-r from-slate-900 via-emerald-950 to-slate-900 p-6 rounded-2xl text-white shadow-xl border border-emerald-900/40">
          <div>
            <div className="flex items-center gap-2 text-emerald-400 text-xs font-bold uppercase tracking-wider mb-1">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              PARENT & GUARDIAN MONITORING PORTAL · GCT PESHAWAR
            </div>
            <h1 className="text-xl lg:text-2xl font-black font-sans tracking-tight">
              Welcome, {session.displayName}
            </h1>
            <p className="text-xs text-emerald-200/80 mt-1 max-w-xl">
              Monitoring Student: <strong className="text-white">{ward?.name}</strong> (Reg: {ward?.registrationNumber}) · {wardProgram?.code} {wardDept?.name} {wardSection ? `· Section ${wardSection.name}` : ''}
            </p>
          </div>

          <button
            onClick={() => onNavigate('#/app/attendance')}
            className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white font-semibold text-xs transition-colors backdrop-blur-xs flex items-center gap-2 self-start md:self-auto"
          >
            <CheckCircle2 size={16} />
            <span>Ward Attendance Record</span>
          </button>
        </div>

        {/* URGENT NOTICE IF WARD IS STRUCK OFF */}
        {ward?.status === 'StruckOff' && (
          <div className="p-5 rounded-2xl bg-rose-600 text-white shadow-xl flex items-start gap-4 border-2 border-rose-300 animate-pulse">
            <AlertTriangle className="shrink-0 mt-0.5 text-white" size={28} />
            <div className="flex-1 text-xs">
              <div className="font-black text-base uppercase tracking-wide">
                URGENT NOTICE TO PARENT: WARD IS STRUCK OFF FROM COLLEGE ROLLS
              </div>
              <p className="mt-1 text-rose-100 text-xs leading-relaxed">
                Your child <strong>{ward?.name}</strong> (Admission: {ward?.admissionNumber}) has been officially STRUCK OFF from college rolls due to continuous attendance shortage below 70% or non-compliance. The student is prohibited from entering classrooms or exams. Please visit the Chairman Directorate immediately for hearing and restoration proceedings.
              </p>
            </div>
          </div>
        )}

        {/* DIRECTORATE WARNINGS ISSUED TO WARD */}
        {ward && state.warnings.filter((w) => w.studentId === ward.id).length > 0 && (
          <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-xs text-amber-950 space-y-2">
            <div className="flex items-center justify-between">
              <div className="font-bold flex items-center gap-2 text-amber-900">
                <AlertTriangle size={16} className="text-amber-600" />
                <span>Directorate Warning Letters Issued to Your Ward ({state.warnings.filter((w) => w.studentId === ward.id).length})</span>
              </div>
            </div>
            {state.warnings
              .filter((w) => w.studentId === ward.id)
              .map((w) => (
                <div key={w.id} className="p-2.5 rounded-xl bg-white border border-amber-200 flex items-center justify-between">
                  <div>
                    <span className="font-black text-rose-700">{w.severity}:</span>{' '}
                    <span className="text-slate-700 font-medium">{w.reason}</span>
                  </div>
                  <span className="text-[10px] text-slate-400 font-mono">{formatDate(w.issuedAt)}</span>
                </div>
              ))}
          </div>
        )}

        {/* Parent KPI Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="rounded-2xl p-5 bg-gradient-to-br from-[#4361ee] to-[#3a0ca3] text-white shadow-lg shadow-indigo-500/10">
            <span className="text-xs font-semibold uppercase tracking-wider text-white/80">Ward Attendance</span>
            <div className="text-3xl font-black mt-2">{wardSummary ? wardSummary.adjustedPercentage.toFixed(1) : 100}%</div>
            <div className="text-[11px] font-medium text-white/80 mt-1">
              {wardSummary?.isShortage ? 'Shortage Alert (<70%)' : 'Good Standing (Eligible)'}
            </div>
          </div>

          <div className="rounded-2xl p-5 bg-gradient-to-br from-[#10b981] to-[#047857] text-white shadow-lg shadow-emerald-500/10">
            <span className="text-xs font-semibold uppercase tracking-wider text-white/80">Lectures Attended</span>
            <div className="text-3xl font-black mt-2">{wardSummary?.present ?? 0} / {wardSummary?.total ?? 0}</div>
            <div className="text-[11px] font-medium text-white/80 mt-1">Conducted to date</div>
          </div>

          <div className="rounded-2xl p-5 bg-gradient-to-br from-[#f59e0b] to-[#b45309] text-white shadow-lg shadow-amber-500/10">
            <span className="text-xs font-semibold uppercase tracking-wider text-white/80">Late Arrivals</span>
            <div className="text-3xl font-black mt-2">{wardSummary?.late ?? 0}</div>
            <div className="text-[11px] font-medium text-white/80 mt-1">3 Lates = 1 Absence</div>
          </div>

          <div className="rounded-2xl p-5 bg-gradient-to-br from-[#8b5cf6] to-[#6d28d9] text-white shadow-lg shadow-purple-500/10">
            <span className="text-xs font-semibold uppercase tracking-wider text-white/80">Absences</span>
            <div className="text-3xl font-black mt-2">{wardSummary?.absent ?? 0}</div>
            <div className="text-[11px] font-medium text-white/80 mt-1">Unexcused missed classes</div>
          </div>
        </div>

        {/* Parent Panels */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200/80">
            <h2 className="text-base font-bold text-slate-800 mb-1">Ward Recent Punch-ins</h2>
            <p className="text-xs text-slate-500 mb-4">Latest attendance records registered for {ward?.name}</p>
            <div className="space-y-3">
              {wardRecords.map((r) => {
                const c = state.courses.find((course) => course.id === r.courseId);
                return (
                  <div key={r.id} className="p-3 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-between text-xs">
                    <div>
                      <div className="font-bold text-slate-800">{c?.code} — {c?.name}</div>
                      <div className="text-[10px] text-slate-500">{formatDate(r.date)} at {r.arrivalTime || 'Class time'}</div>
                    </div>
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase ${
                      r.status === 'present' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                    }`}>
                      {r.status}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200/80">
            <h2 className="text-base font-bold text-slate-800 mb-1">Parent-Teacher Communication</h2>
            <p className="text-xs text-slate-500 mb-4">Connect with department faculty</p>
            <div className="p-4 rounded-xl bg-indigo-50/60 border border-indigo-100 text-xs text-indigo-950 space-y-2">
              <p className="font-bold">Next PTM Schedule:</p>
              <p className="text-indigo-800">
                Department Parent-Teacher meetings are convened monthly. To schedule an appointment with the Chairman or Course Incharge, visit the PTM portal.
              </p>
              <button
                onClick={() => onNavigate('#/app/parent-meetings')}
                className="mt-2 px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-[11px] transition-colors"
              >
                View PTM Meetings
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // -------------------------------------------------------------
  // 3. TEACHER / FACULTY DASHBOARD
  // -------------------------------------------------------------
  if (session.role === 'teacher') {
    const teacher = state.teachers.find(
      (t) => t.id === session.linkedId || t.email.toLowerCase() === session.email.toLowerCase()
    );

    const teacherCourses = state.courses.filter(
      (c) =>
        state.courseAssignments.some((a) => a.teacherId === teacher?.id && a.courseId === c.id) ||
        state.timetable.some((t) => t.teacherId === teacher?.id && t.courseId === c.id)
    );

    const teacherTimetableToday = state.timetable
      .filter((t) => t.day === todayDayName && t.status === 'Active' && t.teacherId === teacher?.id)
      .sort((a, b) => timeToMinutes(a.startTime) - timeToMinutes(b.startTime));

    const activeTeacherSessions = state.attendanceSessions.filter(
      (s) => s.status === 'open' && s.date === today && s.teacherId === teacher?.id
    );

    const pendingStudentLeavesForTeacher = state.leaveApplications.filter(
      (l) => l.status === 'with_teacher'
    );

    const myFacultyLeaves = state.teacherLeaveApplications.filter(
      (l) => l.teacherId === teacher?.id
    );

    return (
      <div className="space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 p-6 rounded-2xl text-white shadow-xl border border-indigo-900/40">
          <div>
            <div className="flex items-center gap-2 text-amber-400 text-xs font-bold uppercase tracking-wider mb-1">
              <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
              FACULTY ACADEMIC CONSOLE · {state.settings.currentTerm} {state.settings.currentYear}
            </div>
            <h1 className="text-xl lg:text-2xl font-black font-sans tracking-tight">
              Welcome back, {teacher?.name || session.displayName}
            </h1>
            <p className="text-xs text-indigo-200/80 mt-1 max-w-xl">
              {teacher?.designation || 'Lecturer'} · Employee Code: {teacher?.employeeCode || 'EMP-000'} · Government College of Technology Peshawar
            </p>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              onClick={() => onNavigate('#/app/qr/start')}
              className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-slate-950 font-bold text-xs shadow-lg shadow-amber-500/20 transition-all flex items-center gap-2"
            >
              <QrCode size={16} />
              <span>Launch QR Session</span>
            </button>
            <button
              onClick={() => onNavigate('#/app/attendance/mark')}
              className="px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white font-semibold text-xs transition-colors backdrop-blur-xs flex items-center gap-2"
            >
              <CheckCircle2 size={16} />
              <span>Manual Register</span>
            </button>
          </div>
        </div>

        {/* Teacher KPI Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="rounded-2xl p-5 bg-gradient-to-br from-[#4361ee] to-[#3a0ca3] text-white shadow-lg shadow-indigo-500/10">
            <span className="text-xs font-semibold uppercase tracking-wider text-white/80">Today's Lectures</span>
            <div className="text-3xl font-black mt-2">{teacherTimetableToday.length}</div>
            <div className="text-[11px] font-medium text-white/80 mt-1">{todayDayName} teaching schedule</div>
          </div>

          <div className="rounded-2xl p-5 bg-gradient-to-br from-[#10b981] to-[#047857] text-white shadow-lg shadow-emerald-500/10">
            <span className="text-xs font-semibold uppercase tracking-wider text-white/80">Active QR Sessions</span>
            <div className="text-3xl font-black mt-2">{activeTeacherSessions.length}</div>
            <div className="text-[11px] font-medium text-white/80 mt-1">Live class punch-in</div>
          </div>

          <div className="rounded-2xl p-5 bg-gradient-to-br from-[#06b6d4] to-[#0e7490] text-white shadow-lg shadow-cyan-500/10">
            <span className="text-xs font-semibold uppercase tracking-wider text-white/80">Assigned Courses</span>
            <div className="text-3xl font-black mt-2">{teacherCourses.length}</div>
            <div className="text-[11px] font-medium text-white/80 mt-1">Active semester catalog</div>
          </div>

          <div
            onClick={() => onNavigate('#/app/leaves')}
            className="rounded-2xl p-5 bg-gradient-to-br from-[#8b5cf6] to-[#6d28d9] text-white shadow-lg shadow-purple-500/10 cursor-pointer"
          >
            <span className="text-xs font-semibold uppercase tracking-wider text-white/80">Pending Student Leaves</span>
            <div className="text-3xl font-black mt-2">{pendingStudentLeavesForTeacher.length}</div>
            <div className="text-[11px] font-medium text-white/80 mt-1">Awaiting your recommendation</div>
          </div>
        </div>

        {/* Teacher Main Panels */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            {/* Today's Teaching Classes with QR Launchers */}
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200/80">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="text-base font-bold text-slate-800">Today's Teaching Schedule ({todayDayName})</h2>
                  <p className="text-xs text-slate-500">Launch live QR attendance for your assigned lectures</p>
                </div>
              </div>

              <div className="divide-y divide-slate-100">
                {teacherTimetableToday.length === 0 ? (
                  <div className="py-8 text-center text-slate-400 text-xs">
                    No classes scheduled on your timetable for {todayDayName}.
                  </div>
                ) : (
                  teacherTimetableToday.map((slot) => {
                    const course = state.courses.find((c) => c.id === slot.courseId);
                    const sec = state.sections.find((s) => s.id === slot.sectionId);
                    const isLive = activeTeacherSessions.some((s) => s.timetableId === slot.id);

                    return (
                      <div key={slot.id} className="py-3.5 flex items-center justify-between gap-4">
                        <div className="flex items-center gap-3">
                          <div className="px-2.5 py-1.5 rounded-lg bg-slate-100 text-slate-700 font-mono text-xs font-bold shrink-0">
                            {slot.startTime}–{slot.endTime}
                          </div>
                          <div>
                            <div className="text-xs font-bold text-slate-800">
                              {course?.code} — {course?.name}
                            </div>
                            <div className="text-[11px] text-slate-500">
                              Section {sec?.name || 'A'} · {slot.className || 'Lecture Hall'}
                            </div>
                          </div>
                        </div>

                        <div>
                          {isLive ? (
                            <button
                              onClick={() => onNavigate('#/app/qr/start')}
                              className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[11px] flex items-center gap-1.5 animate-pulse"
                            >
                              <CheckCircle2 size={14} />
                              <span>Live (Monitor)</span>
                            </button>
                          ) : (
                            <button
                              onClick={() => onNavigate('#/app/qr/start')}
                              className="px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-[11px] flex items-center gap-1.5"
                            >
                              <Play size={14} />
                              <span>Start QR Class</span>
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </div>

          <div className="space-y-6">
            {/* Faculty Quick Shortcuts */}
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200/80">
              <h2 className="text-base font-bold text-slate-800 mb-1">Faculty Tools</h2>
              <p className="text-xs text-slate-500 mb-4">Direct classroom tools</p>

              <div className="grid grid-cols-2 gap-2.5">
                <button
                  onClick={() => onNavigate('#/app/qr/start')}
                  className="p-3 rounded-xl bg-amber-50 hover:bg-amber-100 border border-amber-200/60 text-left transition-colors"
                >
                  <QrCode size={18} className="text-amber-700 mb-2" />
                  <div className="text-xs font-bold text-slate-900">QR Generator</div>
                  <div className="text-[10px] text-slate-500">Projector screen</div>
                </button>

                <button
                  onClick={() => onNavigate('#/app/attendance/mark')}
                  className="p-3 rounded-xl bg-emerald-50 hover:bg-emerald-100 border border-emerald-200/60 text-left transition-colors"
                >
                  <CheckCircle2 size={18} className="text-emerald-700 mb-2" />
                  <div className="text-xs font-bold text-slate-900">Manual Register</div>
                  <div className="text-[10px] text-slate-500">Roll call</div>
                </button>

                <button
                  onClick={() => onNavigate('#/app/assignments')}
                  className="p-3 rounded-xl bg-purple-50 hover:bg-purple-100 border border-purple-200/60 text-left transition-colors"
                >
                  <BookOpen size={18} className="text-purple-700 mb-2" />
                  <div className="text-xs font-bold text-slate-900">Coursework</div>
                  <div className="text-[10px] text-slate-500">Post tasks</div>
                </button>

                <button
                  onClick={() => onNavigate('#/app/leaves')}
                  className="p-3 rounded-xl bg-indigo-50 hover:bg-indigo-100 border border-indigo-200/60 text-left transition-colors"
                >
                  <Mail size={18} className="text-indigo-700 mb-2" />
                  <div className="text-xs font-bold text-slate-900">Faculty Leave</div>
                  <div className="text-[10px] text-slate-500">Apply to HOD</div>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // -------------------------------------------------------------
  // 4. INSTITUTIONAL ADMINISTRATOR DASHBOARD
  // (Sysadmin, Chairman, HOD, Coordinator, Assistant, Clerk)
  // -------------------------------------------------------------
  const scope = getScope();

  const isRecordInScope = (rec: { programId?: string | null; departmentId?: string | null }) => {
    if (scope.unrestricted) return true;
    if (scope.programIds.length && rec.programId && !scope.programIds.includes(rec.programId)) return false;
    if (scope.departmentIds.length && rec.departmentId && !scope.departmentIds.includes(rec.departmentId)) return false;
    return true;
  };

  const scopedStudents = state.students.filter(isRecordInScope).filter((s) => s.status === 'Active');
  const scopedTeachers = state.teachers.filter(isRecordInScope).filter((t) => t.active);

  const pendingLeaves = state.leaveApplications.filter(
    (l) => l.status === 'with_chairman' && isRecordInScope(l)
  );
  const pendingTeacherLeaves = state.teacherLeaveApplications.filter(
    (l) => l.status === 'with_chairman' && isRecordInScope(l)
  );
  const pendingSubs = state.substitutionRequests.filter(
    (r) => r.status === 'pending' && isRecordInScope(r)
  );

  const liveSessions = state.attendanceSessions.filter(
    (s) => s.status === 'open' && s.date === today && isRecordInScope(s)
  );

  const studentsWithShortage = scopedStudents.filter((stu) => {
    const summary = calculateAttendanceSummary(stu.id, state);
    return summary.total > 0 && summary.isShortage;
  });

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 p-6 rounded-2xl text-white shadow-xl border border-indigo-900/40">
        <div>
          <div className="flex items-center gap-2 text-amber-400 text-xs font-bold uppercase tracking-wider mb-1">
            <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
            Institutional Administration · {state.settings.currentTerm} {state.settings.currentYear}
          </div>
          <h1 className="text-xl lg:text-2xl font-black font-sans tracking-tight">
            Welcome back, {session.displayName}
          </h1>
          <p className="text-xs text-indigo-200/80 mt-1 max-w-xl">
            {state.settings.collegeName} — Official Portal for B.Tech (Chairman), DAE (HOD), DIT & Allied Engineering.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={() => onNavigate('#/app/attendance')}
            className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white font-semibold text-xs transition-colors backdrop-blur-xs flex items-center gap-2"
          >
            <CheckCircle2 size={16} />
            <span>Attendance Log</span>
          </button>
          {['chairman', 'hod'].includes(session.role) && (
            <button
              onClick={() => onNavigate('#/app/live-monitor')}
              className="px-4 py-2 rounded-xl bg-gradient-to-r from-cyan-500 to-cyan-600 hover:from-cyan-600 hover:to-cyan-700 text-white font-bold text-xs shadow-lg shadow-cyan-500/20 transition-all flex items-center gap-2"
            >
              <Clock size={16} />
              <span>Live Radar Monitor</span>
            </button>
          )}
        </div>
      </div>

      {/* SkoolZoom Metric KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {/* Card 1: Students */}
        <div
          onClick={() => onNavigate('#/app/students')}
          className="rounded-2xl p-5 bg-gradient-to-br from-[#4361ee] to-[#3a0ca3] text-white shadow-lg shadow-indigo-500/10 flex flex-col justify-between min-h-[130px] relative overflow-hidden group hover:-translate-y-1 transition-all cursor-pointer"
        >
          <div className="flex items-start justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-white/80">
              Active Students
            </span>
            <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center shrink-0">
              <GraduationCap size={20} />
            </div>
          </div>
          <div>
            <div className="text-3xl font-black font-sans leading-none">{scopedStudents.length}</div>
            <div className="text-[11px] font-medium text-white/80 mt-1 flex items-center gap-1">
              <TrendingUp size={13} /> In Department Scope
            </div>
          </div>
        </div>

        {/* Card 2: Faculty */}
        <div
          onClick={() => onNavigate('#/app/teachers')}
          className="rounded-2xl p-5 bg-gradient-to-br from-[#10b981] to-[#047857] text-white shadow-lg shadow-emerald-500/10 flex flex-col justify-between min-h-[130px] relative overflow-hidden group hover:-translate-y-1 transition-all cursor-pointer"
        >
          <div className="flex items-start justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-white/80">
              Faculty Members
            </span>
            <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center shrink-0">
              <Users size={20} />
            </div>
          </div>
          <div>
            <div className="text-3xl font-black font-sans leading-none">{scopedTeachers.length}</div>
            <div className="text-[11px] font-medium text-white/80 mt-1">Teaching Staff & HODs</div>
          </div>
        </div>

        {/* Card 3: Live Classes */}
        <div
          onClick={() => onNavigate('#/app/live-monitor')}
          className="rounded-2xl p-5 bg-gradient-to-br from-[#06b6d4] to-[#0e7490] text-white shadow-lg shadow-cyan-500/10 flex flex-col justify-between min-h-[130px] relative overflow-hidden group hover:-translate-y-1 transition-all cursor-pointer"
        >
          <div className="flex items-start justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-white/80">
              Active Sessions
            </span>
            <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center shrink-0">
              <Clock size={20} />
            </div>
          </div>
          <div>
            <div className="text-3xl font-black font-sans leading-none">{liveSessions.length}</div>
            <div className="text-[11px] font-medium text-white/80 mt-1">
              {liveSessions.length > 0 ? 'Live QR active now' : 'No active sessions'}
            </div>
          </div>
        </div>

        {/* Card 4: Pending Leaves / Approvals */}
        <div
          onClick={() => onNavigate('#/app/leaves')}
          className="rounded-2xl p-5 bg-gradient-to-br from-[#8b5cf6] to-[#6d28d9] text-white shadow-lg shadow-purple-500/10 flex flex-col justify-between min-h-[130px] relative overflow-hidden group hover:-translate-y-1 transition-all cursor-pointer"
        >
          <div className="flex items-start justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-white/80">
              Pending Leaves
            </span>
            <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
              <Mail size={20} />
            </div>
          </div>
          <div>
            <div className="text-3xl font-black font-sans leading-none">
              {pendingLeaves.length + pendingTeacherLeaves.length}
            </div>
            <div className="text-[11px] font-medium text-white/80 mt-1">
              {pendingLeaves.length} Student · {pendingTeacherLeaves.length} Faculty
            </div>
          </div>
        </div>

        {/* Card 5: Attendance Shortages */}
        <div
          onClick={() => onNavigate('#/app/warnings')}
          className="rounded-2xl p-5 bg-gradient-to-br from-[#f59e0b] to-[#b45309] text-white shadow-lg shadow-amber-500/10 flex flex-col justify-between min-h-[130px] relative overflow-hidden group hover:-translate-y-1 transition-all cursor-pointer"
        >
          <div className="flex items-start justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-white/80">
              Shortage Alert
            </span>
            <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
              <AlertTriangle size={20} />
            </div>
          </div>
          <div>
            <div className="text-3xl font-black font-sans leading-none">
              {studentsWithShortage.length}
            </div>
            <div className="text-[11px] font-medium text-white/80 mt-1">Below {shortageThreshold}% Threshold</div>
          </div>
        </div>
      </div>

      {/* Main 2-Column SkoolZoom Panels */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column (2 Cols): Class Performance / Timetable */}
        <div className="lg:col-span-2 space-y-6">
          {/* Class-wise Performance Bar Panel */}
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200/80">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-base font-bold text-slate-800">Class Attendance Standing</h2>
                <p className="text-xs text-slate-500">Average adjusted attendance percentage by section</p>
              </div>
              <button
                onClick={() => onNavigate('#/app/reports')}
                className="text-xs font-bold text-indigo-600 hover:text-indigo-800 flex items-center gap-1"
              >
                Detailed Report <ArrowRight size={14} />
              </button>
            </div>

            <div className="space-y-4">
              {state.sections
                .filter((sec) => isRecordInScope(sec))
                .slice(0, 6)
                .map((sec) => {
                  const sem = state.semesters.find((s) => s.id === sec.semesterId);
                  const prog = sem ? state.programs.find((p) => p.id === sem.programId) : null;
                  const studentsInSec = state.students.filter((st) => st.currentSectionId === sec.id);

                  let totalPct = 0;
                  let counted = 0;
                  studentsInSec.forEach((st) => {
                    const summary = calculateAttendanceSummary(st.id, state);
                    if (summary.total > 0) {
                      totalPct += summary.adjustedPercentage;
                      counted++;
                    }
                  });

                  const avgPct = counted > 0 ? (totalPct / counted).toFixed(1) : '95.0';
                  const numPct = Number(avgPct);

                  return (
                    <div key={sec.id} className="p-3.5 rounded-xl bg-slate-50/80 border border-slate-100 flex items-center gap-4">
                      <div className="w-10 h-10 rounded-xl bg-indigo-50 border border-indigo-100 text-indigo-700 font-extrabold flex items-center justify-center text-sm shrink-0">
                        {sec.name}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1.5">
                          <span className="text-xs font-bold text-slate-800 truncate">
                            {prog ? prog.code : ''} · {sem ? sem.name : 'Semester'} — Section {sec.name}
                          </span>
                          <span className="text-xs font-extrabold text-slate-700">{avgPct}%</span>
                        </div>
                        <div className="w-full h-2 rounded-full bg-slate-200 overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all duration-500 ${
                              numPct < shortageThreshold
                                ? 'bg-rose-500'
                                : numPct < 80
                                ? 'bg-amber-500'
                                : 'bg-emerald-500'
                            }`}
                            style={{ width: `${Math.min(100, numPct)}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  );
                })}
            </div>
          </div>

          {/* Today's Timetable Radar */}
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200/80">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-base font-bold text-slate-800">
                  Classes Scheduled for Today ({todayDayName})
                </h2>
                <p className="text-xs text-slate-500">Live operational timetable overview</p>
              </div>
              <button
                onClick={() => onNavigate('#/app/timetable')}
                className="text-xs font-bold text-indigo-600 hover:text-indigo-800 flex items-center gap-1"
              >
                Full Timetable <ArrowRight size={14} />
              </button>
            </div>

            <div className="divide-y divide-slate-100">
              {state.timetable
                .filter((t) => t.day === todayDayName && t.status === 'Active' && isRecordInScope(t))
                .length === 0 ? (
                <div className="py-8 text-center text-slate-400 text-xs">
                  No classes scheduled for {todayDayName}.
                </div>
              ) : (
                state.timetable
                  .filter((t) => t.day === todayDayName && t.status === 'Active' && isRecordInScope(t))
                  .sort((a, b) => timeToMinutes(a.startTime) - timeToMinutes(b.startTime))
                  .map((slot) => {
                    const course = state.courses.find((c) => c.id === slot.courseId);
                    const teacher = state.teachers.find((t) => t.id === slot.teacherId);
                    const isLive = liveSessions.some((s) => s.timetableId === slot.id);

                    return (
                      <div key={slot.id} className="py-3 flex items-center justify-between gap-4">
                        <div className="flex items-center gap-3">
                          <div className="px-2.5 py-1.5 rounded-lg bg-slate-100 text-slate-700 font-mono text-xs font-bold shrink-0">
                            {slot.startTime}–{slot.endTime}
                          </div>
                          <div>
                            <div className="text-xs font-bold text-slate-800">
                              {course ? `${course.code} — ${course.name}` : 'Course Slot'}
                            </div>
                            <div className="text-[11px] text-slate-500">
                              {teacher?.name} · {slot.className || 'General Lecture Hall'}
                            </div>
                          </div>
                        </div>

                        <div>
                          {isLive ? (
                            <span className="px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-extrabold uppercase flex items-center gap-1">
                              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                              Live Session
                            </span>
                          ) : (
                            <span className="px-2.5 py-1 rounded-full bg-slate-100 text-slate-600 text-[10px] font-semibold">
                              Scheduled
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })
              )}
            </div>
          </div>
        </div>

        {/* Right Column (1 Col): Pending Action Queue & Quick Nav */}
        <div className="space-y-6">
          {/* Action Approvals Hub */}
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200/80">
            <h2 className="text-base font-bold text-slate-800 mb-1">Attention Required</h2>
            <p className="text-xs text-slate-500 mb-4">Pending items requiring institutional decision</p>

            <div className="space-y-3">
              {/* Student Leaves */}
              <div
                onClick={() => onNavigate('#/app/leaves')}
                className="p-3 rounded-xl bg-purple-50/60 border border-purple-100 hover:bg-purple-50 cursor-pointer transition-colors flex items-center justify-between"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-purple-600 text-white flex items-center justify-center font-bold text-xs">
                    {pendingLeaves.length}
                  </div>
                  <div>
                    <div className="text-xs font-bold text-slate-800">Student Leaves</div>
                    <div className="text-[11px] text-slate-500">Awaiting approval</div>
                  </div>
                </div>
                <ArrowRight size={14} className="text-purple-600" />
              </div>

              {/* Faculty Leaves */}
              <div
                onClick={() => onNavigate('#/app/teacher-leaves')}
                className="p-3 rounded-xl bg-indigo-50/60 border border-indigo-100 hover:bg-indigo-50 cursor-pointer transition-colors flex items-center justify-between"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-indigo-600 text-white flex items-center justify-center font-bold text-xs">
                    {pendingTeacherLeaves.length}
                  </div>
                  <div>
                    <div className="text-xs font-bold text-slate-800">Faculty Leaves</div>
                    <div className="text-[11px] text-slate-500">Awaiting Chairman decision</div>
                  </div>
                </div>
                <ArrowRight size={14} className="text-indigo-600" />
              </div>

              {/* Substitutions */}
              <div
                onClick={() => onNavigate('#/app/substitutions')}
                className="p-3 rounded-xl bg-amber-50/60 border border-amber-100 hover:bg-amber-50 cursor-pointer transition-colors flex items-center justify-between"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-amber-600 text-white flex items-center justify-center font-bold text-xs">
                    {pendingSubs.length}
                  </div>
                  <div>
                    <div className="text-xs font-bold text-slate-800">Substitute Requests</div>
                    <div className="text-[11px] text-slate-500">Free teacher matching</div>
                  </div>
                </div>
                <ArrowRight size={14} className="text-amber-600" />
              </div>

              {/* Registrations */}
              <div
                onClick={() => onNavigate('#/app/registrations-admin')}
                className="p-3 rounded-xl bg-cyan-50/60 border border-cyan-100 hover:bg-cyan-50 cursor-pointer transition-colors flex items-center justify-between"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-cyan-600 text-white flex items-center justify-center font-bold text-xs">
                    {state.accounts.filter((a) => a.status === 'Pending').length}
                  </div>
                  <div>
                    <div className="text-xs font-bold text-slate-800">New Registrations</div>
                    <div className="text-[11px] text-slate-500">Public account applications</div>
                  </div>
                </div>
                <ArrowRight size={14} className="text-cyan-600" />
              </div>
            </div>
          </div>

          {/* Quick Action Navigation Grid */}
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200/80">
            <h2 className="text-base font-bold text-slate-800 mb-1">Quick Tools</h2>
            <p className="text-xs text-slate-500 mb-4">Direct shortcuts to frequent college tasks</p>

            <div className="grid grid-cols-2 gap-2.5">
              <button
                onClick={() => onNavigate('#/app/students')}
                className="p-3 rounded-xl bg-slate-50 hover:bg-indigo-50/60 border border-slate-200/60 text-left transition-colors group"
              >
                <GraduationCap size={18} className="text-indigo-600 mb-2 group-hover:scale-110 transition-transform" />
                <div className="text-xs font-bold text-slate-800">Admissions</div>
                <div className="text-[10px] text-slate-500">Student enrollment</div>
              </button>

              <button
                onClick={() => onNavigate('#/app/attendance/mark')}
                className="p-3 rounded-xl bg-slate-50 hover:bg-indigo-50/60 border border-slate-200/60 text-left transition-colors group"
              >
                <CheckCircle2 size={18} className="text-emerald-600 mb-2 group-hover:scale-110 transition-transform" />
                <div className="text-xs font-bold text-slate-800">Attendance</div>
                <div className="text-[10px] text-slate-500">Manual register</div>
              </button>

              <button
                onClick={() => onNavigate('#/app/reports')}
                className="p-3 rounded-xl bg-slate-50 hover:bg-indigo-50/60 border border-slate-200/60 text-left transition-colors group"
              >
                <FileSpreadsheet size={18} className="text-purple-600 mb-2 group-hover:scale-110 transition-transform" />
                <div className="text-xs font-bold text-slate-800">Reports</div>
                <div className="text-[10px] text-slate-500">Official printouts</div>
              </button>

              <button
                onClick={() => onNavigate('#/app/committees')}
                className="p-3 rounded-xl bg-slate-50 hover:bg-indigo-50/60 border border-slate-200/60 text-left transition-colors group"
              >
                <Users size={18} className="text-amber-600 mb-2 group-hover:scale-110 transition-transform" />
                <div className="text-xs font-bold text-slate-800">OBE & PTM</div>
                <div className="text-[10px] text-slate-500">Committees</div>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
