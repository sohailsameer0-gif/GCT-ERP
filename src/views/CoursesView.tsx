import React, { useState } from 'react';
import { BookOpen, Edit, Plus, Search, Trash2, X } from 'lucide-react';
import { useERP } from '../context/ERPContext';
import { Course } from '../types/erp';
import { ConfirmModal } from '../components/common/ConfirmModal';

export const CoursesView: React.FC = () => {
  const { state, can, createCourse, updateCourse, deleteCourse } = useERP();

  const [search, setSearch] = useState('');
  const [selectedProg, setSelectedProg] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCourse, setEditingCourse] = useState<Course | null>(null);
  const [courseToDelete, setCourseToDelete] = useState<Course | null>(null);

  const [formData, setFormData] = useState({
    code: '',
    name: '',
    creditHours: 3,
    type: 'theory' as Course['type'],
    programId: state.programs[0]?.id || '',
    departmentId: '',
    semesterId: state.semesters[0]?.id || '',
    status: 'Active' as Course['status'],
  });

  const [errMsg, setErrMsg] = useState('');

  const openCreateModal = () => {
    setEditingCourse(null);
    setFormData({
      code: '',
      name: '',
      creditHours: 3,
      type: 'theory',
      programId: state.programs[0]?.id || '',
      departmentId: '',
      semesterId: state.semesters[0]?.id || '',
      status: 'Active',
    });
    setErrMsg('');
    setIsModalOpen(true);
  };

  const openEditModal = (c: Course) => {
    setEditingCourse(c);
    setFormData({
      code: c.code,
      name: c.name,
      creditHours: c.creditHours,
      type: c.type,
      programId: c.programId,
      departmentId: c.departmentId || '',
      semesterId: c.semesterId,
      status: c.status,
    });
    setErrMsg('');
    setIsModalOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.code.trim()) return setErrMsg('Course code required');
    if (!formData.name.trim()) return setErrMsg('Course title required');

    try {
      if (editingCourse) {
        updateCourse(editingCourse.id, formData);
      } else {
        createCourse(formData);
      }
      setIsModalOpen(false);
    } catch (e: any) {
      setErrMsg(e.message || 'Operation failed');
    }
  };

  const filteredCourses = state.courses.filter((c) => {
    if (selectedProg && c.programId !== selectedProg) return false;
    if (search.trim()) {
      const q = search.toLowerCase();
      if (!c.code.toLowerCase().includes(q) && !c.name.toLowerCase().includes(q)) return false;
    }
    return true;
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-800 tracking-tight font-sans">
            Course Catalog & Syllabus
          </h1>
          <p className="text-xs text-slate-500">
            Credit hours, subjects, theory & practical laboratory distributions ({state.courses.length} courses)
          </p>
        </div>

        {can('courses.create') && (
          <button
            onClick={openCreateModal}
            className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-700 hover:to-indigo-800 text-white font-bold text-xs shadow-md shadow-indigo-600/20 flex items-center gap-2 self-start sm:self-auto"
          >
            <Plus size={16} />
            <span>Add Course</span>
          </button>
        )}
      </div>

      <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-200/80 flex flex-col sm:flex-row gap-3">
        <div className="flex-1 relative">
          <Search size={16} className="absolute left-3.5 top-3 text-slate-400" />
          <input
            type="text"
            placeholder="Search by course code or subject title..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-800 focus:bg-white focus:outline-hidden"
          />
        </div>

        <select
          value={selectedProg}
          onChange={(e) => setSelectedProg(e.target.value)}
          className="px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-700 focus:bg-white focus:outline-hidden"
        >
          <option value="">All Programs</option>
          {state.programs.map((p) => (
            <option key={p.id} value={p.id}>
              {p.code} — {p.name}
            </option>
          ))}
        </select>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-200/80 overflow-hidden">
        <table className="w-full text-left border-collapse text-xs">
          <thead>
            <tr className="bg-slate-50/80 border-b border-slate-200/80 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
              <th className="py-3.5 px-4">Code</th>
              <th className="py-3.5 px-4">Course Title</th>
              <th className="py-3.5 px-4">Program</th>
              <th className="py-3.5 px-4">Semester</th>
              <th className="py-3.5 px-4">Type</th>
              <th className="py-3.5 px-4">Credit Hours</th>
              <th className="py-3.5 px-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filteredCourses.map((c) => {
              const prog = state.programs.find((p) => p.id === c.programId);
              const sem = state.semesters.find((s) => s.id === c.semesterId);

              return (
                <tr key={c.id} className="hover:bg-indigo-50/20 transition-colors">
                  <td className="py-3 px-4 font-bold font-mono text-indigo-700">{c.code}</td>
                  <td className="py-3 px-4 font-semibold text-slate-800">{c.name}</td>
                  <td className="py-3 px-4 text-slate-600">{prog?.code || '—'}</td>
                  <td className="py-3 px-4 text-slate-600">{sem ? `Sem ${sem.number}` : '—'}</td>
                  <td className="py-3 px-4 uppercase text-[10px] font-extrabold text-slate-500">
                    <span className="px-2 py-0.5 rounded-md bg-slate-100 border border-slate-200">
                      {c.type}
                    </span>
                  </td>
                  <td className="py-3 px-4 font-bold text-slate-700">{c.creditHours} CH</td>
                  <td className="py-3 px-4 text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      {can('courses.create') && (
                        <>
                          <button
                            onClick={() => openEditModal(c)}
                            className="p-1.5 rounded-lg text-slate-500 hover:text-indigo-600 hover:bg-indigo-50"
                          >
                            <Edit size={14} />
                          </button>
                          <button
                            onClick={() => setCourseToDelete(c)}
                            className="p-1.5 rounded-lg text-slate-500 hover:text-rose-600 hover:bg-rose-50"
                            title="Delete Course"
                          >
                            <Trash2 size={14} />
                          </button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 space-y-4">
            <h2 className="font-bold text-slate-900 text-sm">
              {editingCourse ? 'Edit Course Record' : 'Register New Course'}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-3 text-xs">
              {errMsg && <div className="p-2.5 rounded-xl bg-rose-50 text-rose-700 font-medium">{errMsg}</div>}

              <div>
                <label className="block font-bold text-slate-700 mb-1">Course Code *</label>
                <input
                  type="text"
                  required
                  placeholder="BT-ME-201"
                  value={formData.code}
                  onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 font-mono"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Course Title *</label>
                <input
                  type="text"
                  required
                  placeholder="Fluid Mechanics & Hydraulics"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Credit Hours</label>
                  <input
                    type="number"
                    min={1}
                    max={6}
                    value={formData.creditHours}
                    onChange={(e) => setFormData({ ...formData, creditHours: Number(e.target.value) })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Course Type</label>
                  <select
                    value={formData.type}
                    onChange={(e) => setFormData({ ...formData, type: e.target.value as any })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200"
                  >
                    <option value="theory">Theory</option>
                    <option value="practical">Practical</option>
                    <option value="lab">Laboratory</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Program</label>
                  <select
                    value={formData.programId}
                    onChange={(e) => {
                      const pid = e.target.value;
                      const sems = state.semesters.filter((s) => s.programId === pid);
                      setFormData({
                        ...formData,
                        programId: pid,
                        semesterId: sems[0]?.id || '',
                      });
                    }}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200"
                  >
                    {state.programs.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.code}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Semester</label>
                  <select
                    value={formData.semesterId}
                    onChange={(e) => setFormData({ ...formData, semesterId: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200"
                  >
                    {state.semesters
                      .filter((s) => s.programId === formData.programId)
                      .map((s) => (
                        <option key={s.id} value={s.id}>
                          {s.name}
                        </option>
                      ))}
                  </select>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3">
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
                  {editingCourse ? 'Save Changes' : 'Create Course'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Course Modal */}
      <ConfirmModal
        isOpen={!!courseToDelete}
        title="Delete Course Curriculum"
        message={`Are you sure you want to delete course ${courseToDelete?.code} (${courseToDelete?.name})? Timetable slots mapped to this course will need reassignment.`}
        confirmLabel="Yes, Delete Course"
        onConfirm={() => {
          if (courseToDelete) {
            deleteCourse(courseToDelete.id);
            setCourseToDelete(null);
          }
        }}
        onCancel={() => setCourseToDelete(null)}
      />
    </div>
  );
};
