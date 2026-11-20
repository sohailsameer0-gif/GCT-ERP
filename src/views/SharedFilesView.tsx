import React, { useState } from 'react';
import {
  Download,
  File,
  FileText,
  Filter,
  Plus,
  Search,
  Share2,
  Trash2,
  Upload,
  User,
  X,
  Clock,
  Shield,
  Building,
  Users,
  CheckSquare,
  Square,
} from 'lucide-react';
import { useERP } from '../context/ERPContext';
import { formatDate } from '../services/calculations';
import { UserRole, SharedFile } from '../types/erp';
import { ConfirmModal } from '../components/common/ConfirmModal';

interface RoleOption {
  role: UserRole;
  label: string;
  category: string;
}

const ALL_ROLES: RoleOption[] = [
  { role: 'chairman', label: 'Chairman Directorate', category: 'Executive' },
  { role: 'hod', label: 'Heads of Department (HODs)', category: 'Executive' },
  { role: 'coordinator', label: 'Academic Coordinators', category: 'Academics' },
  { role: 'teacher', label: 'Teaching Faculty & Lecturers', category: 'Academics' },
  { role: 'assistant', label: 'Office Assistants', category: 'Administration' },
  { role: 'clerk', label: 'Department Clerks', category: 'Administration' },
  { role: 'student', label: 'Enrolled Students', category: 'Students' },
  { role: 'parent', label: 'Parents & Guardians', category: 'Parents' },
];

export const SharedFilesView: React.FC = () => {
  const { state, session, shareFile, deleteSharedFile, addToast } = useERP();
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [filterDept, setFilterDept] = useState('all');
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [fileToDelete, setFileToDelete] = useState<SharedFile | null>(null);

  // Upload modal state
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [selectedFileName, setSelectedFileName] = useState('');
  const [selectedFileType, setSelectedFileType] = useState('application/pdf');
  const [selectedFileSize, setSelectedFileSize] = useState(0);
  const [selectedFileDataUrl, setSelectedFileDataUrl] = useState('');
  const [targetDeptId, setTargetDeptId] = useState<string>(session?.departmentId || 'all');
  
  // Default shared roles: Official Administrative & Faculty only by default (not students/parents)
  const [selectedRoles, setSelectedRoles] = useState<UserRole[]>([
    'chairman',
    'hod',
    'coordinator',
    'teacher',
    'assistant',
    'clerk',
  ]);

  if (!session) return null;

  // Audience preset helpers
  const applyPreset = (preset: 'official_only' | 'faculty_only' | 'students_included' | 'all_public') => {
    if (preset === 'official_only') {
      setSelectedRoles(['chairman', 'hod', 'coordinator', 'assistant', 'clerk']);
    } else if (preset === 'faculty_only') {
      setSelectedRoles(['chairman', 'hod', 'coordinator', 'teacher']);
    } else if (preset === 'students_included') {
      setSelectedRoles(['chairman', 'hod', 'coordinator', 'teacher', 'student']);
    } else if (preset === 'all_public') {
      setSelectedRoles(['chairman', 'hod', 'coordinator', 'teacher', 'assistant', 'clerk', 'student', 'parent']);
    }
  };

  const toggleRole = (role: UserRole) => {
    setSelectedRoles((prev) =>
      prev.includes(role) ? prev.filter((r) => r !== role) : [...prev, role]
    );
  };

  // Filter files visible to this user
  const visibleFiles = state.sharedFiles.filter((f) => {
    // Sysadmin sees all
    if (session.role === 'sysadmin') return true;
    // Uploader always sees their files
    if (f.sharedBy === session.userId) return true;

    // Role check: must be in sharedWithRoles
    if (!f.sharedWithRoles.includes(session.role)) return false;

    // Department check: if file is department-specific, only that department can view
    if (f.departmentId && f.departmentId !== 'all') {
      // Chairman has college-wide oversight
      if (session.role === 'chairman') return true;
      if (session.departmentId && session.departmentId !== f.departmentId) return false;
    }

    return true;
  });

  const filteredFiles = visibleFiles.filter((f) => {
    if (filterType !== 'all' && !f.fileType.toLowerCase().includes(filterType.toLowerCase())) {
      return false;
    }
    if (filterDept !== 'all' && f.departmentId && f.departmentId !== filterDept) {
      return false;
    }
    if (searchTerm.trim()) {
      const q = searchTerm.toLowerCase();
      const match = `${f.title} ${f.description || ''} ${f.fileName} ${f.sharedByName}`.toLowerCase();
      if (!match.includes(q)) return false;
    }
    return true;
  });

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setSelectedFileName(file.name);
    setSelectedFileType(file.type || 'application/octet-stream');
    setSelectedFileSize(file.size);

    const reader = new FileReader();
    reader.onload = () => {
      setSelectedFileDataUrl(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleUploadSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      addToast('Please enter a document title', 'warn');
      return;
    }

    if (selectedRoles.length === 0) {
      addToast('Please select at least one target recipient role', 'warn');
      return;
    }

    // If no real file selected, provide a clean sample data url
    const fileDataUrl =
      selectedFileDataUrl ||
      'data:text/plain;charset=utf-8,' +
        encodeURIComponent(
          `GCT Peshawar Official Document\nTitle: ${title}\nDepartment: ${
            targetDeptId === 'all' ? 'All College Departments' : targetDeptId
          }\nTarget Audience: ${selectedRoles.join(', ')}`
        );
    const fileName = selectedFileName || `${title.replace(/\s+/g, '_')}.pdf`;
    const fileSize = selectedFileSize || 1024 * 45;

    const targetDeptName =
      targetDeptId === 'all'
        ? 'All Departments'
        : state.departments.find((d) => d.id === targetDeptId)?.name || targetDeptId;

    try {
      shareFile({
        title: title.trim(),
        description: description.trim() || undefined,
        fileName,
        fileType: selectedFileType,
        fileSize,
        dataUrl: fileDataUrl,
        sharedWithRoles: selectedRoles,
        departmentId: targetDeptId,
        targetAudienceNote: `${selectedRoles.length} Roles · ${targetDeptName}`,
      });

      setIsUploadOpen(false);
      setTitle('');
      setDescription('');
      setSelectedFileName('');
      setSelectedFileDataUrl('');
      setSelectedRoles(['chairman', 'hod', 'coordinator', 'teacher', 'assistant', 'clerk']);
      setTargetDeptId(session?.departmentId || 'all');
      addToast('Official document dispatched to designated audience', 'success');
    } catch (err: any) {
      addToast(err?.message || 'Failed to upload document', 'error');
    }
  };

  const handleDownload = (file: typeof state.sharedFiles[0]) => {
    const a = document.createElement('a');
    a.href = file.dataUrl;
    a.download = file.fileName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    addToast(`Downloading ${file.fileName}`, 'info');
  };

  const canUpload =
    session.role === 'sysadmin' ||
    session.role === 'chairman' ||
    session.role === 'hod' ||
    session.role === 'coordinator' ||
    session.role === 'teacher' ||
    session.role === 'clerk';

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-800 tracking-tight font-sans">
            Official Documents & Departmental Repository
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Targeted distribution of circulars, academic syllabi, notifications, and administrative orders
          </p>
        </div>

        {canUpload && (
          <button
            type="button"
            onClick={() => {
              setTargetDeptId(session.departmentId || 'all');
              setIsUploadOpen(true);
            }}
            className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs transition-colors flex items-center gap-2 shadow-md shadow-indigo-600/20"
          >
            <Plus size={16} />
            Share Official Document
          </button>
        )}
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col md:flex-row items-center justify-between gap-3">
        <div className="relative w-full md:w-80">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search documents by title, author, file..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto">
          <select
            value={filterDept}
            onChange={(e) => setFilterDept(e.target.value)}
            className="text-xs bg-white border border-slate-200 rounded-xl px-3 py-2 font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="all">All Department Scopes</option>
            {state.departments.map((d) => (
              <option key={d.id} value={d.id}>
                {d.name}
              </option>
            ))}
          </select>

          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="text-xs bg-white border border-slate-200 rounded-xl px-3 py-2 font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="all">All File Formats</option>
            <option value="pdf">PDF Documents</option>
            <option value="word">Word / Docs</option>
            <option value="sheet">Spreadsheets / Excel</option>
            <option value="image">Images / Diagrams</option>
          </select>
        </div>
      </div>

      {/* Document Grid */}
      {filteredFiles.length === 0 ? (
        <div className="bg-white rounded-2xl p-12 text-center border border-slate-200/80 shadow-xs">
          <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center mx-auto mb-3">
            <Share2 size={24} />
          </div>
          <h3 className="text-sm font-bold text-slate-800">No Documents Visible</h3>
          <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
            No official files have been addressed to your role or department yet. Administrative circulars will appear here when issued.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredFiles.map((file) => {
            const isOwner = file.sharedBy === session.userId || session.role === 'sysadmin';
            const deptObj = state.departments.find((d) => d.id === file.departmentId);
            const deptLabel = deptObj ? deptObj.code : 'College-Wide';
            const isStudentAccessible = file.sharedWithRoles.includes('student');

            return (
              <div
                key={file.id}
                className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs hover:shadow-md transition-all flex flex-col justify-between group"
              >
                <div>
                  <div className="flex items-start justify-between gap-3 mb-2.5">
                    <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                      <FileText size={20} />
                    </div>

                    <div className="flex items-center gap-1.5">
                      <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 text-[10px] font-bold">
                        {deptLabel}
                      </span>
                      {isStudentAccessible ? (
                        <span className="px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 text-[10px] font-bold">
                          Student Visible
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded-md bg-amber-50 text-amber-700 text-[10px] font-bold flex items-center gap-1">
                          <Shield size={10} /> Official Staff
                        </span>
                      )}
                      {isOwner && (
                        <button
                          type="button"
                          onClick={() => setFileToDelete(file)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors ml-1"
                          title="Delete shared document"
                        >
                          <Trash2 size={14} />
                        </button>
                      )}
                    </div>
                  </div>

                  <h3 className="text-sm font-bold text-slate-800 line-clamp-1 group-hover:text-indigo-600 transition-colors">
                    {file.title}
                  </h3>
                  {file.description && (
                    <p className="text-xs text-slate-500 mt-1 line-clamp-2 leading-relaxed">
                      {file.description}
                    </p>
                  )}

                  <div className="mt-2.5 flex items-center gap-2 text-2xs text-slate-400 font-medium">
                    <span className="truncate">{file.fileName}</span>
                    <span>•</span>
                    <span>{(file.fileSize / 1024).toFixed(0)} KB</span>
                  </div>

                  {/* Target Audience Badges */}
                  <div className="mt-3 flex flex-wrap gap-1">
                    {file.sharedWithRoles.slice(0, 3).map((r) => (
                      <span
                        key={r}
                        className="px-1.5 py-0.5 rounded bg-indigo-50 text-indigo-700 text-[9px] font-semibold uppercase tracking-wider"
                      >
                        {r}
                      </span>
                    ))}
                    {file.sharedWithRoles.length > 3 && (
                      <span className="px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 text-[9px] font-semibold">
                        +{file.sharedWithRoles.length - 3} more
                      </span>
                    )}
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-2xs text-slate-500">
                  <div className="flex items-center gap-1.5 truncate">
                    <User size={12} className="text-slate-400 shrink-0" />
                    <span className="truncate">{file.sharedByName}</span>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleDownload(file)}
                    className="px-2.5 py-1 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold flex items-center gap-1 transition-colors shrink-0"
                  >
                    <Download size={12} />
                    Download
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Upload Modal with Audience & Department Selection */}
      {isUploadOpen && (
        <div className="fixed inset-0 bg-slate-950/60 z-50 flex items-center justify-center p-4 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-7 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 duration-150 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
                  <Upload size={18} />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-800 font-sans">
                    Share Official Document
                  </h3>
                  <p className="text-2xs text-slate-400">
                    Specify recipient roles and department restrictions
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsUploadOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleUploadSubmit} className="space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Document Title *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Circular: Mid-Term Examination Datesheet Fall 2026"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Brief Description & Instructions
                </label>
                <textarea
                  rows={2}
                  placeholder="Outline purpose, compliance requirements, or target batch..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
                />
              </div>

              {/* Target Department Selection */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Target Department / Technology Restriction *
                </label>
                <select
                  value={targetDeptId}
                  onChange={(e) => setTargetDeptId(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium"
                >
                  <option value="all">All Departments (Entire College Scope)</option>
                  {state.departments.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.name} ({d.code})
                    </option>
                  ))}
                </select>
                <p className="text-[10px] text-slate-400 mt-1">
                  If a specific department is chosen, other departments will not see this file.
                </p>
              </div>

              {/* Target Audience Roles */}
              <div className="bg-slate-50 p-3 rounded-2xl border border-slate-200/80 space-y-2">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-bold text-slate-800">
                    Designated Recipient Roles * ({selectedRoles.length} selected)
                  </label>
                </div>

                {/* Quick Presets */}
                <div className="flex flex-wrap gap-1.5 pt-1">
                  <button
                    type="button"
                    onClick={() => applyPreset('official_only')}
                    className="px-2 py-1 rounded-lg bg-white border border-slate-200 hover:border-indigo-400 text-[10px] font-semibold text-slate-700 transition-colors"
                  >
                    Staff & Admin Only
                  </button>
                  <button
                    type="button"
                    onClick={() => applyPreset('faculty_only')}
                    className="px-2 py-1 rounded-lg bg-white border border-slate-200 hover:border-indigo-400 text-[10px] font-semibold text-slate-700 transition-colors"
                  >
                    Faculty Only
                  </button>
                  <button
                    type="button"
                    onClick={() => applyPreset('students_included')}
                    className="px-2 py-1 rounded-lg bg-white border border-slate-200 hover:border-indigo-400 text-[10px] font-semibold text-slate-700 transition-colors"
                  >
                    Include Students
                  </button>
                  <button
                    type="button"
                    onClick={() => applyPreset('all_public')}
                    className="px-2 py-1 rounded-lg bg-white border border-slate-200 hover:border-indigo-400 text-[10px] font-semibold text-slate-700 transition-colors"
                  >
                    All (Incl. Parents)
                  </button>
                </div>

                {/* Checkbox Grid */}
                <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-200/60">
                  {ALL_ROLES.map((r) => {
                    const isChecked = selectedRoles.includes(r.role);
                    return (
                      <button
                        type="button"
                        key={r.role}
                        onClick={() => toggleRole(r.role)}
                        className={`p-2 rounded-xl border text-left flex items-center gap-2 transition-all ${
                          isChecked
                            ? 'bg-indigo-50/80 border-indigo-300 text-indigo-900 font-bold'
                            : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-100/60'
                        }`}
                      >
                        {isChecked ? (
                          <CheckSquare size={14} className="text-indigo-600 shrink-0" />
                        ) : (
                          <Square size={14} className="text-slate-400 shrink-0" />
                        )}
                        <span className="text-[11px] leading-tight">{r.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Upload Official File (PDF, DOCX, XLSX, Images)
                </label>
                <input
                  type="file"
                  onChange={handleFileChange}
                  className="w-full text-xs text-slate-500 file:mr-3 file:py-1.5 file:px-3 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100 cursor-pointer"
                />
                {selectedFileName && (
                  <p className="text-2xs text-indigo-600 font-medium mt-1">
                    Selected: {selectedFileName} ({(selectedFileSize / 1024).toFixed(0)} KB)
                  </p>
                )}
              </div>

              <div className="flex justify-end gap-2.5 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsUploadOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs transition-colors shadow-xs"
                >
                  Dispatch Document
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Shared File Confirmation Modal */}
      <ConfirmModal
        isOpen={!!fileToDelete}
        title="Delete Shared Document"
        message={`Are you sure you want to remove "${fileToDelete?.title}"? Recipient roles will no longer have access to download this file.`}
        confirmLabel="Yes, Delete Document"
        onConfirm={() => {
          if (fileToDelete) {
            deleteSharedFile(fileToDelete.id);
            setFileToDelete(null);
          }
        }}
        onCancel={() => setFileToDelete(null)}
      />
    </div>
  );
};
