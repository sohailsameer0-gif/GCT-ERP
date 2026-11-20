import React, { useState } from 'react';
import {
  BookOpen,
  Calendar,
  Edit,
  Mail,
  Phone,
  Plus,
  Search,
  Trash2,
  Users,
  X,
} from 'lucide-react';
import { useERP } from '../context/ERPContext';
import { Teacher } from '../types/erp';
import { ConfirmModal } from '../components/common/ConfirmModal';

export const TeachersView: React.FC = () => {
  const { state, can, createTeacher, updateTeacher, deleteTeacher } = useERP();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDept, setSelectedDept] = useState('');

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTeacher, setEditingTeacher] = useState<Teacher | null>(null);
  const [teacherToDelete, setTeacherToDelete] = useState<Teacher | null>(null);

  const [formData, setFormData] = useState({
    name: '',
    employeeCode: '',
    email: '',
    designation: 'Lecturer',
    programId: state.programs[0]?.id || '',
    departmentId: state.departments[0]?.id || '',
    phone: '',
    active: true,
  });

  const [errorMsg, setErrorMsg] = useState('');

  const openCreateModal = () => {
    setEditingTeacher(null);
    setFormData({
      name: '',
      employeeCode: `EMP-${Math.floor(100 + Math.random() * 900)}`,
      email: '',
      designation: 'Lecturer',
      programId: state.programs[0]?.id || '',
      departmentId: state.departments[0]?.id || '',
      phone: '03001234567',
      active: true,
    });
    setErrorMsg('');
    setIsModalOpen(true);
  };

  const openEditModal = (t: Teacher) => {
    setEditingTeacher(t);
    setFormData({
      name: t.name,
      employeeCode: t.employeeCode,
      email: t.email,
      designation: t.designation,
      programId: t.programId || '',
      departmentId: t.departmentId || '',
      phone: t.phone || '',
      active: t.active,
    });
    setErrorMsg('');
    setIsModalOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) return setErrorMsg('Teacher name is required');
    if (!formData.email.trim()) return setErrorMsg('Email is required');

    try {
      if (editingTeacher) {
        updateTeacher(editingTeacher.id, formData);
      } else {
        createTeacher(formData);
      }
      setIsModalOpen(false);
    } catch (err: any) {
      setErrorMsg(err.message || 'Operation failed');
    }
  };

  const filteredTeachers = state.teachers.filter((t) => {
    if (selectedDept && t.departmentId !== selectedDept) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const match = `${t.name} ${t.employeeCode} ${t.email} ${t.designation}`.toLowerCase();
      if (!match.includes(q)) return false;
    }
    return true;
  });

  return (
    <div className="space-y-6">
      {/* View Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-800 tracking-tight font-sans">
            Faculty & Department Teachers
          </h1>
          <p className="text-xs text-slate-500">
            Government College of Technology Peshawar academic workforce ({state.teachers.length} members)
          </p>
        </div>

        {can('teachers.manage') && (
          <button
            onClick={openCreateModal}
            className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-700 hover:to-indigo-800 text-white font-bold text-xs shadow-md shadow-indigo-600/20 flex items-center gap-2 self-start sm:self-auto"
          >
            <Plus size={16} />
            <span>Add Faculty Member</span>
          </button>
        )}
      </div>

      {/* Filter toolbar */}
      <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-200/80 flex flex-col sm:flex-row gap-3">
        <div className="flex-1 relative">
          <Search size={16} className="absolute left-3.5 top-3 text-slate-400" />
          <input
            type="text"
            placeholder="Search faculty by name, designation, code..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-800 focus:bg-white focus:outline-hidden"
          />
        </div>

        <select
          value={selectedDept}
          onChange={(e) => setSelectedDept(e.target.value)}
          className="px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-700 focus:bg-white focus:outline-hidden"
        >
          <option value="">All Departments</option>
          {state.departments.map((d) => (
            <option key={d.id} value={d.id}>
              {d.name}
            </option>
          ))}
        </select>
      </div>

      {/* Teachers Grid Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {filteredTeachers.map((t) => {
          const dept = state.departments.find((d) => d.id === t.departmentId);
          const prog = state.programs.find((p) => p.id === t.programId);
          const assignedCourses = state.courseAssignments.filter((a) => a.teacherId === t.id);
          const timetableSlots = state.timetable.filter((slot) => slot.teacherId === t.id);

          return (
            <div
              key={t.id}
              className="bg-white rounded-2xl p-5 shadow-sm border border-slate-200/80 flex flex-col justify-between hover:shadow-md transition-shadow relative overflow-hidden"
            >
              <div>
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-2xl bg-indigo-50 border border-indigo-100 text-indigo-700 font-extrabold flex items-center justify-center text-sm shadow-xs shrink-0">
                      {t.name
                        .split(' ')
                        .filter((w) => !w.toLowerCase().includes('engr.'))
                        .slice(0, 2)
                        .map((w) => w[0])
                        .join('')
                        .toUpperCase() || 'FC'}
                    </div>
                    <div>
                      <h3 className="font-bold text-slate-900 text-sm">{t.name}</h3>
                      <p className="text-[11px] font-semibold text-indigo-600">{t.designation}</p>
                      <span className="text-[10px] text-slate-400 font-mono">{t.employeeCode}</span>
                    </div>
                  </div>

                  <span
                    className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                      t.active ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-600'
                    }`}
                  >
                    {t.active ? 'Active' : 'On Leave'}
                  </span>
                </div>

                <div className="space-y-1 text-xs text-slate-600 pt-2 border-t border-slate-100">
                  <div className="text-[11px] text-slate-500 truncate">
                    <strong>Dept:</strong> {dept?.name || 'General Faculty'} ({prog?.code || 'All'})
                  </div>
                  <div className="flex items-center gap-1.5 text-[11px]">
                    <Mail size={12} className="text-slate-400" />
                    <span className="truncate">{t.email}</span>
                  </div>
                  {t.phone && (
                    <div className="flex items-center gap-1.5 text-[11px]">
                      <Phone size={12} className="text-slate-400" />
                      <span>{t.phone}</span>
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-2 mt-4 pt-3 border-t border-slate-100 text-center">
                  <div className="p-2 rounded-xl bg-slate-50">
                    <div className="text-xs font-bold text-slate-800">{assignedCourses.length}</div>
                    <div className="text-[10px] text-slate-500">Subjects</div>
                  </div>
                  <div className="p-2 rounded-xl bg-slate-50">
                    <div className="text-xs font-bold text-slate-800">{timetableSlots.length}</div>
                    <div className="text-[10px] text-slate-500">Weekly Slots</div>
                  </div>
                </div>
              </div>

              {can('teachers.manage') && (
                <div className="flex items-center justify-end gap-2 mt-4 pt-3 border-t border-slate-100">
                  <button
                    onClick={() => openEditModal(t)}
                    className="p-1.5 rounded-lg text-slate-500 hover:text-indigo-600 hover:bg-indigo-50"
                    title="Edit Faculty Record"
                  >
                    <Edit size={15} />
                  </button>
                  <button
                    onClick={() => setTeacherToDelete(t)}
                    className="p-1.5 rounded-lg text-slate-500 hover:text-rose-600 hover:bg-rose-50"
                    title="Delete Teacher"
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Create / Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
              <h2 className="font-bold text-base text-slate-800">
                {editingTeacher ? `Edit Faculty — ${editingTeacher.name}` : 'Add Faculty Member'}
              </h2>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4 text-xs">
              {errorMsg && (
                <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 font-medium">
                  {errorMsg}
                </div>
              )}

              <div className="space-y-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Full Name & Title *</label>
                  <input
                    type="text"
                    required
                    placeholder="Engr. Muhammad Ali"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 focus:bg-white focus:outline-hidden"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Employee Code *</label>
                  <input
                    type="text"
                    required
                    value={formData.employeeCode}
                    onChange={(e) => setFormData({ ...formData, employeeCode: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 focus:bg-white focus:outline-hidden"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Official Email *</label>
                  <input
                    type="email"
                    required
                    placeholder="ali.faculty@gct.edu.pk"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 focus:bg-white focus:outline-hidden"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Academic Designation</label>
                  <select
                    value={formData.designation}
                    onChange={(e) => setFormData({ ...formData, designation: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 focus:bg-white focus:outline-hidden"
                  >
                    <option>Professor</option>
                    <option>Associate Professor</option>
                    <option>Assistant Professor</option>
                    <option>Senior Lecturer</option>
                    <option>Lecturer</option>
                    <option>Lab Engineer</option>
                    <option>Instructor</option>
                    <option>Workshop Supervisor</option>
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Program</label>
                    <select
                      value={formData.programId}
                      onChange={(e) => setFormData({ ...formData, programId: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 focus:bg-white focus:outline-hidden"
                    >
                      {state.programs.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.code}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Department</label>
                    <select
                      value={formData.departmentId}
                      onChange={(e) => setFormData({ ...formData, departmentId: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 focus:bg-white focus:outline-hidden"
                    >
                      {state.departments.map((d) => (
                        <option key={d.id} value={d.id}>
                          {d.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Contact Phone</label>
                  <input
                    type="text"
                    placeholder="03001234567"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 focus:bg-white focus:outline-hidden"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 font-semibold text-slate-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 font-bold text-white shadow-md shadow-indigo-600/20"
                >
                  {editingTeacher ? 'Save Changes' : 'Register Faculty'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Teacher Modal */}
      <ConfirmModal
        isOpen={!!teacherToDelete}
        title="Remove Faculty Member"
        message={`Are you sure you want to remove faculty member ${teacherToDelete?.name} (${teacherToDelete?.employeeCode})? This will unassign any active timetable courses.`}
        confirmLabel="Yes, Remove Faculty"
        onConfirm={() => {
          if (teacherToDelete) {
            deleteTeacher(teacherToDelete.id);
            setTeacherToDelete(null);
          }
        }}
        onCancel={() => setTeacherToDelete(null)}
      />
    </div>
  );
};
