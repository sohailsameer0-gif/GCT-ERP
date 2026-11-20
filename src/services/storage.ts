import {
  Account,
  CollegeSettings,
  Course,
  CourseAssignment,
  Department,
  ERPState,
  Program,
  Section,
  Semester,
  Student,
  Teacher,
  TimetableSlot,
} from '../types/erp';
import { nowIso, todayIso, uid } from './calculations';

export const STORAGE_KEY = 'gct_erp_v14';
export const REMEMBER_KEY = 'gct_remember_me';

export const DEFAULT_PROGRAMS: Program[] = [
  {
    id: 'prog_bt',
    code: 'BT',
    name: 'B.Tech (Bachelor of Technology)',
    durationYears: 4,
    totalSemesters: 8,
    deptHeadRole: 'chairman',
    status: 'Active',
    createdAt: nowIso(),
  },
  {
    id: 'prog_dae',
    code: 'DAE',
    name: 'DAE (Diploma of Associate Engineer)',
    durationYears: 3,
    totalSemesters: 6,
    deptHeadRole: 'hod',
    status: 'Active',
    createdAt: nowIso(),
  },
  {
    id: 'prog_dit',
    code: 'DIT',
    name: 'DIT (Diploma in Information Technology)',
    durationYears: 3,
    totalSemesters: 6,
    deptHeadRole: 'hod',
    status: 'Active',
    createdAt: nowIso(),
  },
  {
    id: 'prog_rs',
    code: 'RS',
    name: 'Related Studies (Allied Sciences)',
    durationYears: 1,
    totalSemesters: 2,
    deptHeadRole: 'hod',
    status: 'Active',
    createdAt: nowIso(),
  },
];

export const DEFAULT_DEPARTMENTS: Department[] = [
  {
    id: 'dept_bt_mech',
    programId: 'prog_bt',
    code: 'BT-MECH',
    name: 'Mechanical Technology (B.Tech)',
    status: 'Active',
    createdAt: nowIso(),
  },
  {
    id: 'dept_bt_civil',
    programId: 'prog_bt',
    code: 'BT-CIVIL',
    name: 'Civil Technology (B.Tech)',
    status: 'Active',
    createdAt: nowIso(),
  },
  {
    id: 'dept_bt_elec',
    programId: 'prog_bt',
    code: 'BT-ELEC',
    name: 'Electrical Technology (B.Tech)',
    status: 'Active',
    createdAt: nowIso(),
  },
  {
    id: 'dept_dae_mech',
    programId: 'prog_dae',
    code: 'DAE-MECH',
    name: 'Mechanical Technology (DAE)',
    status: 'Active',
    createdAt: nowIso(),
  },
  {
    id: 'dept_dae_civil',
    programId: 'prog_dae',
    code: 'DAE-CIVIL',
    name: 'Civil Technology (DAE)',
    status: 'Active',
    createdAt: nowIso(),
  },
  {
    id: 'dept_dae_elec',
    programId: 'prog_dae',
    code: 'DAE-ELEC',
    name: 'Electrical Technology (DAE)',
    status: 'Active',
    createdAt: nowIso(),
  },
  {
    id: 'dept_dae_chem',
    programId: 'prog_dae',
    code: 'DAE-CHEM',
    name: 'Chemical Technology (DAE)',
    status: 'Active',
    createdAt: nowIso(),
  },
  {
    id: 'dept_dae_auto',
    programId: 'prog_dae',
    code: 'DAE-AUTO',
    name: 'Automobile & Diesel (DAE)',
    status: 'Active',
    createdAt: nowIso(),
  },
  {
    id: 'dept_dae_comp',
    programId: 'prog_dae',
    code: 'DAE-COMP',
    name: 'Computer Information Tech (DAE)',
    status: 'Active',
    createdAt: nowIso(),
  },
  {
    id: 'dept_dit_it',
    programId: 'prog_dit',
    code: 'DIT-IT',
    name: 'Information Technology (DIT)',
    status: 'Active',
    createdAt: nowIso(),
  },
  {
    id: 'dept_rs_math',
    programId: 'prog_rs',
    code: 'RS-MATH',
    name: 'Department of Mathematics',
    status: 'Active',
    createdAt: nowIso(),
  },
  {
    id: 'dept_rs_phy',
    programId: 'prog_rs',
    code: 'RS-PHY',
    name: 'Department of Physics & Chemistry',
    status: 'Active',
    createdAt: nowIso(),
  },
];

export const DEFAULT_SETTINGS: CollegeSettings = {
  id: 'settings_singleton',
  collegeName: 'GOVERNMENT COLLEGE OF TECHNOLOGY PESHAWAR',
  departmentName: 'Academic Directorate & Examination Cell',
  affiliation: 'Affiliated with University of Engineering and Technology (UET) Peshawar',
  address: 'Kohat Road, Peshawar, Khyber Pakhtunkhwa, Pakistan',
  phone: '+92-91-9212739',
  email: 'GCT_Peshawar@kptevta.gov.pk',
  website: 'www.gctpesh.edu.pk',
  logoDataUrl: '',
  letterheadDataUrl: '',
  footerText: 'This is an official computer-generated document. For verification contact GCT Peshawar Academic Cell.',
  signatureLabel: 'Authorized Officer / Chairman',
  chairmanName: 'Prof. Engr. Muhammad Tariq',
  chairmanSignatureDataUrl: '',
  shortageThreshold: 70,
  lateToAbsenceThreshold: 3,
  gracePeriodMinutes: 15,
  currentTerm: 'Spring',
  currentYear: 2026,
  qrValiditySeconds: 45,
  qrAttendanceEnabled: true,
};

export const DEFAULT_ACCOUNTS: Account[] = [
  {
    id: 'acc_sysadmin',
    email: 'sysadmin@gct.edu.pk',
    password: 'password',
    role: 'sysadmin',
    displayName: 'System Administrator',
    status: 'Approved',
    linkedId: null,
    createdAt: nowIso(),
  },
  {
    id: 'acc_sysadmin_alias',
    email: 'admin@gctpeshawar.edu.pk',
    password: 'password',
    role: 'sysadmin',
    displayName: 'System Administrator',
    status: 'Approved',
    linkedId: null,
    createdAt: nowIso(),
  },
  {
    id: 'acc_chairman',
    email: 'chairman@gct.edu.pk',
    password: 'password',
    role: 'chairman',
    displayName: 'Prof. Engr. Muhammad Tariq (Chairman B.Tech)',
    status: 'Approved',
    programId: 'prog_bt',
    linkedId: null,
    createdAt: nowIso(),
  },
  {
    id: 'acc_chairman_alias',
    email: 'chairman.civil@gctpeshawar.edu.pk',
    password: 'password',
    role: 'chairman',
    displayName: 'Prof. Engr. Muhammad Tariq (Chairman B.Tech)',
    status: 'Approved',
    programId: 'prog_bt',
    linkedId: null,
    createdAt: nowIso(),
  },
  {
    id: 'acc_hod_mech',
    email: 'hod.dae.mech@gct.edu.pk',
    password: 'password',
    role: 'hod',
    displayName: 'Engr. Zafar Iqbal (HOD DAE Mechanical)',
    status: 'Approved',
    programId: 'prog_dae',
    departmentId: 'dept_dae_mech',
    linkedId: null,
    createdAt: nowIso(),
  },
  {
    id: 'acc_hod_alias',
    email: 'hod.mechanical@gctpeshawar.edu.pk',
    password: 'password',
    role: 'hod',
    displayName: 'Engr. Zafar Iqbal (HOD DAE Mechanical)',
    status: 'Approved',
    programId: 'prog_dae',
    departmentId: 'dept_dae_mech',
    linkedId: null,
    createdAt: nowIso(),
  },
  {
    id: 'acc_coordinator',
    email: 'coordinator@gct.edu.pk',
    password: 'password',
    role: 'coordinator',
    displayName: 'Engr. Haroon Rasheed (Academic Coordinator)',
    status: 'Approved',
    programId: 'prog_bt',
    linkedId: null,
    createdAt: nowIso(),
  },
  {
    id: 'acc_coordinator_alias',
    email: 'coord.civil@gctpeshawar.edu.pk',
    password: 'password',
    role: 'coordinator',
    displayName: 'Engr. Haroon Rasheed (Academic Coordinator)',
    status: 'Approved',
    programId: 'prog_bt',
    linkedId: null,
    createdAt: nowIso(),
  },
  {
    id: 'acc_clerk',
    email: 'clerk@gct.edu.pk',
    password: 'password',
    role: 'clerk',
    displayName: 'Mr. Niaz Muhammad (Assistant Clerk)',
    status: 'Approved',
    programId: 'prog_bt',
    linkedId: null,
    createdAt: nowIso(),
  },
  {
    id: 'acc_assistant',
    email: 'assistant@gct.edu.pk',
    password: 'password',
    role: 'assistant',
    displayName: 'Mr. Asif Khan (Office Assistant)',
    status: 'Approved',
    programId: 'prog_bt',
    linkedId: null,
    createdAt: nowIso(),
  },
  {
    id: 'acc_assistant_alias',
    email: 'assistant.admin@gctpeshawar.edu.pk',
    password: 'password',
    role: 'assistant',
    displayName: 'Mr. Asif Khan (Office Assistant)',
    status: 'Approved',
    programId: 'prog_bt',
    linkedId: null,
    createdAt: nowIso(),
  },
  {
    id: 'acc_teacher_1',
    email: 'teacher@gct.edu.pk',
    password: 'password',
    role: 'teacher',
    displayName: 'Engr. Ahmed Khan',
    status: 'Approved',
    linkedId: 'tch_demo_1',
    programId: 'prog_bt',
    departmentId: 'dept_bt_mech',
    createdAt: nowIso(),
  },
  {
    id: 'acc_teacher_alias',
    email: 'teacher.khan@gctpeshawar.edu.pk',
    password: 'password',
    role: 'teacher',
    displayName: 'Engr. Tariq Khan',
    status: 'Approved',
    linkedId: 'tch_demo_1',
    programId: 'prog_bt',
    departmentId: 'dept_bt_mech',
    createdAt: nowIso(),
  },
  {
    id: 'acc_teacher_2',
    email: 'teacher2@gct.edu.pk',
    password: 'password',
    role: 'teacher',
    displayName: 'Engr. Bilal Ahmad',
    status: 'Approved',
    linkedId: 'tch_demo_2',
    programId: 'prog_bt',
    departmentId: 'dept_bt_mech',
    createdAt: nowIso(),
  },
  {
    id: 'acc_student_1',
    email: 'student@gct.edu.pk',
    password: 'password',
    role: 'student',
    displayName: 'Kashif Ali (B.Tech)',
    status: 'Approved',
    linkedId: 'stu_demo_1',
    cnic: '1730112345671',
    programId: 'prog_bt',
    departmentId: 'dept_bt_mech',
    createdAt: nowIso(),
  },
  {
    id: 'acc_student_alias',
    email: 'student.ahmad@gctpeshawar.edu.pk',
    password: 'password',
    role: 'student',
    displayName: 'Ahmad Khan (Roll: 001)',
    status: 'Approved',
    linkedId: 'stu_demo_1',
    cnic: '1730112345671',
    programId: 'prog_bt',
    departmentId: 'dept_bt_mech',
    createdAt: nowIso(),
  },
  {
    id: 'acc_parent_1',
    email: 'parent@gct.edu.pk',
    password: 'password',
    role: 'parent',
    displayName: 'Haji Ali Muhammad (Parent)',
    status: 'Approved',
    linkedId: 'par_demo_1',
    programId: 'prog_bt',
    departmentId: 'dept_bt_mech',
    createdAt: nowIso(),
  },
  {
    id: 'acc_parent_alias',
    email: 'parent.ahmad@gctpeshawar.edu.pk',
    password: 'password',
    role: 'parent',
    displayName: 'Guardian of Ahmad Khan',
    status: 'Approved',
    linkedId: 'par_demo_1',
    programId: 'prog_bt',
    departmentId: 'dept_bt_mech',
    createdAt: nowIso(),
  },
];

export function buildDefaultSemestersAndSections(programs: Program[]): {
  semesters: Semester[];
  sections: Section[];
} {
  const semesters: Semester[] = [];
  const sections: Section[] = [];
  const ordinals = ['1st', '2nd', '3rd', '4th', '5th', '6th', '7th', '8th'];

  programs.forEach((prog) => {
    for (let i = 1; i <= prog.totalSemesters; i++) {
      const semId = `sem_${prog.code.toLowerCase()}_${i}`;
      const sem: Semester = {
        id: semId,
        number: i,
        name: `${prog.code} · Semester ${i} (${ordinals[i - 1] || `${i}th`})`,
        programId: prog.id,
      };
      semesters.push(sem);

      ['A', 'B'].forEach((secName) => {
        sections.push({
          id: `sec_${prog.code.toLowerCase()}_${i}_${secName.toLowerCase()}`,
          name: secName,
          semesterId: semId,
          programId: prog.id,
          capacity: 60,
        });
      });
    }
  });

  return { semesters, sections };
}

export function createInitialState(): ERPState {
  const { semesters, sections } = buildDefaultSemestersAndSections(DEFAULT_PROGRAMS);

  const teachers: Teacher[] = [
    {
      id: 'tch_demo_1',
      name: 'Engr. Ahmed Khan',
      employeeCode: 'EMP-0101',
      email: 'teacher@gct.edu.pk',
      designation: 'Senior Lecturer',
      programId: 'prog_bt',
      departmentId: 'dept_bt_mech',
      active: true,
      phone: '03001234567',
      createdAt: nowIso(),
    },
    {
      id: 'tch_demo_2',
      name: 'Engr. Bilal Ahmad',
      employeeCode: 'EMP-0102',
      email: 'teacher2@gct.edu.pk',
      designation: 'Assistant Professor',
      programId: 'prog_bt',
      departmentId: 'dept_bt_mech',
      active: true,
      phone: '03007654321',
      createdAt: nowIso(),
    },
    {
      id: 'tch_demo_3',
      name: 'Engr. Sana Ullah',
      employeeCode: 'EMP-0103',
      email: 'teacher3@gct.edu.pk',
      designation: 'Lecturer',
      programId: 'prog_dae',
      departmentId: 'dept_dae_mech',
      active: true,
      phone: '03339876543',
      createdAt: nowIso(),
    },
  ];

  const semBT1 = semesters.find((s) => s.programId === 'prog_bt' && s.number === 1)?.id || '';
  const secBTA = sections.find((s) => s.semesterId === semBT1 && s.name === 'A')?.id || '';
  const semDAE1 = semesters.find((s) => s.programId === 'prog_dae' && s.number === 1)?.id || '';
  const secDAEA = sections.find((s) => s.semesterId === semDAE1 && s.name === 'A')?.id || '';

  const students: Student[] = [
    {
      id: 'stu_demo_1',
      admissionNumber: 'BT-2026-001',
      registrationNumber: '2026-GCT-BT-001',
      classNumber: 'MECH-1A-01',
      name: 'Kashif Ali',
      fatherName: 'Haji Ali Muhammad',
      studentMobile: '03009876541',
      fatherMobile: '03009876540',
      cnic: '1730112345671',
      dob: '2005-03-15',
      email: 'student@gct.edu.pk',
      programId: 'prog_bt',
      departmentId: 'dept_bt_mech',
      currentSemesterId: semBT1,
      currentSectionId: secBTA,
      batch: '2026-2030',
      session: 'Spring',
      status: 'Active',
      admissionDate: todayIso(),
      createdAt: nowIso(),
    },
    {
      id: 'stu_demo_2',
      admissionNumber: 'BT-2026-002',
      registrationNumber: '2026-GCT-BT-002',
      classNumber: 'MECH-1A-02',
      name: 'Hamza Khan',
      fatherName: 'Naveed Khan',
      studentMobile: '03009876542',
      fatherMobile: '03009876543',
      cnic: '1730112345672',
      dob: '2005-07-20',
      email: 'hamza.khan@gct.edu.pk',
      programId: 'prog_bt',
      departmentId: 'dept_bt_mech',
      currentSemesterId: semBT1,
      currentSectionId: secBTA,
      batch: '2026-2030',
      session: 'Spring',
      status: 'Active',
      admissionDate: todayIso(),
      createdAt: nowIso(),
    },
    {
      id: 'stu_demo_3',
      admissionNumber: 'DAE-2026-001',
      registrationNumber: '2026-GCT-DAE-001',
      classNumber: 'DAE-MECH-1A-01',
      name: 'Usman Ghani',
      fatherName: 'Abdul Ghani',
      studentMobile: '03009876544',
      fatherMobile: '03009876545',
      cnic: '1730112345673',
      dob: '2006-01-10',
      email: 'usman.dae@gct.edu.pk',
      programId: 'prog_dae',
      departmentId: 'dept_dae_mech',
      currentSemesterId: semDAE1,
      currentSectionId: secDAEA,
      batch: '2026-2029',
      session: 'Spring',
      status: 'Active',
      admissionDate: todayIso(),
      createdAt: nowIso(),
    },
  ];

  const courses: Course[] = [
    {
      id: 'crs_bt_101',
      code: 'BT-ME-101',
      name: 'Applied Thermodynamics',
      creditHours: 3,
      type: 'theory',
      programId: 'prog_bt',
      departmentId: 'dept_bt_mech',
      semesterId: semBT1,
      status: 'Active',
      createdAt: nowIso(),
    },
    {
      id: 'crs_bt_102',
      code: 'BT-ME-102',
      name: 'Engineering Mechanics',
      creditHours: 3,
      type: 'theory',
      programId: 'prog_bt',
      departmentId: 'dept_bt_mech',
      semesterId: semBT1,
      status: 'Active',
      createdAt: nowIso(),
    },
    {
      id: 'crs_bt_103',
      code: 'BT-ME-103',
      name: 'Engineering Drawing & CAD',
      creditHours: 2,
      type: 'practical',
      programId: 'prog_bt',
      departmentId: 'dept_bt_mech',
      semesterId: semBT1,
      status: 'Active',
      createdAt: nowIso(),
    },
  ];

  const courseAssignments: CourseAssignment[] = [
    {
      id: 'asg_1',
      courseId: 'crs_bt_101',
      teacherId: 'tch_demo_1',
      semesterId: semBT1,
      sectionId: secBTA,
      academicYear: 2026,
    },
    {
      id: 'asg_2',
      courseId: 'crs_bt_102',
      teacherId: 'tch_demo_2',
      semesterId: semBT1,
      sectionId: secBTA,
      academicYear: 2026,
    },
  ];

  const timetable: TimetableSlot[] = [
    {
      id: 'tt_1',
      day: 'Monday',
      startTime: '08:30',
      endTime: '09:30',
      courseId: 'crs_bt_101',
      teacherId: 'tch_demo_1',
      programId: 'prog_bt',
      departmentId: 'dept_bt_mech',
      semesterId: semBT1,
      sectionId: secBTA,
      className: 'Hall A (Ground Floor)',
      slotType: 'Theory',
      status: 'Active',
      createdAt: nowIso(),
    },
    {
      id: 'tt_2',
      day: 'Monday',
      startTime: '09:30',
      endTime: '10:30',
      courseId: 'crs_bt_102',
      teacherId: 'tch_demo_2',
      programId: 'prog_bt',
      departmentId: 'dept_bt_mech',
      semesterId: semBT1,
      sectionId: secBTA,
      className: 'Room 12 (Mechanical Block)',
      slotType: 'Theory',
      status: 'Active',
      createdAt: nowIso(),
    },
    {
      id: 'tt_3',
      day: 'Wednesday',
      startTime: '10:00',
      endTime: '11:00',
      courseId: 'crs_bt_101',
      teacherId: 'tch_demo_1',
      programId: 'prog_bt',
      departmentId: 'dept_bt_mech',
      semesterId: semBT1,
      sectionId: secBTA,
      className: 'Hall A',
      slotType: 'Theory',
      status: 'Active',
      createdAt: nowIso(),
    },
  ];

  return {
    session: null,
    settings: DEFAULT_SETTINGS,
    programs: DEFAULT_PROGRAMS,
    departments: DEFAULT_DEPARTMENTS,
    semesters,
    sections,
    students,
    teachers,
    accounts: DEFAULT_ACCOUNTS,
    courses,
    courseAssignments,
    timetable,
    attendanceSessions: [],
    attendanceRecords: [
      {
        id: 'rec_init_1',
        sessionId: 'session_demo',
        studentId: 'stu_demo_1',
        courseId: 'crs_bt_101',
        teacherId: 'tch_demo_1',
        semesterId: semBT1,
        sectionId: secBTA,
        date: todayIso(),
        arrivalTime: '08:32',
        status: 'present',
        lateMinutes: 2,
        markedBy: 'tch_demo_1',
        markedAt: nowIso(),
      },
      {
        id: 'rec_init_2',
        sessionId: 'session_demo',
        studentId: 'stu_demo_2',
        courseId: 'crs_bt_101',
        teacherId: 'tch_demo_1',
        semesterId: semBT1,
        sectionId: secBTA,
        date: todayIso(),
        arrivalTime: '08:50',
        status: 'late',
        lateMinutes: 20,
        markedBy: 'tch_demo_1',
        markedAt: nowIso(),
      },
    ],
    leaveApplications: [
      {
        id: 'lv_demo_1',
        studentId: 'stu_demo_1',
        leaveType: 'Medical',
        startDate: todayIso(),
        endDate: todayIso(),
        days: 1,
        reason: 'Severe fever and medical doctor consultation.',
        status: 'with_chairman',
        currentOwnerRole: 'chairman',
        submittedAt: nowIso(),
        teacherRemarks: 'Recommended. Student showed doctor prescription.',
        timeline: [
          {
            at: nowIso(),
            action: 'Submitted',
            by: 'stu_demo_1',
            role: 'student',
            note: 'Application submitted',
          },
          {
            at: nowIso(),
            action: 'Forwarded',
            by: 'tch_demo_1',
            role: 'teacher',
            note: 'Forwarded with recommendation',
          },
        ],
      },
    ],
    teacherLeaveApplications: [
      {
        id: 'tlv_demo_1',
        teacherId: 'tch_demo_2',
        teacherName: 'Engr. Bilal Ahmad',
        leaveType: 'Casual',
        startDate: todayIso(),
        endDate: todayIso(),
        days: 1,
        reason: 'Attending National Technical Education Workshop & Symposium at UET Peshawar.',
        status: 'with_chairman',
        submittedAt: nowIso(),
        programId: 'prog_bt',
        departmentId: 'dept_bt_mech',
      },
    ],
    lateScanRequests: [],
    substitutionRequests: [],
    committees: [
      {
        id: 'cmt_obe',
        committeeNumber: 1,
        name: 'Outcome Based Education (OBE) Steering Committee',
        formationDate: '2025-09-01',
        committeeType: 'Standing',
        committeeKind: 'OBE',
        description: 'Oversees engineering program accreditation and curriculum alignments.',
        status: 'Active',
        createdAt: nowIso(),
      },
    ],
    committeeMembers: [
      {
        id: 'cmm_1',
        committeeId: 'cmt_obe',
        memberName: 'Prof. Engr. Muhammad Tariq',
        designation: 'Chairman',
        position: 'Convener',
        status: 'Active',
        joinedAt: nowIso(),
        addedBy: 'sysadmin',
      },
    ],
    committeeMeetings: [],
    parentTeacherMeetings: [
      {
        id: 'ptm_1',
        title: 'Mid-Term Academic Review & Attendance Counseling',
        date: todayIso(),
        time: '11:00 AM',
        venue: 'Main Auditorium, GCT Peshawar',
        agenda: 'Review student attendance thresholds and 1st sessional results.',
        status: 'Approved',
        createdAt: nowIso(),
        createdBy: 'coordinator',
        createdByName: 'Academic Coordinator',
      },
    ],
    assignments: [
      {
        id: 'asg_demo_1',
        title: 'First Law of Thermodynamics Energy Analysis',
        description: 'Solve textbook chapter 4 problems 12 to 24 with closed system boundary equations.',
        courseId: 'crs_bt_101',
        semesterId: semBT1,
        sectionId: secBTA,
        teacherId: 'tch_demo_1',
        teacherName: 'Engr. Ahmed Khan',
        dueDate: todayIso(),
        totalMarks: 20,
        status: 'Open',
        createdAt: nowIso(),
      },
    ],
    assignmentSubmissions: [],
    sharedFiles: [],
    notifications: [
      {
        id: 'ntf_welcome',
        title: 'Welcome to GCT Peshawar ERP',
        message: 'The upgraded SkoolZoom-grade ERP is now active for Spring 2026 semester operations.',
        type: 'info',
        read: false,
        createdAt: nowIso(),
      },
      {
        id: 'ntf_chr_leave_pending',
        title: 'Student Leave Awaiting Chairman Approval',
        message: 'Kashif Ali (B.Tech ME-1A-01) requested 1 day Medical Leave. Teacher recommendation: Verified with doctor prescription.',
        type: 'warn',
        read: false,
        recipientRole: 'chairman',
        relatedRoute: '#/app/leaves',
        createdAt: nowIso(),
      },
      {
        id: 'ntf_chr_faculty_leave',
        title: 'Faculty Leave Application Submitted',
        message: 'Engr. Bilal Ahmad (Assistant Professor) submitted Casual Leave for National Technical Education Workshop.',
        type: 'warn',
        read: false,
        recipientRole: 'chairman',
        relatedRoute: '#/app/leaves',
        createdAt: nowIso(),
      },
      {
        id: 'ntf_tch_attendance',
        title: 'Class Attendance Lecture Reminder',
        message: 'Applied Thermodynamics (BT-ME-101) scheduled for today. Launch dynamic rotating QR session or mark manual register.',
        type: 'info',
        read: false,
        recipientRole: 'teacher',
        relatedRoute: '#/app/qr/start',
        createdAt: nowIso(),
      },
      {
        id: 'ntf_stu_bte_policy',
        title: 'KP-BTE Mandatory 70% Attendance Notice',
        message: 'Official Policy: Minimum 70% cumulative attendance required for term-end board exams. Every 3 late punch-ins count as 1 absence.',
        type: 'warn',
        read: false,
        recipientRole: 'student',
        relatedRoute: '#/app/attendance',
        createdAt: nowIso(),
      },
      {
        id: 'ntf_stu_asg',
        title: 'Coursework Assignment 1 Published',
        message: 'Applied Thermodynamics Assignment 1 — First Law & Energy Equations has been posted. Due this week.',
        type: 'info',
        read: false,
        recipientRole: 'student',
        relatedRoute: '#/app/assignments',
        createdAt: nowIso(),
      },
      {
        id: 'ntf_par_report',
        title: 'Ward Monthly Academic Standing Report',
        message: 'Kashif Ali has maintained 95.0% adjusted attendance in Spring 2026. Academic standing: Eligible for final board exams.',
        type: 'success',
        read: false,
        recipientRole: 'parent',
        relatedRoute: '#/app/attendance',
        createdAt: nowIso(),
      },
      {
        id: 'ntf_par_ptm',
        title: 'Department Parent-Teacher Meeting (PTM)',
        message: 'Upcoming Parent-Teacher consultation session scheduled at Mechanical Engineering Block.',
        type: 'info',
        read: false,
        recipientRole: 'parent',
        relatedRoute: '#/app/parent-meetings',
        createdAt: nowIso(),
      },
      {
        id: 'ntf_adm_reg',
        title: 'Public Portal Account Verification',
        message: 'Public account registration request received and awaiting administrative credentials verification.',
        type: 'warn',
        read: false,
        recipientRole: 'sysadmin',
        relatedRoute: '#/app/registrations-admin',
        createdAt: nowIso(),
      },
    ],
    warnings: [],
    exitRecords: [],
    auditLogs: [
      {
        id: 'audit_init',
        userId: 'system',
        role: 'system',
        action: 'system.bootstrap',
        module: 'core',
        timestamp: nowIso(),
      },
    ],
    parents: [
      {
        id: 'par_demo_1',
        name: 'Haji Ali Muhammad',
        email: 'parent@gct.edu.pk',
        mobile: '03009876540',
        relation: 'Father',
      },
    ],
    parentLinks: [
      {
        id: 'pl_1',
        parentId: 'par_demo_1',
        studentId: 'stu_demo_1',
        relation: 'Father',
        isPrimary: true,
        verified: true,
        linkedAt: nowIso(),
      },
    ],
    semesterHistory: [],
    promotions: [],
  };
}

export function loadERPState(): ERPState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      const initial = createInitialState();
      saveERPState(initial);
      return initial;
    }
    const parsed = JSON.parse(raw);
    const initial = createInitialState();
    
    // Merge default accounts to ensure demo logins always work
    const accountMap = new Map<string, Account>();
    DEFAULT_ACCOUNTS.forEach((a) => accountMap.set(a.email.toLowerCase(), a));
    (Array.isArray(parsed.accounts) ? parsed.accounts : []).forEach((a: Account) => {
      if (a && a.email) accountMap.set(a.email.toLowerCase(), a);
    });

    // Merge notifications so default role notifications are always available
    const existingNotifIds = new Set((parsed.notifications || []).map((n: any) => n.id));
    const mergedNotifications = [
      ...(parsed.notifications || []),
      ...initial.notifications.filter((n) => !existingNotifIds.has(n.id)),
    ];

    // Merge seed leave applications if not present
    const existingLeaveIds = new Set((parsed.leaveApplications || []).map((l: any) => l.id));
    const mergedLeaves = [
      ...(parsed.leaveApplications || []),
      ...initial.leaveApplications.filter((l) => !existingLeaveIds.has(l.id)),
    ];

    const existingTeacherLeaveIds = new Set((parsed.teacherLeaveApplications || []).map((l: any) => l.id));
    const mergedTeacherLeaves = [
      ...(parsed.teacherLeaveApplications || []),
      ...initial.teacherLeaveApplications.filter((l) => !existingTeacherLeaveIds.has(l.id)),
    ];

    return {
      ...initial,
      ...parsed,
      accounts: Array.from(accountMap.values()),
      settings: { ...initial.settings, ...(parsed.settings || {}) },
      notifications: mergedNotifications,
      leaveApplications: mergedLeaves,
      teacherLeaveApplications: mergedTeacherLeaves,
    };
  } catch (e) {
    console.error('Error loading ERP state, falling back to clean seed:', e);
    const initial = createInitialState();
    saveERPState(initial);
    return initial;
  }
}

export function saveERPState(state: ERPState): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch (e) {
    console.warn('Failed to write ERP state to localStorage:', e);
  }
}
