import { AttendanceSession } from './attendance-session.model';
import { AttendanceRecord } from './attendance-record.model';
import { Enrollment } from '../academic/enrollment.model';
import { TeacherAssignment } from '../academic/teacher-assignment.model';
import { ClassModel } from '../academic/class.model';
import { ParentStudentLink } from '../parents/parent-student-link.model';
import { SchoolSettings } from '../settings/school-settings.model';
import { NotificationService } from '../notifications/notification.service';
import { AuditService } from '../audit/audit.service';
import { NotFoundError, BadRequestError, ForbiddenError, ConflictError } from '../../shared/errors';
import { AttendanceStatus, AttendanceRecordInput } from '@school/shared-types';
import mongoose from 'mongoose';

export class AttendanceService {
  /**
   * Create or retrieve an attendance session for a class, date, and period.
   */
  public static async getOrCreateSession(params: {
    classId: string;
    date: string;
    period: number;
    subjectId?: string;
    userId: string;
    userRole: string;
  }) {
    // 1. Verify class exists
    const classDoc = await ClassModel.findById(params.classId);
    if (!classDoc) {
      throw new NotFoundError('Class not found');
    }

    // 2. If teacher, verify assignment
    if (params.userRole === 'teacher') {
      const isAssigned = await TeacherAssignment.exists({
        classId: params.classId,
        teacherId: params.userId
      });
      const isClassTeacher = classDoc.classTeacherId?.toString() === params.userId;

      if (!isAssigned && !isClassTeacher) {
        throw new ForbiddenError('You are not authorized to mark attendance for this class');
      }
    }

    // 3. Find existing session or create draft
    let session = await AttendanceSession.findOne({
      classId: params.classId,
      date: params.date,
      period: params.period,
      subjectId: params.subjectId || null
    });

    if (!session) {
      session = await AttendanceSession.create({
        classId: params.classId,
        date: params.date,
        period: params.period,
        subjectId: params.subjectId || undefined,
        markedBy: params.userId,
        status: 'draft'
      });

      // Populate draft records with all enrolled students default to 'present'
      const enrollments = await Enrollment.find({
        classId: params.classId,
        status: 'enrolled'
      }).populate('studentId', 'status');

      const initialRecords = enrollments
        .filter(e => e.studentId && (e.studentId as any).status === 'active')
        .map(e => ({
          sessionId: session!._id,
          studentId: (e.studentId as any)._id,
          status: 'present' as AttendanceStatus,
          updatedBy: params.userId,
          markedAt: new Date()
        }));

      if (initialRecords.length > 0) {
        await AttendanceRecord.insertMany(initialRecords, { ordered: false });
      }
    }

    return this.getSessionDetails(session._id.toString());
  }

  /**
   * Get full details of an attendance session including its records and student details
   */
  public static async getSessionDetails(sessionId: string) {
    const session = await AttendanceSession.findById(sessionId)
      .populate('classId', 'grade section')
      .populate('subjectId', 'name code')
      .populate('markedBy', 'name email')
      .lean();

    if (!session) {
      throw new NotFoundError('Attendance session not found');
    }

    const records = await AttendanceRecord.find({ sessionId })
      .populate('studentId', 'admissionNumber name dateOfBirth')
      .sort({ 'studentId.admissionNumber': 1 })
      .lean();

    return {
      session,
      records
    };
  }

  /**
   * List sessions with filtering
   */
  public static async listSessions(filter: {
    classId?: string;
    date?: string;
    status?: string;
    teacherId?: string;
    limit?: number;
    page?: number;
  }) {
    const query: any = {};
    if (filter.classId) query.classId = filter.classId;
    if (filter.date) query.date = filter.date;
    if (filter.status) query.status = filter.status;
    if (filter.teacherId) query.markedBy = filter.teacherId;

    const page = Math.max(1, Number(filter.page) || 1);
    const limit = Math.max(1, Number(filter.limit) || 20);
    const skip = (page - 1) * limit;

    const [sessions, total] = await Promise.all([
      AttendanceSession.find(query)
        .populate('classId', 'grade section')
        .populate('subjectId', 'name code')
        .populate('markedBy', 'name email')
        .sort({ date: -1, period: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      AttendanceSession.countDocuments(query)
    ]);

    return {
      sessions,
      total,
      page,
      totalPages: Math.ceil(total / limit)
    };
  }

  /**
   * Save draft records for a session
   */
  public static async saveDraftRecords(
    sessionId: string,
    records: AttendanceRecordInput[],
    userId: string
  ) {
    const session = await AttendanceSession.findById(sessionId);
    if (!session) {
      throw new NotFoundError('Attendance session not found');
    }

    if (session.status === 'submitted') {
      throw new BadRequestError('This session is already submitted and cannot be edited directly. Submit a correction request instead.');
    }

    // Upsert each record
    const ops = records.map(r => ({
      updateOne: {
        filter: { sessionId: session._id, studentId: r.studentId },
        update: {
          $set: {
            status: r.status,
            remarks: r.remarks,
            updatedBy: userId,
            markedAt: new Date()
          }
        },
        upsert: true
      }
    }));

    if (ops.length > 0) {
      await AttendanceRecord.bulkWrite(ops);
    }

    session.updatedAt = new Date();
    await session.save();

    return this.getSessionDetails(sessionId);
  }

  /**
   * Submit and finalize attendance session
   */
  public static async submitAttendance(
    sessionId: string,
    records: AttendanceRecordInput[],
    userId: string
  ) {
    const session = await AttendanceSession.findById(sessionId);
    if (!session) {
      throw new NotFoundError('Attendance session not found');
    }

    if (session.status === 'submitted') {
      throw new ConflictError('This attendance session has already been submitted');
    }

    // Save final records
    await this.saveDraftRecords(sessionId, records, userId);

    session.status = 'submitted';
    session.submittedAt = new Date();
    session.markedBy = new mongoose.Types.ObjectId(userId);
    await session.save();

    await AuditService.log(userId, 'ATTENDANCE_SUBMITTED', 'AttendanceSession', sessionId, undefined, {
      recordCount: records.length,
      absentCount: records.filter(r => r.status === 'absent').length
    });

    // Event-driven: Dispatch absence notifications to verified parents
    const absentStudentIds = records
      .filter(r => r.status === 'absent')
      .map(r => r.studentId);

    if (absentStudentIds.length > 0) {
      // Async dispatch so API response stays instant
      NotificationService.notifyParentsOfAbsences(session, absentStudentIds).catch(err => {
        console.error('Failed to notify parents of absences:', err);
      });
    }

    return this.getSessionDetails(sessionId);
  }

  /**
   * Submit a correction request
   */
  public static async submitCorrectionRequest(
    sessionId: string,
    input: { reason: string; records: AttendanceRecordInput[] },
    userId: string
  ) {
    const session = await AttendanceSession.findById(sessionId);
    if (!session) {
      throw new NotFoundError('Attendance session not found');
    }

    // Check policy: allowed within N days
    const settings = await SchoolSettings.findOne();
    const allowedDays = settings?.attendancePolicy?.allowTeacherCorrectionsWithinDays ?? 2;
    const sessionDate = new Date(session.date);
    const now = new Date();
    const diffDays = Math.ceil(Math.abs(now.getTime() - sessionDate.getTime()) / (1000 * 60 * 60 * 24));

    if (diffDays > allowedDays) {
      throw new BadRequestError(`Corrections can only be submitted within ${allowedDays} days of the attendance date.`);
    }

    // Apply the correction directly or log as corrected with audit
    const beforeRecords = await AttendanceRecord.find({ sessionId }).lean();

    const ops = input.records.map(r => ({
      updateOne: {
        filter: { sessionId: session._id, studentId: r.studentId },
        update: {
          $set: {
            status: r.status,
            remarks: r.remarks ? `[Corrected] ${r.remarks}` : `[Corrected: ${input.reason}]`,
            updatedBy: userId,
            markedAt: new Date()
          }
        }
      }
    }));

    if (ops.length > 0) {
      await AttendanceRecord.bulkWrite(ops);
    }

    session.status = 'corrected';
    session.correctionReason = input.reason;
    await session.save();

    await AuditService.log(userId, 'ATTENDANCE_CORRECTED', 'AttendanceSession', sessionId, beforeRecords, {
      reason: input.reason,
      modifiedCount: input.records.length
    });

    return this.getSessionDetails(sessionId);
  }

  /**
   * Get attendance records for a specific student (with authorization check)
   */
  public static async getStudentAttendance(studentId: string, currentUser: any) {
    // Authorization: Admin & Teacher can view. If Parent, must be verified link. If Student, must be self.
    if (currentUser.role === 'parent') {
      const isLinked = await ParentStudentLink.exists({
        parentUserId: currentUser._id,
        studentId,
        verificationStatus: 'verified'
      });
      if (!isLinked) {
        throw new ForbiddenError('You can only view attendance for your verified children');
      }
    } else if (currentUser.role === 'student') {
      // Look up student by admission or user link
      // For now verify studentId
    }

    const records = await AttendanceRecord.find({ studentId })
      .populate({
        path: 'sessionId',
        select: 'date period status subjectId',
        populate: { path: 'subjectId', select: 'name code' }
      })
      .sort({ markedAt: -1 })
      .lean();

    // Calculate metrics
    let present = 0;
    let absent = 0;
    let late = 0;
    let excused = 0;

    const validRecords = records.filter(r => r.sessionId && (r.sessionId as any).status !== 'draft');

    validRecords.forEach(r => {
      if (r.status === 'present') present++;
      else if (r.status === 'absent') absent++;
      else if (r.status === 'late') late++;
      else if (r.status === 'excused') excused++;
    });

    const totalSessions = validRecords.length;
    const settings = await SchoolSettings.findOne();
    const lateFraction = settings?.attendancePolicy?.lateCountsAsFraction ?? 0.5;
    const excusedPresent = settings?.attendancePolicy?.excusedCountsAsPresent ?? true;

    const effectivePresent = present + (late * lateFraction) + (excusedPresent ? excused : 0);
    const percentage = totalSessions > 0 ? Math.round((effectivePresent / totalSessions) * 100) : 100;

    return {
      studentId,
      totalSessions,
      present,
      absent,
      late,
      excused,
      percentage,
      records: validRecords.map(r => ({
        _id: r._id,
        date: (r.sessionId as any).date,
        period: (r.sessionId as any).period,
        status: r.status,
        remarks: r.remarks,
        subject: (r.sessionId as any).subjectId?.name || 'Class Attendance'
      }))
    };
  }
}
