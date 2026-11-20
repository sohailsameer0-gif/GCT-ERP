import React, { createContext, useContext, useEffect, useState } from 'react';
import {
  calculateAttendanceSummary,
  cleanMobile,
  getDeviceFingerprint,
  getDayOfWeek,
  nowIso,
  secureToken,
  timeToMinutes,
  todayIso,
  uid,
} from '../services/calculations';
import { playNotificationTone } from '../services/sound';
import {
  DEFAULT_ACCOUNTS,
  loadERPState,
  REMEMBER_KEY,
  saveERPState,
} from '../services/storage';
import {
  Account,
  Assignment,
  AttendanceRecord,
  AttendanceSession,
  AttendanceStatus,
  Committee,
  CommitteeMeeting,
  CommitteeMember,
  Course,
  Department,
  ERPState,
  LateScanRequest,
  LeaveApplication,
  Notification,
  ParentTeacherMeeting,
  Program,
  Section,
  Semester,
  SharedFile,
  Student,
  SubstitutionRequest,
  Teacher,
  TeacherLeaveApplication,
  TimetableSlot,
  UserRole,
  UserSession,
  Warning,
} from '../types/erp';

export interface ToastItem {
  id: string;
  type: 'success' | 'error' | 'warn' | 'info';
  title?: string;
  message: string;
}

export interface Scope {
  unrestricted: boolean;
  programIds: string[];
  departmentIds: string[];
  role: UserRole | null;
}

interface ERPContextValue {
  state: ERPState;
  session: UserSession | null;
  user: UserSession | null;
  setUser: (user: UserSession | null) => void;
  toasts: ToastItem[];
  addToast: (message: string, type?: ToastItem['type'], title?: string) => void;
  removeToast: (id: string) => void;
  login: (emailOrCnic: string, password: string, rememberMe?: boolean) => UserSession;
  logout: () => void;
  updateProfile: (patch: Partial<UserSession>) => void;
  changePassword: (oldPwd: string, newPwd: string) => void;
  updateSettings: (patch: Partial<ERPState['settings']>) => void;
  getScope: () => Scope;
  can: (permission: string) => boolean;
  pushNotification: (data: Omit<Notification, 'id' | 'createdAt' | 'read'>) => void;
  markNotificationRead: (id: string) => void;
  markAllNotificationsRead: () => void;
  // Students
  createStudent: (data: Omit<Student, 'id' | 'createdAt'>) => Student;
  updateStudent: (id: string, data: Partial<Student>) => void;
  deleteStudent: (id: string) => void;
  promoteStudent: (
    studentId: string,
    toSemesterId: string,
    toSectionId: string,
    remarks?: string
  ) => void;
  strikeOffStudent: (studentId: string, reason: string) => void;
  reinstateStudent: (studentId: string, remarks?: string) => void;
  cancelStudentAdmission: (studentId: string, reason: string) => void;
  requestAdmissionCancellation: (studentId: string, reason: string) => void;
  // Teachers & Staff
  createTeacher: (data: Omit<Teacher, 'id' | 'createdAt'>) => Teacher;
  updateTeacher: (id: string, data: Partial<Teacher>) => void;
  deleteTeacher: (id: string) => void;
  createStaffAccount: (data: Partial<Account>) => Account;
  updateStaffAccount: (id: string, patch: Partial<Account>) => void;
  deleteStaffAccount: (id: string) => void;
  deactivateStaffAccount: (id: string) => void;
  approveRegistration: (accountId: string, linkedIdOverride?: string) => void;
  rejectRegistration: (accountId: string, reason?: string) => void;
  registerAccount: (data: Partial<Account>) => Account;
  // Programs & Courses
  createProgram: (data: Omit<Program, 'id' | 'createdAt'>) => Program;
  createDepartment: (data: Omit<Department, 'id' | 'createdAt'>) => Department;
  createCourse: (data: Omit<Course, 'id' | 'createdAt'>) => Course;
  updateCourse: (id: string, data: Partial<Course>) => void;
  deleteCourse: (id: string) => void;
  // Timetable
  createSlot: (data: Omit<TimetableSlot, 'id' | 'createdAt'>) => TimetableSlot;
  updateSlot: (id: string, data: Partial<TimetableSlot>) => void;
  deleteSlot: (id: string) => void;
  // Attendance
  startClassSession: (timetableId: string, actualStartIso?: string) => AttendanceSession;
  closeClassSession: (sessionId: string) => void;
  rotateQrToken: (sessionId: string, silent?: boolean) => void;
  scanQr: (token: string, studentId: string) => AttendanceRecord;
  punchOutQr: (studentId: string) => void;
  markManualAttendance: (data: {
    studentId: string;
    courseId: string;
    teacherId: string;
    date: string;
    status: AttendanceStatus;
    lateMinutes?: number;
    remarks?: string;
    correct?: boolean;
  }) => void;
  requestLateScan: (reason: string) => LateScanRequest;
  decideLateScan: (requestId: string, decision: 'approved' | 'rejected', remarks?: string) => void;
  // Leaves
  submitStudentLeave: (data: {
    leaveType: string;
    startDate: string;
    endDate: string;
    reason: string;
    description?: string;
  }) => LeaveApplication;
  forwardStudentLeave: (leaveId: string, remarks?: string) => void;
  decideStudentLeave: (leaveId: string, decision: 'approve' | 'reject', remarks: string) => void;
  submitTeacherLeave: (data: {
    leaveType: string;
    startDate: string;
    endDate: string;
    reason: string;
    description?: string;
  }) => TeacherLeaveApplication;
  decideTeacherLeave: (leaveId: string, decision: 'approve' | 'reject', remarks: string) => void;
  // Substitutions
  createSubstitutionRequest: (timetableId: string, date: string, reason: string, targetTeacherId?: string) => SubstitutionRequest;
  acceptSubstitution: (id: string) => void;
  declineSubstitution: (id: string, reason?: string) => void;
  assignSubstitute: (id: string, teacherId: string) => void;
  // Committees
  createCommittee: (data: Partial<Committee>) => Committee;
  updateCommittee: (id: string, data: Partial<Committee>) => void;
  deleteCommittee: (id: string) => void;
  addCommitteeMember: (data: Partial<CommitteeMember>) => CommitteeMember;
  removeCommitteeMember: (memberId: string) => void;
  scheduleMeeting: (data: Partial<CommitteeMeeting>) => CommitteeMeeting;
  approveMeeting: (meetingId: string) => void;
  // PTM
  createPTM: (data: Partial<ParentTeacherMeeting>) => ParentTeacherMeeting;
  approvePTM: (id: string) => void;
  // Assignments
  createAssignment: (data: Partial<Assignment>) => Assignment;
  submitAssignment: (assignmentId: string, notes?: string, fileDataUrl?: string, fileName?: string) => void;
  gradeAssignment: (submissionId: string, grade: string | number, feedback?: string) => void;
  // File sharing
  shareFile: (data: Omit<SharedFile, 'id' | 'sharedAt' | 'sharedBy' | 'sharedByName'>) => SharedFile;
  deleteSharedFile: (id: string) => void;
  // Warnings & Import
  issueWarning: (studentId: string, severity: Warning['severity'], reason: string) => Warning;
  importStudents: (students: Partial<Student>[]) => { imported: number; errors: string[] };
}

const ERPContext = createContext<ERPContextValue | null>(null);

export const ERPProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, setState] = useState<ERPState>(() => {
    const loaded = loadERPState();
    // Synchronously check active user or remembered session
    try {
      const activeRaw = localStorage.getItem('gct_active_user') || localStorage.getItem(REMEMBER_KEY);
      if (activeRaw) {
        const parsed = JSON.parse(activeRaw);
        if (parsed && (parsed.userId || parsed.email)) {
          loaded.session = parsed;
        }
      }
    } catch (e) {
      console.warn('Error reading active session from storage:', e);
    }
    return loaded;
  });

  const [toasts, setToasts] = useState<ToastItem[]>([]);

  useEffect(() => {
    saveERPState(state);
  }, [state]);

  const setUser = (user: UserSession | null) => {
    if (user) {
      try {
        localStorage.setItem('gct_active_user', JSON.stringify(user));
        localStorage.setItem(REMEMBER_KEY, JSON.stringify(user));
      } catch (e) {}
      setState((prev) => {
        const next = { ...prev, session: user };
        saveERPState(next);
        return next;
      });
    } else {
      try {
        localStorage.removeItem('gct_active_user');
        localStorage.removeItem(REMEMBER_KEY);
      } catch (e) {}
      setState((prev) => {
        const next = { ...prev, session: null };
        saveERPState(next);
        return next;
      });
    }
  };

  const addToast = (message: string, type: ToastItem['type'] = 'info', title?: string) => {
    const id = uid('toast');
    setToasts((prev) => [...prev, { id, message, type, title }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  };

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  const audit = (action: string, module: string, recordId?: string | null, before?: any, after?: any) => {
    const entry = {
      id: uid('log'),
      userId: state.session?.userId || 'system',
      role: state.session?.role || 'system',
      action,
      module,
      recordId: recordId || null,
      before: before || null,
      after: after || null,
      programId: state.session?.programId || null,
      departmentId: state.session?.departmentId || null,
      timestamp: nowIso(),
    };
    setState((prev) => ({
      ...prev,
      auditLogs: [...prev.auditLogs, entry],
    }));
  };

  const pushNotification = (data: Omit<Notification, 'id' | 'createdAt' | 'read'>) => {
    const notif: Notification = {
      ...data,
      id: uid('ntf'),
      read: false,
      createdAt: nowIso(),
    };
    setState((prev) => ({
      ...prev,
      notifications: [notif, ...prev.notifications],
    }));
    playNotificationTone(data.type === 'error' || data.type === 'warn' ? 'warning' : 'info');
  };

  const markNotificationRead = (id: string) => {
    setState((prev) => ({
      ...prev,
      notifications: prev.notifications.map((n) => (n.id === id ? { ...n, read: true } : n)),
    }));
  };

  const markAllNotificationsRead = () => {
    setState((prev) => ({
      ...prev,
      notifications: prev.notifications.map((n) => ({ ...n, read: true })),
    }));
    addToast('All notifications marked as read', 'success');
  };

  const getScope = (): Scope => {
    const s = state.session;
    if (!s) return { unrestricted: false, programIds: [], departmentIds: [], role: null };
    if (s.role === 'sysadmin') return { unrestricted: true, programIds: [], departmentIds: [], role: 'sysadmin' };
    if (s.role === 'chairman') {
      if (s.programId) return { unrestricted: false, programIds: [s.programId], departmentIds: [], role: 'chairman' };
      return { unrestricted: true, programIds: [], departmentIds: [], role: 'chairman' };
    }
    if (s.role === 'hod') {
      return {
        unrestricted: false,
        programIds: s.programId ? [s.programId] : [],
        departmentIds: s.departmentId ? [s.departmentId] : [],
        role: 'hod',
      };
    }
    if (s.role === 'coordinator' || s.role === 'clerk' || s.role === 'assistant' || s.role === 'teacher') {
      return {
        unrestricted: false,
        programIds: s.programId ? [s.programId] : [],
        departmentIds: s.departmentId ? [s.departmentId] : [],
        role: s.role,
      };
    }
    if (s.role === 'student' || s.role === 'parent') {
      let stu: Student | undefined;
      if (s.role === 'student') {
        stu = state.students.find((x) => x.id === s.linkedId);
      } else {
        const link = state.parentLinks.find((l) => l.parentId === s.linkedId && l.verified);
        stu = link ? state.students.find((x) => x.id === link.studentId) : undefined;
      }
      return {
        unrestricted: false,
        programIds: stu?.programId ? [stu.programId] : [],
        departmentIds: stu?.departmentId ? [stu.departmentId] : [],
        role: s.role,
      };
    }
    return { unrestricted: false, programIds: [], departmentIds: [], role: s.role };
  };

  const can = (permission: string): boolean => {
    const s = state.session;
    if (!s) return false;
    if (s.role === 'sysadmin' || s.role === 'chairman') return true;
    if (Array.isArray(s.permissions) && s.permissions.includes('*')) return true;
    if (Array.isArray(s.permissions) && s.permissions.includes(permission)) return true;

    const DEFAULT_PERMS: Record<UserRole, string[]> = {
      sysadmin: ['*'],
      chairman: ['*'],
      hod: [
        'dashboard.view', 'students.view', 'teachers.view', 'teachers.manage',
        'courses.view', 'courses.create', 'timetable.view', 'timetable.manage',
        'attendance.view', 'attendance.manual', 'attendance.correct',
        'leaves.review', 'leaves.forward', 'leaves.decide', 'leaves.view',
        'reports.view', 'reports.print', 'notifications.view', 'ptm.view',
        'meetings.manage', 'committees.view', 'committees.manage', 'audit.view',
        'warnings.manage', 'promotions.manage', 'profile.change', 'password.change',
      ],
      teacher: [
        'dashboard.view', 'my-classes.view', 'my-timetable.view', 'attendance.mark',
        'attendance.view', 'attendance.manual', 'attendance.correct', 'qr.start',
        'leaves.review', 'leaves.forward', 'leaves.view', 'my-leave.submit',
        'my-leave.view', 'students.view.assigned', 'academics.manage.assigned',
        'notifications.view', 'profile.change', 'password.change', 'courses.create',
        'ptm.view', 'assignments.manage', 'assignments.view', 'substitution.request',
        'substitution.respond',
      ],
      coordinator: [
        'dashboard.view', 'committees.manage', 'committees.view', 'committees.print',
        'meetings.manage', 'parent-meetings.manage', 'notifications.view',
        'profile.change', 'password.change', 'ptm.view', 'assignments.view', 'sharedfiles.view',
      ],
      clerk: [
        'dashboard.view', 'students.view', 'students.create', 'students.update',
        'students.delete', 'admissions.manage', 'registrations.manage',
        'promotions.manage', 'timetable.view', 'timetable.manage', 'attendance.view',
        'attendance.manual', 'reports.view', 'reports.print', 'import.manage',
        'notifications.view', 'exit-records.manage', 'courses.create', 'profile.change',
        'password.change', 'assignments.view', 'sharedfiles.view',
      ],
      assistant: [
        'dashboard.view', 'students.view', 'students.create', 'students.update',
        'promotions.manage', 'import.manage', 'admissions.manage', 'registrations.manage',
        'courses.view', 'timetable.view', 'attendance.view', 'notifications.view',
        'reports.view', 'profile.change', 'password.change', 'assignments.view',
      ],
      student: [
        'dashboard.view', 'profile.view.own', 'my-attendance.view', 'my-timetable.view',
        'my-leave.submit', 'my-leave.view', 'my-academics.view', 'qr.scan',
        'notifications.view', 'my-warnings.view', 'profile.change', 'password.change',
        'assignments.submit', 'assignments.view',
      ],
      parent: [
        'dashboard.view', 'child.view', 'child.attendance.view', 'child.leave.view',
        'child.timetable.view', 'child.academics.view', 'notifications.view',
        'parent-meeting.view', 'profile.change', 'password.change',
      ],
    };

    const perms = DEFAULT_PERMS[s.role] || [];
    return perms.includes('*') || perms.includes(permission);
  };

  const login = (emailOrCnic: string, pwd: string, rememberMe: boolean = false): UserSession => {
    const rawInput = (emailOrCnic || '').trim();
    const cleanId = rawInput.toLowerCase();
    const cleanNum = rawInput.replace(/\D/g, '');
    const cleanPwd = (pwd || '').trim();

    // Map of common role aliases/nicknames
    const roleAliases: Record<string, UserRole> = {
      admin: 'sysadmin',
      sysadmin: 'sysadmin',
      administrator: 'sysadmin',
      chairman: 'chairman',
      hod: 'hod',
      coordinator: 'coordinator',
      coord: 'coordinator',
      clerk: 'clerk',
      assistant: 'assistant',
      teacher: 'teacher',
      student: 'student',
      parent: 'parent',
    };

    // Merge default accounts with custom accounts in state
    const allAccounts = [...DEFAULT_ACCOUNTS, ...state.accounts];

    // Find account with flexible matching
    const acc = allAccounts.find((a) => {
      if (!a) return false;
      const aEmail = (a.email || '').toLowerCase();
      const aPrefix = aEmail.split('@')[0];
      const aCnicNum = (a.cnic || '').replace(/\D/g, '');

      // 1. Exact email match
      if (aEmail === cleanId) return true;

      // 2. Email prefix match (e.g. 'sysadmin', 'chairman', 'teacher', 'admin')
      if (aPrefix === cleanId) return true;

      // 3. Direct role keyword match
      if (roleAliases[cleanId] && a.role === roleAliases[cleanId]) return true;

      // 4. Domain prefix match (e.g. admin@gctpeshawar.edu.pk matches sysadmin)
      const inputPrefix = cleanId.split('@')[0];
      if (roleAliases[inputPrefix] && a.role === roleAliases[inputPrefix]) return true;

      // 4b. Base prefix match (e.g. chairman.civil -> chairman, teacher.khan -> teacher)
      const basePrefix = inputPrefix.split('.')[0];
      if (roleAliases[basePrefix] && a.role === roleAliases[basePrefix]) return true;
      if (a.role === basePrefix) return true;

      // 5. Student classNumber / rollNo / registrationNumber / admissionNumber match
      if (a.role === 'student') {
        const stu = a.linkedId
          ? state.students.find((s) => s.id === a.linkedId)
          : state.students.find((s) => s.email?.toLowerCase() === aEmail);
        if (stu) {
          if (stu.classNumber && stu.classNumber.toLowerCase() === cleanId) return true;
          if (stu.registrationNumber && stu.registrationNumber.toLowerCase() === cleanId) return true;
          if (stu.admissionNumber && stu.admissionNumber.toLowerCase() === cleanId) return true;
          if (cleanNum && cleanNum.length >= 7 && stu.cnic.replace(/\D/g, '').includes(cleanNum)) return true;
        }
      }

      // 6. Teacher employee code match
      if (a.role === 'teacher') {
        const tch = a.linkedId
          ? state.teachers.find((t) => t.id === a.linkedId)
          : state.teachers.find((t) => t.email?.toLowerCase() === aEmail);
        if (tch && tch.employeeCode && tch.employeeCode.toLowerCase() === cleanId) return true;
      }

      // 7. CNIC number match
      if (cleanNum.length >= 11 && aCnicNum && aCnicNum === cleanNum) return true;

      return false;
    });

    if (!acc) {
      throw new Error(`Account not found for "${rawInput}". Please use one of the 1-Click Role Switcher buttons or check your email.`);
    }

    // Password check: allow configured password or standard 'password'
    const isPasswordValid =
      cleanPwd === 'password' ||
      acc.password === pwd ||
      acc.password === cleanPwd ||
      !acc.password;

    if (!isPasswordValid) {
      throw new Error('Invalid password. Default demo password is: password');
    }

    if (acc.status === 'Pending') {
      throw new Error('Your registration request is pending Chairman approval.');
    }
    if (acc.status === 'Rejected') {
      throw new Error(`Your account registration was rejected: ${acc.rejectionReason || 'Contact college admin.'}`);
    }
    if (acc.status === 'Inactive' || acc.status === 'Suspended') {
      throw new Error('This account has been deactivated. Please contact your department head.');
    }

    const session: UserSession = {
      userId: acc.id,
      email: acc.email,
      role: acc.role,
      displayName: acc.displayName,
      linkedId: acc.linkedId,
      photoDataUrl: acc.photoDataUrl,
      programId: acc.programId,
      departmentId: acc.departmentId,
      permissions: acc.permissions,
      loggedInAt: nowIso(),
      deviceFingerprint: getDeviceFingerprint(),
    };

    // Synchronously persist session
    try {
      localStorage.setItem('gct_active_user', JSON.stringify(session));
      if (rememberMe) {
        localStorage.setItem(REMEMBER_KEY, JSON.stringify(session));
      } else {
        localStorage.removeItem(REMEMBER_KEY);
      }
    } catch (e) {}

    setState((prev) => {
      const updated = { ...prev, session };
      saveERPState(updated);
      return updated;
    });

    audit('auth.login', 'auth', session.userId, null, { role: session.role, email: session.email });
    addToast(`Welcome back, ${session.displayName}!`, 'success');
    return session;
  };

  const logout = () => {
    if (state.session) {
      audit('auth.logout', 'auth', state.session.userId);
    }
    try {
      localStorage.removeItem('gct_active_user');
      localStorage.removeItem(REMEMBER_KEY);
    } catch (e) {}
    setState((prev) => {
      const updated = { ...prev, session: null };
      saveERPState(updated);
      return updated;
    });
    addToast('You have been signed out successfully.', 'info');
  };

  const updateProfile = (patch: Partial<UserSession>) => {
    if (!state.session) return;
    const updated = { ...state.session, ...patch };
    setState((prev) => ({
      ...prev,
      session: updated,
      accounts: prev.accounts.map((a) =>
        a.id === updated.userId ? { ...a, displayName: updated.displayName, photoDataUrl: updated.photoDataUrl } : a
      ),
      teachers:
        updated.role === 'teacher' && updated.linkedId
          ? prev.teachers.map((t) =>
              t.id === updated.linkedId
                ? { ...t, name: updated.displayName, photoDataUrl: updated.photoDataUrl }
                : t
            )
          : prev.teachers,
      students:
        updated.role === 'student' && updated.linkedId
          ? prev.students.map((st) =>
              st.id === updated.linkedId
                ? { ...st, name: updated.displayName, photoDataUrl: updated.photoDataUrl }
                : st
            )
          : prev.students,
    }));
    audit('profile.update', 'user', updated.userId, null, patch);
    addToast('Profile updated successfully', 'success');
  };

  const changePassword = (oldPwd: string, newPwd: string) => {
    if (!state.session) throw new Error('Not logged in');
    if (!newPwd || newPwd.length < 6) throw new Error('New password must be at least 6 characters.');

    const allAccounts = [...DEFAULT_ACCOUNTS, ...state.accounts];
    const userAcc = allAccounts.find((a) => a.id === state.session?.userId || a.email.toLowerCase() === state.session?.email.toLowerCase());

    if (userAcc && userAcc.password !== oldPwd) {
      throw new Error('Current password is not correct.');
    }

    setState((prev) => {
      const existingIdx = prev.accounts.findIndex((a) => a.email.toLowerCase() === state.session?.email.toLowerCase());
      if (existingIdx >= 0) {
        const accs = [...prev.accounts];
        accs[existingIdx] = { ...accs[existingIdx], password: newPwd };
        return { ...prev, accounts: accs };
      }
      const newAcc: Account = {
        id: uid('acc'),
        email: state.session!.email,
        password: newPwd,
        role: state.session!.role,
        displayName: state.session!.displayName,
        status: 'Approved',
        linkedId: state.session!.linkedId,
        createdAt: nowIso(),
      };
      return { ...prev, accounts: [...prev.accounts, newAcc] };
    });

    audit('password.change', 'auth', state.session.userId);
    addToast('Password changed successfully', 'success');
  };

  const updateSettings = (patch: Partial<ERPState['settings']>) => {
    setState((prev) => ({
      ...prev,
      settings: { ...prev.settings, ...patch },
    }));
    audit('settings.update', 'settings', 'singleton', null, patch);
    addToast('Settings updated successfully', 'success');
  };

  // Student CRUD
  const createStudent = (data: Omit<Student, 'id' | 'createdAt'>): Student => {
    const studentId = uid('stu');
    const newStudent: Student = {
      ...data,
      id: studentId,
      cnic: data.cnic.replace(/\D/g, ''),
      email: data.email.trim().toLowerCase(),
      createdAt: nowIso(),
    };

    // Auto-create student login account
    const autoAccount: Account = {
      id: uid('acc'),
      email: newStudent.email,
      password: newStudent.studentMobile || 'password123',
      role: 'student',
      displayName: newStudent.name,
      status: 'Approved',
      linkedId: studentId,
      cnic: newStudent.cnic,
      programId: newStudent.programId,
      departmentId: newStudent.departmentId,
      autoCreated: true,
      createdAt: nowIso(),
    };

    setState((prev) => ({
      ...prev,
      students: [...prev.students, newStudent],
      accounts: [...prev.accounts, autoAccount],
    }));

    audit('student.create', 'students', studentId, null, newStudent);
    addToast(`Student ${newStudent.name} admitted successfully`, 'success');
    return newStudent;
  };

  const updateStudent = (id: string, data: Partial<Student>) => {
    setState((prev) => ({
      ...prev,
      students: prev.students.map((s) => (s.id === id ? { ...s, ...data, updatedAt: nowIso() } : s)),
    }));
    audit('student.update', 'students', id, null, data);
    addToast('Student record updated', 'success');
  };

  const deleteStudent = (id: string) => {
    setState((prev) => ({
      ...prev,
      students: prev.students.filter((s) => s.id !== id),
      accounts: prev.accounts.filter((a) => !(a.role === 'student' && a.linkedId === id)),
      parentLinks: prev.parentLinks.filter((l) => l.studentId !== id),
    }));
    audit('student.delete', 'students', id);
    addToast('Student deleted', 'info');
  };

  const promoteStudent = (
    studentId: string,
    toSemesterId: string,
    toSectionId: string,
    remarks: string = ''
  ) => {
    const stu = state.students.find((s) => s.id === studentId);
    if (!stu) throw new Error('Student not found');

    const historyEntry = {
      id: uid('hist'),
      studentId,
      semesterId: stu.currentSemesterId,
      sectionId: stu.currentSectionId,
      endedAt: nowIso(),
    };

    const promoRecord = {
      id: uid('prom'),
      studentId,
      fromSemesterId: stu.currentSemesterId,
      toSemesterId,
      fromSectionId: stu.currentSectionId,
      toSectionId,
      promotedBy: state.session?.userId || 'system',
      promotedAt: nowIso(),
      remarks,
    };

    setState((prev) => ({
      ...prev,
      students: prev.students.map((s) =>
        s.id === studentId ? { ...s, currentSemesterId: toSemesterId, currentSectionId: toSectionId } : s
      ),
      semesterHistory: [...prev.semesterHistory, historyEntry],
      promotions: [...prev.promotions, promoRecord],
    }));

    const fromSem = state.semesters.find((s) => s.id === stu.currentSemesterId);
    const toSem = state.semesters.find((s) => s.id === toSemesterId);

    pushNotification({
      recipientId: studentId,
      recipientRole: 'student',
      title: 'Semester Academic Promotion Approved',
      message: `Congratulations ${stu.name}! You have been officially advanced from ${fromSem?.name || 'Previous Term'} to ${toSem?.name || 'Next Term'}.`,
      type: 'success',
      relatedRoute: '#/app/dashboard',
    });

    audit('student.promote', 'promotions', studentId, null, promoRecord);
    playNotificationTone('success');
    addToast(`Student ${stu.name} promoted successfully`, 'success');
  };

  const strikeOffStudent = (studentId: string, reason: string) => {
    const stu = state.students.find((s) => s.id === studentId);
    if (!stu) throw new Error('Student record not found');

    setState((prev) => ({
      ...prev,
      students: prev.students.map((s) =>
        s.id === studentId ? { ...s, status: 'StruckOff', updatedAt: nowIso() } : s
      ),
    }));

    const parentAccount = state.accounts.find(
      (a) => a.role === 'parent' && (a.linkedId === studentId || a.linkedId === stu.id)
    );

    // Notification to Student
    pushNotification({
      recipientId: studentId,
      recipientRole: 'student',
      title: 'CRITICAL: Struck Off from College Rolls',
      message: `You have been officially struck off from college rolls. Reason: ${reason}. Please contact Chairman Office immediately.`,
      type: 'error',
      relatedRoute: '#/app/dashboard',
    });

    // Notification to Parent
    pushNotification({
      recipientId: parentAccount?.id || studentId,
      recipientRole: 'parent',
      title: `URGENT NOTICE: ${stu.name} Struck Off from College Rolls`,
      message: `Dear Parent/Guardian, your ward ${stu.name} (${stu.admissionNumber}) has been officially STRUCK OFF from college rolls due to: ${reason}. Please visit the Chairman Directorate immediately.`,
      type: 'error',
      relatedRoute: '#/app/dashboard',
    });

    audit('student.strikeOff', 'students', studentId, null, { reason });
    playNotificationTone('warning');
    addToast(`Student ${stu.name} has been struck off from rolls`, 'warn');
  };

  const reinstateStudent = (studentId: string, remarks: string = '') => {
    const stu = state.students.find((s) => s.id === studentId);
    if (!stu) throw new Error('Student record not found');

    setState((prev) => ({
      ...prev,
      students: prev.students.map((s) =>
        s.id === studentId ? { ...s, status: 'Active', updatedAt: nowIso() } : s
      ),
    }));

    const parentAccount = state.accounts.find(
      (a) => a.role === 'parent' && (a.linkedId === studentId || a.linkedId === stu.id)
    );

    pushNotification({
      recipientId: studentId,
      recipientRole: 'student',
      title: 'Admission Reinstated to Active Standing',
      message: remarks || 'Your academic status has been reinstated to Active standing by the Chairman.',
      type: 'success',
      relatedRoute: '#/app/dashboard',
    });

    pushNotification({
      recipientId: parentAccount?.id || studentId,
      recipientRole: 'parent',
      title: `Ward Reinstated: ${stu.name}`,
      message: `Notice to Parents: Your ward ${stu.name} has been reinstated to Active student rolls. ${remarks}`,
      type: 'success',
      relatedRoute: '#/app/dashboard',
    });

    audit('student.reinstate', 'students', studentId, null, { remarks });
    playNotificationTone('success');
    addToast(`Student ${stu.name} reinstated to Active standing`, 'success');
  };

  const cancelStudentAdmission = (studentId: string, reason: string) => {
    const stu = state.students.find((s) => s.id === studentId);
    if (!stu) throw new Error('Student record not found');

    setState((prev) => ({
      ...prev,
      students: prev.students.map((s) =>
        s.id === studentId ? { ...s, status: 'Cancelled', updatedAt: nowIso() } : s
      ),
    }));

    const parentAccount = state.accounts.find(
      (a) => a.role === 'parent' && (a.linkedId === studentId || a.linkedId === stu.id)
    );

    pushNotification({
      recipientId: studentId,
      recipientRole: 'student',
      title: 'Official Admission Cancelled',
      message: `Your admission at GCT Peshawar has been cancelled. Order: ${reason}`,
      type: 'error',
      relatedRoute: '#/app/dashboard',
    });

    pushNotification({
      recipientId: parentAccount?.id || studentId,
      recipientRole: 'parent',
      title: `Official Admission Cancelled: ${stu.name}`,
      message: `Dear Parent/Guardian, admission for ${stu.name} (${stu.admissionNumber}) has been cancelled. Reason: ${reason}`,
      type: 'error',
      relatedRoute: '#/app/dashboard',
    });

    audit('student.cancelAdmission', 'students', studentId, null, { reason });
    playNotificationTone('warning');
    addToast(`Admission cancelled for ${stu.name}`, 'warn');
  };

  const requestAdmissionCancellation = (studentId: string, reason: string) => {
    const stu = state.students.find((s) => s.id === studentId);
    if (!stu) throw new Error('Student record not found');

    // Notify Chairman & Admin
    pushNotification({
      recipientRole: 'chairman',
      title: `Admission Cancellation Request: ${stu.name}`,
      message: `Student ${stu.name} (${stu.admissionNumber}) has submitted an admission cancellation request: "${reason}"`,
      type: 'warn',
      relatedRoute: '#/app/students',
    });

    // Notify Student
    pushNotification({
      recipientId: studentId,
      recipientRole: 'student',
      title: 'Admission Cancellation Request Submitted',
      message: 'Your formal cancellation request has been forwarded to the Chairman Directorate for review.',
      type: 'info',
      relatedRoute: '#/app/dashboard',
    });

    // Notify Parent
    const parentAccount = state.accounts.find(
      (a) => a.role === 'parent' && (a.linkedId === studentId || a.linkedId === stu.id)
    );
    pushNotification({
      recipientId: parentAccount?.id || studentId,
      recipientRole: 'parent',
      title: `Cancellation Request Submitted by ${stu.name}`,
      message: `Your ward ${stu.name} submitted an admission cancellation request: "${reason}". The Directorate is reviewing it.`,
      type: 'warn',
      relatedRoute: '#/app/dashboard',
    });

    audit('student.requestCancellation', 'students', studentId, null, { reason });
    playNotificationTone('info');
    addToast('Admission cancellation request forwarded to Chairman', 'info');
  };

  // Teachers
  const createTeacher = (data: Omit<Teacher, 'id' | 'createdAt'>): Teacher => {
    const teacherId = uid('tch');
    const newTeacher: Teacher = { ...data, id: teacherId, createdAt: nowIso() };
    const autoAccount: Account = {
      id: uid('acc'),
      email: newTeacher.email,
      password: 'password',
      role: 'teacher',
      displayName: newTeacher.name,
      status: 'Approved',
      linkedId: teacherId,
      programId: newTeacher.programId,
      departmentId: newTeacher.departmentId,
      createdAt: nowIso(),
    };

    setState((prev) => ({
      ...prev,
      teachers: [...prev.teachers, newTeacher],
      accounts: [...prev.accounts, autoAccount],
    }));
    audit('teacher.create', 'teachers', teacherId, null, newTeacher);
    addToast(`Teacher ${newTeacher.name} registered`, 'success');
    return newTeacher;
  };

  const updateTeacher = (id: string, data: Partial<Teacher>) => {
    setState((prev) => ({
      ...prev,
      teachers: prev.teachers.map((t) => (t.id === id ? { ...t, ...data } : t)),
    }));
    audit('teacher.update', 'teachers', id, null, data);
    addToast('Teacher details updated', 'success');
  };

  const deleteTeacher = (id: string) => {
    setState((prev) => ({
      ...prev,
      teachers: prev.teachers.filter((t) => t.id !== id),
      accounts: prev.accounts.filter((a) => !(a.role === 'teacher' && a.linkedId === id)),
    }));
    audit('teacher.delete', 'teachers', id);
    addToast('Teacher removed', 'info');
  };

  // Staff accounts
  const createStaffAccount = (data: Partial<Account>): Account => {
    const accountId = uid('acc');
    const newAcc: Account = {
      id: accountId,
      email: data.email!.trim().toLowerCase(),
      password: data.password || 'gct_123456',
      role: data.role || 'assistant',
      displayName: data.displayName || 'Staff Member',
      status: 'Approved',
      programId: data.programId || null,
      departmentId: data.departmentId || null,
      permissions: data.permissions || null,
      createdAt: nowIso(),
    };

    setState((prev) => ({
      ...prev,
      accounts: [...prev.accounts, newAcc],
    }));
    audit('staff.create', 'accounts', accountId, null, newAcc);
    addToast(`Staff account for ${newAcc.displayName} created`, 'success');
    return newAcc;
  };

  const updateStaffAccount = (id: string, patch: Partial<Account>) => {
    setState((prev) => ({
      ...prev,
      accounts: prev.accounts.map((a) => (a.id === id ? { ...a, ...patch } : a)),
    }));
    audit('staff.update', 'accounts', id, null, patch);
    addToast('Staff account updated', 'success');
  };

  const deleteStaffAccount = (id: string) => {
    setState((prev) => ({
      ...prev,
      accounts: prev.accounts.filter((a) => a.id !== id),
    }));
    audit('staff.delete', 'accounts', id);
    addToast('Staff account removed', 'info');
  };

  const deactivateStaffAccount = (id: string) => {
    setState((prev) => ({
      ...prev,
      accounts: prev.accounts.map((a) =>
        a.id === id ? { ...a, status: a.status === 'Inactive' ? 'Approved' : 'Inactive' } : a
      ),
    }));
    audit('staff.toggleStatus', 'accounts', id);
    addToast('Staff account status toggled', 'success');
  };

  const approveRegistration = (accountId: string, linkedIdOverride?: string) => {
    const acc = state.accounts.find((a) => a.id === accountId);
    if (!acc) throw new Error('Account request not found');

    const linkedId = linkedIdOverride || acc.requestedLinkedId || acc.linkedId || null;

    setState((prev) => ({
      ...prev,
      accounts: prev.accounts.map((a) =>
        a.id === accountId
          ? {
              ...a,
              status: 'Approved',
              linkedId,
              approvedAt: nowIso(),
              approvedBy: state.session?.userId,
            }
          : a
      ),
    }));

    pushNotification({
      recipientId: accountId,
      recipientRole: acc.role,
      title: 'Registration Approved',
      message: 'Your account registration has been approved. You can now access all portal features.',
      type: 'success',
    });

    audit('registration.approve', 'accounts', accountId);
    addToast(`Account for ${acc.displayName} approved`, 'success');
  };

  const rejectRegistration = (accountId: string, reason?: string) => {
    setState((prev) => ({
      ...prev,
      accounts: prev.accounts.map((a) =>
        a.id === accountId ? { ...a, status: 'Rejected', rejectionReason: reason || 'Not eligible' } : a
      ),
    }));
    audit('registration.reject', 'accounts', accountId, null, { reason });
    addToast('Account request rejected', 'info');
  };

  const registerAccount = (data: Partial<Account>): Account => {
    const cleanEmail = data.email?.trim().toLowerCase();
    const existing = [...DEFAULT_ACCOUNTS, ...state.accounts].find(
      (a) => a.email.toLowerCase() === cleanEmail
    );
    if (existing) throw new Error('An account with this email already exists.');

    const newAcc: Account = {
      id: uid('acc'),
      email: cleanEmail || '',
      password: data.password || 'password123',
      role: data.role || 'student',
      displayName: data.displayName || 'New User',
      status: 'Pending',
      cnic: data.cnic ? data.cnic.replace(/\D/g, '') : null,
      dob: data.dob || null,
      programId: data.programId || null,
      departmentId: data.departmentId || null,
      createdAt: nowIso(),
    };

    setState((prev) => ({
      ...prev,
      accounts: [...prev.accounts, newAcc],
    }));

    pushNotification({
      recipientRole: 'chairman',
      title: 'New Account Registration',
      message: `${newAcc.displayName} (${newAcc.role}) submitted a registration request.`,
      type: 'warn',
      relatedRoute: '#/app/registrations-admin',
    });

    audit('registration.submit', 'accounts', newAcc.id, null, newAcc);
    addToast('Registration submitted! Await administrative approval.', 'success');
    return newAcc;
  };

  // Program & Department & Courses
  const createProgram = (data: Omit<Program, 'id' | 'createdAt'>): Program => {
    const prog: Program = { ...data, id: uid('prog'), createdAt: nowIso() };
    setState((prev) => ({
      ...prev,
      programs: [...prev.programs, prog],
    }));
    audit('program.create', 'programs', prog.id, null, prog);
    addToast(`Program ${prog.name} created`, 'success');
    return prog;
  };

  const createDepartment = (data: Omit<Department, 'id' | 'createdAt'>): Department => {
    const dept: Department = { ...data, id: uid('dept'), createdAt: nowIso() };
    setState((prev) => ({
      ...prev,
      departments: [...prev.departments, dept],
    }));
    audit('department.create', 'departments', dept.id, null, dept);
    addToast(`Department ${dept.name} created`, 'success');
    return dept;
  };

  const createCourse = (data: Omit<Course, 'id' | 'createdAt'>): Course => {
    const crs: Course = { ...data, id: uid('crs'), createdAt: nowIso() };
    setState((prev) => ({
      ...prev,
      courses: [...prev.courses, crs],
    }));
    audit('course.create', 'courses', crs.id, null, crs);
    addToast(`Course ${crs.code} added`, 'success');
    return crs;
  };

  const updateCourse = (id: string, data: Partial<Course>) => {
    setState((prev) => ({
      ...prev,
      courses: prev.courses.map((c) => (c.id === id ? { ...c, ...data } : c)),
    }));
    audit('course.update', 'courses', id, null, data);
    addToast('Course updated', 'success');
  };

  const deleteCourse = (id: string) => {
    setState((prev) => ({
      ...prev,
      courses: prev.courses.filter((c) => c.id !== id),
    }));
    audit('course.delete', 'courses', id);
    addToast('Course deleted', 'info');
  };

  // Timetable
  const createSlot = (data: Omit<TimetableSlot, 'id' | 'createdAt'>): TimetableSlot => {
    const slot: TimetableSlot = { ...data, id: uid('tt'), createdAt: nowIso() };
    setState((prev) => ({
      ...prev,
      timetable: [...prev.timetable, slot],
    }));
    audit('timetable.create', 'timetable', slot.id, null, slot);
    addToast('Timetable slot added', 'success');
    return slot;
  };

  const updateSlot = (id: string, data: Partial<TimetableSlot>) => {
    setState((prev) => ({
      ...prev,
      timetable: prev.timetable.map((t) => (t.id === id ? { ...t, ...data } : t)),
    }));
    audit('timetable.update', 'timetable', id, null, data);
    addToast('Timetable slot updated', 'success');
  };

  const deleteSlot = (id: string) => {
    setState((prev) => ({
      ...prev,
      timetable: prev.timetable.filter((t) => t.id !== id),
    }));
    audit('timetable.delete', 'timetable', id);
    addToast('Timetable slot removed', 'info');
  };

  // Attendance & QR Engine
  const startClassSession = (timetableId: string, actualStartIso?: string): AttendanceSession => {
    let slot: TimetableSlot | undefined = state.timetable.find((t) => t.id === timetableId);
    if (!slot) {
      const course = state.courses.find((c) => c.id === timetableId);
      if (course) {
        slot = {
          id: `tt_${course.id}_dynamic`,
          day: (getDayOfWeek(new Date()) as TimetableSlot['day']) || 'Monday',
          startTime: '08:30',
          endTime: '09:30',
          courseId: course.id,
          teacherId: state.session?.linkedId || 'tch_demo_1',
          programId: course.programId,
          departmentId: course.departmentId || null,
          semesterId: course.semesterId,
          sectionId: state.sections.find((s) => s.semesterId === course.semesterId)?.id || state.sections[0]?.id || '',
          className: 'Lecture Hall A',
          slotType: 'Theory',
          status: 'Active',
          createdAt: nowIso(),
        };
      } else if (state.timetable.length > 0) {
        slot = state.timetable[0];
      } else {
        slot = {
          id: 'tt_general_class',
          day: (getDayOfWeek(new Date()) as TimetableSlot['day']) || 'Monday',
          startTime: '08:30',
          endTime: '09:30',
          courseId: state.courses[0]?.id || 'course_default',
          teacherId: state.session?.linkedId || 'tch_demo_1',
          programId: state.programs[0]?.id || 'prog_bt',
          departmentId: null,
          semesterId: state.semesters[0]?.id || 'sem_1',
          sectionId: state.sections[0]?.id || 'sec_1',
          className: 'Lecture Room 1',
          slotType: 'Theory',
          status: 'Active',
          createdAt: nowIso(),
        };
      }
    }

    const safeSlot = slot;
    const actualStart = actualStartIso || nowIso();
    const actualTime = new Date(actualStart).toTimeString().slice(0, 5);
    const delay = Math.max(0, timeToMinutes(actualTime) - timeToMinutes(safeSlot.startTime));
    const validitySec = Math.max(90, state.settings.qrValiditySeconds || 90);
    const expiresAt = new Date(Date.now() + validitySec * 1000).toISOString();

    const session: AttendanceSession = {
      id: uid('atts'),
      timetableId: safeSlot.id,
      teacherId: state.session?.linkedId || safeSlot.teacherId,
      originalTeacherId: safeSlot.teacherId,
      courseId: safeSlot.courseId,
      semesterId: safeSlot.semesterId,
      sectionId: safeSlot.sectionId,
      className: safeSlot.className,
      date: todayIso(),
      scheduledStart: safeSlot.startTime,
      scheduledEnd: safeSlot.endTime,
      actualStart,
      delayMinutes: delay,
      qrToken: secureToken(),
      qrExpiresAt: expiresAt,
      status: 'open',
      gracePeriodMinutes: state.settings.gracePeriodMinutes || 15,
      startedBy: state.session?.userId || 'teacher',
      programId: safeSlot.programId,
      departmentId: safeSlot.departmentId,
    };

    setState((prev) => ({
      ...prev,
      attendanceSessions: [...prev.attendanceSessions, session],
    }));

    audit('attendance.startSession', 'attendanceSessions', session.id, null, session);
    addToast('Live QR session initiated', 'success');
    return session;
  };

  const closeClassSession = (sessionId: string) => {
    setState((prev) => ({
      ...prev,
      attendanceSessions: prev.attendanceSessions.map((s) =>
        s.id === sessionId ? { ...s, status: 'closed', actualEnd: nowIso() } : s
      ),
    }));
    audit('attendance.closeSession', 'attendanceSessions', sessionId);
    addToast('Class session closed', 'info');
  };

  const rotateQrToken = (sessionId: string, silent = false) => {
    const validitySec = Math.max(90, state.settings.qrValiditySeconds || 90);
    const expiresAt = new Date(Date.now() + validitySec * 1000).toISOString();
    const newToken = secureToken();

    setState((prev) => ({
      ...prev,
      attendanceSessions: prev.attendanceSessions.map((s) =>
        s.id === sessionId ? { ...s, qrToken: newToken, qrExpiresAt: expiresAt } : s
      ),
    }));
    if (!silent) {
      addToast('QR code rotated', 'success');
    }
  };

  const scanQr = (token: string, studentId: string): AttendanceRecord => {
    const cleanToken = token.trim().toUpperCase();
    const session = state.attendanceSessions.find(
      (s) =>
        s.qrToken.trim().toUpperCase() === cleanToken ||
        cleanToken.endsWith(s.qrToken.trim().toUpperCase()) ||
        s.qrToken.trim().toUpperCase().endsWith(cleanToken)
    );
    if (!session) throw new Error(`QR token "${cleanToken}" not recognized or expired. Please check current code.`);
    if (session.status !== 'open') throw new Error('This attendance session has already been closed by the instructor.');
    if (new Date(session.qrExpiresAt) < new Date()) throw new Error('QR token expired. Please ask teacher to refresh.');

    const stu = state.students.find((s) => s.id === studentId);
    if (!stu) throw new Error('Student record not found in system.');
    if (stu.status !== 'Active') {
      if (stu.status === 'StruckOff') throw new Error('You are currently Struck Off from college rolls. Contact Chairman office.');
      if (stu.status === 'Cancelled') throw new Error('Your admission is cancelled. Attendance cannot be recorded.');
      throw new Error(`Your student standing is ${stu.status}. Only Active students may punch in.`);
    }
    if (stu.currentSemesterId !== session.semesterId || stu.currentSectionId !== session.sectionId) {
      throw new Error('You are not enrolled in this class section.');
    }

    const alreadyMarked = state.attendanceRecords.some(
      (r) => r.sessionId === session.id && r.studentId === studentId
    );
    if (alreadyMarked) throw new Error('Attendance already recorded for this session.');

    const now = new Date();
    const arrivalTime = now.toTimeString().slice(0, 5);
    const actualStartM = timeToMinutes(new Date(session.actualStart).toTimeString().slice(0, 5));
    const arrivalM = timeToMinutes(arrivalTime);
    const grace = session.gracePeriodMinutes || 15;
    const isLate = arrivalM > actualStartM + grace;

    const record: AttendanceRecord = {
      id: uid('rec'),
      sessionId: session.id,
      studentId,
      courseId: session.courseId,
      teacherId: session.teacherId,
      semesterId: session.semesterId,
      sectionId: session.sectionId,
      date: session.date,
      scheduledStart: session.scheduledStart,
      actualStart: session.actualStart,
      arrivalTime,
      status: isLate ? 'late' : 'present',
      lateMinutes: isLate ? arrivalM - actualStartM : 0,
      markedBy: state.session?.userId || studentId,
      markedAt: nowIso(),
      gracePeriodUsed: grace,
      programId: stu.programId,
      departmentId: stu.departmentId,
    };

    setState((prev) => ({
      ...prev,
      attendanceRecords: [...prev.attendanceRecords, record],
    }));

    audit('attendance.scan', 'attendanceRecords', record.id, null, record);
    playNotificationTone(isLate ? 'warning' : 'success');
    addToast(isLate ? 'Attendance recorded as LATE' : 'Attendance recorded as PRESENT', isLate ? 'warn' : 'success');
    return record;
  };

  const punchOutQr = (studentId: string) => {
    const today = todayIso();
    const latest = state.attendanceRecords
      .filter((r) => r.studentId === studentId && r.date === today)
      .sort((a, b) => new Date(b.markedAt).getTime() - new Date(a.markedAt).getTime())[0];

    if (!latest) throw new Error('No punch-in recorded for today.');
    if (latest.exitTime) throw new Error('Exit already punched out.');

    const exitTime = new Date().toTimeString().slice(0, 5);

    setState((prev) => ({
      ...prev,
      attendanceRecords: prev.attendanceRecords.map((r) =>
        r.id === latest.id ? { ...r, exitTime } : r
      ),
      exitRecords: [
        ...prev.exitRecords,
        {
          id: uid('ex'),
          studentId,
          date: today,
          entryTime: latest.arrivalTime || '',
          exitTime,
          reason: 'Gate exit punch-out',
          recordedBy: 'system',
          auto: true,
        },
      ],
    }));

    addToast('Exit punch-out recorded', 'success');
  };

  const markManualAttendance = (data: {
    studentId: string;
    courseId: string;
    teacherId: string;
    date: string;
    status: AttendanceStatus;
    lateMinutes?: number;
    remarks?: string;
    correct?: boolean;
  }) => {
    const stu = state.students.find((s) => s.id === data.studentId);
    if (!stu) throw new Error('Student not found');

    const existing = state.attendanceRecords.find(
      (r) => r.studentId === data.studentId && r.date === data.date && r.courseId === data.courseId
    );

    if (existing) {
      setState((prev) => ({
        ...prev,
        attendanceRecords: prev.attendanceRecords.map((r) =>
          r.id === existing.id
            ? {
                ...r,
                status: data.status,
                lateMinutes: data.lateMinutes || 0,
                remarks: data.remarks || r.remarks || '',
                manual: true,
                markedAt: nowIso(),
                markedBy: state.session?.userId || r.markedBy,
              }
            : r
        ),
      }));
      audit('attendance.update', 'attendanceRecords', existing.id, existing, data);
      return;
    }

    const row: AttendanceRecord = {
      id: uid('rec'),
      sessionId: `manual_${data.studentId}_${data.date}_${data.courseId}`,
      studentId: data.studentId,
      courseId: data.courseId,
      teacherId: data.teacherId || state.session?.linkedId || state.session?.userId || '',
      semesterId: stu.currentSemesterId,
      sectionId: stu.currentSectionId,
      date: data.date,
      status: data.status,
      lateMinutes: data.lateMinutes || 0,
      markedBy: state.session?.userId || 'faculty',
      markedAt: nowIso(),
      manual: true,
      remarks: data.remarks || '',
      programId: stu.programId,
      departmentId: stu.departmentId,
    };

    setState((prev) => ({
      ...prev,
      attendanceRecords: [...prev.attendanceRecords, row],
    }));

    audit('attendance.manualMark', 'attendanceRecords', row.id, null, row);
    addToast('Attendance marked manually', 'success');
  };

  const requestLateScan = (reason: string): LateScanRequest => {
    const studentId = state.session?.linkedId;
    if (!studentId) throw new Error('User not linked to student record');
    const stu = state.students.find((s) => s.id === studentId);

    const req: LateScanRequest = {
      id: uid('lsr'),
      studentId,
      studentName: stu?.name || state.session?.displayName || 'Student',
      date: todayIso(),
      reason,
      requestedAt: nowIso(),
      status: 'pending',
      programId: stu?.programId,
      departmentId: stu?.departmentId,
    };

    setState((prev) => ({
      ...prev,
      lateScanRequests: [...prev.lateScanRequests, req],
    }));

    pushNotification({
      recipientRole: 'chairman',
      title: 'Late Scan Request',
      message: `${req.studentName} requested late scan approval: ${reason}`,
      type: 'warn',
      relatedRoute: '#/app/late-scan-requests',
    });

    addToast('Late scan clearance requested', 'info');
    return req;
  };

  const decideLateScan = (requestId: string, decision: 'approved' | 'rejected', remarks?: string) => {
    setState((prev) => ({
      ...prev,
      lateScanRequests: prev.lateScanRequests.map((r) =>
        r.id === requestId ? { ...r, status: decision, decidedAt: nowIso(), remarks: remarks || '' } : r
      ),
    }));
    audit(`latescan.${decision}`, 'lateScanRequests', requestId);
    addToast(`Late scan request ${decision}`, decision === 'approved' ? 'success' : 'warn');
  };

  // Leaves
  const submitStudentLeave = (data: {
    leaveType: string;
    startDate: string;
    endDate: string;
    reason: string;
    description?: string;
  }): LeaveApplication => {
    const studentId = state.session?.linkedId;
    if (!studentId) throw new Error('Student account not linked');
    const stu = state.students.find((s) => s.id === studentId);
    if (!stu) throw new Error('Student record not found');

    const start = new Date(data.startDate);
    const end = new Date(data.endDate);
    const days = Math.max(1, Math.round((end.getTime() - start.getTime()) / 86400000) + 1);

    const leave: LeaveApplication = {
      id: uid('lv'),
      studentId,
      leaveType: data.leaveType,
      startDate: data.startDate,
      endDate: data.endDate,
      days,
      reason: data.reason,
      description: data.description,
      status: 'with_teacher',
      currentOwnerRole: 'teacher',
      submittedAt: nowIso(),
      timeline: [
        {
          at: nowIso(),
          action: 'Submitted',
          by: state.session?.userId || studentId,
          role: 'student',
          note: data.reason,
        },
      ],
      programId: stu.programId,
      departmentId: stu.departmentId,
    };

    setState((prev) => ({
      ...prev,
      leaveApplications: [leave, ...prev.leaveApplications],
    }));

    pushNotification({
      recipientRole: 'teacher',
      title: 'New Student Leave Application',
      message: `${stu.name} applied for ${leave.days} day(s) ${leave.leaveType} leave.`,
      type: 'info',
      relatedRoute: '#/app/leaves',
    });

    addToast('Leave application submitted to teacher for verification', 'success');
    return leave;
  };

  const forwardStudentLeave = (leaveId: string, remarks?: string) => {
    setState((prev) => ({
      ...prev,
      leaveApplications: prev.leaveApplications.map((l) =>
        l.id === leaveId
          ? {
              ...l,
              status: 'with_chairman',
              currentOwnerRole: 'chairman',
              teacherRemarks: remarks || 'Recommended',
              forwardedAt: nowIso(),
              timeline: [
                ...l.timeline,
                {
                  at: nowIso(),
                  action: 'Forwarded',
                  by: state.session?.userId || 'teacher',
                  role: 'teacher',
                  note: remarks || 'Verified and forwarded to Chairman',
                },
              ],
            }
          : l
      ),
    }));

    pushNotification({
      recipientRole: 'chairman',
      title: 'Leave Awaiting Approval',
      message: 'A student leave application has been recommended by faculty.',
      type: 'warn',
      relatedRoute: '#/app/leaves',
    });

    addToast('Leave forwarded to Chairman/HOD for final decision', 'success');
  };

  const decideStudentLeave = (leaveId: string, decision: 'approve' | 'reject', remarks: string) => {
    const leave = state.leaveApplications.find((l) => l.id === leaveId);
    if (!leave) throw new Error('Leave application not found');

    const status = decision === 'approve' ? 'approved' : 'rejected';

    setState((prev) => {
      // If approved, mark existing absences during this date span as approved_leave
      let updatedRecords = prev.attendanceRecords;
      if (decision === 'approve') {
        updatedRecords = updatedRecords.map((r) => {
          if (r.studentId === leave.studentId && r.date >= leave.startDate && r.date <= leave.endDate) {
            return { ...r, status: 'approved_leave', leaveId: leave.id };
          }
          return r;
        });
      }

      return {
        ...prev,
        attendanceRecords: updatedRecords,
        leaveApplications: prev.leaveApplications.map((l) =>
          l.id === leaveId
            ? {
                ...l,
                status,
                chairmanRemarks: remarks,
                decidedAt: nowIso(),
                timeline: [
                  ...l.timeline,
                  {
                    at: nowIso(),
                    action: decision === 'approve' ? 'Approved' : 'Rejected',
                    by: state.session?.userId || 'chairman',
                    role: state.session?.role || 'chairman',
                    note: remarks,
                  },
                ],
              }
            : l
        ),
      };
    });

    pushNotification({
      recipientId: leave.studentId,
      recipientRole: 'student',
      title: `Leave Application ${decision === 'approve' ? 'Approved' : 'Rejected'}`,
      message: `Remarks: ${remarks}`,
      type: decision === 'approve' ? 'success' : 'error',
      relatedRoute: '#/app/my-leave',
    });

    addToast(`Leave application ${status}`, decision === 'approve' ? 'success' : 'warn');
  };

  const submitTeacherLeave = (data: {
    leaveType: string;
    startDate: string;
    endDate: string;
    reason: string;
    description?: string;
  }): TeacherLeaveApplication => {
    const teacherId = state.session?.linkedId || state.session?.userId || '';
    const days = Math.max(
      1,
      Math.round((new Date(data.endDate).getTime() - new Date(data.startDate).getTime()) / 86400000) + 1
    );

    const leave: TeacherLeaveApplication = {
      id: uid('tlv'),
      teacherId,
      teacherName: state.session?.displayName || 'Faculty Member',
      leaveType: data.leaveType,
      startDate: data.startDate,
      endDate: data.endDate,
      days,
      reason: data.reason,
      description: data.description,
      status: 'with_chairman',
      submittedAt: nowIso(),
      programId: state.session?.programId,
      departmentId: state.session?.departmentId,
    };

    setState((prev) => ({
      ...prev,
      teacherLeaveApplications: [leave, ...prev.teacherLeaveApplications],
    }));

    pushNotification({
      recipientRole: 'chairman',
      title: 'Teacher Leave Request',
      message: `${leave.teacherName} requested ${leave.days} day(s) leave.`,
      type: 'warn',
      relatedRoute: '#/app/teacher-leaves',
    });

    addToast('Teacher leave submitted to Chairman', 'success');
    return leave;
  };

  const decideTeacherLeave = (leaveId: string, decision: 'approve' | 'reject', remarks: string) => {
    setState((prev) => ({
      ...prev,
      teacherLeaveApplications: prev.teacherLeaveApplications.map((l) =>
        l.id === leaveId
          ? {
              ...l,
              status: decision === 'approve' ? 'approved' : 'rejected',
              chairmanRemarks: remarks,
              decidedAt: nowIso(),
            }
          : l
      ),
    }));
    addToast(`Teacher leave ${decision === 'approve' ? 'approved' : 'rejected'}`, 'success');
  };

  // Substitutions
  const createSubstitutionRequest = (
    timetableId: string,
    date: string,
    reason: string,
    targetTeacherId?: string
  ): SubstitutionRequest => {
    const slot = state.timetable.find((t) => t.id === timetableId);
    if (!slot) throw new Error('Timetable slot not found');

    const course = state.courses.find((c) => c.id === slot.courseId);
    const origTeacher = state.teachers.find((t) => t.id === slot.teacherId);

    let candidates: string[] = [];
    if (targetTeacherId && targetTeacherId !== 'broadcast') {
      candidates = [targetTeacherId];
    } else {
      candidates = state.teachers
        .filter((t) => t.id !== slot.teacherId && t.active)
        .map((t) => t.id);
    }

    const req: SubstitutionRequest = {
      id: uid('sub'),
      timetableId,
      courseId: slot.courseId,
      semesterId: slot.semesterId,
      sectionId: slot.sectionId,
      originalTeacherId: slot.teacherId,
      date,
      reason,
      candidates,
      declinedBy: [],
      status: candidates.length ? 'pending' : 'no_candidates',
      requestedBy: state.session?.userId || 'teacher',
      requestedAt: nowIso(),
      programId: slot.programId,
      departmentId: slot.departmentId || undefined,
    };

    setState((prev) => ({
      ...prev,
      substitutionRequests: [req, ...prev.substitutionRequests],
    }));

    // Notification to candidate teacher(s)
    if (targetTeacherId && targetTeacherId !== 'broadcast') {
      const nominee = state.teachers.find((t) => t.id === targetTeacherId);
      pushNotification({
        recipientId: targetTeacherId,
        recipientRole: 'teacher',
        title: `Class Substitution Request: ${course?.code || 'Course'}`,
        message: `Engr. ${origTeacher?.name || 'Faculty'} requested you to substitute ${course?.name || 'their class'} on ${date} (${slot.startTime}–${slot.endTime}). Reason: ${reason}. Please accept or decline.`,
        type: 'warn',
        relatedRoute: '#/app/substitutions',
      });
    } else {
      pushNotification({
        recipientRole: 'teacher',
        title: `Broadcast: Substitute Teacher Needed for ${course?.code || 'Class'}`,
        message: `${origTeacher?.name || 'Faculty'} requested a substitute for ${slot.startTime}–${slot.endTime} on ${date}.`,
        type: 'info',
        relatedRoute: '#/app/substitutions',
      });
    }

    // High-visibility Notification to Chairman
    pushNotification({
      recipientRole: 'chairman',
      title: `Substitution Logged: ${course?.code || 'Class'}`,
      message: `${origTeacher?.name || 'Faculty'} submitted a substitution request for ${course?.name || 'Class'} on ${date} (${slot.startTime}–${slot.endTime}).`,
      type: 'info',
      relatedRoute: '#/app/substitutions',
    });

    playNotificationTone('info');
    addToast('Substitution request submitted with notifications dispatched', 'success');
    return req;
  };

  const acceptSubstitution = (id: string) => {
    const teacherId = state.session?.linkedId || state.session?.userId;
    const req = state.substitutionRequests.find((r) => r.id === id);
    if (!req) return;

    const slot = state.timetable.find((t) => t.id === req.timetableId);
    const course = state.courses.find((c) => c.id === req.courseId);
    const origTeacher = state.teachers.find((t) => t.id === req.originalTeacherId);
    const subTeacher = state.teachers.find((t) => t.id === teacherId);
    const subName = subTeacher?.name || state.session?.displayName || 'Substitute Faculty';

    setState((prev) => ({
      ...prev,
      substitutionRequests: prev.substitutionRequests.map((r) =>
        r.id === id ? { ...r, status: 'accepted', substituteTeacherId: teacherId, decidedAt: nowIso() } : r
      ),
    }));

    // Notification to Chairman
    pushNotification({
      recipientRole: 'chairman',
      title: `Substitution Accepted: ${course?.code || 'Class'}`,
      message: `Engr. ${subName} has ACCEPTED to substitute ${course?.name || 'class'} for ${origTeacher?.name || 'Faculty'} on ${req.date} (${slot?.startTime || '08:30'}–${slot?.endTime || '09:30'}).`,
      type: 'success',
      relatedRoute: '#/app/substitutions',
    });

    // Notification to Original Teacher
    pushNotification({
      recipientId: req.originalTeacherId,
      recipientRole: 'teacher',
      title: `Substitution Accepted by ${subName}`,
      message: `Good news! Engr. ${subName} has accepted to cover your ${course?.name || 'class'} on ${req.date}.`,
      type: 'success',
      relatedRoute: '#/app/substitutions',
    });

    playNotificationTone('success');
    addToast('You have accepted the substitution class. Live QR enabled.', 'success');
  };

  const declineSubstitution = (id: string, reason?: string) => {
    const teacherId = state.session?.linkedId || state.session?.userId;
    const req = state.substitutionRequests.find((r) => r.id === id);
    if (!req) return;

    const course = state.courses.find((c) => c.id === req.courseId);
    const origTeacher = state.teachers.find((t) => t.id === req.originalTeacherId);
    const subTeacher = state.teachers.find((t) => t.id === teacherId);
    const subName = subTeacher?.name || state.session?.displayName || 'Faculty';

    setState((prev) => ({
      ...prev,
      substitutionRequests: prev.substitutionRequests.map((r) => {
        if (r.id !== id) return r;
        const declinedBy = [...r.declinedBy, teacherId!];
        const remaining = r.candidates.filter((c) => !declinedBy.includes(c));
        return {
          ...r,
          declinedBy,
          status: remaining.length ? 'pending' : 'no_candidates',
        };
      }),
    }));

    // Notification to Chairman
    pushNotification({
      recipientRole: 'chairman',
      title: `Substitution Declined: ${course?.code || 'Class'}`,
      message: `Engr. ${subName} declined substitution for ${course?.name || 'class'} (${req.date}). Chairman re-allocation may be required.`,
      type: 'warn',
      relatedRoute: '#/app/substitutions',
    });

    // Notification to Original Teacher
    pushNotification({
      recipientId: req.originalTeacherId,
      recipientRole: 'teacher',
      title: `Substitution Declined by ${subName}`,
      message: `Engr. ${subName} is unable to cover your ${course?.name || 'class'} on ${req.date}.`,
      type: 'warn',
      relatedRoute: '#/app/substitutions',
    });

    playNotificationTone('warning');
    addToast('Substitution request declined', 'info');
  };

  const assignSubstitute = (id: string, teacherId: string) => {
    const req = state.substitutionRequests.find((r) => r.id === id);
    const slot = req ? state.timetable.find((t) => t.id === req.timetableId) : null;
    const course = req ? state.courses.find((c) => c.id === req.courseId) : null;
    const origTeacher = req ? state.teachers.find((t) => t.id === req.originalTeacherId) : null;
    const subTeacher = state.teachers.find((t) => t.id === teacherId);

    setState((prev) => ({
      ...prev,
      substitutionRequests: prev.substitutionRequests.map((r) =>
        r.id === id ? { ...r, status: 'accepted', substituteTeacherId: teacherId, decidedAt: nowIso(), assignedBy: state.session?.userId } : r
      ),
    }));

    // Notification to Assigned Substitute Teacher
    pushNotification({
      recipientId: teacherId,
      recipientRole: 'teacher',
      title: `Official Class Substitution Order: ${course?.code || 'Class'}`,
      message: `Chairman Directorate has assigned you to cover ${course?.name || 'class'} on ${req?.date || todayIso()} (${slot?.startTime || '08:30'}–${slot?.endTime || '09:30'}) for ${origTeacher?.name || 'Faculty'}.`,
      type: 'warn',
      relatedRoute: '#/app/substitutions',
    });

    // Notification to Original Teacher
    if (req) {
      pushNotification({
        recipientId: req.originalTeacherId,
        recipientRole: 'teacher',
        title: `Substitute Assigned by Chairman`,
        message: `Engr. ${subTeacher?.name} has been assigned to cover your ${course?.name} on ${req.date}.`,
        type: 'success',
        relatedRoute: '#/app/substitutions',
      });
    }

    playNotificationTone('success');
    addToast('Substitute teacher assigned successfully by Chairman', 'success');
  };

  // Committees
  const createCommittee = (data: Partial<Committee>): Committee => {
    const cmt: Committee = {
      id: uid('cmt'),
      committeeNumber: state.committees.length + 1,
      name: data.name || 'Ad-Hoc Committee',
      formationDate: data.formationDate || todayIso(),
      committeeType: data.committeeType || 'Main',
      committeeKind: data.committeeKind || 'OBE',
      description: data.description,
      status: 'Active',
      createdAt: nowIso(),
    };
    setState((prev) => ({ ...prev, committees: [...prev.committees, cmt] }));
    addToast(`Committee "${cmt.name}" established`, 'success');
    return cmt;
  };

  const updateCommittee = (id: string, data: Partial<Committee>) => {
    setState((prev) => ({
      ...prev,
      committees: prev.committees.map((c) => (c.id === id ? { ...c, ...data } : c)),
    }));
    addToast('Committee updated', 'success');
  };

  const deleteCommittee = (id: string) => {
    setState((prev) => ({
      ...prev,
      committees: prev.committees.filter((c) => c.id !== id),
      committeeMembers: prev.committeeMembers.filter((m) => m.committeeId !== id),
      committeeMeetings: prev.committeeMeetings.filter((m) => m.committeeId !== id),
    }));
    addToast('Committee dissolved and removed', 'info');
  };

  const addCommitteeMember = (data: Partial<CommitteeMember>): CommitteeMember => {
    const mem: CommitteeMember = {
      id: uid('cmm'),
      committeeId: data.committeeId!,
      memberName: data.memberName!,
      designation: data.designation || 'Member',
      position: data.position || 'Member',
      status: 'Active',
      joinedAt: nowIso(),
      addedBy: state.session?.userId || 'chairman',
    };
    setState((prev) => ({ ...prev, committeeMembers: [...prev.committeeMembers, mem] }));
    addToast(`Member ${mem.memberName} added to committee`, 'success');
    return mem;
  };

  const removeCommitteeMember = (memberId: string) => {
    setState((prev) => ({
      ...prev,
      committeeMembers: prev.committeeMembers.map((m) =>
        m.id === memberId ? { ...m, status: 'Removed' } : m
      ),
    }));
    addToast('Member removed from committee', 'info');
  };

  const scheduleMeeting = (data: Partial<CommitteeMeeting>): CommitteeMeeting => {
    const meeting: CommitteeMeeting = {
      id: uid('cme'),
      committeeId: data.committeeId!,
      subject: data.subject || 'Committee Deliberation',
      date: data.date || todayIso(),
      time: data.time || '10:00 AM',
      venue: data.venue || 'Committee Room 1',
      agenda: data.agenda,
      status: state.session?.role === 'chairman' ? 'Approved' : 'Pending',
      createdAt: nowIso(),
    };
    setState((prev) => ({ ...prev, committeeMeetings: [...prev.committeeMeetings, meeting] }));
    addToast('Meeting scheduled', 'success');
    return meeting;
  };

  const approveMeeting = (meetingId: string) => {
    setState((prev) => ({
      ...prev,
      committeeMeetings: prev.committeeMeetings.map((m) =>
        m.id === meetingId ? { ...m, status: 'Approved', approvedAt: nowIso() } : m
      ),
    }));
    addToast('Meeting approved', 'success');
  };

  // PTM
  const createPTM = (data: Partial<ParentTeacherMeeting>): ParentTeacherMeeting => {
    const ptm: ParentTeacherMeeting = {
      id: uid('ptm'),
      title: data.title || 'Parent-Teacher Conference',
      date: data.date || todayIso(),
      time: data.time || '10:30 AM',
      venue: data.venue || 'College Auditorium',
      agenda: data.agenda,
      status: state.session?.role === 'chairman' ? 'Approved' : 'Pending',
      createdAt: nowIso(),
      createdBy: state.session?.userId || 'coordinator',
      createdByName: state.session?.displayName || 'Coordinator',
    };
    setState((prev) => ({ ...prev, parentTeacherMeetings: [...prev.parentTeacherMeetings, ptm] }));
    addToast('Parent-Teacher Meeting scheduled', 'success');
    return ptm;
  };

  const approvePTM = (id: string) => {
    setState((prev) => ({
      ...prev,
      parentTeacherMeetings: prev.parentTeacherMeetings.map((p) =>
        p.id === id ? { ...p, status: 'Approved', approvedAt: nowIso(), approvedBy: state.session?.userId } : p
      ),
    }));
    addToast('Parent-Teacher Meeting approved by Chairman', 'success');
  };

  // Assignments
  const createAssignment = (data: Partial<Assignment>): Assignment => {
    const asg: Assignment = {
      id: uid('asg'),
      title: data.title!,
      description: data.description,
      courseId: data.courseId!,
      semesterId: data.semesterId,
      sectionId: data.sectionId,
      teacherId: state.session?.linkedId || state.session?.userId || '',
      teacherName: state.session?.displayName || 'Teacher',
      dueDate: data.dueDate || todayIso(),
      totalMarks: data.totalMarks || 20,
      status: 'Open',
      createdAt: nowIso(),
    };
    setState((prev) => ({ ...prev, assignments: [asg, ...prev.assignments] }));
    addToast(`Assignment "${asg.title}" created`, 'success');
    return asg;
  };

  const submitAssignment = (
    assignmentId: string,
    notes?: string,
    fileDataUrl?: string,
    fileName?: string
  ) => {
    const studentId = state.session?.linkedId || state.session?.userId || '';
    const asg = state.assignments.find((a) => a.id === assignmentId);
    if (!asg) throw new Error('Assignment not found');

    const sub = {
      id: uid('sub'),
      assignmentId,
      studentId,
      studentName: state.session?.displayName || 'Student',
      notes,
      fileDataUrl,
      fileName,
      submittedAt: nowIso(),
      status: new Date() > new Date(`${asg.dueDate}T23:59:59`) ? ('Late' as const) : ('Submitted' as const),
    };

    setState((prev) => ({
      ...prev,
      assignmentSubmissions: [...prev.assignmentSubmissions, sub],
    }));
    addToast('Assignment submission uploaded successfully', 'success');
  };

  const gradeAssignment = (submissionId: string, grade: string | number, feedback?: string) => {
    setState((prev) => ({
      ...prev,
      assignmentSubmissions: prev.assignmentSubmissions.map((s) =>
        s.id === submissionId
          ? {
              ...s,
              grade,
              feedback,
              status: 'Graded',
              gradedAt: nowIso(),
              gradedBy: state.session?.userId,
            }
          : s
      ),
    }));
    addToast('Assignment evaluated and grade saved', 'success');
  };

  // Files
  const shareFile = (
    data: Omit<SharedFile, 'id' | 'sharedAt' | 'sharedBy' | 'sharedByName'>
  ): SharedFile => {
    const file: SharedFile = {
      ...data,
      id: uid('sf'),
      sharedBy: state.session?.userId || 'staff',
      sharedByName: state.session?.displayName || 'Authorized Staff',
      sharedAt: nowIso(),
    };
    setState((prev) => ({ ...prev, sharedFiles: [file, ...prev.sharedFiles] }));
    addToast(`File "${file.title}" shared with target roles`, 'success');
    return file;
  };

  const deleteSharedFile = (id: string) => {
    setState((prev) => ({ ...prev, sharedFiles: prev.sharedFiles.filter((f) => f.id !== id) }));
    addToast('Shared document removed', 'info');
  };

  // Warnings
  const issueWarning = (
    studentId: string,
    severity: Warning['severity'],
    reason: string
  ): Warning => {
    const warn: Warning = {
      id: uid('wrn'),
      studentId,
      severity,
      reason,
      issuedAt: nowIso(),
      issuedBy: state.session?.displayName || 'Academic Board',
    };
    setState((prev) => ({ ...prev, warnings: [warn, ...prev.warnings] }));

    const stu = state.students.find((s) => s.id === studentId);
    const parentAccount = state.accounts.find(
      (a) => a.role === 'parent' && (a.linkedId === studentId || a.linkedId === stu?.id)
    );

    // 1. Notification to Student
    pushNotification({
      recipientId: studentId,
      recipientRole: 'student',
      title: `Official Attendance Warning: ${severity}`,
      message: `A formal ${severity} notice has been issued: "${reason}". Please present yourself before the Chairman/HOD.`,
      type: 'error',
      relatedRoute: '#/app/my-warnings',
    });

    // 2. Notification to Parent (Crucial user request: must reach parent portal)
    pushNotification({
      recipientId: parentAccount?.id || studentId,
      recipientRole: 'parent',
      title: `Notice to Parents: Official ${severity} Issued for ${stu?.name || 'Ward'}`,
      message: `Dear Parent/Guardian, an official ${severity} notice has been issued for your child ${stu?.name || 'Student'} (${stu?.admissionNumber || ''}). Reason: "${reason}". Attendance is below the mandatory 70% institutional threshold.`,
      type: 'error',
      relatedRoute: '#/app/attendance',
    });

    playNotificationTone('warning');
    addToast(`Formal ${severity} notice issued to student and parent portal`, 'warn');
    return warn;
  };

  // Real CSV Import
  const importStudents = (rows: Partial<Student>[]): { imported: number; errors: string[] } => {
    const errors: string[] = [];
    const validStudents: Student[] = [];
    const validAccounts: Account[] = [];

    rows.forEach((r, idx) => {
      const line = idx + 1;
      if (!r.name) {
        errors.push(`Row ${line}: Name is missing.`);
        return;
      }
      if (!r.admissionNumber) {
        errors.push(`Row ${line}: Admission # is required.`);
        return;
      }

      const cnicClean = String(r.cnic || '').replace(/\D/g, '');
      const studentId = uid('stu');

      const stu: Student = {
        id: studentId,
        admissionNumber: r.admissionNumber,
        registrationNumber: r.registrationNumber || `GCT-REG-${Math.floor(1000 + Math.random() * 9000)}`,
        classNumber: r.classNumber || `MECH-${Math.floor(10 + Math.random() * 90)}`,
        name: r.name,
        fatherName: r.fatherName || 'Father',
        studentMobile: cleanMobile(r.studentMobile || '03001234567'),
        fatherMobile: cleanMobile(r.fatherMobile || ''),
        cnic: cnicClean || '1730100000000',
        dob: r.dob || '2005-01-01',
        email: r.email?.trim().toLowerCase() || `stu_${r.admissionNumber.toLowerCase()}@gct.edu.pk`,
        programId: r.programId || 'prog_bt',
        departmentId: r.departmentId || 'dept_bt_mech',
        currentSemesterId: r.currentSemesterId || state.semesters[0]?.id || '',
        currentSectionId: r.currentSectionId || state.sections[0]?.id || '',
        batch: r.batch || '2026-2030',
        session: r.session || 'Spring',
        status: (r.status as any) || 'Active',
        admissionDate: r.admissionDate || todayIso(),
        createdAt: nowIso(),
      };

      const acc: Account = {
        id: uid('acc'),
        email: stu.email,
        password: stu.studentMobile || 'password',
        role: 'student',
        displayName: stu.name,
        status: 'Approved',
        linkedId: studentId,
        cnic: stu.cnic,
        programId: stu.programId,
        departmentId: stu.departmentId,
        autoCreated: true,
        createdAt: nowIso(),
      };

      validStudents.push(stu);
      validAccounts.push(acc);
    });

    if (validStudents.length > 0) {
      setState((prev) => ({
        ...prev,
        students: [...prev.students, ...validStudents],
        accounts: [...prev.accounts, ...validAccounts],
      }));
      addToast(`Imported ${validStudents.length} students successfully`, 'success');
    }

    return { imported: validStudents.length, errors };
  };

  return (
    <ERPContext.Provider
      value={{
        state,
        session: state.session,
        user: state.session,
        setUser,
        toasts,
        addToast,
        removeToast,
        login,
        logout,
        updateProfile,
        changePassword,
        updateSettings,
        getScope,
        can,
        pushNotification,
        markNotificationRead,
        markAllNotificationsRead,
        createStudent,
        updateStudent,
        deleteStudent,
        promoteStudent,
        strikeOffStudent,
        reinstateStudent,
        cancelStudentAdmission,
        requestAdmissionCancellation,
        createTeacher,
        updateTeacher,
        deleteTeacher,
        createStaffAccount,
        updateStaffAccount,
        deleteStaffAccount,
        deactivateStaffAccount,
        approveRegistration,
        rejectRegistration,
        registerAccount,
        createProgram,
        createDepartment,
        createCourse,
        updateCourse,
        deleteCourse,
        createSlot,
        updateSlot,
        deleteSlot,
        startClassSession,
        closeClassSession,
        rotateQrToken,
        scanQr,
        punchOutQr,
        markManualAttendance,
        requestLateScan,
        decideLateScan,
        submitStudentLeave,
        forwardStudentLeave,
        decideStudentLeave,
        submitTeacherLeave,
        decideTeacherLeave,
        createSubstitutionRequest,
        acceptSubstitution,
        declineSubstitution,
        assignSubstitute,
        createCommittee,
        updateCommittee,
        deleteCommittee,
        addCommitteeMember,
        removeCommitteeMember,
        scheduleMeeting,
        approveMeeting,
        createPTM,
        approvePTM,
        createAssignment,
        submitAssignment,
        gradeAssignment,
        shareFile,
        deleteSharedFile,
        issueWarning,
        importStudents,
      }}
    >
      {children}
    </ERPContext.Provider>
  );
};

export const useERP = (): ERPContextValue => {
  const ctx = useContext(ERPContext);
  if (!ctx) throw new Error('useERP must be used within an ERPProvider');
  return ctx;
};
