// User & Authentication Types
export type UserRole = 'admin' | 'teacher' | 'parent' | 'student';

export interface IUser {
  _id: string;
  name: string;
  email: string;
  role: UserRole;
  isActive: boolean;
  phone?: string;
  createdAt: string;
  updatedAt: string;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  user: IUser;
}

// Student Types
export type StudentStatus = 'active' | 'inactive' | 'transferred' | 'graduated';

export interface IStudent {
  _id: string;
  admissionNumber: string;
  name: string;
  dateOfBirth?: string;
  gender?: 'male' | 'female' | 'other';
  status: StudentStatus;
  currentClass?: {
    classId: string;
    grade: string;
    section: string;
  };
  createdAt: string;
  updatedAt: string;
}

// Parent-Student Link Types
export type RelationshipType = 'father' | 'mother' | 'guardian';
export type VerificationStatus = 'pending' | 'verified' | 'rejected';

export interface IParentStudentLink {
  _id: string;
  parentUserId: string | IUser;
  studentId: string | IStudent;
  relationship: RelationshipType;
  verificationStatus: VerificationStatus;
  verifiedAt?: string;
  createdAt: string;
  updatedAt: string;
}

// Academic Year Types
export type AcademicYearStatus = 'active' | 'upcoming' | 'completed';

export interface IAcademicYear {
  _id: string;
  name: string;
  startDate: string;
  endDate: string;
  status: AcademicYearStatus;
  createdAt: string;
  updatedAt: string;
}

// Class & Section Types
export type ClassStatus = 'active' | 'archived';

export interface IClass {
  _id: string;
  grade: string;
  section: string;
  academicYearId: string | IAcademicYear;
  classTeacherId?: string | IUser;
  status: ClassStatus;
  createdAt: string;
  updatedAt: string;
}

// Enrollment Types
export type EnrollmentStatus = 'enrolled' | 'transferred' | 'withdrawn' | 'graduated';

export interface IEnrollment {
  _id: string;
  studentId: string | IStudent;
  classId: string | IClass;
  academicYearId: string | IAcademicYear;
  startDate: string;
  endDate?: string;
  status: EnrollmentStatus;
  rollNumber?: number;
  createdAt: string;
  updatedAt: string;
}

// Subject Types
export interface ISubject {
  _id: string;
  name: string;
  code: string;
  description?: string;
  createdAt: string;
  updatedAt: string;
}

// Teacher Assignment Types
export interface ITeacherAssignment {
  _id: string;
  teacherId: string | IUser;
  classId: string | IClass;
  subjectId?: string | ISubject;
  academicYearId: string | IAcademicYear;
  createdAt: string;
  updatedAt: string;
}

// Timetable Period Types
export interface ITimetablePeriod {
  _id: string;
  classId: string | IClass;
  subjectId?: string | ISubject;
  teacherId: string | IUser;
  dayOfWeek: number; // 1 = Monday ... 7 = Sunday
  periodNumber: number;
  startTime: string; // HH:mm format
  endTime: string;   // HH:mm format
  createdAt: string;
  updatedAt: string;
}

// Attendance Types
export type AttendanceStatus = 'present' | 'absent' | 'late' | 'excused';
export type AttendanceSessionStatus = 'draft' | 'submitted' | 'corrected';

export interface IAttendanceSession {
  _id: string;
  classId: string | IClass;
  subjectId?: string | ISubject;
  date: string; // YYYY-MM-DD
  period: number;
  markedBy: string | IUser;
  status: AttendanceSessionStatus;
  submittedAt?: string;
  correctionReason?: string;
  createdAt: string;
  updatedAt: string;
}

export interface IAttendanceRecord {
  _id: string;
  sessionId: string | IAttendanceSession;
  studentId: string | IStudent;
  status: AttendanceStatus;
  markedAt: string;
  updatedBy: string | IUser;
  remarks?: string;
}

export interface IAttendanceRecordInput {
  studentId: string;
  status: AttendanceStatus;
  remarks?: string;
}

// Leave Request Types
export type LeaveStatus = 'pending' | 'approved' | 'rejected';

export interface ILeaveRequest {
  _id: string;
  studentId: string | IStudent;
  parentUserId: string | IUser;
  startDate: string;
  endDate: string;
  reason: string;
  status: LeaveStatus;
  reviewedBy?: string | IUser;
  reviewedAt?: string;
  remarks?: string;
  createdAt: string;
  updatedAt: string;
}

// Notification Types
export type NotificationType = 'absence' | 'leave_update' | 'announcement' | 'system';
export type DeliveryStatus = 'pending' | 'delivered' | 'failed' | 'read';

export interface INotification {
  _id: string;
  recipientUserId: string | IUser;
  studentId?: string | IStudent;
  type: NotificationType;
  title: string;
  message: string;
  deliveryStatus: DeliveryStatus;
  createdAt: string;
  deliveredAt?: string;
  readAt?: string;
}

// Audit Log Types
export interface IAuditLog {
  _id: string;
  actorId: string | IUser;
  action: string;
  entityType: string;
  entityId: string;
  before?: Record<string, any>;
  after?: Record<string, any>;
  timestamp: string;
}

// School Settings & Policies
export interface AttendancePolicy {
  minimumRequiredPercentage: number;
  lateCountsAsFraction: number; // e.g. 0.5 or 1.0
  excusedCountsAsPresent: boolean;
  consecutiveAbsenceAlertThreshold: number;
  autoCloseDraftHours: number;
  allowTeacherCorrectionsWithinDays: number;
}

export interface NotificationSettings {
  enablePushNotifications: boolean;
  enableEmailNotifications: boolean;
  absenceAlertTime: string;
  dailyDigestEnabled: boolean;
}

export interface ReportingSettings {
  academicStartMonth: number;
  weekStartsOn: number; // 1 = Monday, 0 = Sunday
}

export interface ISchoolSettings {
  _id?: string;
  schoolName: string;
  schoolCode: string;
  timezone: string;
  attendancePolicy: AttendancePolicy;
  notificationSettings: NotificationSettings;
  reportingSettings: ReportingSettings;
  holidays: Array<{
    name: string;
    date: string;
  }>;
  createdAt: string;
  updatedAt: string;
}

// API Response Wrappers
export interface ApiResponse<T = any> {
  success: boolean;
  message?: string;
  data: T;
  meta?: {
    page?: number;
    limit?: number;
    total?: number;
    totalPages?: number;
  };
}

export interface ApiErrorResponse {
  success: false;
  message: string;
  code?: string;
  errors?: Array<{
    field: string;
    message: string;
  }>;
}

// Report DTOs
export interface IDailyAttendanceReport {
  date: string;
  totalEnrolled: number;
  presentCount: number;
  absentCount: number;
  lateCount: number;
  excusedCount: number;
  attendancePercentage: number;
  classBreakdown: Array<{
    classId: string;
    grade: string;
    section: string;
    total: number;
    present: number;
    absent: number;
    late: number;
    excused: number;
    percentage: number;
    sessionStatus?: string;
  }>;
}

export interface IStudentAttendanceReport {
  student: IStudent;
  dateRange: {
    startDate: string;
    endDate: string;
  };
  summary: {
    totalSessions: number;
    present: number;
    absent: number;
    late: number;
    excused: number;
    calculatedPercentage: number;
    meetsThreshold: boolean;
  };
  records: Array<{
    date: string;
    period: number;
    status: AttendanceStatus;
    remarks?: string;
    subjectName?: string;
  }>;
}
