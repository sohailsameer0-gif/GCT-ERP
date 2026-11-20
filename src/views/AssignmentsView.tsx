import React, { useState } from 'react';
import { useERP } from '../context/ERPContext';
import { Assignment, AssignmentSubmission } from '../types/erp';
import {
  BookOpen,
  Calendar,
  CheckCircle,
  Clock,
  FileCheck,
  FileText,
  Filter,
  GraduationCap,
  Plus,
  Search,
  Upload,
  UserCheck
} from 'lucide-react';

export const AssignmentsView: React.FC = () => {
  const {
    state,
    session,
    can,
    createAssignment,
    submitAssignment,
    gradeAssignment,
    addToast
  } = useERP();

  const [searchTerm, setSearchTerm] = useState('');
  const [courseFilter, setCourseFilter] = useState('all');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [activeTab, setActiveTab] = useState<'assignments' | 'submissions'>('assignments');
  const [selectedAssignment, setSelectedAssignment] = useState<Assignment | null>(null);

  // New assignment form state
  const [title, setTitle] = useState('');
  const [courseId, setCourseId] = useState('');
  const [description, setDescription] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [totalMarks, setTotalMarks] = useState(20);

  // Submission state for students
  const [submitModalOpen, setSubmitModalOpen] = useState(false);
  const [submittingAssignmentId, setSubmittingAssignmentId] = useState('');
  const [submissionNotes, setSubmissionNotes] = useState('');
  const [submissionFileName, setSubmissionFileName] = useState('');
  const [submissionFileDataUrl, setSubmissionFileDataUrl] = useState('');

  // Grading state for teachers
  const [gradingModalOpen, setGradingModalOpen] = useState(false);
  const [activeSubmission, setActiveSubmission] = useState<{
    sub: AssignmentSubmission;
    assignment: Assignment;
  } | null>(null);
  const [gradeScore, setGradeScore] = useState<number | string>('');
  const [gradeFeedback, setGradeFeedback] = useState('');

  const isTeacher =
    session?.role === 'teacher' ||
    session?.role === 'chairman' ||
    session?.role === 'hod' ||
    session?.role === 'sysadmin';
  const isStudent = session?.role === 'student';

  const assignments = state.assignments || [];
  const submissions = state.assignmentSubmissions || [];

  const filteredAssignments = assignments.filter((a) => {
    const course = state.courses.find((c) => c.id === a.courseId);
    const searchMatch =
      !searchTerm ||
      a.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (a.description || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (course?.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (course?.code || '').toLowerCase().includes(searchTerm.toLowerCase());

    const courseMatch = courseFilter === 'all' || a.courseId === courseFilter;
    return searchMatch && courseMatch;
  });

  const handleCreateAssignment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !courseId || !dueDate) {
      addToast('Please fill in title, course, and due date', 'error');
      return;
    }

    try {
      createAssignment({
        title,
        courseId,
        teacherId: session?.linkedId || session?.userId || '',
        teacherName: session?.displayName || 'Faculty Member',
        description,
        dueDate,
        totalMarks: Number(totalMarks) || 20,
        status: 'Open'
      });
      setShowCreateModal(false);
      setTitle('');
      setDescription('');
      setDueDate('');
      setTotalMarks(20);
      addToast('Assignment published successfully', 'success');
    } catch (err: any) {
      addToast(err?.message || 'Failed to create assignment', 'error');
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      addToast('File exceeds 5MB limit', 'error');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      setSubmissionFileName(file.name);
      setSubmissionFileDataUrl(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleSubmitAssignmentForm = (e: React.FormEvent) => {
    e.preventDefault();
    if (!submittingAssignmentId) return;

    try {
      submitAssignment(
        submittingAssignmentId,
        submissionNotes,
        submissionFileDataUrl || undefined,
        submissionFileName || undefined
      );
      setSubmitModalOpen(false);
      setSubmittingAssignmentId('');
      setSubmissionNotes('');
      setSubmissionFileName('');
      setSubmissionFileDataUrl('');
      addToast('Assignment submitted successfully', 'success');
    } catch (err: any) {
      addToast(err?.message || 'Failed to submit assignment', 'error');
    }
  };

  const handleGradeForm = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeSubmission) return;

    try {
      gradeAssignment(activeSubmission.sub.id, gradeScore, gradeFeedback);
      setGradingModalOpen(false);
      setActiveSubmission(null);
      setGradeScore('');
      setGradeFeedback('');
      addToast('Grade and evaluation recorded', 'success');
    } catch (err: any) {
      addToast(err?.message || 'Failed to record grade', 'error');
    }
  };

  const currentStudentId = session?.linkedId || session?.userId;

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
            <BookOpen className="w-7 h-7 text-indigo-600" />
            Course Assignments & Tasks
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Publish academic assignments, evaluate student submissions, and manage coursework grading
          </p>
        </div>

        <div className="flex items-center gap-2">
          {isTeacher && (
            <button
              onClick={() => setShowCreateModal(true)}
              className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-medium text-sm rounded-lg shadow-sm transition-all"
            >
              <Plus className="w-4 h-4" />
              New Assignment
            </button>
          )}
        </div>
      </div>

      {/* KPI Overview */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-xl border border-slate-200/80 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-lg bg-indigo-50 flex items-center justify-center text-indigo-600">
            <BookOpen className="w-6 h-6" />
          </div>
          <div>
            <div className="text-2xl font-bold text-slate-800">{assignments.length}</div>
            <div className="text-xs font-medium text-slate-500">Active Assignments</div>
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200/80 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-lg bg-amber-50 flex items-center justify-center text-amber-600">
            <Upload className="w-6 h-6" />
          </div>
          <div>
            <div className="text-2xl font-bold text-amber-700">{submissions.length}</div>
            <div className="text-xs font-medium text-slate-500">Total Submissions</div>
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200/80 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-lg bg-emerald-50 flex items-center justify-center text-emerald-600">
            <CheckCircle className="w-6 h-6" />
          </div>
          <div>
            <div className="text-2xl font-bold text-emerald-700">
              {submissions.filter((s) => s.grade != null).length}
            </div>
            <div className="text-xs font-medium text-slate-500">Graded Submissions</div>
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200/80 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-lg bg-sky-50 flex items-center justify-center text-sky-600">
            <GraduationCap className="w-6 h-6" />
          </div>
          <div>
            <div className="text-2xl font-bold text-sky-700">{state.courses.length}</div>
            <div className="text-xs font-medium text-slate-500">Configured Courses</div>
          </div>
        </div>
      </div>

      {/* Tabs & Search */}
      <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-sm flex flex-col sm:flex-row gap-3 items-center justify-between">
        <div className="flex items-center gap-2 border-b sm:border-b-0 border-slate-200 pb-2 sm:pb-0 w-full sm:w-auto">
          <button
            onClick={() => setActiveTab('assignments')}
            className={`px-3 py-1.5 rounded-lg text-sm font-semibold transition-colors ${
              activeTab === 'assignments'
                ? 'bg-indigo-50 text-indigo-700'
                : 'text-slate-600 hover:text-slate-800'
            }`}
          >
            Assignments ({filteredAssignments.length})
          </button>
          {isTeacher && (
            <button
              onClick={() => setActiveTab('submissions')}
              className={`px-3 py-1.5 rounded-lg text-sm font-semibold transition-colors ${
                activeTab === 'submissions'
                  ? 'bg-indigo-50 text-indigo-700'
                  : 'text-slate-600 hover:text-slate-800'
              }`}
            >
              All Submissions Review
            </button>
          )}
        </div>

        <div className="flex flex-col sm:flex-row items-center gap-2 w-full sm:w-auto">
          <div className="relative w-full sm:w-64">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search assignments..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <select
            value={courseFilter}
            onChange={(e) => setCourseFilter(e.target.value)}
            className="w-full sm:w-auto px-3 py-2 border border-slate-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="all">All Courses</option>
            {state.courses.map((c) => (
              <option key={c.id} value={c.id}>
                {c.code} - {c.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Main Content Area */}
      {activeTab === 'assignments' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredAssignments.length === 0 ? (
            <div className="col-span-full p-12 bg-white rounded-xl border border-slate-200 text-center text-slate-400">
              <BookOpen className="w-12 h-12 mx-auto mb-3 opacity-30" />
              <p className="font-semibold text-slate-700">No Assignments Found</p>
              <p className="text-xs text-slate-400 mt-1">
                Faculty members can publish tasks and assignments using the button above.
              </p>
            </div>
          ) : (
            filteredAssignments.map((a) => {
              const course = state.courses.find((c) => c.id === a.courseId);
              const teacher = state.teachers.find((t) => t.id === a.teacherId);
              const isPastDue = new Date(a.dueDate).getTime() < Date.now();
              const mySubmission = isStudent
                ? submissions.find((s) => s.assignmentId === a.id && s.studentId === currentStudentId)
                : null;
              const assignmentSubs = submissions.filter((s) => s.assignmentId === a.id);

              return (
                <div
                  key={a.id}
                  className="bg-white rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between overflow-hidden"
                >
                  <div className="p-5 space-y-3">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-xs font-bold text-indigo-700 bg-indigo-50 px-2.5 py-1 rounded-md">
                        {course?.code || 'COURSE'}
                      </span>
                      <span
                        className={`text-xs px-2 py-0.5 rounded-full font-medium flex items-center gap-1 ${
                          isPastDue
                            ? 'bg-rose-50 text-rose-700'
                            : 'bg-emerald-50 text-emerald-700'
                        }`}
                      >
                        <Clock className="w-3 h-3" />
                        {isPastDue ? 'Expired' : 'Active'}
                      </span>
                    </div>

                    <h3 className="text-base font-bold text-slate-800 line-clamp-1">{a.title}</h3>

                    <p className="text-xs text-slate-600 line-clamp-3 bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                      {a.description || 'No additional instructions provided.'}
                    </p>

                    <div className="space-y-1.5 text-xs text-slate-500 pt-1 border-t border-slate-100">
                      <div className="flex justify-between">
                        <span>Course:</span>
                        <strong className="text-slate-700">{course?.name || 'N/A'}</strong>
                      </div>
                      <div className="flex justify-between">
                        <span>Faculty:</span>
                        <span className="text-slate-700">{teacher?.name || a.teacherName || 'Assigned Staff'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Total Marks:</span>
                        <strong className="text-indigo-600">{a.totalMarks || 20} Marks</strong>
                      </div>
                      <div className="flex justify-between">
                        <span>Due Date:</span>
                        <span className="font-semibold text-slate-800">
                          {new Date(a.dueDate).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Card Bottom CTA */}
                  <div className="p-4 bg-slate-50/80 border-t border-slate-100 flex items-center justify-between">
                    {isStudent && (
                      <div className="w-full">
                        {mySubmission ? (
                          <div className="flex items-center justify-between w-full">
                            <span className="text-xs font-semibold text-emerald-700 flex items-center gap-1">
                              <CheckCircle className="w-4 h-4 text-emerald-600" />
                              Submitted
                            </span>
                            {mySubmission.grade != null ? (
                              <span className="text-xs font-bold bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded">
                                Grade: {mySubmission.grade}/{a.totalMarks || 20}
                              </span>
                            ) : (
                              <span className="text-xs text-slate-500">Pending Grading</span>
                            )}
                          </div>
                        ) : (
                          <button
                            onClick={() => {
                              setSubmittingAssignmentId(a.id);
                              setSubmitModalOpen(true);
                            }}
                            disabled={isPastDue}
                            className="w-full py-2 bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-300 text-white text-xs font-semibold rounded-lg shadow-sm transition-all flex items-center justify-center gap-1.5"
                          >
                            <Upload className="w-3.5 h-3.5" />
                            Submit Work
                          </button>
                        )}
                      </div>
                    )}

                    {isTeacher && (
                      <div className="flex items-center justify-between w-full">
                        <span className="text-xs text-slate-500">
                          <strong>{assignmentSubs.length}</strong> submissions
                        </span>
                        <button
                          onClick={() => {
                            setSelectedAssignment(a);
                            setActiveTab('submissions');
                          }}
                          className="text-xs text-indigo-600 font-semibold hover:text-indigo-800"
                        >
                          Review & Grade →
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      ) : (
        /* Submissions Review Tab */
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
            <h2 className="text-sm font-bold text-slate-800 flex items-center gap-2">
              <FileCheck className="w-4 h-4 text-indigo-600" />
              {selectedAssignment ? `Submissions for: ${selectedAssignment.title}` : 'All Student Submissions'}
            </h2>
            {selectedAssignment && (
              <button
                onClick={() => setSelectedAssignment(null)}
                className="text-xs text-indigo-600 hover:underline font-medium"
              >
                Show All Courses
              </button>
            )}
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-600">
              <thead className="bg-slate-50 text-xs uppercase font-semibold text-slate-500 border-b border-slate-200">
                <tr>
                  <th className="p-3.5">Student / Class No</th>
                  <th className="p-3.5">Assignment</th>
                  <th className="p-3.5">Submission Date</th>
                  <th className="p-3.5">Attached Work</th>
                  <th className="p-3.5">Status & Marks</th>
                  <th className="p-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {submissions
                  .filter((s) => !selectedAssignment || s.assignmentId === selectedAssignment.id)
                  .map((sub) => {
                    const assignment = assignments.find((a) => a.id === sub.assignmentId);
                    const student = state.students.find((s) => s.id === sub.studentId);
                    if (!assignment) return null;

                    return (
                      <tr key={sub.id} className="hover:bg-slate-50/60 transition-colors">
                        <td className="p-3.5">
                          <div className="font-semibold text-slate-800">
                            {student?.name || sub.studentName}
                          </div>
                          <div className="text-xs font-mono text-indigo-600">
                            {student?.classNumber || 'N/A'}
                          </div>
                        </td>
                        <td className="p-3.5">
                          <div className="font-medium text-slate-800">{assignment.title}</div>
                          <div className="text-xs text-slate-400">Total: {assignment.totalMarks || 20} marks</div>
                        </td>
                        <td className="p-3.5 text-xs text-slate-500">
                          {new Date(sub.submittedAt).toLocaleString()}
                        </td>
                        <td className="p-3.5 text-xs">
                          {sub.fileName ? (
                            <a
                              href={sub.fileDataUrl || '#'}
                              download={sub.fileName}
                              className="text-indigo-600 hover:underline font-medium flex items-center gap-1"
                            >
                              <FileText className="w-3.5 h-3.5" />
                              {sub.fileName}
                            </a>
                          ) : (
                            <span className="text-slate-400">Text Notes Only</span>
                          )}
                          {sub.notes && (
                            <div className="text-xs text-slate-500 truncate max-w-xs mt-0.5">
                              {sub.notes}
                            </div>
                          )}
                        </td>
                        <td className="p-3.5">
                          {sub.grade != null ? (
                            <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800">
                              {sub.grade} / {assignment.totalMarks || 20}
                            </span>
                          ) : (
                            <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-100 text-amber-800">
                              Ungraded
                            </span>
                          )}
                        </td>
                        <td className="p-3.5 text-right">
                          <button
                            onClick={() => {
                              setActiveSubmission({ sub, assignment });
                              setGradeScore(sub.grade != null ? sub.grade : '');
                              setGradeFeedback(sub.feedback || '');
                              setGradingModalOpen(true);
                            }}
                            className="px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-semibold text-xs rounded-lg transition-colors inline-flex items-center gap-1"
                          >
                            <UserCheck className="w-3.5 h-3.5" />
                            {sub.grade != null ? 'Update Grade' : 'Grade'}
                          </button>
                        </td>
                      </tr>
                    );
                  })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* New Assignment Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 animate-in fade-in duration-200">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-indigo-600" />
                Publish Course Assignment
              </h2>
              <button
                onClick={() => setShowCreateModal(false)}
                className="text-slate-400 hover:text-slate-600 text-lg font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateAssignment} className="space-y-4 mt-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Assignment Title *
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Lab Report 4: Digital Logic Circuit Simulation"
                  required
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Course *
                </label>
                <select
                  value={courseId}
                  onChange={(e) => setCourseId(e.target.value)}
                  required
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="">-- Select Course --</option>
                  {state.courses.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.code} - {c.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                    Due Date *
                  </label>
                  <input
                    type="date"
                    value={dueDate}
                    onChange={(e) => setDueDate(e.target.value)}
                    required
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                    Total Marks *
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={100}
                    value={totalMarks}
                    onChange={(e) => setTotalMarks(Number(e.target.value))}
                    required
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Instructions & Guidelines
                </label>
                <textarea
                  rows={4}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Outline questions, requirements, and reference citations..."
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 border border-slate-200 rounded-lg text-sm font-medium text-slate-600 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-semibold shadow-sm transition-all"
                >
                  Publish Assignment
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Student Submit Modal */}
      {submitModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 animate-in fade-in duration-200">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                <Upload className="w-5 h-5 text-indigo-600" />
                Submit Assignment Solution
              </h2>
              <button
                onClick={() => setSubmitModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 text-lg font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmitAssignmentForm} className="space-y-4 mt-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Submission Notes / Text Solution
                </label>
                <textarea
                  rows={4}
                  value={submissionNotes}
                  onChange={(e) => setSubmissionNotes(e.target.value)}
                  placeholder="Paste your answers or write summary notes for the instructor..."
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Attach File (PDF, DOCX, ZIP, Max 5MB)
                </label>
                <input
                  type="file"
                  onChange={handleFileUpload}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs file:mr-3 file:py-1 file:px-3 file:rounded-md file:border-0 file:text-xs file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100"
                />
                {submissionFileName && (
                  <p className="text-xs text-emerald-600 mt-1 flex items-center gap-1">
                    <CheckCircle className="w-3.5 h-3.5" /> Attached: {submissionFileName}
                  </p>
                )}
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setSubmitModalOpen(false)}
                  className="px-4 py-2 border border-slate-200 rounded-lg text-sm font-medium text-slate-600 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-semibold shadow-sm transition-all"
                >
                  Submit for Evaluation
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Grading Modal */}
      {gradingModalOpen && activeSubmission && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 animate-in fade-in duration-200">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                <UserCheck className="w-5 h-5 text-indigo-600" />
                Grade Student Submission
              </h2>
              <button
                onClick={() => setGradingModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 text-lg font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleGradeForm} className="space-y-4 mt-4">
              <div className="bg-slate-50 p-3 rounded-lg border border-slate-200/80 text-xs space-y-1">
                <div>
                  <strong>Student:</strong>{' '}
                  {state.students.find((s) => s.id === activeSubmission.sub.studentId)?.name || activeSubmission.sub.studentName}
                </div>
                <div>
                  <strong>Assignment:</strong> {activeSubmission.assignment.title}
                </div>
                <div>
                  <strong>Maximum Marks:</strong> {activeSubmission.assignment.totalMarks || 20}
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Awarded Marks (Out of {activeSubmission.assignment.totalMarks || 20}) *
                </label>
                <input
                  type="number"
                  min={0}
                  max={activeSubmission.assignment.totalMarks || 20}
                  value={gradeScore}
                  onChange={(e) => setGradeScore(e.target.value)}
                  required
                  placeholder="e.g. 18"
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Instructor Feedback / Remarks
                </label>
                <textarea
                  rows={3}
                  value={gradeFeedback}
                  onChange={(e) => setGradeFeedback(e.target.value)}
                  placeholder="Well structured diagram; needs minor correction on calculation step 3..."
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setGradingModalOpen(false)}
                  className="px-4 py-2 border border-slate-200 rounded-lg text-sm font-medium text-slate-600 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-semibold shadow-sm transition-all"
                >
                  Save Grade & Notify
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
