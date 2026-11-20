import React, { useState } from 'react';
import { useERP } from '../context/ERPContext';
import {
  DoorOpen,
  Search,
  Filter,
  Clock,
  CheckCircle,
  AlertTriangle,
  UserCheck,
  Calendar,
  Building
} from 'lucide-react';

export const ExitRecordsView: React.FC = () => {
  const { state, punchOutQr, addToast, session } = useERP();
  const [searchTerm, setSearchTerm] = useState('');
  const [dateFilter, setDateFilter] = useState('');
  const [manualStudentId, setManualStudentId] = useState('');

  const exitCutoff = '16:00';

  // Gather all records from state.exitRecords
  const exitRecords = state.exitRecords || [];

  const filteredExits = exitRecords.filter((rec) => {
    const student = state.students.find((s) => s.id === rec.studentId);
    const searchMatch =
      !searchTerm ||
      (student?.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (student?.classNumber || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (student?.registrationNumber || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (rec.reason || '').toLowerCase().includes(searchTerm.toLowerCase());

    const dateMatch = !dateFilter || rec.date === dateFilter;
    return searchMatch && dateMatch;
  });

  const handleManualExit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualStudentId) {
      addToast('Please select a student for gate exit logging', 'error');
      return;
    }

    try {
      punchOutQr(manualStudentId);
      setManualStudentId('');
      addToast('Campus exit punch-out recorded', 'success');
    } catch (err: any) {
      addToast(err?.message || 'Failed to record gate exit', 'error');
    }
  };

  const isEarlyExit = (exitTime?: string) => {
    if (!exitTime) return false;
    return exitTime < exitCutoff;
  };

  const canGateDispatch =
    session?.role === 'sysadmin' ||
    session?.role === 'assistant' ||
    session?.role === 'clerk';

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
            <DoorOpen className="w-7 h-7 text-indigo-600" />
            Campus Gate Exit Pass & Punch-Out Log
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Real-time security gate dispatch registry and early student departure tracking
          </p>
        </div>
      </div>

      {/* KPI Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-lg bg-indigo-50 flex items-center justify-center text-indigo-600">
            <DoorOpen className="w-6 h-6" />
          </div>
          <div>
            <div className="text-2xl font-bold text-slate-800">{exitRecords.length}</div>
            <div className="text-xs font-medium text-slate-500">Total Recorded Gate Exits</div>
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-lg bg-emerald-50 flex items-center justify-center text-emerald-600">
            <CheckCircle className="w-6 h-6" />
          </div>
          <div>
            <div className="text-2xl font-bold text-emerald-700">
              {exitRecords.filter((r) => !isEarlyExit(r.exitTime)).length}
            </div>
            <div className="text-xs font-medium text-slate-500">Standard Scheduled Exits (After {exitCutoff})</div>
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-lg bg-amber-50 flex items-center justify-center text-amber-600">
            <AlertTriangle className="w-6 h-6" />
          </div>
          <div>
            <div className="text-2xl font-bold text-amber-700">
              {exitRecords.filter((r) => isEarlyExit(r.exitTime)).length}
            </div>
            <div className="text-xs font-medium text-slate-500">Early Departures (Before {exitCutoff})</div>
          </div>
        </div>
      </div>

      {/* Manual Gate Dispatch Box for Security / Gate Staff */}
      {canGateDispatch && (
        <div className="bg-gradient-to-r from-slate-900 to-indigo-950 text-white p-5 rounded-xl shadow-md border border-indigo-900 flex flex-col md:flex-row items-center justify-between gap-4">
          <div>
            <h3 className="text-base font-bold flex items-center gap-2">
              <UserCheck className="w-5 h-5 text-indigo-400" />
              Security Gatekeeper Quick Punch-Out
            </h3>
            <p className="text-xs text-slate-300 mt-0.5">
              Instantly log departure for students leaving via main security gate without QR scanner
            </p>
          </div>

          <form onSubmit={handleManualExit} className="flex items-center gap-2 w-full md:w-auto">
            <select
              value={manualStudentId}
              onChange={(e) => setManualStudentId(e.target.value)}
              className="px-3 py-2 bg-slate-800 text-white border border-slate-700 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-indigo-400 min-w-64"
            >
              <option value="">-- Choose Student to Dispatch --</option>
              {state.students.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name} ({s.classNumber})
                </option>
              ))}
            </select>
            <button
              type="submit"
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs rounded-lg transition-colors whitespace-nowrap shadow-xs"
            >
              Confirm Exit
            </button>
          </form>
        </div>
      )}

      {/* Search & Filter */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-col sm:flex-row gap-3 items-center justify-between">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by student, class no, reg no..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-2 border border-slate-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Calendar className="w-4 h-4 text-slate-400" />
          <input
            type="date"
            value={dateFilter}
            onChange={(e) => setDateFilter(e.target.value)}
            className="px-3 py-2 border border-slate-200 rounded-lg text-xs bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
          {dateFilter && (
            <button
              onClick={() => setDateFilter('')}
              className="text-xs text-indigo-600 hover:underline"
            >
              Clear
            </button>
          )}
        </div>
      </div>

      {/* Gate Exit Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-600">
            <thead className="bg-slate-50 text-xs uppercase font-semibold text-slate-500 border-b border-slate-200">
              <tr>
                <th className="p-3.5">Roll No (Class No)</th>
                <th className="p-3.5">Student Name</th>
                <th className="p-3.5">Department</th>
                <th className="p-3.5">Date</th>
                <th className="p-3.5">Entry Time</th>
                <th className="p-3.5">Exit Time</th>
                <th className="p-3.5 text-right">Gate Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredExits.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-slate-400">
                    <DoorOpen className="w-10 h-10 mx-auto text-slate-300 mb-2" />
                    No campus exit punch-outs recorded for the selected criteria.
                  </td>
                </tr>
              ) : (
                filteredExits.map((rec) => {
                  const student = state.students.find((s) => s.id === rec.studentId);
                  const dept = state.departments.find((d) => d.id === student?.departmentId);
                  const early = isEarlyExit(rec.exitTime);

                  return (
                    <tr key={rec.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="p-3.5 font-mono font-bold text-slate-800">{student?.classNumber || 'N/A'}</td>
                      <td className="p-3.5 font-semibold text-slate-800">{student?.name || 'Student'}</td>
                      <td className="p-3.5 text-xs text-slate-600">{dept?.name || 'N/A'}</td>
                      <td className="p-3.5 text-xs text-slate-500">{rec.date}</td>
                      <td className="p-3.5 text-xs font-mono text-emerald-700">
                        {rec.entryTime || '—'}
                      </td>
                      <td className="p-3.5 text-xs font-mono font-bold text-indigo-700">
                        {rec.exitTime || '—'}
                      </td>
                      <td className="p-3.5 text-right">
                        <span
                          className={`px-2.5 py-1 rounded-full text-xs font-semibold ${
                            early
                              ? 'bg-amber-100 text-amber-800'
                              : 'bg-emerald-100 text-emerald-800'
                          }`}
                        >
                          {early ? 'Early Gate Exit' : 'Standard Departure'}
                        </span>
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
