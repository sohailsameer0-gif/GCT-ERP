import React, { useState } from 'react';
import { useERP } from '../context/ERPContext';
import { AuditLog } from '../types/erp';
import {
  ShieldAlert,
  Search,
  Filter,
  Calendar,
  Clock,
  User,
  Activity,
  FileCode,
  Download
} from 'lucide-react';

export const AuditLogsView: React.FC = () => {
  const { state, addToast } = useERP();
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [moduleFilter, setModuleFilter] = useState('all');
  const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null);

  const logs = state.auditLogs || [];

  const filteredLogs = logs.filter((log) => {
    const searchMatch =
      !searchTerm ||
      log.action.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.userId.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.module.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (log.recordId || '').toLowerCase().includes(searchTerm.toLowerCase());

    const roleMatch = roleFilter === 'all' || log.role.toLowerCase() === roleFilter.toLowerCase();
    const moduleMatch = moduleFilter === 'all' || log.module === moduleFilter;

    return searchMatch && roleMatch && moduleMatch;
  });

  const getActionBadge = (action: string) => {
    const act = action.toUpperCase();
    if (act.includes('CREATE') || act.includes('APPROVE') || act.includes('LOGIN')) {
      return 'bg-emerald-100 text-emerald-800 border-emerald-200';
    }
    if (act.includes('DELETE') || act.includes('REJECT') || act.includes('WARNING')) {
      return 'bg-rose-100 text-rose-800 border-rose-200';
    }
    if (act.includes('UPDATE') || act.includes('EDIT') || act.includes('PROMOTE')) {
      return 'bg-indigo-100 text-indigo-800 border-indigo-200';
    }
    return 'bg-slate-100 text-slate-800 border-slate-200';
  };

  const handleExportCSV = () => {
    const headers = ['Timestamp', 'User ID', 'Role', 'Action', 'Module', 'Record ID', 'After Payload'];
    const rows = filteredLogs.map((l) => [
      `"${l.timestamp}"`,
      `"${l.userId}"`,
      `"${l.role}"`,
      `"${l.action}"`,
      `"${l.module}"`,
      `"${l.recordId || ''}"`,
      `"${l.after ? JSON.stringify(l.after).replace(/"/g, '""') : ''}"`
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `GCT_Audit_Logs_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    addToast('Audit log export generated successfully', 'success');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
            <ShieldAlert className="w-7 h-7 text-indigo-600" />
            System Audit & Governance Logs
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Immutable tracking record of all institutional actions, admissions, attendance marks, and security events
          </p>
        </div>

        <button
          onClick={handleExportCSV}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-medium text-xs rounded-lg shadow-xs transition-all self-start sm:self-auto"
        >
          <Download className="w-3.5 h-3.5 text-slate-500" />
          Export Audit Trail
        </button>
      </div>

      {/* KPI Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-lg bg-indigo-50 flex items-center justify-center text-indigo-600">
            <Activity className="w-6 h-6" />
          </div>
          <div>
            <div className="text-2xl font-bold text-slate-800">{logs.length}</div>
            <div className="text-xs font-medium text-slate-500">Total Recorded Events</div>
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-lg bg-emerald-50 flex items-center justify-center text-emerald-600">
            <User className="w-6 h-6" />
          </div>
          <div>
            <div className="text-2xl font-bold text-emerald-700">
              {logs.filter((l) => l.action.includes('login') || l.action.includes('LOGIN')).length}
            </div>
            <div className="text-xs font-medium text-slate-500">Auth Sessions Logged</div>
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-lg bg-sky-50 flex items-center justify-center text-sky-600">
            <Calendar className="w-6 h-6" />
          </div>
          <div>
            <div className="text-2xl font-bold text-sky-700">
              {logs.filter((l) => l.module === 'attendance').length}
            </div>
            <div className="text-xs font-medium text-slate-500">Attendance Events</div>
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-lg bg-amber-50 flex items-center justify-center text-amber-600">
            <Clock className="w-6 h-6" />
          </div>
          <div>
            <div className="text-2xl font-bold text-amber-700">
              {logs.filter((l) => l.module === 'leaves').length}
            </div>
            <div className="text-xs font-medium text-slate-500">Leave Actions Tracked</div>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-col md:flex-row gap-3 items-center justify-between">
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search action, user ID, or record ID..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-2 border border-slate-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="px-3 py-2 border border-slate-200 rounded-lg text-xs bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="all">All Roles</option>
            <option value="sysadmin">System Administrator</option>
            <option value="chairman">Chairman</option>
            <option value="hod">HOD</option>
            <option value="coordinator">Coordinator</option>
            <option value="teacher">Teacher</option>
            <option value="student">Student</option>
          </select>

          <select
            value={moduleFilter}
            onChange={(e) => setModuleFilter(e.target.value)}
            className="px-3 py-2 border border-slate-200 rounded-lg text-xs bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="all">All Modules</option>
            <option value="auth">Auth & Session</option>
            <option value="attendance">Attendance Operations</option>
            <option value="leaves">Leave Workflows</option>
            <option value="students">Student Operations</option>
            <option value="timetable">Timetable</option>
            <option value="settings">Settings</option>
          </select>
        </div>
      </div>

      {/* Audit Log Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-600">
            <thead className="bg-slate-50 text-xs uppercase font-semibold text-slate-500 border-b border-slate-200">
              <tr>
                <th className="p-3.5">Timestamp</th>
                <th className="p-3.5">Actor ID</th>
                <th className="p-3.5">Role</th>
                <th className="p-3.5">Action Executed</th>
                <th className="p-3.5">Module / Target</th>
                <th className="p-3.5 text-right">Payload</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-mono text-xs">
              {filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-slate-400 font-sans">
                    No matching audit records found.
                  </td>
                </tr>
              ) : (
                filteredLogs.slice(0, 100).map((log) => (
                  <tr key={log.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="p-3.5 text-slate-500 whitespace-nowrap">
                      {new Date(log.timestamp).toLocaleString()}
                    </td>
                    <td className="p-3.5 font-sans font-semibold text-slate-800">
                      {log.userId}
                    </td>
                    <td className="p-3.5 font-sans">
                      <span className="px-2 py-0.5 rounded-full text-2xs font-semibold bg-slate-100 text-slate-700 uppercase">
                        {log.role}
                      </span>
                    </td>
                    <td className="p-3.5">
                      <span className={`px-2 py-0.5 rounded border text-2xs font-bold ${getActionBadge(log.action)}`}>
                        {log.action}
                      </span>
                    </td>
                    <td className="p-3.5 text-slate-600 font-sans">
                      <strong className="text-slate-800 uppercase text-xs">{log.module}</strong>{' '}
                      {log.recordId && <span className="font-mono text-2xs text-slate-400">({log.recordId})</span>}
                    </td>
                    <td className="p-3.5 text-right font-sans">
                      {log.after || log.before ? (
                        <button
                          onClick={() => setSelectedLog(log)}
                          className="px-2.5 py-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-semibold text-xs rounded transition-colors inline-flex items-center gap-1"
                        >
                          <FileCode className="w-3.5 h-3.5" />
                          View Data
                        </button>
                      ) : (
                        <span className="text-slate-400 text-xs">None</span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Details Modal */}
      {selectedLog && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h2 className="text-base font-bold text-slate-800 flex items-center gap-2">
                <ShieldAlert className="w-5 h-5 text-indigo-600" />
                Audit Record Payload
              </h2>
              <button
                onClick={() => setSelectedLog(null)}
                className="text-slate-400 hover:text-slate-600 text-lg font-bold"
              >
                ✕
              </button>
            </div>

            <div className="mt-4 space-y-3">
              <div className="text-xs text-slate-500">
                <strong>Event:</strong> {selectedLog.action} by <strong>{selectedLog.userId}</strong> ({selectedLog.role})
              </div>
              <div className="text-xs text-slate-500">
                <strong>Time:</strong> {selectedLog.timestamp}
              </div>

              <div className="bg-slate-900 text-emerald-400 p-4 rounded-xl font-mono text-xs overflow-x-auto max-h-72">
                <pre>{JSON.stringify(selectedLog.after || selectedLog.before, null, 2)}</pre>
              </div>
            </div>

            <div className="flex justify-end pt-4 border-t border-slate-100 mt-4">
              <button
                onClick={() => setSelectedLog(null)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
