export type UserRole =
  | 'sysadmin'
  | 'chairman'
  | 'hod'
  | 'coordinator'
  | 'clerk'
  | 'assistant'
  | 'teacher'
  | 'student'
  | 'parent';

export interface UserSession {
  userId: string;
  email: string;
  role: UserRole;
  displayName: string;
  linkedId?: string | null;
  photoDataUrl?: string;
  programId?: string | null;
  departmentId?: string | null;
  permissions?: string[] | null;
  loggedInAt: string;
  deviceFingerprint?: string;
}

export interface Program {
  id: string;
  code: string;
  name: string;
  durationYears: number;
  totalSemesters: number;
  deptHeadRole: 'chairman' | 'hod';
  status: 'Active' | 'Inactive';
  createdAt: string;
}

export interface Department {
  id: string;
  programId: string;
  code: string;
  name: string;
  status: 'Active' | 'Inactive';
  createdAt: string;
}

export interface Semester {
  id: string;
  number: number;
  name: string;
  programId: string;
}

export interface Section {
  id: string;
  name: string;
  semesterId: string;
  programId: string;
  capacity?: number;
}

export interface Student {
  id: string;
  admissionNumber: string;
  registrationNumber: string;
  classNumber: string;
  name: string;
  fatherName: string;
  studentMobile: string;
  fatherMobile?: string;
  cnic: string;
  dob: string;
  email: string;
  programId: string;
  departmentId: string;
  currentSemesterId: string;
  currentSectionId: string;
  batch?: string;
  session?: string;
  status: 'Active' | 'Graduated' | 'Left' | 'Suspended' | 'Withdrawn' | 'StruckOff' | 'Cancelled';
  admissionDate: string;
  photoDataUrl?: string;
  createdAt: string;
  updatedAt?: string;
}

export interface Teacher {
  id: string;
  name: string;
  employeeCode: string;
  email: string;
  designation: string;
  programId?: string | null;
  departmentId?: string | null;
  active: boolean;
  phone?: string;
  photoDataUrl?: string;
  createdAt: string;
}

export interface Account {
  id: string;
  email: string;
  password?: string;
  role: UserRole;
  displayName: string;
  status: 'Pending' | 'Approved' | 'Rejected' | 'Inactive' | 'Suspended';
  linkedId?: string | null;
  requestedLinkedId?: string | null;
  cnic?: string | null;
  dob?: string | null;
  programId?: string | null;
  departmentId?: string | null;
  permissions?: string[] | null;
  photoDataUrl?: string;
  createdAt: string;
  approvedAt?: string;
  approvedBy?: string;
  rejectionReason?: string;
  autoCreated?: boolean;
}

export interface Course {
  id: string;
  code: string;
  name: string;
  creditHours: number;
  type: 'theory' | 'practical' | 'lab';
  programId: string;
  departmentId?: string | null;
  semesterId: string;
  status: 'Active' | 'Inactive';
  createdAt: string;
}

export interface CourseAssignment {
  id: string;
  courseId: string;
  teacherId: string;
  semesterId: string;
  sectionId: string;
  academicYear: number;
}

export interface TimetableSlot {
  id: string;
  day: 'Monday' | 'Tuesday' | 'Wednesday' | 'Thursday' | 'Friday' | 'Saturday';
  startTime: string; // HH:MM
  endTime: string; // HH:MM
  courseId: string;
  teacherId: string;
  programId: string;
  departmentId?: string | null;
  semesterId: string;
  sectionId: string;
  className?: string;
  slotType: 'Theory' | 'Practical' | 'Lab';
  status: 'Active' | 'Inactive';
  createdAt: string;
}

export type AttendanceStatus = 'present' | 'late' | 'absent' | 'approved_leave';

export interface AttendanceSession {
  id: string;
  timetableId: string;
  teacherId: string;
  originalTeacherId: string;
  courseId: string;
  semesterId: string;
  sectionId: string;
  className?: string;
  date: string; // YYYY-MM-DD
  scheduledStart: string;
  scheduledEnd: string;
  actualStart: string;
  actualEnd?: string | null;
  delayMinutes: number;
  qrToken: string;
  qrExpiresAt: string;
  status: 'open' | 'closed';
  gracePeriodMinutes: number;
  startedBy: string;
  programId: string;
  departmentId?: string | null;
}

export interface AttendanceRecord {
  id: string;
  sessionId: string;
  studentId: string;
  courseId: string;
  teacherId: string;
  semesterId: string;
  sectionId: string;
  date: string;
  scheduledStart?: string;
  actualStart?: string;
  arrivalTime?: string | null;
  exitTime?: string | null;
  status: AttendanceStatus;
  lateMinutes: number;
  markedBy: string;
  markedAt: string;
  manual?: boolean;
  remarks?: string;
  leaveId?: string;
  gracePeriodUsed?: number;
  programId?: string;
  departmentId?: string;
}

export interface LateScanRequest {
  id: string;
  studentId: string;
  studentName: string;
  date: string;
  reason: string;
  requestedAt: string;
  status: 'pending' | 'approved' | 'rejected';
  decidedAt?: string | null;
  decidedBy?: string | null;
  remarks?: string;
  programId?: string | null;
  departmentId?: string | null;
}

export interface LeaveTimelineEntry {
  at: string;
  action: string;
  by: string;
  role: string;
  note: string;
}

export interface LeaveApplication {
  id: string;
  studentId: string;
  leaveType: string;
  startDate: string;
  endDate: string;
  days: number;
  reason: string;
  description?: string;
  status: 'with_teacher' | 'with_chairman' | 'approved' | 'rejected';
  currentOwnerRole?: string | null;
  currentOwnerId?: string | null;
  notifiedTeacherIds?: string[];
  teacherRemarks?: string;
  chairmanRemarks?: string;
  submittedAt: string;
  forwardedAt?: string | null;
  decidedAt?: string | null;
  timeline: LeaveTimelineEntry[];
  programId?: string;
  departmentId?: string;
}

export interface TeacherLeaveApplication {
  id: string;
  teacherId: string;
  teacherName: string;
  leaveType: string;
  startDate: string;
  endDate: string;
  days: number;
  reason: string;
  description?: string;
  status: 'with_chairman' | 'approved' | 'rejected';
  chairmanRemarks?: string;
  submittedAt: string;
  decidedAt?: string | null;
  programId?: string | null;
  departmentId?: string | null;
}

export interface SubstitutionRequest {
  id: string;
  timetableId: string;
  courseId: string;
  semesterId: string;
  sectionId: string;
  originalTeacherId: string;
  date: string;
  reason: string;
  candidates: string[];
  declinedBy: string[];
  substituteTeacherId?: string | null;
  status: 'pending' | 'accepted' | 'declined' | 'no_candidates';
  requestedBy: string;
  requestedAt: string;
  decidedAt?: string;
  assignedBy?: string;
  programId?: string;
  departmentId?: string;
}

export interface Committee {
  id: string;
  committeeNumber?: number;
  name: string;
  formationDate: string;
  committeeType: 'Main' | 'Sub' | 'Ad-hoc' | 'Standing' | 'Special';
  committeeKind:
    | 'OBE'
    | 'AT'
    | 'PT'
    | 'Standalone'
    | 'Discipline'
    | 'Sports'
    | 'Examination'
    | 'Admissions'
    | 'Harassment'
    | 'Hostel'
    | 'General';
  description?: string;
  status: 'Active' | 'Dissolved' | 'On Hold';
  parentCommitteeId?: string | null;
  programId?: string | null;
  departmentId?: string | null;
  createdAt: string;
}

export interface CommitteeMember {
  id: string;
  committeeId: string;
  memberName: string;
  designation: string;
  position: string;
  serialNo?: number;
  status: 'Active' | 'Removed';
  joinedAt: string;
  addedBy: string;
}

export interface CommitteeMeeting {
  id: string;
  committeeId: string;
  subject: string;
  date: string;
  time?: string;
  venue?: string;
  agenda?: string;
  minutes?: string;
  status: 'Pending' | 'Approved';
  createdAt: string;
  approvedAt?: string;
  approvedBy?: string;
}

export interface ParentTeacherMeeting {
  id: string;
  title: string;
  date: string;
  time?: string;
  venue?: string;
  agenda?: string;
  notes?: string;
  status: 'Pending' | 'Approved';
  createdAt: string;
  createdBy: string;
  createdByName?: string;
  approvedBy?: string | null;
  approvedAt?: string | null;
}

export interface Assignment {
  id: string;
  title: string;
  description?: string;
  courseId: string;
  semesterId?: string;
  sectionId?: string;
  teacherId: string;
  teacherName: string;
  dueDate: string;
  totalMarks?: number;
  status: 'Open' | 'Closed';
  createdAt: string;
  programId?: string | null;
  departmentId?: string | null;
}

export interface AssignmentSubmission {
  id: string;
  assignmentId: string;
  studentId: string;
  studentName: string;
  notes?: string;
  fileDataUrl?: string | null;
  fileName?: string | null;
  submittedAt: string;
  status: 'Submitted' | 'Late' | 'Graded';
  grade?: string | number | null;
  feedback?: string;
  gradedAt?: string;
  gradedBy?: string;
}

export interface SharedFile {
  id: string;
  title: string;
  description?: string;
  fileName: string;
  fileType: string;
  fileSize: number;
  dataUrl: string;
  sharedWithRoles: UserRole[];
  departmentId?: string | null;
  targetAudienceNote?: string;
  sharedBy: string;
  sharedByName: string;
  sharedAt: string;
}

export interface Notification {
  id: string;
  recipientId?: string | null;
  recipientRole?: UserRole | null;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warn' | 'error';
  senderId?: string | null;
  senderRole?: string;
  relatedRecordId?: string | null;
  relatedModule?: string | null;
  relatedRoute?: string | null;
  programId?: string | null;
  departmentId?: string | null;
  read: boolean;
  createdAt: string;
}

export interface Warning {
  id: string;
  studentId: string;
  severity: 'Warning 1' | 'Warning 2' | 'Final Notice' | 'Suspension';
  reason: string;
  issuedAt: string;
  issuedBy: string;
  programId?: string;
  departmentId?: string;
}

export interface ExitRecord {
  id: string;
  studentId: string;
  date: string;
  entryTime: string;
  exitTime: string;
  reason?: string;
  recordedBy: string;
  auto?: boolean;
}

export interface AuditLog {
  id: string;
  userId: string;
  role: string;
  action: string;
  module: string;
  recordId?: string | null;
  before?: any;
  after?: any;
  programId?: string | null;
  departmentId?: string | null;
  timestamp: string;
}

export interface Parent {
  id: string;
  name: string;
  email: string;
  mobile: string;
  relation: string;
}

export interface ParentLink {
  id: string;
  parentId: string;
  studentId: string;
  relation: string;
  isPrimary: boolean;
  verified: boolean;
  linkedAt: string;
  linkedBy?: string;
}

export interface CollegeSettings {
  id: string;
  collegeName: string;
  departmentName: string;
  affiliation: string;
  address: string;
  phone: string;
  email: string;
  website: string;
  logoDataUrl: string;
  letterheadDataUrl: string;
  footerText: string;
  signatureLabel: string;
  chairmanName: string;
  chairmanSignatureDataUrl: string;
  shortageThreshold: number;
  lateToAbsenceThreshold: number;
  gracePeriodMinutes: number;
  currentTerm: 'Spring' | 'Fall';
  currentYear: number;
  qrValiditySeconds: number;
  qrAttendanceEnabled: boolean;
}

export interface ERPState {
  session: UserSession | null;
  settings: CollegeSettings;
  programs: Program[];
  departments: Department[];
  semesters: Semester[];
  sections: Section[];
  students: Student[];
  teachers: Teacher[];
  accounts: Account[];
  courses: Course[];
  courseAssignments: CourseAssignment[];
  timetable: TimetableSlot[];
  attendanceSessions: AttendanceSession[];
  attendanceRecords: AttendanceRecord[];
  leaveApplications: LeaveApplication[];
  teacherLeaveApplications: TeacherLeaveApplication[];
  lateScanRequests: LateScanRequest[];
  substitutionRequests: SubstitutionRequest[];
  committees: Committee[];
  committeeMembers: CommitteeMember[];
  committeeMeetings: CommitteeMeeting[];
  parentTeacherMeetings: ParentTeacherMeeting[];
  assignments: Assignment[];
  assignmentSubmissions: AssignmentSubmission[];
  sharedFiles: SharedFile[];
  notifications: Notification[];
  warnings: Warning[];
  exitRecords: ExitRecord[];
  auditLogs: AuditLog[];
  parents: Parent[];
  parentLinks: ParentLink[];
  semesterHistory: Array<{
    id: string;
    studentId: string;
    semesterId: string;
    sectionId: string;
    endedAt: string;
  }>;
  promotions: Array<{
    id: string;
    studentId: string;
    fromSemesterId: string;
    toSemesterId: string;
    fromSectionId: string;
    toSectionId: string;
    promotedBy: string;
    promotedAt: string;
    remarks?: string;
  }>;
}
