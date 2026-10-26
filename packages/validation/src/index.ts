import { z } from 'zod';

// ==================== AUTH SCHEMAS ====================
export const loginSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters')
});
export type LoginInput = z.infer<typeof loginSchema>;

export const registerSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  role: z.enum(['admin', 'teacher', 'parent', 'student']),
  phone: z.string().optional()
});
export type RegisterInput = z.infer<typeof registerSchema>;

export const refreshTokenSchema = z.object({
  refreshToken: z.string().min(1, 'Refresh token is required')
});

export const forgotPasswordSchema = z.object({
  email: z.string().email('Please enter a valid email address')
});

export const resetPasswordSchema = z.object({
  token: z.string().min(1, 'Reset token is required'),
  newPassword: z.string().min(8, 'Password must be at least 8 characters')
});

// ==================== STUDENT SCHEMAS ====================
export const createStudentSchema = z.object({
  admissionNumber: z.string().min(1, 'Admission number is required').trim(),
  name: z.string().min(2, 'Student name must be at least 2 characters').trim(),
  dateOfBirth: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date of birth must be YYYY-MM-DD').optional(),
  gender: z.enum(['male', 'female', 'other']).optional(),
  status: z.enum(['active', 'inactive', 'transferred', 'graduated']).default('active'),
  classId: z.string().min(1, 'Class ID is required for initial enrollment')
});
export type CreateStudentInput = z.infer<typeof createStudentSchema>;

export const updateStudentSchema = z.object({
  name: z.string().min(2).optional(),
  dateOfBirth: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  gender: z.enum(['male', 'female', 'other']).optional(),
  status: z.enum(['active', 'inactive', 'transferred', 'graduated']).optional()
});

export const createParentLinkSchema = z.object({
  parentUserId: z.string().min(1, 'Parent User ID is required'),
  relationship: z.enum(['father', 'mother', 'guardian']),
  verificationStatus: z.enum(['pending', 'verified', 'rejected']).default('verified')
});

// ==================== TEACHER SCHEMAS ====================
export const createTeacherSchema = z.object({
  name: z.string().min(2, 'Teacher name must be at least 2 characters'),
  email: z.string().email('Valid email is required'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  phone: z.string().optional()
});

export const updateTeacherSchema = z.object({
  name: z.string().min(2).optional(),
  email: z.string().email().optional(),
  phone: z.string().optional(),
  isActive: z.boolean().optional()
});

// ==================== CLASS & ENROLLMENT SCHEMAS ====================
export const createAcademicYearSchema = z.object({
  name: z.string().min(1, 'Name is required e.g. 2026-2027'),
  startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Start date must be YYYY-MM-DD'),
  endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'End date must be YYYY-MM-DD'),
  status: z.enum(['active', 'upcoming', 'completed']).default('active')
});

export const createClassSchema = z.object({
  grade: z.string().min(1, 'Grade is required e.g. Grade 10'),
  section: z.string().min(1, 'Section is required e.g. A').trim(),
  academicYearId: z.string().min(1, 'Academic Year ID is required'),
  classTeacherId: z.string().optional()
});

export const enrollStudentSchema = z.object({
  studentId: z.string().min(1, 'Student ID is required'),
  classId: z.string().min(1, 'Class ID is required'),
  academicYearId: z.string().min(1, 'Academic Year ID is required'),
  startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).default(() => new Date().toISOString().split('T')[0]),
  rollNumber: z.number().int().positive().optional()
});

export const createSubjectSchema = z.object({
  name: z.string().min(2, 'Subject name is required'),
  code: z.string().min(2, 'Subject code is required e.g. MATH101').toUpperCase(),
  description: z.string().optional()
});

export const assignTeacherSchema = z.object({
  teacherId: z.string().min(1, 'Teacher ID is required'),
  classId: z.string().min(1, 'Class ID is required'),
  subjectId: z.string().optional(),
  academicYearId: z.string().min(1, 'Academic Year ID is required')
});

export const createTimetablePeriodSchema = z.object({
  classId: z.string().min(1, 'Class ID is required'),
  subjectId: z.string().optional(),
  teacherId: z.string().min(1, 'Teacher ID is required'),
  dayOfWeek: z.number().int().min(1).max(7),
  periodNumber: z.number().int().min(1).max(12),
  startTime: z.string().regex(/^\d{2}:\d{2}$/, 'Time must be HH:mm'),
  endTime: z.string().regex(/^\d{2}:\d{2}$/, 'Time must be HH:mm')
});

// ==================== ATTENDANCE SCHEMAS ====================
export const attendanceRecordInputSchema = z.object({
  studentId: z.string().min(1, 'Student ID is required'),
  status: z.enum(['present', 'absent', 'late', 'excused']),
  remarks: z.string().max(250).optional()
});

export const createAttendanceSessionSchema = z.object({
  classId: z.string().min(1, 'Class ID is required'),
  subjectId: z.string().optional(),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be YYYY-MM-DD'),
  period: z.number().int().min(1).max(12).default(1)
});

export const updateAttendanceRecordsSchema = z.object({
  records: z.array(attendanceRecordInputSchema).min(1, 'At least one record is required')
});

export const submitAttendanceSchema = z.object({
  records: z.array(attendanceRecordInputSchema).min(1, 'At least one record is required')
});

export const correctionRequestSchema = z.object({
  reason: z.string().min(5, 'Reason must be at least 5 characters long'),
  records: z.array(attendanceRecordInputSchema).min(1, 'At least one record modification is required')
});

export const approveCorrectionSchema = z.object({
  approved: z.boolean(),
  reviewRemarks: z.string().optional()
});

// ==================== LEAVE REQUEST SCHEMAS ====================
export const createLeaveRequestSchema = z.object({
  studentId: z.string().min(1, 'Student ID is required'),
  startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Start date must be YYYY-MM-DD'),
  endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'End date must be YYYY-MM-DD'),
  reason: z.string().min(5, 'Reason must be at least 5 characters')
}).refine(data => data.endDate >= data.startDate, {
  message: 'End date cannot be earlier than start date',
  path: ['endDate']
});

export const reviewLeaveRequestSchema = z.object({
  status: z.enum(['approved', 'rejected']),
  remarks: z.string().optional()
});

// ==================== SETTINGS SCHEMAS ====================
export const updateSchoolSettingsSchema = z.object({
  schoolName: z.string().min(2).optional(),
  timezone: z.string().min(2).optional(),
  attendancePolicy: z.object({
    minimumRequiredPercentage: z.number().min(0).max(100).optional(),
    lateCountsAsFraction: z.number().min(0).max(1).optional(),
    excusedCountsAsPresent: z.boolean().optional(),
    consecutiveAbsenceAlertThreshold: z.number().int().positive().optional(),
    autoCloseDraftHours: z.number().int().positive().optional(),
    allowTeacherCorrectionsWithinDays: z.number().int().min(0).optional()
  }).optional(),
  notificationSettings: z.object({
    enablePushNotifications: z.boolean().optional(),
    enableEmailNotifications: z.boolean().optional(),
    absenceAlertTime: z.string().optional(),
    dailyDigestEnabled: z.boolean().optional()
  }).optional(),
  reportingSettings: z.object({
    academicStartMonth: z.number().min(1).max(12).optional(),
    weekStartsOn: z.number().min(0).max(6).optional()
  }).optional()
});
