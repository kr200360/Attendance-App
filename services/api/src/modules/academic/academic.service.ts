import { ClassModel } from './class.model';
import { AcademicYear } from './academic-year.model';
import { Subject } from './subject.model';
import { Enrollment } from './enrollment.model';
import { TeacherAssignment } from './teacher-assignment.model';
import { TimetablePeriod } from './timetable.model';
import { User } from '../users/user.model';
import { NotFoundError, BadRequestError, ForbiddenError } from '../../shared/errors';
import { AuditService } from '../audit/audit.service';
import bcrypt from 'bcryptjs';

export class AcademicService {
  // Academic Years
  public static async getAcademicYears() {
    return AcademicYear.find().sort({ startDate: -1 });
  }

  public static async createAcademicYear(data: any, actorId: string) {
    const year = await AcademicYear.create(data);
    await AuditService.log(actorId, 'ACADEMIC_YEAR_CREATED', 'AcademicYear', year._id.toString());
    return year;
  }

  // Classes
  public static async listClasses(academicYearId?: string) {
    const filter: any = { status: 'active' };
    if (academicYearId) filter.academicYearId = academicYearId;
    return ClassModel.find(filter)
      .populate('academicYearId', 'name')
      .populate('classTeacherId', 'name email')
      .sort({ grade: 1, section: 1 })
      .lean();
  }

  public static async createClass(data: any, actorId: string) {
    const newClass = await ClassModel.create(data);
    await AuditService.log(actorId, 'CLASS_CREATED', 'Class', newClass._id.toString(), undefined, data);
    return newClass;
  }

  public static async getClassRoster(classId: string, teacherId?: string, userRole?: string) {
    const classDoc = await ClassModel.findById(classId).populate('academicYearId', 'name');
    if (!classDoc) {
      throw new NotFoundError('Class not found');
    }

    // If teacher, verify that teacher is assigned to this class or is class teacher
    if (userRole === 'teacher' && teacherId) {
      const isAssigned = await TeacherAssignment.exists({
        classId,
        teacherId
      });
      const isClassTeacher = classDoc.classTeacherId?.toString() === teacherId;

      if (!isAssigned && !isClassTeacher) {
        throw new ForbiddenError('You are not assigned to this class');
      }
    }

    const enrollments = await Enrollment.find({
      classId,
      status: 'enrolled'
    })
      .populate('studentId', 'admissionNumber name dateOfBirth gender status')
      .sort({ rollNumber: 1 })
      .lean();

    return {
      class: classDoc,
      students: enrollments
        .filter(e => e.studentId && (e.studentId as any).status === 'active')
        .map(e => ({
          ...(e.studentId as any),
          rollNumber: e.rollNumber,
          enrollmentId: e._id
        }))
    };
  }

  // Subjects
  public static async listSubjects() {
    return Subject.find().sort({ name: 1 });
  }

  public static async createSubject(data: any) {
    return Subject.create(data);
  }

  // Teachers
  public static async listTeachers() {
    return User.find({ role: 'teacher' }).select('-passwordHash').sort({ name: 1 });
  }

  public static async createTeacher(data: any, actorId: string) {
    const existing = await User.findOne({ email: data.email.toLowerCase() });
    if (existing) {
      throw new BadRequestError('User with this email already exists');
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(data.password, salt);

    const teacher = await User.create({
      name: data.name,
      email: data.email.toLowerCase(),
      passwordHash,
      role: 'teacher',
      phone: data.phone,
      isActive: true
    });

    await AuditService.log(actorId, 'TEACHER_CREATED', 'User', teacher._id.toString());
    return teacher;
  }

  // Teacher Assignments
  public static async assignTeacher(data: any, actorId: string) {
    const assignment = await TeacherAssignment.findOneAndUpdate(
      {
        teacherId: data.teacherId,
        classId: data.classId,
        subjectId: data.subjectId || null,
        academicYearId: data.academicYearId
      },
      data,
      { upsert: true, new: true }
    );

    await AuditService.log(actorId, 'TEACHER_ASSIGNED', 'TeacherAssignment', assignment._id.toString());
    return assignment;
  }

  public static async getTeacherAssignments(teacherId: string) {
    return TeacherAssignment.find({ teacherId })
      .populate('classId', 'grade section academicYearId')
      .populate('subjectId', 'name code')
      .populate('academicYearId', 'name status')
      .lean();
  }

  // Timetable
  public static async getTimetable(classId?: string, teacherId?: string) {
    const filter: any = {};
    if (classId) filter.classId = classId;
    if (teacherId) filter.teacherId = teacherId;

    return TimetablePeriod.find(filter)
      .populate('classId', 'grade section')
      .populate('subjectId', 'name code')
      .populate('teacherId', 'name email')
      .sort({ dayOfWeek: 1, periodNumber: 1 });
  }

  public static async createTimetablePeriod(data: any) {
    return TimetablePeriod.create(data);
  }
}
