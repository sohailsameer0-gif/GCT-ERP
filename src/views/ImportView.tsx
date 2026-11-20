import React, { useState } from 'react';
import { useERP } from '../context/ERPContext';
import { cleanMobile } from '../services/calculations';
import { Student } from '../types/erp';
import {
  Upload,
  Download,
  FileSpreadsheet,
  AlertCircle,
  CheckCircle,
  CheckCircle2,
  AlertTriangle,
  Info,
  Shield,
  Table,
  Layers,
  ArrowRight,
  Sparkles,
} from 'lucide-react';

export const ImportView: React.FC = () => {
  const { state, session, getScope, importStudents, addToast } = useERP();
  const [csvText, setCsvText] = useState('');
  const [parsedRows, setParsedRows] = useState<Partial<Student>[]>([]);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [importSummary, setImportSummary] = useState<{ imported: number; errors: string[] } | null>(null);

  const scope = getScope();

  // Role validation: Chairman, Assistant, Clerk, HOD, Sysadmin have access
  const isAuthorized =
    session &&
    ['sysadmin', 'chairman', 'clerk', 'assistant', 'hod'].includes(session.role);

  // Department scoping: Assistant/Clerk for a specific department is scoped
  const scopedDepts = scope.unrestricted
    ? state.departments
    : scope.departmentIds.length > 0
    ? state.departments.filter((d) => scope.departmentIds.includes(d.id))
    : state.departments;

  const defaultDept = scopedDepts[0] || state.departments[0];

  const downloadSampleTemplate = () => {
    const sampleHeaders = [
      'RollNo',
      'FullName',
      'FatherName',
      'AdmissionNo',
      'RegistrationNo',
      'CNIC',
      'Mobile',
      'FatherMobile',
      'Email',
      'DateOfBirth',
      'ProgramCode',
      'DepartmentCode',
      'SemesterNumber',
      'SectionName',
      'Batch',
      'Session',
    ];

    const sampleRows = [
      [
        'MECH-001',
        'Kashif Ali',
        'Muhammad Ali',
        'GCT-ADM-2026-001',
        'GCT-REG-2026-001',
        '17301-1234567-1',
        '0300-1234567',
        '0300-7654321',
        'kashif.ali@gctpeshawar.edu.pk',
        '2005-04-12',
        'BT',
        'BT-MECH',
        '1',
        'A',
        '2026-2030',
        'Spring',
      ],
      [
        'MECH-002',
        'Bilal Ahmad Khan',
        'Ahmad Khan',
        'GCT-ADM-2026-002',
        'GCT-REG-2026-002',
        '17301-2345678-3',
        '0312-3456789',
        '0313-9988776',
        'bilal.khan@gctpeshawar.edu.pk',
        '2005-08-19',
        'BT',
        'BT-MECH',
        '1',
        'A',
        '2026-2030',
        'Spring',
      ],
      [
        'CIV-001',
        'Farhan Ullah',
        'Hidayat Ullah',
        'GCT-ADM-2026-003',
        'GCT-REG-2026-003',
        '17301-3456789-5',
        '0333-8877665',
        '0334-1122339',
        'farhan.ullah@gctpeshawar.edu.pk',
        '2005-01-25',
        'BT',
        'BT-CIVIL',
        '1',
        'A',
        '2026-2030',
        'Spring',
      ],
      [
        'DAE-M-001',
        'Tariq Mehmood',
        'Mehmood Shah',
        'GCT-ADM-2026-004',
        'GCT-REG-2026-004',
        '17301-4567890-7',
        '0345-5566778',
        '0346-7788990',
        'tariq.mehmood@gctpeshawar.edu.pk',
        '2006-11-05',
        'DAE',
        'DAE-MECH',
        '1',
        'A',
        '2026-2029',
        'Fall',
      ],
    ];

    const csvContent =
      'data:text/csv;charset=utf-8,' +
      [sampleHeaders.join(','), ...sampleRows.map((r) => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', 'GCT_Peshawar_Official_Student_Admissions_Template.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    addToast('Official Excel/CSV admissions template downloaded', 'success');
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      setCsvText(text);
      parseAndValidateCSV(text);
    };
    reader.readAsText(file);
  };

  // Helper to extract column value by matching aliases
  const getCol = (row: Record<string, string>, ...keys: string[]) => {
    for (const k of keys) {
      const cleanK = k.toLowerCase().replace(/[^a-z0-9]/g, '');
      for (const rowKey of Object.keys(row)) {
        const cleanRowKey = rowKey.toLowerCase().replace(/[^a-z0-9]/g, '');
        if (cleanRowKey === cleanK && row[rowKey]) {
          return row[rowKey].trim();
        }
      }
    }
    return '';
  };

  const parseAndValidateCSV = (rawCsv: string) => {
    const lines = rawCsv.split(/\r?\n/).filter((l) => l.trim().length > 0);
    if (lines.length < 2) {
      setValidationErrors(['CSV file must contain a header row and at least one student data row.']);
      setParsedRows([]);
      return;
    }

    const headers = lines[0].split(',').map((h) => h.trim().replace(/^"|"$/g, ''));
    const errors: string[] = [];
    const validStudents: Partial<Student>[] = [];

    for (let i = 1; i < lines.length; i++) {
      const rowLine = lines[i];
      // Split with support for commas
      const cols = rowLine.split(',').map((c) => c.trim().replace(/^"|"$/g, ''));
      if (cols.length < 3) continue;

      const rowData: Record<string, string> = {};
      headers.forEach((h, idx) => {
        rowData[h] = cols[idx] || '';
      });

      // Flexible matching for exact user columns
      const classNumber = getCol(rowData, 'RollNo', 'Roll Number', 'Roll', 'ClassNo', 'Class Number', 'Class') || cols[0];
      const name = getCol(rowData, 'FullName', 'Full Name', 'Student Name', 'Name', 'StudentName') || cols[1];
      const fatherName = getCol(rowData, 'FatherName', 'Father Name', "Father's Name", 'GuardianName') || cols[2] || 'Father';
      const admissionNumber = getCol(rowData, 'AdmissionNo', 'Admission Number', 'AdmNo', 'Admission') || `GCT-ADM-${Date.now().toString().slice(-5)}${i}`;
      const registrationNumber = getCol(rowData, 'RegistrationNo', 'Registration Number', 'RegNo') || `GCT-REG-${Date.now().toString().slice(-4)}${i}`;
      const cnic = getCol(rowData, 'CNIC', 'NIC', 'B-Form', 'CnicNumber') || cols[3] || '17301-0000000-0';
      const mobile = getCol(rowData, 'Mobile', 'StudentMobile', 'Phone', 'Cell', 'MobileNumber') || cols[4] || '03001234567';
      const fatherMobile = getCol(rowData, 'FatherMobile', 'Father Phone', 'ParentMobile', 'EmergencyPhone') || cols[5] || '';
      const email = getCol(rowData, 'Email', 'EmailAddress', 'StudentEmail') || `${classNumber.toLowerCase().replace(/[^a-z0-9]/g, '')}@gctpeshawar.edu.pk`;
      const dob = getCol(rowData, 'DateOfBirth', 'DOB', 'Date of Birth', 'BirthDate') || '2005-01-01';
      const progCodeOrName = getCol(rowData, 'ProgramCode', 'Program', 'AcademicProgram', 'Degree') || cols[6] || '';
      const deptCodeOrName = getCol(rowData, 'DepartmentCode', 'Department', 'Dept', 'Technology') || cols[7] || '';
      const semesterNum = parseInt(getCol(rowData, 'SemesterNumber', 'Semester', 'Term') || '1', 10);
      const sectionName = getCol(rowData, 'SectionName', 'Section', 'ClassSection') || 'A';
      const batch = getCol(rowData, 'Batch', 'IntakeBatch') || '2026-2030';
      const sessionTerm = getCol(rowData, 'Session', 'IntakeSession') || 'Spring';

      if (!classNumber || !name) {
        errors.push(`Row ${i + 1}: Missing mandatory Roll Number or Student Full Name.`);
        continue;
      }

      // Check duplicate roll number in existing system
      if (state.students.some((s) => s.classNumber.toLowerCase() === classNumber.toLowerCase())) {
        errors.push(`Row ${i + 1}: Class Roll No "${classNumber}" already exists in GCT student directory.`);
        continue;
      }

      // Resolve Department & Program
      let prog = state.programs.find(
        (p) =>
          p.code.toLowerCase() === progCodeOrName.toLowerCase() ||
          p.name.toLowerCase().includes(progCodeOrName.toLowerCase())
      );

      let dept = state.departments.find(
        (d) =>
          d.code.toLowerCase() === deptCodeOrName.toLowerCase() ||
          d.name.toLowerCase().includes(deptCodeOrName.toLowerCase())
      );

      // If departmental user has locked department, enforce it
      if (scope.departmentIds.length > 0 && !dept) {
        dept = state.departments.find((d) => scope.departmentIds.includes(d.id));
      }

      const targetProgId = prog?.id || dept?.programId || defaultDept.programId || state.programs[0]?.id;
      const targetDeptId = dept?.id || state.departments.find((d) => d.programId === targetProgId)?.id || defaultDept.id;

      // Find semester for this program
      const matchingSem =
        state.semesters.find((s) => s.programId === targetProgId && s.number === semesterNum) ||
        state.semesters.find((s) => s.programId === targetProgId && s.number === 1) ||
        state.semesters[0];

      // Find section
      const matchingSec =
        state.sections.find((sec) => sec.semesterId === matchingSem?.id && sec.name.toLowerCase() === sectionName.toLowerCase()) ||
        state.sections.find((sec) => sec.semesterId === matchingSem?.id) ||
        state.sections[0];

      validStudents.push({
        admissionNumber,
        registrationNumber,
        classNumber,
        name,
        fatherName,
        cnic: cnic.replace(/\D/g, '') || '1730100000000',
        studentMobile: cleanMobile(mobile),
        fatherMobile: cleanMobile(fatherMobile),
        email: email.toLowerCase(),
        dob,
        programId: targetProgId,
        departmentId: targetDeptId,
        currentSemesterId: matchingSem?.id || '',
        currentSectionId: matchingSec?.id || '',
        batch,
        session: sessionTerm,
        status: 'Active',
        admissionDate: new Date().toISOString().slice(0, 10),
      });
    }

    setValidationErrors(errors);
    setParsedRows(validStudents);
    setImportSummary(null);
  };

  const handleExecuteImport = () => {
    if (parsedRows.length === 0) {
      addToast('No valid student records ready to import', 'warn');
      return;
    }

    setIsProcessing(true);
    try {
      const res = importStudents(parsedRows);
      setImportSummary(res);
      addToast(`Successfully enrolled ${res.imported} new student records with login accounts!`, 'success');
      setParsedRows([]);
      setCsvText('');
    } catch (err: any) {
      addToast(err?.message || 'Failed to complete batch import', 'error');
    } finally {
      setIsProcessing(false);
    }
  };

  if (!isAuthorized) {
    return (
      <div className="max-w-2xl mx-auto p-8 text-center bg-white rounded-3xl border border-slate-200 shadow-sm space-y-3 mt-12">
        <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center mx-auto">
          <Shield className="w-6 h-6" />
        </div>
        <h2 className="text-base font-bold text-slate-900">Restricted Access Module</h2>
        <p className="text-xs text-slate-500 leading-relaxed">
          The Batch Student Admissions & CSV Import module is restricted to Chairman Directorate, HODs, Office Assistants, and Academic Clerks.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-800 tracking-tight font-sans flex items-center gap-2">
            <Upload className="w-6 h-6 text-indigo-600" />
            Batch Student Admissions & Excel/CSV Import
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Bulk-enroll cohorts directly into GCT Peshawar student database with automatic portal credentials
          </p>
        </div>

        <button
          onClick={downloadSampleTemplate}
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-md shadow-indigo-600/20 transition-all self-start sm:self-auto active:scale-95"
        >
          <Download className="w-4 h-4" />
          Download Sample Template (.CSV)
        </button>
      </div>

      {/* Field Mapping Architectural Card (Exact Title to Target Location) */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-5 sm:p-6 space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2">
            <Table className="w-5 h-5 text-indigo-600" />
            <h2 className="text-sm font-bold text-slate-900">
              CSV Column-to-System Mapping Layout (عنوان اور مطلوبہ جگہ)
            </h2>
          </div>
          <span className="text-2xs font-semibold px-2 py-0.5 rounded bg-emerald-50 text-emerald-800">
            Auto-Header Detection Active
          </span>
        </div>

        <p className="text-xs text-slate-600 leading-relaxed">
          The Excel / CSV template contains the exact columns needed for the GCT admission form. When you upload your file, each column is automatically mapped to its designated location in the database:
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-1">
          <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80 space-y-1">
            <div className="font-mono font-bold text-indigo-700 text-xs">RollNo & FullName</div>
            <div className="text-[11px] text-slate-700 font-semibold">کلاس رول نمبر اور پورا نام</div>
            <p className="text-[10px] text-slate-500">
              Maps to <strong>Class Number</strong> and <strong>Student Legal Name</strong> (e.g. <code>MECH-001</code> ➔ Kashif Ali).
            </p>
          </div>

          <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80 space-y-1">
            <div className="font-mono font-bold text-indigo-700 text-xs">FatherName & CNIC</div>
            <div className="text-[11px] text-slate-700 font-semibold">والد کا نام اور شناختی کارڈ</div>
            <p className="text-[10px] text-slate-500">
              Maps to <strong>Father Name</strong> and Pakistani 13-digit <strong>CNIC</strong> (e.g. <code>17301-1234567-1</code>).
            </p>
          </div>

          <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80 space-y-1">
            <div className="font-mono font-bold text-indigo-700 text-xs">Mobile & FatherMobile</div>
            <div className="text-[11px] text-slate-700 font-semibold">طالب علم اور سرپرست کا فون</div>
            <p className="text-[10px] text-slate-500">
              Maps to contact records and default SMS alert recipients (e.g. <code>0300-1234567</code>).
            </p>
          </div>

          <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80 space-y-1">
            <div className="font-mono font-bold text-indigo-700 text-xs">DepartmentCode & Program</div>
            <div className="text-[11px] text-slate-700 font-semibold">شعبہ اور اکیڈمک پروگرام</div>
            <p className="text-[10px] text-slate-500">
              e.g. <code>BT-MECH</code> (Mechanical B.Tech) or <code>BT-CIVIL</code> (Civil B.Tech).
            </p>
          </div>

          <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80 space-y-1">
            <div className="font-mono font-bold text-indigo-700 text-xs">SemesterNumber & Section</div>
            <div className="text-[11px] text-slate-700 font-semibold">سمسٹر اور سیکشن</div>
            <p className="text-[10px] text-slate-500">
              Auto-allocates student to Semester 1 (or 2) and Section A/B based on value.
            </p>
          </div>

          <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80 space-y-1">
            <div className="font-mono font-bold text-indigo-700 text-xs">AdmissionNo & RegNo</div>
            <div className="text-[11px] text-slate-700 font-semibold">داخلہ و رجسٹریشن نمبر</div>
            <p className="text-[10px] text-slate-500">
              Maps official college records; auto-generated if left empty.
            </p>
          </div>
        </div>
      </div>

      {/* Upload Drag & Drop Area */}
      <div className="bg-white rounded-2xl border-2 border-dashed border-slate-300 hover:border-indigo-500 transition-colors p-8 text-center space-y-4 shadow-xs">
        <div className="w-14 h-14 mx-auto bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center font-bold">
          <FileSpreadsheet className="w-7 h-7" />
        </div>

        <div>
          <h3 className="text-sm font-bold text-slate-800">
            Upload Prepared CSV / Excel Admissions File
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">
            Select the .CSV file generated from Excel containing your student roster
          </p>
        </div>

        <div>
          <label className="cursor-pointer inline-flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-md shadow-indigo-600/20 transition-all active:scale-95">
            <Upload className="w-4 h-4" />
            Browse and Select CSV File
            <input
              type="file"
              accept=".csv,text/csv"
              onChange={handleFileUpload}
              className="hidden"
            />
          </label>
        </div>
      </div>

      {/* Import Summary Banner */}
      {importSummary && (
        <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-5 flex items-start gap-3 shadow-xs animate-in fade-in">
          <CheckCircle2 className="w-6 h-6 text-emerald-600 shrink-0 mt-0.5" />
          <div>
            <h4 className="text-sm font-bold text-emerald-900">
              Batch Import Completed Successfully!
            </h4>
            <p className="text-xs text-emerald-700 mt-1 leading-relaxed">
              Enrolled <strong>{importSummary.imported}</strong> new students. Login accounts and default passwords (student mobile) have been created automatically. Students can now sign in and view their attendance records.
            </p>
          </div>
        </div>
      )}

      {/* Validation Notices */}
      {validationErrors.length > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 space-y-2 shadow-xs">
          <div className="flex items-center gap-2 text-amber-900 font-bold text-xs">
            <AlertTriangle className="w-4 h-4 text-amber-600" />
            Validation Notices ({validationErrors.length})
          </div>
          <ul className="text-[11px] text-amber-800 space-y-1 list-disc pl-5">
            {validationErrors.map((err, idx) => (
              <li key={idx}>{err}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Pre-Import Data Review Table */}
      {parsedRows.length > 0 && (
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden animate-in fade-in">
          <div className="p-4 border-b border-slate-100 bg-slate-50 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="text-sm font-bold text-slate-800">
                Verified Data Preview: {parsedRows.length} Students Ready to Enroll
              </h3>
              <p className="text-2xs text-slate-400">
                Review mapped fields below. Click "Confirm & Enroll" to persist records into database.
              </p>
            </div>

            <button
              onClick={handleExecuteImport}
              disabled={isProcessing}
              className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-300 text-white font-bold text-xs rounded-xl shadow-md shadow-emerald-600/20 transition-all flex items-center gap-1.5 active:scale-95"
            >
              <CheckCircle className="w-4 h-4" />
              {isProcessing ? 'Enrolling...' : `Confirm & Enroll ${parsedRows.length} Students`}
            </button>
          </div>

          <div className="overflow-x-auto max-h-96">
            <table className="w-full text-left text-xs text-slate-600">
              <thead className="bg-slate-50 text-[11px] uppercase font-bold text-slate-500 border-b border-slate-200 sticky top-0">
                <tr>
                  <th className="p-3">#</th>
                  <th className="p-3">Class Roll No</th>
                  <th className="p-3">Full Legal Name</th>
                  <th className="p-3">Father Name</th>
                  <th className="p-3">CNIC</th>
                  <th className="p-3">Mobile</th>
                  <th className="p-3">Department</th>
                  <th className="p-3">Term / Section</th>
                  <th className="p-3 text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {parsedRows.map((r, idx) => {
                  const dept = state.departments.find((d) => d.id === r.departmentId);
                  const sem = state.semesters.find((s) => s.id === r.currentSemesterId);
                  const sec = state.sections.find((s) => s.id === r.currentSectionId);

                  return (
                    <tr key={idx} className="hover:bg-slate-50">
                      <td className="p-3 font-mono text-slate-400">{idx + 1}</td>
                      <td className="p-3 font-mono font-bold text-slate-900">{r.classNumber}</td>
                      <td className="p-3 font-bold text-slate-800">{r.name}</td>
                      <td className="p-3 text-slate-600">{r.fatherName}</td>
                      <td className="p-3 font-mono text-slate-500">{r.cnic}</td>
                      <td className="p-3 font-mono text-slate-500">{r.studentMobile}</td>
                      <td className="p-3 font-medium text-indigo-700">{dept?.name || 'Assigned'}</td>
                      <td className="p-3 text-slate-600 font-semibold">
                        {sem?.name || 'Sem 1'} ({sec?.name ? `Sec ${sec.name}` : 'Sec A'})
                      </td>
                      <td className="p-3 text-right">
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                          Ready ✓
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
