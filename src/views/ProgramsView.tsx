import React, { useState } from 'react';
import { Award, Building, Edit, Plus, Trash2, X } from 'lucide-react';
import { useERP } from '../context/ERPContext';
import { Department, Program } from '../types/erp';

export const ProgramsView: React.FC = () => {
  const { state, createProgram, createDepartment } = useERP();

  const [isProgModalOpen, setIsProgModalOpen] = useState(false);
  const [isDeptModalOpen, setIsDeptModalOpen] = useState(false);
  const [targetProgramId, setTargetProgramId] = useState('');

  const [progForm, setProgForm] = useState({
    code: '',
    name: '',
    durationYears: 4,
    totalSemesters: 8,
    deptHeadRole: 'chairman' as 'chairman' | 'hod',
  });

  const [deptForm, setDeptForm] = useState({
    code: '',
    name: '',
    programId: '',
  });

  const handleProgramSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!progForm.code || !progForm.name) return;
    createProgram({ ...progForm, status: 'Active' });
    setIsProgModalOpen(false);
  };

  const handleDeptSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!deptForm.name) return;
    createDepartment({
      ...deptForm,
      programId: targetProgramId || state.programs[0]?.id || '',
      status: 'Active',
    });
    setIsDeptModalOpen(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-800 tracking-tight font-sans">
            Academic Programs & Departments
          </h1>
          <p className="text-xs text-slate-500">
            Institutional framework for B.Tech (4 Years), DAE (3 Years), DIT, and Allied Studies
          </p>
        </div>

        <button
          onClick={() => {
            setProgForm({ code: '', name: '', durationYears: 4, totalSemesters: 8, deptHeadRole: 'chairman' });
            setIsProgModalOpen(true);
          }}
          className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-md shadow-indigo-600/20 flex items-center gap-2 self-start sm:self-auto"
        >
          <Plus size={16} />
          <span>Add Academic Program</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {state.programs.map((prog) => {
          const depts = state.departments.filter((d) => d.programId === prog.id);
          const semesters = state.semesters.filter((s) => s.programId === prog.id);

          return (
            <div
              key={prog.id}
              className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200/80 flex flex-col justify-between"
            >
              <div>
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="px-2.5 py-0.5 rounded-md bg-indigo-100 text-indigo-800 text-[11px] font-black tracking-wider uppercase font-mono">
                        {prog.code}
                      </span>
                      <h2 className="font-extrabold text-slate-900 text-base">{prog.name}</h2>
                    </div>
                    <div className="text-xs text-slate-500 mt-1">
                      {prog.durationYears} Years Duration · {prog.totalSemesters} Total Semesters · Headed by{' '}
                      <strong className="text-slate-700 uppercase">{prog.deptHeadRole}</strong>
                    </div>
                  </div>
                </div>

                <div className="mt-4 pt-4 border-t border-slate-100">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold text-slate-700">Departments ({depts.length})</span>
                    <button
                      onClick={() => {
                        setTargetProgramId(prog.id);
                        setDeptForm({ code: '', name: '', programId: prog.id });
                        setIsDeptModalOpen(true);
                      }}
                      className="text-[11px] font-bold text-indigo-600 hover:underline flex items-center gap-1"
                    >
                      <Plus size={13} /> Add Dept
                    </button>
                  </div>

                  <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                    {depts.map((d) => (
                      <div
                        key={d.id}
                        className="px-3 py-2 rounded-xl bg-slate-50 text-xs flex items-center justify-between border border-slate-100"
                      >
                        <span className="font-semibold text-slate-800">{d.name}</span>
                        <span className="text-[10px] font-mono text-slate-400">{d.code}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="mt-5 pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
                <span>{semesters.length} registered semesters</span>
                <span className="font-bold text-emerald-600">Active Curriculum</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Program Modal */}
      {isProgModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 space-y-4">
            <h2 className="font-bold text-slate-900 text-sm">Add Academic Program</h2>
            <form onSubmit={handleProgramSubmit} className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Program Code (e.g. BT, DAE, DIT)</label>
                <input
                  type="text"
                  required
                  placeholder="BT"
                  value={progForm.code}
                  onChange={(e) => setProgForm({ ...progForm, code: e.target.value.toUpperCase() })}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Full Program Title</label>
                <input
                  type="text"
                  required
                  placeholder="Bachelor of Technology"
                  value={progForm.name}
                  onChange={(e) => setProgForm({ ...progForm, name: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Duration (Years)</label>
                  <input
                    type="number"
                    min={1}
                    max={6}
                    value={progForm.durationYears}
                    onChange={(e) => setProgForm({ ...progForm, durationYears: Number(e.target.value) })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Total Semesters</label>
                  <input
                    type="number"
                    min={1}
                    max={12}
                    value={progForm.totalSemesters}
                    onChange={(e) => setProgForm({ ...progForm, totalSemesters: Number(e.target.value) })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Department Head Role</label>
                <select
                  value={progForm.deptHeadRole}
                  onChange={(e) => setProgForm({ ...progForm, deptHeadRole: e.target.value as any })}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200"
                >
                  <option value="chairman">Chairman (for B.Tech)</option>
                  <option value="hod">Head of Department (for DAE & DIT)</option>
                </select>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setIsProgModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-indigo-600 font-bold text-white"
                >
                  Create Program
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Dept Modal */}
      {isDeptModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 space-y-4">
            <h2 className="font-bold text-slate-900 text-sm">Add Department to Program</h2>
            <form onSubmit={handleDeptSubmit} className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Department Code</label>
                <input
                  type="text"
                  placeholder="BT-CIVIL"
                  value={deptForm.code}
                  onChange={(e) => setDeptForm({ ...deptForm, code: e.target.value.toUpperCase() })}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Department Name *</label>
                <input
                  type="text"
                  required
                  placeholder="Civil Engineering Technology"
                  value={deptForm.name}
                  onChange={(e) => setDeptForm({ ...deptForm, name: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setIsDeptModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-indigo-600 font-bold text-white"
                >
                  Add Department
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
