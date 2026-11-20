import React, { useState } from 'react';
import {
  Edit,
  KeyRound,
  Plus,
  Search,
  Shield,
  Trash2,
  UserCheck,
  UserX,
  X,
} from 'lucide-react';
import { useERP } from '../context/ERPContext';
import { Account, UserRole } from '../types/erp';
import { ConfirmModal } from '../components/common/ConfirmModal';

export const StaffView: React.FC = () => {
  const {
    state,
    session,
    createStaffAccount,
    updateStaffAccount,
    deleteStaffAccount,
    deactivateStaffAccount,
  } = useERP();

  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingAcc, setEditingAcc] = useState<Account | null>(null);
  const [staffToDelete, setStaffToDelete] = useState<Account | null>(null);

  const [formData, setFormData] = useState({
    displayName: '',
    email: '',
    password: '',
    role: 'assistant' as UserRole,
    programId: '',
    departmentId: '',
  });

  const [err, setErr] = useState('');

  const openCreateModal = () => {
    setEditingAcc(null);
    setFormData({
      displayName: '',
      email: '',
      password: 'gct_password123',
      role: 'assistant',
      programId: state.programs[0]?.id || '',
      departmentId: state.departments[0]?.id || '',
    });
    setErr('');
    setIsModalOpen(true);
  };

  const openEditModal = (acc: Account) => {
    setEditingAcc(acc);
    setFormData({
      displayName: acc.displayName,
      email: acc.email,
      password: '',
      role: acc.role,
      programId: acc.programId || '',
      departmentId: acc.departmentId || '',
    });
    setErr('');
    setIsModalOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.displayName.trim()) return setErr('Name required');
    if (!formData.email.trim()) return setErr('Email required');

    try {
      if (editingAcc) {
        updateStaffAccount(editingAcc.id, formData);
      } else {
        createStaffAccount(formData);
      }
      setIsModalOpen(false);
    } catch (e: any) {
      setErr(e.message || 'Operation failed');
    }
  };

  // Combine and filter accounts
  const accounts = state.accounts.filter((a) => {
    if (roleFilter && a.role !== roleFilter) return false;
    if (search.trim()) {
      const q = search.toLowerCase();
      const match = `${a.displayName} ${a.email} ${a.role}`.toLowerCase();
      if (!match.includes(q)) return false;
    }
    return true;
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-800 tracking-tight font-sans">
            Staff & Role Permissions
          </h1>
          <p className="text-xs text-slate-500">
            Administrative credentials, staff accounts and role delegation
          </p>
        </div>

        <button
          onClick={openCreateModal}
          className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-700 hover:to-indigo-800 text-white font-bold text-xs shadow-md shadow-indigo-600/20 flex items-center gap-2 self-start sm:self-auto"
        >
          <Plus size={16} />
          <span>Create Staff User</span>
        </button>
      </div>

      <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-200/80 flex flex-col sm:flex-row gap-3">
        <div className="flex-1 relative">
          <Search size={16} className="absolute left-3.5 top-3 text-slate-400" />
          <input
            type="text"
            placeholder="Search accounts by name, email, role..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-800 focus:bg-white focus:outline-hidden"
          />
        </div>

        <select
          value={roleFilter}
          onChange={(e) => setRoleFilter(e.target.value)}
          className="px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-700 focus:bg-white focus:outline-hidden"
        >
          <option value="">All Roles</option>
          <option value="sysadmin">System Administrator</option>
          <option value="chairman">Chairman</option>
          <option value="hod">HOD</option>
          <option value="coordinator">Coordinator</option>
          <option value="clerk">Assistant Clerk</option>
          <option value="assistant">Office Assistant</option>
          <option value="teacher">Teacher</option>
          <option value="student">Student</option>
        </select>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-200/80 overflow-hidden">
        <table className="w-full text-left border-collapse text-xs">
          <thead>
            <tr className="bg-slate-50/80 border-b border-slate-200/80 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
              <th className="py-3.5 px-4">User</th>
              <th className="py-3.5 px-4">Email</th>
              <th className="py-3.5 px-4">Assigned Role</th>
              <th className="py-3.5 px-4">Scope</th>
              <th className="py-3.5 px-4">Status</th>
              <th className="py-3.5 px-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {accounts.map((acc) => {
              const prog = state.programs.find((p) => p.id === acc.programId);
              const dept = state.departments.find((d) => d.id === acc.departmentId);

              return (
                <tr key={acc.id} className="hover:bg-indigo-50/20 transition-colors">
                  <td className="py-3 px-4 font-bold text-slate-800">{acc.displayName}</td>
                  <td className="py-3 px-4 font-mono text-slate-600">{acc.email}</td>
                  <td className="py-3 px-4">
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase bg-indigo-50 text-indigo-700 border border-indigo-200">
                      {acc.role}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-slate-600">
                    {prog ? `${prog.code} ` : ''}
                    {dept ? `· ${dept.name}` : 'Institution-wide'}
                  </td>
                  <td className="py-3 px-4">
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        acc.status === 'Approved'
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          : acc.status === 'Pending'
                          ? 'bg-amber-50 text-amber-700 border border-amber-200'
                          : 'bg-rose-50 text-rose-700 border border-rose-200'
                      }`}
                    >
                      {acc.status}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      <button
                        onClick={() => openEditModal(acc)}
                        className="p-1.5 rounded-lg text-slate-500 hover:text-indigo-600 hover:bg-indigo-50"
                        title="Edit Account"
                      >
                        <Edit size={14} />
                      </button>
                      <button
                        onClick={() => deactivateStaffAccount(acc.id)}
                        className="p-1.5 rounded-lg text-slate-500 hover:text-amber-600 hover:bg-amber-50"
                        title="Toggle Active Status"
                      >
                        {acc.status === 'Inactive' ? <UserCheck size={14} /> : <UserX size={14} />}
                      </button>
                      {session?.userId !== acc.id && (
                        <button
                          onClick={() => setStaffToDelete(acc)}
                          className="p-1.5 rounded-lg text-slate-500 hover:text-rose-600 hover:bg-rose-50"
                          title="Delete Account"
                        >
                          <Trash2 size={14} />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
              <h2 className="font-bold text-base text-slate-800">
                {editingAcc ? 'Edit Staff User' : 'Create Staff Account'}
              </h2>
              <button onClick={() => setIsModalOpen(false)}>
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4 text-xs">
              {err && <div className="p-2.5 rounded-xl bg-rose-50 text-rose-700 font-medium">{err}</div>}

              <div>
                <label className="block font-bold text-slate-700 mb-1">Full Name *</label>
                <input
                  type="text"
                  required
                  value={formData.displayName}
                  onChange={(e) => setFormData({ ...formData, displayName: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Email Address *</label>
                <input
                  type="email"
                  required
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200"
                />
              </div>

              {!editingAcc && (
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Temporary Password</label>
                  <input
                    type="text"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 font-mono"
                  />
                </div>
              )}

              <div>
                <label className="block font-bold text-slate-700 mb-1">Assigned Role</label>
                <select
                  value={formData.role}
                  onChange={(e) => setFormData({ ...formData, role: e.target.value as any })}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200"
                >
                  <option value="sysadmin">System Administrator</option>
                  <option value="chairman">Chairman (B.Tech)</option>
                  <option value="hod">HOD (DAE / DIT)</option>
                  <option value="coordinator">Academic Coordinator</option>
                  <option value="clerk">Assistant Clerk</option>
                  <option value="assistant">Office Assistant</option>
                  <option value="teacher">Teacher</option>
                </select>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-indigo-600 font-bold text-white shadow-md shadow-indigo-600/20"
                >
                  {editingAcc ? 'Save Changes' : 'Create Account'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Staff Account Modal */}
      <ConfirmModal
        isOpen={!!staffToDelete}
        title="Delete Administrative Staff Account"
        message={`Are you sure you want to permanently delete the staff credentials for ${staffToDelete?.displayName} (${staffToDelete?.email})?`}
        confirmLabel="Yes, Delete Account"
        onConfirm={() => {
          if (staffToDelete) {
            deleteStaffAccount(staffToDelete.id);
            setStaffToDelete(null);
          }
        }}
        onCancel={() => setStaffToDelete(null)}
      />
    </div>
  );
};
