import React, { useState } from 'react';
import { Check, Clock, UserCheck, UserX, X } from 'lucide-react';
import { useERP } from '../context/ERPContext';
import { formatDateTime } from '../services/calculations';

export const RegistrationsAdminView: React.FC = () => {
  const { state, approveRegistration, rejectRegistration, addToast } = useERP();
  const [rejectingId, setRejectingId] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState('');

  const pendingRequests = state.accounts.filter((a) => a.status === 'Pending');
  const pastDecisions = state.accounts.filter((a) => a.status === 'Approved' || a.status === 'Rejected');

  const handleApprove = (accountId: string) => {
    try {
      approveRegistration(accountId);
    } catch (e: any) {
      addToast(e.message || 'Approval failed', 'error');
    }
  };

  const handleConfirmReject = () => {
    if (!rejectingId) return;
    try {
      rejectRegistration(rejectingId, rejectReason || 'Ineligible application.');
      setRejectingId(null);
      setRejectReason('');
    } catch (e: any) {
      addToast(e.message || 'Rejection failed', 'error');
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-slate-800 tracking-tight font-sans">
          Public Registration Requests
        </h1>
        <p className="text-xs text-slate-500">
          Review and approve self-registered student, faculty, and guardian accounts
        </p>
      </div>

      {/* Pending Queue */}
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200/80">
        <div className="flex items-center gap-2 mb-4">
          <Clock size={18} className="text-amber-500" />
          <h2 className="text-sm font-bold text-slate-800">
            Pending Queue ({pendingRequests.length})
          </h2>
        </div>

        {pendingRequests.length === 0 ? (
          <div className="py-8 text-center text-slate-400 text-xs">
            No pending registration requests in the queue.
          </div>
        ) : (
          <div className="space-y-3">
            {pendingRequests.map((req) => {
              const prog = state.programs.find((p) => p.id === req.programId);
              const dept = state.departments.find((d) => d.id === req.departmentId);

              return (
                <div
                  key={req.id}
                  className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 flex flex-col md:flex-row md:items-center justify-between gap-4"
                >
                  <div className="space-y-1 text-xs">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-slate-900 text-sm">{req.displayName}</span>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase bg-amber-100 text-amber-800">
                        {req.role}
                      </span>
                    </div>

                    <div className="text-slate-600 font-mono text-[11px]">
                      {req.email} {req.cnic ? `· CNIC: ${req.cnic}` : ''}
                    </div>

                    <div className="text-slate-500 text-[11px]">
                      Program: {prog?.name || 'All'} {dept ? `· Dept: ${dept.name}` : ''} · Applied on{' '}
                      {formatDateTime(req.createdAt)}
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleApprove(req.id)}
                      className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md shadow-emerald-600/20 flex items-center gap-1.5 transition-colors"
                    >
                      <Check size={15} />
                      <span>Approve</span>
                    </button>
                    <button
                      onClick={() => {
                        setRejectingId(req.id);
                        setRejectReason('');
                      }}
                      className="px-3.5 py-2 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold text-xs border border-rose-200 flex items-center gap-1.5 transition-colors"
                    >
                      <X size={15} />
                      <span>Reject</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Decision History */}
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200/80">
        <h2 className="text-sm font-bold text-slate-800 mb-3">Recent Registration Records</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50 text-[10px] uppercase font-bold text-slate-500 border-b border-slate-200">
                <th className="py-2.5 px-3">Applicant Name</th>
                <th className="py-2.5 px-3">Email</th>
                <th className="py-2.5 px-3">Role</th>
                <th className="py-2.5 px-3">Status</th>
                <th className="py-2.5 px-3">Applied At</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {pastDecisions.slice(-10).reverse().map((a) => (
                <tr key={a.id}>
                  <td className="py-2.5 px-3 font-semibold text-slate-800">{a.displayName}</td>
                  <td className="py-2.5 px-3 font-mono text-slate-600">{a.email}</td>
                  <td className="py-2.5 px-3 uppercase text-[10px] font-bold text-slate-500">{a.role}</td>
                  <td className="py-2.5 px-3">
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        a.status === 'Approved' ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                      }`}
                    >
                      {a.status}
                    </span>
                  </td>
                  <td className="py-2.5 px-3 text-slate-400">{formatDateTime(a.createdAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Rejection Modal */}
      {rejectingId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl shadow-2xl max-w-sm w-full p-6 space-y-4">
            <h3 className="font-bold text-slate-900 text-sm">Reject Registration Request</h3>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Reason for Rejection</label>
              <textarea
                rows={3}
                placeholder="CNIC mismatch or invalid academic enrollment..."
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                className="w-full p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs focus:bg-white focus:outline-hidden"
              />
            </div>
            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => setRejectingId(null)}
                className="px-3 py-1.5 rounded-xl bg-slate-100 font-semibold text-xs text-slate-700"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmReject}
                className="px-4 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-700 font-bold text-xs text-white"
              >
                Confirm Rejection
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
