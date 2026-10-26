import { Student } from './student.model';
import { Enrollment } from '../academic/enrollment.model';
import { ClassModel } from '../academic/class.model';
import { ParentStudentLink } from '../parents/parent-student-link.model';
import { NotFoundError, ConflictError, BadRequestError } from '../../shared/errors';
import { CreateStudentInput } from '@school/validation';
import { AuditService } from '../audit/audit.service';

export class StudentService {
  public static async listStudents(query: {
    search?: string;
    classId?: string;
    status?: string;
    page?: number;
    limit?: number;
  }) {
    const page = Math.max(1, Number(query.page) || 1);
    const limit = Math.max(1, Number(query.limit) || 20);
    const skip = (page - 1) * limit;

    const filter: any = {};
    if (query.search) {
      filter.$or = [
        { name: { $regex: query.search, $options: 'i' } },
        { admissionNumber: { $regex: query.search, $options: 'i' } }
      ];
    }
    if (query.status) {
      filter.status = query.status;
    }

    // If filtered by classId, find enrolled students first
    if (query.classId) {
      const enrollments = await Enrollment.find({
        classId: query.classId,
        status: 'enrolled'
      }).select('studentId');
      const studentIds = enrollments.map(e => e.studentId);
      filter._id = { $in: studentIds };
    }

    const [students, total] = await Promise.all([
      Student.find(filter)
        .sort({ name: 1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Student.countDocuments(filter)
    ]);

    // Attach active enrollment details to each student
    const studentIds = students.map(s => s._id);
    const enrollments = await Enrollment.find({
      studentId: { $in: studentIds },
      status: 'enrolled'
    }).populate('classId', 'grade section').lean();

    const enrollmentMap = new Map();
    enrollments.forEach(e => {
      enrollmentMap.set(e.studentId.toString(), e.classId);
    });

    const enrichedStudents = students.map(s => ({
      ...s,
      currentClass: enrollmentMap.get(s._id.toString()) || null
    }));

    return {
      students: enrichedStudents,
      total,
      page,
      totalPages: Math.ceil(total / limit)
    };
  }

  public static async getStudentById(id: string) {
    const student = await Student.findById(id).lean();
    if (!student) {
      throw new NotFoundError('Student not found');
    }

    const [enrollment, parents] = await Promise.all([
      Enrollment.findOne({ studentId: id, status: 'enrolled' })
        .populate('classId', 'grade section academicYearId')
        .populate('academicYearId', 'name')
        .lean(),
      ParentStudentLink.find({ studentId: id })
        .populate('parentUserId', 'name email phone')
        .lean()
    ]);

    return {
      ...student,
      enrollment,
      parents
    };
  }

  public static async createStudent(input: CreateStudentInput, actorId: string) {
    const existing = await Student.findOne({ admissionNumber: input.admissionNumber });
    if (existing) {
      throw new ConflictError(`Student with admission number ${input.admissionNumber} already exists`);
    }

    const targetClass = await ClassModel.findById(input.classId);
    if (!targetClass) {
      throw new BadRequestError('Specified Class ID does not exist');
    }

    const student = await Student.create({
      admissionNumber: input.admissionNumber,
      name: input.name,
      dateOfBirth: input.dateOfBirth,
      gender: input.gender,
      status: input.status || 'active'
    });

    // Create active enrollment
    await Enrollment.create({
      studentId: student._id,
      classId: targetClass._id,
      academicYearId: targetClass.academicYearId,
      startDate: new Date().toISOString().split('T')[0],
      status: 'enrolled'
    });

    await AuditService.log(actorId, 'STUDENT_CREATED', 'Student', student._id.toString(), undefined, {
      admissionNumber: student.admissionNumber,
      name: student.name,
      classId: input.classId
    });

    return student;
  }

  public static async updateStudent(id: string, updates: any, actorId: string) {
    const student = await Student.findById(id);
    if (!student) {
      throw new NotFoundError('Student not found');
    }

    const before = student.toObject();
    Object.assign(student, updates);
    await student.save();

    await AuditService.log(actorId, 'STUDENT_UPDATED', 'Student', id, before, student.toObject());
    return student;
  }

  public static async linkParent(
    studentId: string,
    data: { parentUserId: string; relationship: string; verificationStatus?: string },
    actorId: string
  ) {
    const student = await Student.findById(studentId);
    if (!student) {
      throw new NotFoundError('Student not found');
    }

    const link = await ParentStudentLink.findOneAndUpdate(
      { studentId, parentUserId: data.parentUserId },
      {
        studentId,
        parentUserId: data.parentUserId,
        relationship: data.relationship,
        verificationStatus: data.verificationStatus || 'verified',
        verifiedAt: new Date()
      },
      { upsert: true, new: true }
    );

    await AuditService.log(actorId, 'PARENT_STUDENT_LINKED', 'ParentStudentLink', link._id.toString());
    return link;
  }
}
