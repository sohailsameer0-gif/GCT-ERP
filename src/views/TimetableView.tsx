import React, { useState } from 'react';
import { Calendar, Clock, Edit, Plus, Trash2, X } from 'lucide-react';
import { useERP } from '../context/ERPContext';
import { timeToMinutes } from '../services/calculations';
import { TimetableSlot } from '../types/erp';
import { ConfirmModal } from '../components/common/ConfirmModal';

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'] as const;

export const TimetableView: React.FC = () => {
  const { state, session, can, createSlot, updateSlot, deleteSlot } = useERP();

  const isStudent = session?.role === 'student';
  const isParent = session?.role === 'parent';
  const currentStudent = isStudent
    ? state.students.find((s) => s.id === session?.linkedId || s.email.toLowerCase() === session?.email.toLowerCase())
    : isParent
    ? state.students.find((s) => s.id === state.parentLinks.find((l) => l.parentId === session?.linkedId)?.studentId)
    : null;

  const [activeDay, setActiveDay] = useState<typeof DAYS[number]>('Monday');
  const [selectedProg, setSelectedProg] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingSlot, setEditingSlot] = useState<TimetableSlot | null>(null);
  const [slotToDelete, setSlotToDelete] = useState<TimetableSlot | null>(null);

  const [formData, setFormData] = useState({
    day: 'Monday' as TimetableSlot['day'],
    startTime: '08:30',
    endTime: '09:30',
    courseId: state.courses[0]?.id || '',
    teacherId: state.teachers[0]?.id || '',
    programId: state.programs[0]?.id || '',
    departmentId: '',
    semesterId: state.semesters[0]?.id || '',
    sectionId: state.sections[0]?.id || '',
    className: 'Lecture Hall 1',
    slotType: 'Theory' as TimetableSlot['slotType'],
    status: 'Active' as 'Active' | 'Inactive',
  });

  const [errorMsg, setErrorMsg] = useState('');

  const openCreateModal = () => {
    setEditingSlot(null);
    setFormData({
      day: activeDay,
      startTime: '08:30',
      endTime: '09:30',
      courseId: state.courses[0]?.id || '',
      teacherId: state.teachers[0]?.id || '',
      programId: state.programs[0]?.id || '',
      departmentId: '',
      semesterId: state.semesters[0]?.id || '',
      sectionId: state.sections[0]?.id || '',
      className: 'Lecture Hall 1',
      slotType: 'Theory',
      status: 'Active',
    });
    setErrorMsg('');
    setIsModalOpen(true);
  };

  const openEditModal = (slot: TimetableSlot) => {
    setEditingSlot(slot);
    setFormData({
      day: slot.day,
      startTime: slot.startTime,
      endTime: slot.endTime,
      courseId: slot.courseId,
      teacherId: slot.teacherId,
      programId: slot.programId,
      departmentId: slot.departmentId || '',
      semesterId: slot.semesterId,
      sectionId: slot.sectionId,
      className: slot.className || 'Lecture Hall 1',
      slotType: slot.slotType,
      status: slot.status,
    });
    setErrorMsg('');
    setIsModalOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (timeToMinutes(formData.startTime) >= timeToMinutes(formData.endTime)) {
      return setErrorMsg('Slot end time must be strictly after start time.');
    }

    // Check teacher collision on the same day
    const teacherConflict = state.timetable.find((t) => {
      if (editingSlot && t.id === editingSlot.id) return false;
      if (t.day !== formData.day || t.teacherId !== formData.teacherId) return false;
      return (
        timeToMinutes(formData.startTime) < timeToMinutes(t.endTime) &&
        timeToMinutes(formData.endTime) > timeToMinutes(t.startTime)
      );
    });

    if (teacherConflict) {
      const teacherName = state.teachers.find((t) => t.id === formData.teacherId)?.name;
      return setErrorMsg(
        `Schedule Collision: ${teacherName} is already assigned to another class during this time window (${teacherConflict.startTime}–${teacherConflict.endTime}).`
      );
    }

    try {
      if (editingSlot) {
        updateSlot(editingSlot.id, formData);
      } else {
        createSlot(formData);
      }
      setIsModalOpen(false);
    } catch (err: any) {
      setErrorMsg(err.message || 'Operation failed');
    }
  };

  const daySlots = state.timetable
    .filter((slot) => slot.day === activeDay)
    .filter((slot) => {
      if (currentStudent) {
        if (slot.sectionId && currentStudent.currentSectionId && slot.sectionId !== currentStudent.currentSectionId) return false;
        if (slot.programId && currentStudent.programId && slot.programId !== currentStudent.programId) return false;
        return true;
      }
      return !selectedProg || slot.programId === selectedProg;
    })
    .sort((a, b) => timeToMinutes(a.startTime) - timeToMinutes(b.startTime));

  const currentSection = currentStudent ? state.sections.find((s) => s.id === currentStudent.currentSectionId) : null;
  const currentProgram = currentStudent ? state.programs.find((p) => p.id === currentStudent.programId) : null;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-800 tracking-tight font-sans">
            {isStudent ? 'My Class Timetable' : isParent ? "Ward's Class Timetable" : 'College Academic Timetable'}
          </h1>
          <p className="text-xs text-slate-500">
            {isStudent || isParent
              ? `${currentStudent?.name || 'Student'} · ${currentProgram?.code || ''} · Section ${currentSection?.name || 'A'} class schedule`
              : 'Weekly class schedule, lecture rooms, and faculty period assignments'}
          </p>
        </div>

        {can('timetable.manage') && (
          <button
            onClick={openCreateModal}
            className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-700 hover:to-indigo-800 text-white font-bold text-xs shadow-md shadow-indigo-600/20 flex items-center gap-2 self-start sm:self-auto"
          >
            <Plus size={16} />
            <span>Add Class Period</span>
          </button>
        )}
      </div>

      {/* Day Selector Tabs */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-1.5 p-1.5 rounded-2xl bg-white border border-slate-200/80 shadow-xs overflow-x-auto">
          {DAYS.map((day) => {
            const count = state.timetable.filter((s) => {
              if (s.day !== day) return false;
              if (currentStudent) {
                if (s.sectionId && currentStudent.currentSectionId && s.sectionId !== currentStudent.currentSectionId) return false;
                if (s.programId && currentStudent.programId && s.programId !== currentStudent.programId) return false;
                return true;
              }
              return true;
            }).length;
            const isSelected = activeDay === day;

            return (
              <button
                key={day}
                onClick={() => setActiveDay(day)}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 whitespace-nowrap ${
                  isSelected
                    ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                }`}
              >
                <span>{day}</span>
                <span
                  className={`px-1.5 py-0.5 rounded-full text-[10px] font-bold ${
                    isSelected ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-600'
                  }`}
                >
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        {!isStudent && !isParent && (
          <select
            value={selectedProg}
            onChange={(e) => setSelectedProg(e.target.value)}
            className="px-3 py-2 rounded-xl bg-white border border-slate-200 text-xs text-slate-700 shadow-xs focus:outline-hidden"
          >
            <option value="">All Programs</option>
            {state.programs.map((p) => (
              <option key={p.id} value={p.id}>
                {p.code} — {p.name}
              </option>
            ))}
          </select>
        )}
      </div>

      {/* Period Cards Grid for Selected Day */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {daySlots.length === 0 ? (
          <div className="col-span-full py-16 text-center text-slate-400 text-xs bg-white rounded-2xl border border-slate-200/80">
            No class periods scheduled for {activeDay}. Click &quot;Add Class Period&quot; to register a slot.
          </div>
        ) : (
          daySlots.map((slot) => {
            const course = state.courses.find((c) => c.id === slot.courseId);
            const teacher = state.teachers.find((t) => t.id === slot.teacherId);
            const sem = state.semesters.find((s) => s.id === slot.semesterId);
            const sec = state.sections.find((s) => s.id === slot.sectionId);
            const prog = state.programs.find((p) => p.id === slot.programId);

            return (
              <div
                key={slot.id}
                className="bg-white rounded-2xl p-5 shadow-sm border border-slate-200/80 flex flex-col justify-between hover:shadow-md transition-shadow relative"
              >
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <span className="px-2.5 py-1 rounded-lg bg-indigo-50 border border-indigo-100 text-indigo-700 font-mono text-xs font-black flex items-center gap-1.5">
                      <Clock size={13} /> {slot.startTime} – {slot.endTime}
                    </span>

                    <span
                      className={`px-2 py-0.5 rounded-md text-[10px] font-bold uppercase ${
                        slot.slotType === 'Theory'
                          ? 'bg-blue-50 text-blue-700'
                          : slot.slotType === 'Practical'
                          ? 'bg-emerald-50 text-emerald-700'
                          : 'bg-amber-50 text-amber-700'
                      }`}
                    >
                      {slot.slotType}
                    </span>
                  </div>

                  <h3 className="font-bold text-slate-900 text-sm mb-1 leading-snug">
                    {course ? `${course.code} — ${course.name}` : 'Course Slot'}
                  </h3>

                  <div className="text-xs text-slate-600 space-y-1 mb-4">
                    <div className="font-semibold text-slate-700">Faculty: {teacher?.name || 'Unassigned'}</div>
                    <div className="text-slate-500 text-[11px]">
                      Room / Lab: <strong>{slot.className || 'General Room'}</strong>
                    </div>
                    <div className="text-slate-400 text-[11px]">
                      {prog?.code} · {sem?.name} {sec ? `(Sec ${sec.name})` : ''}
                    </div>
                  </div>
                </div>

                {can('timetable.manage') && (
                  <div className="flex items-center justify-end gap-1.5 pt-3 border-t border-slate-100">
                    <button
                      onClick={() => openEditModal(slot)}
                      className="p-1.5 rounded-lg text-slate-500 hover:text-indigo-600 hover:bg-indigo-50"
                      title="Edit Slot"
                    >
                      <Edit size={14} />
                    </button>
                    <button
                      onClick={() => setSlotToDelete(slot)}
                      className="p-1.5 rounded-lg text-slate-500 hover:text-rose-600 hover:bg-rose-50"
                      title="Delete Slot"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full p-6 space-y-4">
            <h2 className="font-bold text-slate-900 text-sm">
              {editingSlot ? 'Edit Timetable Period' : 'Add Class Slot to Timetable'}
            </h2>

            <form onSubmit={handleSubmit} className="space-y-3 text-xs">
              {errorMsg && (
                <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 font-medium leading-relaxed">
                  {errorMsg}
                </div>
              )}

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Day of Week</label>
                  <select
                    value={formData.day}
                    onChange={(e) => setFormData({ ...formData, day: e.target.value as any })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200"
                  >
                    {DAYS.map((d) => (
                      <option key={d} value={d}>
                        {d}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Start Time (HH:MM)</label>
                  <input
                    type="time"
                    required
                    value={formData.startTime}
                    onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 font-mono"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">End Time (HH:MM)</label>
                  <input
                    type="time"
                    required
                    value={formData.endTime}
                    onChange={(e) => setFormData({ ...formData, endTime: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Subject / Course *</label>
                <select
                  value={formData.courseId}
                  onChange={(e) => setFormData({ ...formData, courseId: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200"
                >
                  {state.courses.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.code} — {c.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Assigned Teacher *</label>
                <select
                  value={formData.teacherId}
                  onChange={(e) => setFormData({ ...formData, teacherId: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200"
                >
                  {state.teachers.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.name} ({t.designation})
                    </option>
                  ))}
                </select>
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

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Classroom / Hall Name</label>
                  <input
                    type="text"
                    value={formData.className}
                    onChange={(e) => setFormData({ ...formData, className: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Slot Type</label>
                  <select
                    value={formData.slotType}
                    onChange={(e) => setFormData({ ...formData, slotType: e.target.value as any })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200"
                  >
                    <option value="Theory">Theory Lecture</option>
                    <option value="Practical">Practical Lab</option>
                    <option value="Lab">Workshop</option>
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
                  {editingSlot ? 'Save Changes' : 'Confirm Slot'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Slot Confirmation Modal */}
      <ConfirmModal
        isOpen={!!slotToDelete}
        title="Delete Timetable Period Slot"
        message={`Are you sure you want to remove the ${slotToDelete?.day} slot (${slotToDelete?.startTime} - ${slotToDelete?.endTime})? Any scheduled live class sessions for this slot will be cancelled.`}
        confirmLabel="Yes, Delete Slot"
        onConfirm={() => {
          if (slotToDelete) {
            deleteSlot(slotToDelete.id);
            setSlotToDelete(null);
          }
        }}
        onCancel={() => setSlotToDelete(null)}
      />
    </div>
  );
};
