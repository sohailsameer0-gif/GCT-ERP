import React, { useState } from 'react';
import { useERP } from '../context/ERPContext';
import { calculateAttendanceSummary, openPrintDocument } from '../services/calculations';
import {
  FileText,
  Printer,
  Download,
  AlertTriangle,
  CheckCircle,
  GraduationCap,
  Users,
  Search,
  Filter,
  BarChart3,
  Calendar
} from 'lucide-react';

export const ReportsView: React.FC = () => {
  const { state, addToast } = useERP();
  const [selectedReport, setSelectedReport] = useState<'shortage' | 'exam' | 'faculty'>('shortage');
  const [programFilter, setProgramFilter] = useState('all');
  const [deptFilter, setDeptFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');

  const threshold = state.settings.shortageThreshold ?? 70;

  // Student Attendance Calculations
  const studentStats = state.students.map((student) => {
    const summary = calculateAttendanceSummary(student.id, state);
    const dept = state.departments.find((d) => d.id === student.departmentId);
    const prog = state.programs.find((p) => p.id === student.programId);
    const sem = state.semesters.find((s) => s.id === student.currentSemesterId);

    return {
      student,
      summary,
      dept,
      prog,
      sem,
      isShort: summary.isShortage
    };
  });

  const filteredStats = studentStats.filter((item) => {
    const progMatch = programFilter === 'all' || item.student.programId === programFilter;
    const deptMatch = deptFilter === 'all' || item.student.departmentId === deptFilter;
    const searchMatch =
      !searchTerm ||
      item.student.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.student.classNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.student.registrationNumber.toLowerCase().includes(searchTerm.toLowerCase());
    return progMatch && deptMatch && searchMatch;
  });

  const shortageList = filteredStats.filter((item) => item.isShort);

  // Faculty Workload Calculations
  const facultyStats = state.teachers.map((teacher) => {
    const assignedSlots = state.timetable.filter((slot) => slot.teacherId === teacher.id);
    const dept = state.departments.find((d) => d.id === teacher.departmentId);
    const leaves = state.teacherLeaveApplications?.filter(
      (l) => l.teacherId === teacher.id && l.status === 'approved'
    ) || [];

    return {
      teacher,
      dept,
      assignedSlotsCount: assignedSlots.length,
      weeklyContactHours: assignedSlots.length * 1.5, // 1.5 hrs per session
      approvedLeaves: leaves.length
    };
  });

  // Print Handler
  const handlePrintShortageReport = () => {
    const rowsHtml = shortageList
      .map(
        (item, idx) => `
        <tr>
          <td style="text-align: center; border: 1px solid #cbd5e1; padding: 6px;">${idx + 1}</td>
          <td style="border: 1px solid #cbd5e1; padding: 6px;"><strong>${item.student.name}</strong></td>
          <td style="font-family: monospace; border: 1px solid #cbd5e1; padding: 6px;">${item.student.classNumber}</td>
          <td style="border: 1px solid #cbd5e1; padding: 6px;">${item.dept?.name || 'N/A'}</td>
          <td style="border: 1px solid #cbd5e1; padding: 6px;">${item.sem?.name || 'N/A'}</td>
          <td style="text-align: center; border: 1px solid #cbd5e1; padding: 6px;">${item.summary.total}</td>
          <td style="text-align: center; border: 1px solid #cbd5e1; padding: 6px;">${item.summary.present}</td>
          <td style="text-align: center; color: #dc2626; font-weight: bold; border: 1px solid #cbd5e1; padding: 6px;">${item.summary.adjustedPercentage.toFixed(1)}%</td>
          <td style="text-align: center; color: #dc2626; border: 1px solid #cbd5e1; padding: 6px;">Barred from Exams</td>
        </tr>
      `
      )
      .join('');

    const bodyHtml = `
      <div style="margin-bottom: 20px;">
        <h3 style="margin: 0; color: #1e1b4b; text-transform: uppercase;">Official Attendance Shortage Notice (Under ${threshold}%)</h3>
        <p style="margin: 4px 0 0; color: #64748b; font-size: 13px;">Academic Session • Generated on ${new Date().toLocaleDateString()}</p>
      </div>

      <table style="width: 100%; border-collapse: collapse; font-size: 12px;">
        <thead>
          <tr style="background: #f1f5f9; text-align: left;">
            <th style="padding: 8px; border: 1px solid #cbd5e1; text-align: center;">#</th>
            <th style="padding: 8px; border: 1px solid #cbd5e1;">Student Name</th>
            <th style="padding: 8px; border: 1px solid #cbd5e1;">Roll No</th>
            <th style="padding: 8px; border: 1px solid #cbd5e1;">Department</th>
            <th style="padding: 8px; border: 1px solid #cbd5e1;">Semester</th>
            <th style="padding: 8px; border: 1px solid #cbd5e1; text-align: center;">Held</th>
            <th style="padding: 8px; border: 1px solid #cbd5e1; text-align: center;">Attended</th>
            <th style="padding: 8px; border: 1px solid #cbd5e1; text-align: center;">Percentage</th>
            <th style="padding: 8px; border: 1px solid #cbd5e1; text-align: center;">Status</th>
          </tr>
        </thead>
        <tbody>
          ${rowsHtml || '<tr><td colspan="9" style="text-align: center; padding: 20px;">No students below attendance criteria.</td></tr>'}
        </tbody>
      </table>

      <div style="margin-top: 40px; display: flex; justify-content: space-between;">
        <div style="text-align: center; width: 200px;">
          <div style="border-bottom: 1px solid #334155; margin-bottom: 8px;"></div>
          <span style="font-size: 12px; font-weight: bold;">Academic Coordinator</span>
        </div>
        <div style="text-align: center; width: 200px;">
          <div style="border-bottom: 1px solid #334155; margin-bottom: 8px;"></div>
          <span style="font-size: 12px; font-weight: bold;">Head of Department / Chairman</span>
        </div>
        <div style="text-align: center; width: 200px;">
          <div style="border-bottom: 1px solid #334155; margin-bottom: 8px;"></div>
          <span style="font-size: 12px; font-weight: bold;">Principal / Director GCT</span>
        </div>
      </div>
    `;

    openPrintDocument('Official Attendance Shortage Notice', bodyHtml);
  };

  const handlePrintExamRollSheet = () => {
    const rowsHtml = filteredStats
      .map(
        (item, idx) => `
        <tr>
          <td style="text-align: center; border: 1px solid #cbd5e1; padding: 6px;">${idx + 1}</td>
          <td style="font-family: monospace; font-weight: bold; border: 1px solid #cbd5e1; padding: 6px;">${item.student.classNumber}</td>
          <td style="border: 1px solid #cbd5e1; padding: 6px;"><strong>${item.student.name}</strong></td>
          <td style="font-family: monospace; border: 1px solid #cbd5e1; padding: 6px;">${item.student.registrationNumber}</td>
          <td style="border: 1px solid #cbd5e1; padding: 6px;">${item.dept?.name || 'N/A'}</td>
          <td style="text-align: center; border: 1px solid #cbd5e1; padding: 6px;">${item.summary.adjustedPercentage.toFixed(1)}%</td>
          <td style="text-align: center; font-weight: bold; color: ${item.isShort ? '#dc2626' : '#16a34a'}; border: 1px solid #cbd5e1; padding: 6px;">
            ${item.isShort ? 'NOT ELIGIBLE' : 'ELIGIBLE'}
          </td>
          <td style="width: 120px; border: 1px solid #cbd5e1; padding: 6px;"></td>
        </tr>
      `
      )
      .join('');

    const bodyHtml = `
      <div style="margin-bottom: 20px;">
        <h3 style="margin: 0; color: #1e1b4b; text-transform: uppercase;">Board / Sessional Examination Roll Sheet & Eligibility Roster</h3>
        <p style="margin: 4px 0 0; color: #64748b; font-size: 13px;">Criteria: Min ${threshold}% Attendance required for admit card generation</p>
      </div>

      <table style="width: 100%; border-collapse: collapse; font-size: 12px;">
        <thead>
          <tr style="background: #f1f5f9;">
            <th style="padding: 8px; border: 1px solid #cbd5e1; text-align: center;">#</th>
            <th style="padding: 8px; border: 1px solid #cbd5e1;">Roll No</th>
            <th style="padding: 8px; border: 1px solid #cbd5e1;">Student Name</th>
            <th style="padding: 8px; border: 1px solid #cbd5e1;">Reg No</th>
            <th style="padding: 8px; border: 1px solid #cbd5e1;">Department</th>
            <th style="padding: 8px; border: 1px solid #cbd5e1; text-align: center;">Att. %</th>
            <th style="padding: 8px; border: 1px solid #cbd5e1; text-align: center;">Eligibility</th>
            <th style="padding: 8px; border: 1px solid #cbd5e1;">Candidate Signature</th>
          </tr>
        </thead>
        <tbody>
          ${rowsHtml}
        </tbody>
      </table>
    `;

    openPrintDocument('Examination Eligibility Roll Sheet', bodyHtml);
  };

  // CSV Export
  const handleExportCSV = () => {
    const headers = ['Roll No', 'Full Name', 'Department', 'Program', 'Semester', 'Attended', 'Conducted', 'Percentage', 'Shortage Status'];
    const rows = filteredStats.map((item) => [
      `"${item.student.classNumber}"`,
      `"${item.student.name}"`,
      `"${item.dept?.name || ''}"`,
      `"${item.prog?.name || ''}"`,
      `"${item.sem?.name || ''}"`,
      item.summary.present,
      item.summary.total,
      `${item.summary.adjustedPercentage.toFixed(1)}%`,
      item.isShort ? 'Shortage (<70%)' : 'Eligible'
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `GCT_Attendance_Report_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    addToast('CSV export downloaded successfully', 'success');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
            <FileText className="w-7 h-7 text-indigo-600" />
            Official Academic Reports & Registers
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            GCT Peshawar attendance shortage notices, exam eligibility rosters, and official gazettes
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleExportCSV}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-medium text-sm rounded-lg shadow-xs transition-all"
          >
            <Download className="w-4 h-4 text-slate-500" />
            Export CSV
          </button>
          <button
            onClick={selectedReport === 'shortage' ? handlePrintShortageReport : handlePrintExamRollSheet}
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-medium text-sm rounded-lg shadow-xs transition-all"
          >
            <Printer className="w-4 h-4" />
            Print Official Document
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-lg bg-indigo-50 flex items-center justify-center text-indigo-600">
            <Users className="w-6 h-6" />
          </div>
          <div>
            <div className="text-2xl font-bold text-slate-800">{state.students.length}</div>
            <div className="text-xs font-medium text-slate-500">Enrolled Students</div>
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-lg bg-rose-50 flex items-center justify-center text-rose-600">
            <AlertTriangle className="w-6 h-6" />
          </div>
          <div>
            <div className="text-2xl font-bold text-rose-600">{shortageList.length}</div>
            <div className="text-xs font-medium text-slate-500">Below {threshold}% Shortage</div>
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-lg bg-emerald-50 flex items-center justify-center text-emerald-600">
            <CheckCircle className="w-6 h-6" />
          </div>
          <div>
            <div className="text-2xl font-bold text-emerald-600">
              {filteredStats.length - shortageList.length}
            </div>
            <div className="text-xs font-medium text-slate-500">Exam Eligible Candidates</div>
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-lg bg-sky-50 flex items-center justify-center text-sky-600">
            <GraduationCap className="w-6 h-6" />
          </div>
          <div>
            <div className="text-2xl font-bold text-sky-700">{state.teachers.length}</div>
            <div className="text-xs font-medium text-slate-500">Teaching Faculty</div>
          </div>
        </div>
      </div>

      {/* Report Switcher & Filter Controls */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-col md:flex-row gap-3 items-center justify-between">
        <div className="flex items-center gap-2 border-b md:border-b-0 border-slate-200 pb-2 md:pb-0 w-full md:w-auto">
          <button
            onClick={() => setSelectedReport('shortage')}
            className={`px-3 py-1.5 rounded-lg text-sm font-semibold transition-colors ${
              selectedReport === 'shortage'
                ? 'bg-rose-50 text-rose-700'
                : 'text-slate-600 hover:text-slate-800'
            }`}
          >
            Attendance Shortage Notice ({shortageList.length})
          </button>
          <button
            onClick={() => setSelectedReport('exam')}
            className={`px-3 py-1.5 rounded-lg text-sm font-semibold transition-colors ${
              selectedReport === 'exam'
                ? 'bg-indigo-50 text-indigo-700'
                : 'text-slate-600 hover:text-slate-800'
            }`}
          >
            Exam Eligibility Roster
          </button>
          <button
            onClick={() => setSelectedReport('faculty')}
            className={`px-3 py-1.5 rounded-lg text-sm font-semibold transition-colors ${
              selectedReport === 'faculty'
                ? 'bg-sky-50 text-sky-700'
                : 'text-slate-600 hover:text-slate-800'
            }`}
          >
            Faculty Workload & Utilization
          </button>
        </div>

        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
          <div className="relative w-full sm:w-56">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search student or roll no..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 border border-slate-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <select
            value={deptFilter}
            onChange={(e) => setDeptFilter(e.target.value)}
            className="px-2.5 py-1.5 border border-slate-200 rounded-lg text-xs bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="all">All Departments</option>
            {state.departments.map((d) => (
              <option key={d.id} value={d.id}>
                {d.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Main Table Display */}
      {selectedReport === 'shortage' && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="p-4 border-b border-slate-100 bg-rose-50/50 flex items-center justify-between">
            <div className="flex items-center gap-2 text-rose-800 text-sm font-bold">
              <AlertTriangle className="w-4 h-4 text-rose-600" />
              Critical Shortage Cases (Attendance &lt; {threshold}%)
            </div>
            <span className="text-xs text-rose-700 bg-rose-100 px-2.5 py-0.5 rounded-full font-semibold">
              Action Required: Barred from Terminal Exams
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-600">
              <thead className="bg-slate-50 text-xs uppercase font-semibold text-slate-500 border-b border-slate-200">
                <tr>
                  <th className="p-3.5">Roll No (Class No)</th>
                  <th className="p-3.5">Student Name</th>
                  <th className="p-3.5">Department</th>
                  <th className="p-3.5">Semester</th>
                  <th className="p-3.5 text-center">Lectures Held</th>
                  <th className="p-3.5 text-center">Attended</th>
                  <th className="p-3.5 text-center">Adjusted %</th>
                  <th className="p-3.5 text-center">Deficit</th>
                  <th className="p-3.5 text-right">Notice Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {shortageList.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="p-8 text-center text-slate-400">
                      <CheckCircle className="w-10 h-10 mx-auto text-emerald-500 mb-2 opacity-60" />
                      All students meet the minimum {threshold}% attendance threshold.
                    </td>
                  </tr>
                ) : (
                  shortageList.map((item) => (
                    <tr key={item.student.id} className="hover:bg-rose-50/30 transition-colors">
                      <td className="p-3.5 font-mono font-bold text-slate-800">{item.student.classNumber}</td>
                      <td className="p-3.5 font-semibold text-slate-800">{item.student.name}</td>
                      <td className="p-3.5 text-xs text-slate-600">{item.dept?.name || 'N/A'}</td>
                      <td className="p-3.5 text-xs text-slate-600">{item.sem?.name || 'N/A'}</td>
                      <td className="p-3.5 text-center text-xs font-semibold">{item.summary.total}</td>
                      <td className="p-3.5 text-center text-xs font-semibold text-emerald-700">
                        {item.summary.present}
                      </td>
                      <td className="p-3.5 text-center font-bold text-rose-600">
                        {item.summary.adjustedPercentage.toFixed(1)}%
                      </td>
                      <td className="p-3.5 text-center text-xs font-mono text-rose-700">
                        -{(threshold - item.summary.adjustedPercentage).toFixed(1)}%
                      </td>
                      <td className="p-3.5 text-right">
                        <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-rose-100 text-rose-800">
                          Shortage Alert Sent
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {selectedReport === 'exam' && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="p-4 border-b border-slate-100 bg-slate-50 flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
              <GraduationCap className="w-4 h-4 text-indigo-600" />
              Examination Candidate Eligibility Roster
            </h3>
            <span className="text-xs text-slate-500">
              Showing {filteredStats.length} candidates
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-600">
              <thead className="bg-slate-50 text-xs uppercase font-semibold text-slate-500 border-b border-slate-200">
                <tr>
                  <th className="p-3.5">Roll No</th>
                  <th className="p-3.5">Registration</th>
                  <th className="p-3.5">Student Name</th>
                  <th className="p-3.5">Department</th>
                  <th className="p-3.5 text-center">Attended / Total</th>
                  <th className="p-3.5 text-center">Percentage</th>
                  <th className="p-3.5 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredStats.map((item) => (
                  <tr key={item.student.id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="p-3.5 font-mono font-bold text-slate-800">{item.student.classNumber}</td>
                    <td className="p-3.5 font-mono text-xs text-slate-500">{item.student.registrationNumber}</td>
                    <td className="p-3.5 font-semibold text-slate-800">{item.student.name}</td>
                    <td className="p-3.5 text-xs text-slate-600">{item.dept?.name || 'N/A'}</td>
                    <td className="p-3.5 text-center text-xs">
                      {item.summary.present} / {item.summary.total}
                    </td>
                    <td className="p-3.5 text-center font-bold">
                      <span className={item.isShort ? 'text-rose-600' : 'text-emerald-700'}>
                        {item.summary.adjustedPercentage.toFixed(1)}%
                      </span>
                    </td>
                    <td className="p-3.5 text-center">
                      <span
                        className={`px-2.5 py-1 rounded-full text-xs font-bold ${
                          item.isShort
                            ? 'bg-rose-100 text-rose-800'
                            : 'bg-emerald-100 text-emerald-800'
                        }`}
                      >
                        {item.isShort ? 'Ineligible' : 'Eligible'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {selectedReport === 'faculty' && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="p-4 border-b border-slate-100 bg-slate-50 flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-sky-600" />
              Faculty Teaching Workload & Timetable Utilization
            </h3>
            <span className="text-xs text-slate-500">
              Total Faculty: {facultyStats.length}
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-600">
              <thead className="bg-slate-50 text-xs uppercase font-semibold text-slate-500 border-b border-slate-200">
                <tr>
                  <th className="p-3.5">Emp Code</th>
                  <th className="p-3.5">Faculty Name</th>
                  <th className="p-3.5">Designation</th>
                  <th className="p-3.5">Department</th>
                  <th className="p-3.5 text-center">Weekly Lectures</th>
                  <th className="p-3.5 text-center">Contact Hours</th>
                  <th className="p-3.5 text-center">Approved Leaves</th>
                  <th className="p-3.5 text-right">Workload Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {facultyStats.map((item) => (
                  <tr key={item.teacher.id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="p-3.5 font-mono font-bold text-slate-800">{item.teacher.employeeCode}</td>
                    <td className="p-3.5 font-semibold text-slate-800">{item.teacher.name}</td>
                    <td className="p-3.5 text-xs text-slate-600">{item.teacher.designation}</td>
                    <td className="p-3.5 text-xs text-slate-600">{item.dept?.name || 'N/A'}</td>
                    <td className="p-3.5 text-center text-xs font-bold text-slate-800">
                      {item.assignedSlotsCount} sessions
                    </td>
                    <td className="p-3.5 text-center text-xs font-mono text-indigo-600">
                      {item.weeklyContactHours} hrs/week
                    </td>
                    <td className="p-3.5 text-center text-xs font-semibold text-amber-700">
                      {item.approvedLeaves} days
                    </td>
                    <td className="p-3.5 text-right">
                      <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800">
                        Balanced
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
