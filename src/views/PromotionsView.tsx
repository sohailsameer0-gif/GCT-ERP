import React, { useState, useEffect } from 'react';
import { useERP } from '../context/ERPContext';
import {
  TrendingUp,
  GraduationCap,
  Users,
  ArrowRight,
  CheckCircle,
  AlertCircle,
  Search,
  Filter,
  CheckSquare,
  Square,
  Shield,
  Sparkles,
  Award,
} from 'lucide-react';
import { calculateAttendanceSummary } from '../services/calculations';
import { ConfirmModal } from '../components/common/ConfirmModal';

export const PromotionsView: React.FC = () => {
  const { state, session, getScope, promoteStudent, addToast } = useERP();

  const scope = getScope();

  // Role validation: Chairman, Assistant, Clerk, HOD, Sysadmin have access
  const isAuthorized =
    session &&
    ['sysadmin', 'chairman', 'clerk', 'assistant', 'hod'].includes(session.role);

  // Scoped programs and departments based on user credentials
  const scopedPrograms = scope.unrestricted
    ? state.programs
    : scope.programIds.length > 0
    ? state.programs.filter((p) => scope.programIds.includes(p.id))
    : state.programs;

  const scopedDepartments = scope.unrestricted
    ? state.departments
    : scope.departmentIds.length > 0
    ? state.departments.filter((d) => scope.departmentIds.includes(d.id))
    : scope.programIds.length > 0
    ? state.departments.filter((d) => scope.programIds.includes(d.programId))
    : state.departments;

  const [selectedProgramId, setSelectedProgramId] = useState(
    scopedPrograms[0]?.id || state.programs[0]?.id || ''
  );

  const validDepts = scopedDepartments.filter((d) => d.programId === selectedProgramId);
  const [selectedDeptId, setSelectedDeptId] = useState(
    validDepts[0]?.id || scopedDepartments[0]?.id || ''
  );

  // Available semesters for selected program
  const programSemesters = state.semesters
    .filter((s) => s.programId === selectedProgramId)
    .sort((a, b) => a.number - b.number);

  const [sourceSemesterId, setSourceSemesterId] = useState(programSemesters[0]?.id || '');
  const [targetSemesterId, setTargetSemesterId] = useState('');
  const [targetSectionId, setTargetSectionId] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [remarks, setRemarks] = useState('Annual Sessional Academic Promotion (Regular Advancement)');
  const [selectedStudentIds, setSelectedStudentIds] = useState<string[]>([]);
  const [isPromoting, setIsPromoting] = useState(false);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);

  // Automatically update Target Semester (To) when Source Semester changes!
  // E.g., If Kashif Ali / students are in Semester 1, Target Semester automatically defaults to Semester 2!
  useEffect(() => {
    if (!sourceSemesterId) {
      setTargetSemesterId('');
      return;
    }

    const currentSourceSem = programSemesters.find((s) => s.id === sourceSemesterId);
    if (currentSourceSem) {
      // Find the next consecutive semester in the same program
      const nextSem = programSemesters.find((s) => s.number === currentSourceSem.number + 1);
      if (nextSem) {
        setTargetSemesterId(nextSem.id);
      } else {
        // Already at final semester or no next semester found
        setTargetSemesterId('');
      }
    }
  }, [sourceSemesterId, selectedProgramId]);

  // Sync department when program changes
  useEffect(() => {
    const depts = scopedDepartments.filter((d) => d.programId === selectedProgramId);
    if (depts.length > 0 && !depts.some((d) => d.id === selectedDeptId)) {
      setSelectedDeptId(depts[0].id);
    }
    const sems = state.semesters
      .filter((s) => s.programId === selectedProgramId)
      .sort((a, b) => a.number - b.number);
    if (sems.length > 0) {
      setSourceSemesterId(sems[0].id);
    }
  }, [selectedProgramId]);

  if (!isAuthorized) {
    return (
      <div className="max-w-2xl mx-auto p-8 text-center bg-white rounded-3xl border border-slate-200 shadow-sm space-y-3 mt-12">
        <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center mx-auto">
          <Shield className="w-6 h-6" />
        </div>
        <h2 className="text-base font-bold text-slate-900">Restricted Access Module</h2>
        <p className="text-xs text-slate-500 leading-relaxed">
          The Semester Advancement & Student Promotion console is reserved for the Chairman Directorate, Office Assistants, and Academic Clerks.
        </p>
      </div>
    );
  }

  // Filter students by selected program, department, source semester, and search query
  const eligibleStudents = state.students.filter((s) => {
    if (s.programId !== selectedProgramId) return false;
    if (selectedDeptId && s.departmentId !== selectedDeptId) return false;
    if (sourceSemesterId && s.currentSemesterId !== sourceSemesterId) return false;
    if (s.status !== 'Active') return false;

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const match = `${s.name} ${s.fatherName} ${s.classNumber} ${s.registrationNumber} ${s.cnic}`.toLowerCase();
      if (!match.includes(q)) return false;
    }

    return true;
  });

  const handleSelectAll = () => {
    if (selectedStudentIds.length === eligibleStudents.length) {
      setSelectedStudentIds([]);
    } else {
      setSelectedStudentIds(eligibleStudents.map((s) => s.id));
    }
  };

  const handleToggleStudent = (id: string) => {
    if (selectedStudentIds.includes(id)) {
      setSelectedStudentIds(selectedStudentIds.filter((sid) => sid !== id));
    } else {
      setSelectedStudentIds([...selectedStudentIds, id]);
    }
  };

  const handleExecutePromotion = () => {
    if (!targetSemesterId) {
      addToast('Please select the target destination semester', 'warn');
      return;
    }
    if (selectedStudentIds.length === 0) {
      addToast('Please select at least one student to promote', 'warn');
      return;
    }

    setIsConfirmOpen(true);
  };

  const confirmAndProceedPromotion = () => {
    setIsPromoting(true);
    let successCount = 0;

    try {
      selectedStudentIds.forEach((sid) => {
        promoteStudent(sid, targetSemesterId, targetSectionId || 'sec-a', remarks);
        successCount++;
      });
      addToast(`Successfully promoted ${successCount} student(s) to ${targetSem?.name || 'next semester'}!`, 'success');
      setSelectedStudentIds([]);
      setIsConfirmOpen(false);
    } catch (err: any) {
      addToast(err?.message || 'Error occurred during promotion batch', 'error');
    } finally {
      setIsPromoting(false);
    }
  };

  const sourceSem = state.semesters.find((s) => s.id === sourceSemesterId);
  const targetSem = state.semesters.find((s) => s.id === targetSemesterId);
  const selectedDeptObj = state.departments.find((d) => d.id === selectedDeptId);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-800 tracking-tight font-sans flex items-center gap-2">
            <TrendingUp className="w-6 h-6 text-indigo-600" />
            Semester Advancement & Student Promotions
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Advance eligible student cohorts to higher academic terms (e.g. 1st Semester to 2nd Semester)
          </p>
        </div>
      </div>

      {/* Promotion Configuration Panel */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-5 sm:p-6 space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <h2 className="text-sm font-bold text-slate-800 flex items-center gap-2">
            <GraduationCap className="w-5 h-5 text-indigo-600" />
            Cohort Advancement Criteria & Target Semester
          </h2>
          <span className="text-2xs font-semibold px-2 py-0.5 rounded bg-indigo-50 text-indigo-700">
            Authorized: {session.role.toUpperCase()}
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Academic Program *
            </label>
            <select
              value={selectedProgramId}
              onChange={(e) => {
                setSelectedProgramId(e.target.value);
                setSelectedStudentIds([]);
              }}
              className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium"
            >
              {scopedPrograms.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.code} — {p.name} ({p.totalSemesters} Semesters)
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Department / Technology *
            </label>
            <select
              value={selectedDeptId}
              onChange={(e) => {
                setSelectedDeptId(e.target.value);
                setSelectedStudentIds([]);
              }}
              className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium"
            >
              {scopedDepartments
                .filter((d) => d.programId === selectedProgramId)
                .map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.name}
                  </option>
                ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Current Semester (From) *
            </label>
            <select
              value={sourceSemesterId}
              onChange={(e) => {
                setSourceSemesterId(e.target.value);
                setSelectedStudentIds([]);
              }}
              className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 font-bold text-slate-800"
            >
              {programSemesters.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name} (Term {s.number})
                </option>
              ))}
            </select>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-xs font-bold text-indigo-700">
                Target Semester (To) *
              </label>
              <span className="text-[10px] text-indigo-600 font-semibold flex items-center gap-0.5">
                <Sparkles size={11} /> Auto Next
              </span>
            </div>
            <select
              value={targetSemesterId}
              onChange={(e) => setTargetSemesterId(e.target.value)}
              className="w-full px-3 py-2 border border-indigo-300 bg-indigo-50/60 rounded-xl text-xs font-bold text-indigo-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="">-- Select Destination Semester --</option>
              {programSemesters.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name} (Semester {s.number}) {sourceSem && s.number === sourceSem.number + 1 ? '★ Next Term' : ''}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Live Vector Summary & Action */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-3 border-t border-slate-100">
          <div className="text-xs text-slate-500 flex flex-wrap items-center gap-2">
            <span className="font-semibold text-slate-700">Advancement Vector:</span>
            <span className="bg-slate-100 px-3 py-1 rounded-lg font-mono font-bold text-slate-800 border border-slate-200">
              {sourceSem ? sourceSem.name : 'Select Term'}
            </span>
            <ArrowRight className="w-4 h-4 text-indigo-500" />
            <span className="bg-emerald-100 text-emerald-900 px-3 py-1 rounded-lg font-mono font-bold border border-emerald-200 flex items-center gap-1">
              <Sparkles size={12} className="text-emerald-600" />
              {targetSem ? targetSem.name : 'Target Semester (To)'}
            </span>
          </div>

          <button
            onClick={handleExecutePromotion}
            disabled={!targetSemesterId || selectedStudentIds.length === 0 || isPromoting}
            className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-200 disabled:text-slate-400 text-white font-bold text-xs rounded-xl shadow-md shadow-indigo-600/20 transition-all flex items-center gap-2 active:scale-95"
          >
            <CheckCircle className="w-4 h-4" />
            Promote Selected ({selectedStudentIds.length}) Students to {targetSem?.name || 'Next Term'}
          </button>
        </div>
      </div>

      {/* Student Selection Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        {/* Table Toolbar & Search */}
        <div className="p-4 border-b border-slate-100 bg-slate-50/60 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <button
              onClick={handleSelectAll}
              className="flex items-center gap-2 text-xs font-bold text-slate-700 hover:text-indigo-600 transition-colors"
            >
              {selectedStudentIds.length > 0 && selectedStudentIds.length === eligibleStudents.length ? (
                <CheckSquare className="w-4 h-4 text-indigo-600" />
              ) : (
                <Square className="w-4 h-4 text-slate-400" />
              )}
              Select All ({eligibleStudents.length} Students)
            </button>
          </div>

          <div className="flex items-center gap-3">
            <div className="relative w-full sm:w-64">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search name, roll#, e.g. Kashif Ali..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 text-xs rounded-xl bg-white border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <div className="text-xs text-slate-500 shrink-0 font-medium">
              Selected: <strong className="text-indigo-600 font-mono">{selectedStudentIds.length}</strong> / {eligibleStudents.length}
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-600">
            <thead className="bg-slate-50 text-[11px] uppercase font-bold text-slate-500 border-b border-slate-200">
              <tr>
                <th className="p-3.5 w-12 text-center">Select</th>
                <th className="p-3.5">Class Roll No</th>
                <th className="p-3.5">Registration No</th>
                <th className="p-3.5">Student Full Name</th>
                <th className="p-3.5">Father Name</th>
                <th className="p-3.5">Current Term</th>
                <th className="p-3.5 text-center">Attendance Standing</th>
                <th className="p-3.5 text-right">Advancement Target</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {eligibleStudents.length === 0 ? (
                <tr>
                  <td colSpan={8} className="p-12 text-center text-slate-400">
                    <Users className="w-8 h-8 mx-auto text-slate-300 mb-2" />
                    No active students found in {sourceSem?.name || 'this semester'} for {selectedDeptObj?.name || 'this department'}.
                  </td>
                </tr>
              ) : (
                eligibleStudents.map((s) => {
                  const isSelected = selectedStudentIds.includes(s.id);
                  const currentSem = state.semesters.find((sem) => sem.id === s.currentSemesterId);
                  const att = calculateAttendanceSummary(s.id, state);
                  const isShortage = att.adjustedPercentage < 70;

                  return (
                    <tr
                      key={s.id}
                      onClick={() => handleToggleStudent(s.id)}
                      className={`cursor-pointer transition-colors ${
                        isSelected ? 'bg-indigo-50/70' : 'hover:bg-slate-50/80'
                      }`}
                    >
                      <td className="p-3.5 text-center">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => handleToggleStudent(s.id)}
                          className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                        />
                      </td>
                      <td className="p-3.5 font-mono font-bold text-slate-800">{s.classNumber}</td>
                      <td className="p-3.5 font-mono text-slate-500">{s.registrationNumber}</td>
                      <td className="p-3.5 font-bold text-slate-900">{s.name}</td>
                      <td className="p-3.5 text-slate-600">{s.fatherName}</td>
                      <td className="p-3.5">
                        <span className="bg-slate-100 px-2 py-0.5 rounded text-slate-700 font-semibold">
                          {currentSem?.name || 'Semester'}
                        </span>
                      </td>
                      <td className="p-3.5 text-center">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            isShortage
                              ? 'bg-rose-100 text-rose-800'
                              : 'bg-emerald-100 text-emerald-800'
                          }`}
                        >
                          {att.adjustedPercentage.toFixed(0)}% Standing
                        </span>
                      </td>
                      <td className="p-3.5 text-right font-mono font-bold text-indigo-700">
                        {targetSem ? (
                          <span className="inline-flex items-center gap-1 text-emerald-700">
                            ➔ {targetSem.name}
                          </span>
                        ) : (
                          <span className="text-slate-400">Select Target</span>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Confirmation Modal */}
      <ConfirmModal
        isOpen={isConfirmOpen}
        title="Confirm Batch Student Advancement"
        message={`Are you sure you want to promote ${selectedStudentIds.length} student(s) from ${sourceSem?.name} to ${targetSem?.name}? Academic records will be advanced immediately.`}
        confirmLabel="Confirm & Advance Cohort"
        variant="primary"
        onConfirm={confirmAndProceedPromotion}
        onCancel={() => setIsConfirmOpen(false)}
      />
    </div>
  );
};
