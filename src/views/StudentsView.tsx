import React, { useState } from 'react';
import {
  Download,
  Edit,
  GraduationCap,
  MessageCircle,
  Plus,
  Search,
  Trash2,
  UserCheck,
  UserMinus,
  UserX,
  RotateCcw,
  AlertCircle,
  Ban,
  X,
} from 'lucide-react';
import { useERP } from '../context/ERPContext';
import { calculateAttendanceSummary, formatDate, waLink } from '../services/calculations';
import { Student } from '../types/erp';
import { ConfirmModal } from '../components/common/ConfirmModal';

export const StudentsView: React.FC = () => {
  const {
    state,
    session,
    can,
    getScope,
    createStudent,
    updateStudent,
    deleteStudent,
    strikeOffStudent,
    reinstateStudent,
    cancelStudentAdmission,
  } = useERP();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedProgram, setSelectedProgram] = useState('');
  const [selectedDepartment, setSelectedDepartment] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');

  // Disciplinary / Status Action Modals
  const [strikeModalStudent, setStrikeModalStudent] = useState<Student | null>(null);
  const [strikeReason, setStrikeReason] = useState('Continuous attendance shortage below mandatory 70% threshold.');
  const [cancelModalStudent, setCancelModalStudent] = useState<Student | null>(null);
  const [cancelReason, setCancelReason] = useState('Admission cancelled on formal application / college order.');
  const [reinstateModalStudent, setReinstateModalStudent] = useState<Student | null>(null);
  const [reinstateRemarks, setReinstateRemarks] = useState('Pardon granted by Chairman Directorate upon submitted undertaking.');
  const [studentToDelete, setStudentToDelete] = useState<Student | null>(null);

  const scope = getScope();

  // Scoped programs and departments based on user credentials
  const allowedPrograms = scope.unrestricted
    ? state.programs
    : scope.programIds.length > 0
      ? state.programs.filter((p) => scope.programIds.includes(p.id))
      : state.programs;

  const allowedDepartments = scope.unrestricted
    ? state.departments
    : scope.departmentIds.length > 0
      ? state.departments.filter((d) => scope.departmentIds.includes(d.id))
      : scope.programIds.length > 0
        ? state.departments.filter((d) => scope.programIds.includes(d.programId))
        : state.departments;

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingStudent, setEditingStudent] = useState<Student | null>(null);

  // Form Fields
  const [formData, setFormData] = useState({
    name: '',
    fatherName: '',
    admissionNumber: '',
    registrationNumber: '',
    classNumber: '',
    studentMobile: '',
    fatherMobile: '',
    cnic: '',
    dob: '2005-01-01',
    email: '',
    programId: state.programs[0]?.id || '',
    departmentId: state.departments[0]?.id || '',
    currentSemesterId: state.semesters[0]?.id || '',
    currentSectionId: state.sections[0]?.id || '',
    batch: '2026-2030',
    session: 'Spring',
    status: 'Active' as Student['status'],
    admissionDate: new Date().toISOString().slice(0, 10),
  });

  const [formError, setFormError] = useState('');

  const openCreateModal = () => {
    setEditingStudent(null);
    const initialProg = allowedPrograms[0]?.id || state.programs[0]?.id || '';
    const initialDepts = allowedDepartments.filter((d) => d.programId === initialProg);
    const initialDept = initialDepts[0]?.id || allowedDepartments[0]?.id || '';
    const initialSems = state.semesters.filter((s) => s.programId === initialProg);
    const initialSem = initialSems[0]?.id || state.semesters[0]?.id || '';
    const initialSecs = state.sections.filter((sec) => sec.semesterId === initialSem);
    const initialSec = initialSecs[0]?.id || state.sections[0]?.id || '';

    setFormData({
      name: '',
      fatherName: '',
      admissionNumber: `GCT-ADM-${Math.floor(1000 + Math.random() * 9000)}`,
      registrationNumber: `GCT-REG-${Math.floor(1000 + Math.random() * 9000)}`,
      classNumber: `MECH-${Math.floor(10 + Math.random() * 90)}`,
      studentMobile: '03001234567',
      fatherMobile: '03007654321',
      cnic: '1730112345671',
      dob: '2005-01-01',
      email: '',
      programId: initialProg,
      departmentId: initialDept,
      currentSemesterId: initialSem,
      currentSectionId: initialSec,
      batch: '2026-2030',
      session: 'Spring',
      status: 'Active',
      admissionDate: new Date().toISOString().slice(0, 10),
    });
    setFormError('');
    setIsModalOpen(true);
  };

  const openEditModal = (stu: Student) => {
    setEditingStudent(stu);
    setFormData({
      name: stu.name,
      fatherName: stu.fatherName,
      admissionNumber: stu.admissionNumber,
      registrationNumber: stu.registrationNumber,
      classNumber: stu.classNumber,
      studentMobile: stu.studentMobile,
      fatherMobile: stu.fatherMobile || '',
      cnic: stu.cnic,
      dob: stu.dob,
      email: stu.email,
      programId: stu.programId,
      departmentId: stu.departmentId,
      currentSemesterId: stu.currentSemesterId,
      currentSectionId: stu.currentSectionId,
      batch: stu.batch || '2026-2030',
      session: stu.session || 'Spring',
      status: stu.status,
      admissionDate: stu.admissionDate,
    });
    setFormError('');
    setIsModalOpen(true);
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');

    if (!formData.name.trim()) return setFormError('Student full name is required');
    if (!formData.admissionNumber.trim()) return setFormError('Admission number is required');
    if (!formData.cnic.replace(/\D/g, '') || formData.cnic.replace(/\D/g, '').length !== 13) {
      return setFormError('Valid 13-digit Pakistani CNIC is required (e.g., 1730112345671)');
    }
    if (!formData.studentMobile || !formData.studentMobile.startsWith('03')) {
      return setFormError('Student mobile must be an 11-digit number starting with 03');
    }

    const email = formData.email.trim() || `stu_${formData.admissionNumber.toLowerCase().replace(/[^a-z0-9]/g, '')}@gct.edu.pk`;

    try {
      if (editingStudent) {
        updateStudent(editingStudent.id, { ...formData, email });
      } else {
        createStudent({ ...formData, email });
      }
      setIsModalOpen(false);
    } catch (err: any) {
      setFormError(err.message || 'Operation failed');
    }
  };

  // Filter students with role-based scope
  const filteredStudents = state.students.filter((s) => {
    if (!scope.unrestricted) {
      if (scope.departmentIds.length > 0 && !scope.departmentIds.includes(s.departmentId)) return false;
      if (scope.programIds.length > 0 && !scope.programIds.includes(s.programId)) return false;
    }
    if (selectedProgram && s.programId !== selectedProgram) return false;
    if (selectedDepartment && s.departmentId !== selectedDepartment) return false;
    if (selectedStatus && s.status !== selectedStatus) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const haystack = `${s.name} ${s.fatherName} ${s.registrationNumber} ${s.admissionNumber} ${s.cnic} ${s.studentMobile}`.toLowerCase();
      if (!haystack.includes(q)) return false;
    }
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-800 tracking-tight font-sans">
            Students & Admissions Directory
          </h1>
          <p className="text-xs text-slate-500">
            Total of {state.students.length} students enrolled across B.Tech, DAE & DIT programs
          </p>
        </div>

        {can('students.create') && (
          <button
            onClick={openCreateModal}
            className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-700 hover:to-indigo-800 text-white font-bold text-xs shadow-md shadow-indigo-600/20 flex items-center gap-2 transition-all self-start sm:self-auto"
          >
            <Plus size={16} />
            <span>Admit New Student</span>
          </button>
        )}
      </div>

      {/* Filter Toolbar */}
      <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-200/80 flex flex-col md:flex-row gap-3">
        <div className="flex-1 relative">
          <Search size={16} className="absolute left-3.5 top-3 text-slate-400" />
          <input
            type="text"
            placeholder="Search by name, roll#, CNIC, mobile..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-800 focus:bg-white focus:border-indigo-500 focus:outline-hidden transition-all"
          />
        </div>

        <select
          value={selectedProgram}
          onChange={(e) => {
            setSelectedProgram(e.target.value);
            setSelectedDepartment('');
          }}
          className="px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-700 focus:bg-white focus:outline-hidden"
        >
          <option value="">All Scoped Programs</option>
          {allowedPrograms.map((p) => (
            <option key={p.id} value={p.id}>
              {p.code} — {p.name}
            </option>
          ))}
        </select>

        <select
          value={selectedDepartment}
          onChange={(e) => setSelectedDepartment(e.target.value)}
          className="px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-700 focus:bg-white focus:outline-hidden"
        >
          <option value="">All Scoped Departments</option>
          {allowedDepartments
            .filter((d) => !selectedProgram || d.programId === selectedProgram)
            .map((d) => (
              <option key={d.id} value={d.id}>
                {d.name}
              </option>
            ))}
        </select>

        <select
          value={selectedStatus}
          onChange={(e) => setSelectedStatus(e.target.value)}
          className="px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-700 focus:bg-white focus:outline-hidden"
        >
          <option value="">All Statuses</option>
          <option value="Active">Active Standing</option>
          <option value="StruckOff">Struck Off (خارج شدہ)</option>
          <option value="Cancelled">Admission Cancelled (منسوخ)</option>
          <option value="Suspended">Suspended</option>
          <option value="Graduated">Graduated</option>
          <option value="Left">Left / Migrated</option>
        </select>
      </div>

      {/* Students Data Table */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200/80 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-200/80 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                <th className="py-3.5 px-4">Adm # / Reg #</th>
                <th className="py-3.5 px-4">Student Name</th>
                <th className="py-3.5 px-4">Program & Dept</th>
                <th className="py-3.5 px-4">Semester</th>
                <th className="py-3.5 px-4">Attendance %</th>
                <th className="py-3.5 px-4">Contact</th>
                <th className="py-3.5 px-4">Status</th>
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              {filteredStudents.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400">
                    No students match your filter criteria.
                  </td>
                </tr>
              ) : (
                filteredStudents.map((stu) => {
                  const program = state.programs.find((p) => p.id === stu.programId);
                  const department = state.departments.find((d) => d.id === stu.departmentId);
                  const semester = state.semesters.find((s) => s.id === stu.currentSemesterId);
                  const section = state.sections.find((s) => s.id === stu.currentSectionId);
                  const summary = calculateAttendanceSummary(stu.id, state);

                  const waChatLink = waLink(
                    stu.studentMobile,
                    `Hello ${stu.name}, this is an official message from Government College of Technology Peshawar regarding your academic standing.`
                  );

                  return (
                    <tr key={stu.id} className="hover:bg-indigo-50/30 transition-colors">
                      <td className="py-3 px-4 font-mono">
                        <div className="font-bold text-slate-800">{stu.admissionNumber}</div>
                        <div className="text-[10px] text-slate-400">{stu.registrationNumber}</div>
                      </td>
                      <td className="py-3 px-4">
                        <div className="font-bold text-slate-800 flex items-center gap-1.5">
                          {stu.name}
                        </div>
                        <div className="text-[11px] text-slate-500">S/O {stu.fatherName}</div>
                      </td>
                      <td className="py-3 px-4">
                        <div className="font-semibold text-slate-700">{program?.code}</div>
                        <div className="text-[11px] text-slate-500 truncate max-w-[150px]">
                          {department?.name}
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <span className="font-semibold text-slate-700">{semester ? `Sem ${semester.number}` : '—'}</span>
                        <span className="text-[10px] text-slate-400 ml-1">({section ? `Sec ${section.name}` : ''})</span>
                      </td>
                      <td className="py-3 px-4">
                        <span
                          className={`font-black text-xs px-2 py-0.5 rounded-md ${
                            summary.isShortage
                              ? 'bg-rose-100 text-rose-700'
                              : 'bg-emerald-100 text-emerald-700'
                          }`}
                        >
                          {summary.adjustedPercentage.toFixed(1)}%
                        </span>
                        {summary.isShortage && (
                          <div className="text-[10px] font-bold text-rose-500 mt-0.5">Shortage!</div>
                        )}
                      </td>
                      <td className="py-3 px-4 font-mono text-slate-600">
                        <div>{stu.studentMobile}</div>
                        {waChatLink && (
                          <a
                            href={waChatLink}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-600 hover:text-emerald-700 mt-0.5"
                          >
                            <MessageCircle size={11} /> WhatsApp
                          </a>
                        )}
                      </td>
                      <td className="py-3 px-4">
                        <span
                          className={`px-2.5 py-0.5 rounded-full text-[10px] font-black inline-flex items-center gap-1 ${
                            stu.status === 'Active'
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : stu.status === 'StruckOff'
                              ? 'bg-rose-100 text-rose-800 border border-rose-300 animate-pulse'
                              : stu.status === 'Cancelled'
                              ? 'bg-slate-200 text-slate-800 border border-slate-300'
                              : 'bg-amber-50 text-amber-700 border border-amber-200'
                          }`}
                        >
                          {stu.status === 'StruckOff' && <AlertCircle size={10} />}
                          {stu.status === 'Cancelled' && <Ban size={10} />}
                          {stu.status === 'Active'
                            ? 'Active'
                            : stu.status === 'StruckOff'
                            ? 'Struck Off (خارج)'
                            : stu.status === 'Cancelled'
                            ? 'Cancelled (منسوخ)'
                            : stu.status}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {/* Strike Off / Reinstate Quick Action */}
                          {['chairman', 'sysadmin', 'hod'].includes(session?.role || '') && (
                            <>
                              {stu.status === 'Active' ? (
                                <button
                                  type="button"
                                  onClick={() => {
                                    setStrikeModalStudent(stu);
                                    setStrikeReason('Continuous attendance shortage below mandatory 70% threshold.');
                                  }}
                                  className="px-2 py-1 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold text-[11px] border border-rose-200 flex items-center gap-1 transition-colors"
                                  title="Strike Off Student from Rolls"
                                >
                                  <UserMinus size={13} />
                                  <span>Strike Off</span>
                                </button>
                              ) : (
                                <button
                                  type="button"
                                  onClick={() => {
                                    setReinstateModalStudent(stu);
                                    setReinstateRemarks('Restored to active rolls upon Chairman clearance.');
                                  }}
                                  className="px-2 py-1 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-bold text-[11px] border border-emerald-200 flex items-center gap-1 transition-colors"
                                  title="Reinstate Student to Active Standing"
                                >
                                  <RotateCcw size={13} />
                                  <span>Reinstate</span>
                                </button>
                              )}

                              {stu.status !== 'Cancelled' && (
                                <button
                                  type="button"
                                  onClick={() => {
                                    setCancelModalStudent(stu);
                                    setCancelReason('Admission cancelled on formal application / college order.');
                                  }}
                                  className="p-1.5 rounded-lg text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition-colors"
                                  title="Cancel Admission"
                                >
                                  <Ban size={14} />
                                </button>
                              )}
                            </>
                          )}

                          {can('students.update') && (
                            <button
                              onClick={() => openEditModal(stu)}
                              className="p-1.5 rounded-lg text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 transition-colors"
                              title="Edit Student"
                            >
                              <Edit size={15} />
                            </button>
                          )}
                          {can('students.delete') && (
                            <button
                              onClick={() => setStudentToDelete(stu)}
                              className="p-1.5 rounded-lg text-slate-500 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                              title="Delete Student"
                            >
                              <Trash2 size={15} />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Admission / Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
              <h2 className="font-bold text-base text-slate-800">
                {editingStudent ? `Edit Student — ${editingStudent.name}` : 'Student Admission Form'}
              </h2>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleFormSubmit} className="flex-1 overflow-y-auto p-6 space-y-4 text-xs">
              {formError && (
                <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 font-medium">
                  {formError}
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Full Student Name *</label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 focus:bg-white focus:border-indigo-500 focus:outline-hidden"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Father's Name *</label>
                  <input
                    type="text"
                    required
                    value={formData.fatherName}
                    onChange={(e) => setFormData({ ...formData, fatherName: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 focus:bg-white focus:border-indigo-500 focus:outline-hidden"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Admission Number *</label>
                  <input
                    type="text"
                    required
                    value={formData.admissionNumber}
                    onChange={(e) => setFormData({ ...formData, admissionNumber: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 focus:bg-white focus:border-indigo-500 focus:outline-hidden"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Registration Number *</label>
                  <input
                    type="text"
                    required
                    value={formData.registrationNumber}
                    onChange={(e) => setFormData({ ...formData, registrationNumber: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 focus:bg-white focus:border-indigo-500 focus:outline-hidden"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Class Roll Number</label>
                  <input
                    type="text"
                    value={formData.classNumber}
                    onChange={(e) => setFormData({ ...formData, classNumber: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 focus:bg-white focus:border-indigo-500 focus:outline-hidden"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Pakistani CNIC (13 digits) *</label>
                  <input
                    type="text"
                    required
                    placeholder="1730112345671"
                    maxLength={15}
                    value={formData.cnic}
                    onChange={(e) => setFormData({ ...formData, cnic: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 focus:bg-white focus:border-indigo-500 focus:outline-hidden"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Student Mobile (03xxxxxxxxx) *</label>
                  <input
                    type="text"
                    required
                    placeholder="03001234567"
                    maxLength={11}
                    value={formData.studentMobile}
                    onChange={(e) => setFormData({ ...formData, studentMobile: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 focus:bg-white focus:border-indigo-500 focus:outline-hidden"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Father / Guardian Mobile</label>
                  <input
                    type="text"
                    placeholder="03007654321"
                    maxLength={11}
                    value={formData.fatherMobile}
                    onChange={(e) => setFormData({ ...formData, fatherMobile: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 focus:bg-white focus:border-indigo-500 focus:outline-hidden"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Date of Birth</label>
                  <input
                    type="date"
                    value={formData.dob}
                    onChange={(e) => setFormData({ ...formData, dob: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 focus:bg-white focus:border-indigo-500 focus:outline-hidden"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Email Address</label>
                  <input
                    type="email"
                    placeholder="student@gct.edu.pk"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 focus:bg-white focus:border-indigo-500 focus:outline-hidden"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Academic Program *</label>
                  <select
                    value={formData.programId}
                    onChange={(e) => {
                      const pid = e.target.value;
                      const relatedDepts = allowedDepartments.filter((d) => d.programId === pid);
                      const relatedSems = state.semesters.filter((s) => s.programId === pid);
                      const firstSem = relatedSems[0]?.id || '';
                      const relatedSecs = state.sections.filter((sec) => sec.semesterId === firstSem);
                      setFormData({
                        ...formData,
                        programId: pid,
                        departmentId: relatedDepts[0]?.id || '',
                        currentSemesterId: firstSem,
                        currentSectionId: relatedSecs[0]?.id || '',
                      });
                    }}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 focus:bg-white focus:outline-hidden"
                  >
                    {allowedPrograms.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.code} — {p.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Department / Technology *</label>
                  <select
                    value={formData.departmentId}
                    onChange={(e) => setFormData({ ...formData, departmentId: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 focus:bg-white focus:outline-hidden"
                  >
                    {allowedDepartments
                      .filter((d) => d.programId === formData.programId)
                      .map((d) => (
                        <option key={d.id} value={d.id}>
                          {d.name}
                        </option>
                      ))}
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Semester *</label>
                  <select
                    value={formData.currentSemesterId}
                    onChange={(e) => setFormData({ ...formData, currentSemesterId: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 focus:bg-white focus:outline-hidden"
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

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Section</label>
                  <select
                    value={formData.currentSectionId}
                    onChange={(e) => setFormData({ ...formData, currentSectionId: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 focus:bg-white focus:outline-hidden"
                  >
                    {state.sections
                      .filter((sec) => sec.semesterId === formData.currentSemesterId)
                      .map((sec) => (
                        <option key={sec.id} value={sec.id}>
                          Section {sec.name}
                        </option>
                      ))}
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Status</label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 focus:bg-white focus:outline-hidden"
                  >
                    <option value="Active">Active Standing</option>
                    <option value="StruckOff">Struck Off (خارج شدہ - Shortage / Disciplinary)</option>
                    <option value="Cancelled">Admission Cancelled (منسوخ)</option>
                    <option value="Suspended">Suspended</option>
                    <option value="Graduated">Graduated</option>
                    <option value="Left">Left / Migrated</option>
                  </select>
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
                  {editingStudent ? 'Save Changes' : 'Confirm Admission'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* 2. STRIKE OFF STUDENT MODAL                                   */}
      {/* ============================================================== */}
      {strikeModalStudent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-rose-200 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-rose-100">
              <div className="flex items-center gap-2.5 text-rose-700 font-black text-base">
                <div className="p-2 rounded-xl bg-rose-100 text-rose-700">
                  <UserMinus size={20} />
                </div>
                <span>Strike Off Student from College Rolls</span>
              </div>
              <button
                type="button"
                onClick={() => setStrikeModalStudent(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-700"
              >
                <X size={18} />
              </button>
            </div>

            <div className="p-4 rounded-2xl bg-rose-50/70 border border-rose-200 text-xs text-rose-950 space-y-1.5">
              <div className="font-bold">Student: {strikeModalStudent.name}</div>
              <div className="font-mono text-rose-800">
                Admission: {strikeModalStudent.admissionNumber} · Roll: {strikeModalStudent.classNumber}
              </div>
              <p className="text-[11px] text-rose-700">
                Striking off removes the student from active college rolls and immediately dispatches an urgent formal notice to both the student and their parent portal with an audio alert.
              </p>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Official Reason / Board Order:
              </label>
              <textarea
                rows={3}
                required
                value={strikeReason}
                onChange={(e) => setStrikeReason(e.target.value)}
                className="w-full p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs font-medium text-slate-900 focus:bg-white focus:border-rose-500 focus:outline-none"
                placeholder="e.g., Continuous attendance shortage (<70%) or disciplinary order..."
              />
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setStrikeModalStudent(null)}
                className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  strikeOffStudent(strikeModalStudent.id, strikeReason);
                  setStrikeModalStudent(null);
                }}
                className="px-5 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs shadow-md shadow-rose-600/20 flex items-center gap-1.5"
              >
                <UserMinus size={15} />
                <span>Confirm Strike Off & Notify Parent</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* 3. CANCEL ADMISSION MODAL                                     */}
      {/* ============================================================== */}
      {cancelModalStudent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-300 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2.5 text-slate-900 font-black text-base">
                <div className="p-2 rounded-xl bg-slate-100 text-slate-800">
                  <Ban size={20} />
                </div>
                <span>Cancel Student Admission</span>
              </div>
              <button
                type="button"
                onClick={() => setCancelModalStudent(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-700"
              >
                <X size={18} />
              </button>
            </div>

            <div className="p-4 rounded-2xl bg-slate-100 border border-slate-200 text-xs text-slate-900 space-y-1">
              <div className="font-bold">Student: {cancelModalStudent.name}</div>
              <div className="font-mono text-slate-600">
                Admission: {cancelModalStudent.admissionNumber} · Roll: {cancelModalStudent.classNumber}
              </div>
              <p className="text-[11px] text-slate-500">
                Cancelling admission officially voids the student seat at GCT Peshawar and alerts both student and parent portals.
              </p>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Cancellation Reason / Order Details:
              </label>
              <textarea
                rows={3}
                required
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
                className="w-full p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs font-medium text-slate-900 focus:bg-white focus:border-slate-800 focus:outline-none"
                placeholder="e.g. Student self-request, dual admission detected, or migration..."
              />
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setCancelModalStudent(null)}
                className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  cancelStudentAdmission(cancelModalStudent.id, cancelReason);
                  setCancelModalStudent(null);
                }}
                className="px-5 py-2 rounded-xl bg-slate-900 hover:bg-black text-white font-bold text-xs shadow-md shadow-black/20 flex items-center gap-1.5"
              >
                <Ban size={15} />
                <span>Confirm Admission Cancellation</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* 4. REINSTATE STUDENT MODAL                                    */}
      {/* ============================================================== */}
      {reinstateModalStudent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-emerald-200 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-emerald-100">
              <div className="flex items-center gap-2.5 text-emerald-800 font-black text-base">
                <div className="p-2 rounded-xl bg-emerald-100 text-emerald-700">
                  <RotateCcw size={20} />
                </div>
                <span>Reinstate Student to Active Standing</span>
              </div>
              <button
                type="button"
                onClick={() => setReinstateModalStudent(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-700"
              >
                <X size={18} />
              </button>
            </div>

            <div className="p-4 rounded-2xl bg-emerald-50/70 border border-emerald-200 text-xs text-emerald-950 space-y-1">
              <div className="font-bold">Student: {reinstateModalStudent.name}</div>
              <div className="font-mono text-emerald-800">
                Current Status: {reinstateModalStudent.status} · Roll: {reinstateModalStudent.classNumber}
              </div>
              <p className="text-[11px] text-emerald-700">
                Reinstating restores the student to Active rolls, permitting QR attendance scans and examination entry.
              </p>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Restoration Remarks / Chairman Clearance:
              </label>
              <textarea
                rows={3}
                required
                value={reinstateRemarks}
                onChange={(e) => setReinstateRemarks(e.target.value)}
                className="w-full p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs font-medium text-slate-900 focus:bg-white focus:border-emerald-500 focus:outline-none"
                placeholder="e.g. Fine deposited, undertaking signed, or medical grounds accepted..."
              />
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setReinstateModalStudent(null)}
                className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  reinstateStudent(reinstateModalStudent.id, reinstateRemarks);
                  setReinstateModalStudent(null);
                }}
                className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md shadow-emerald-600/20 flex items-center gap-1.5"
              >
                <RotateCcw size={15} />
                <span>Confirm Reinstatement & Notify</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Student Confirmation Modal */}
      <ConfirmModal
        isOpen={!!studentToDelete}
        title="Permanently Delete Student Record"
        message={`Are you sure you want to permanently delete student ${studentToDelete?.name} (${studentToDelete?.admissionNumber})? All attendance history, warning logs, and portal credentials will be removed.`}
        confirmLabel="Yes, Delete Student"
        onConfirm={() => {
          if (studentToDelete) {
            deleteStudent(studentToDelete.id);
            setStudentToDelete(null);
          }
        }}
        onCancel={() => setStudentToDelete(null)}
      />
    </div>
  );
};
