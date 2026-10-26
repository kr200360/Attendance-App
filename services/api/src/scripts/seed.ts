import bcrypt from 'bcryptjs';
import { connectDatabase, disconnectDatabase } from '../config/database';
import { User } from '../modules/users/user.model';
import { Student } from '../modules/students/student.model';
import { ParentStudentLink } from '../modules/parents/parent-student-link.model';
import { AcademicYear } from '../modules/academic/academic-year.model';
import { ClassModel } from '../modules/academic/class.model';
import { Subject } from '../modules/academic/subject.model';
import { Enrollment } from '../modules/academic/enrollment.model';
import { TeacherAssignment } from '../modules/academic/teacher-assignment.model';
import { TimetablePeriod } from '../modules/academic/timetable.model';
import { AttendanceSession } from '../modules/attendance/attendance-session.model';
import { AttendanceRecord } from '../modules/attendance/attendance-record.model';
import { LeaveRequest } from '../modules/leave-requests/leave-request.model';
import { Notification } from '../modules/notifications/notification.model';
import { SchoolSettings } from '../modules/settings/school-settings.model';
import { logger } from '../shared/logger';

export async function seedDatabase() {
  await connectDatabase();
  logger.info('Clearing existing collections for clean seed...');

  await Promise.all([
    User.deleteMany({}),
    Student.deleteMany({}),
    ParentStudentLink.deleteMany({}),
    AcademicYear.deleteMany({}),
    ClassModel.deleteMany({}),
    Subject.deleteMany({}),
    Enrollment.deleteMany({}),
    TeacherAssignment.deleteMany({}),
    TimetablePeriod.deleteMany({}),
    AttendanceSession.deleteMany({}),
    AttendanceRecord.deleteMany({}),
    LeaveRequest.deleteMany({}),
    Notification.deleteMany({}),
    SchoolSettings.deleteMany({})
  ]);

  logger.info('Creating School Settings...');
  await SchoolSettings.create({
    schoolName: 'Oakwood International Academy',
    schoolCode: 'OIA-2026',
    timezone: 'America/New_York',
    attendancePolicy: {
      minimumRequiredPercentage: 85,
      lateCountsAsFraction: 0.5,
      excusedCountsAsPresent: true,
      consecutiveAbsenceAlertThreshold: 3,
      autoCloseDraftHours: 24,
      allowTeacherCorrectionsWithinDays: 3
    },
    notificationSettings: {
      enablePushNotifications: true,
      enableEmailNotifications: true,
      absenceAlertTime: '10:00',
      dailyDigestEnabled: true
    },
    reportingSettings: {
      academicStartMonth: 9,
      weekStartsOn: 1
    },
    holidays: [
      { name: 'Labor Day', date: '2026-09-07' },
      { name: 'Thanksgiving', date: '2026-11-26' }
    ]
  });

  logger.info('Creating Users...');
  const salt = await bcrypt.genSalt(10);
  const adminPass = await bcrypt.hash('Admin123!', salt);
  const teacherPass = await bcrypt.hash('Teacher123!', salt);
  const parentPass = await bcrypt.hash('Parent123!', salt);

  const admin = await User.create({
    name: 'Dr. Arthur Pendelton',
    email: 'admin@school.edu',
    passwordHash: adminPass,
    role: 'admin',
    phone: '+1-555-0100',
    isActive: true
  });

  const teacher1 = await User.create({
    name: 'Sarah Jenkins',
    email: 'sarah.jenkins@school.edu',
    passwordHash: teacherPass,
    role: 'teacher',
    phone: '+1-555-0101',
    isActive: true
  });

  const teacher2 = await User.create({
    name: 'Marcus Vance',
    email: 'marcus.vance@school.edu',
    passwordHash: teacherPass,
    role: 'teacher',
    phone: '+1-555-0102',
    isActive: true
  });

  const parent1 = await User.create({
    name: 'John Watson',
    email: 'john.watson@parent.edu',
    passwordHash: parentPass,
    role: 'parent',
    phone: '+1-555-0103',
    isActive: true
  });

  const parent2 = await User.create({
    name: 'Maria Garcia',
    email: 'maria.garcia@parent.edu',
    passwordHash: parentPass,
    role: 'parent',
    phone: '+1-555-0104',
    isActive: true
  });

  logger.info('Creating Academic Year & Subjects...');
  const academicYear = await AcademicYear.create({
    name: '2026-2027 Academic Year',
    startDate: '2026-09-01',
    endDate: '2027-06-30',
    status: 'active'
  });

  const math = await Subject.create({ name: 'Mathematics', code: 'MATH101' });
  const science = await Subject.create({ name: 'Science & Biology', code: 'SCI101' });
  const english = await Subject.create({ name: 'English Literature', code: 'ENG101' });
  const history = await Subject.create({ name: 'World History', code: 'HIST101' });

  logger.info('Creating Classes...');
  const classA = await ClassModel.create({
    grade: 'Grade 10',
    section: 'A',
    academicYearId: academicYear._id,
    classTeacherId: teacher1._id,
    status: 'active'
  });

  const classB = await ClassModel.create({
    grade: 'Grade 10',
    section: 'B',
    academicYearId: academicYear._id,
    classTeacherId: teacher2._id,
    status: 'active'
  });

  logger.info('Assigning Teachers...');
  await TeacherAssignment.create({
    teacherId: teacher1._id,
    classId: classA._id,
    subjectId: math._id,
    academicYearId: academicYear._id
  });

  await TeacherAssignment.create({
    teacherId: teacher2._id,
    classId: classB._id,
    subjectId: science._id,
    academicYearId: academicYear._id
  });

  logger.info('Creating Timetable...');
  await TimetablePeriod.create([
    {
      classId: classA._id,
      subjectId: math._id,
      teacherId: teacher1._id,
      dayOfWeek: 1, // Mon
      periodNumber: 1,
      startTime: '08:30',
      endTime: '09:20'
    },
    {
      classId: classA._id,
      subjectId: english._id,
      teacherId: teacher1._id,
      dayOfWeek: 1,
      periodNumber: 2,
      startTime: '09:25',
      endTime: '10:15'
    },
    {
      classId: classB._id,
      subjectId: science._id,
      teacherId: teacher2._id,
      dayOfWeek: 1,
      periodNumber: 1,
      startTime: '08:30',
      endTime: '09:20'
    }
  ]);

  logger.info('Registering Students & Enrollments...');
  const studentData = [
    { admissionNumber: 'STU-1001', name: 'Emma Watson', gender: 'female' as const, dateOfBirth: '2010-04-15', class: classA, roll: 1 },
    { admissionNumber: 'STU-1002', name: 'Liam Johnson', gender: 'male' as const, dateOfBirth: '2010-06-20', class: classA, roll: 2 },
    { admissionNumber: 'STU-1003', name: 'Sophia Garcia', gender: 'female' as const, dateOfBirth: '2010-01-11', class: classA, roll: 3 },
    { admissionNumber: 'STU-1004', name: 'Noah Brown', gender: 'male' as const, dateOfBirth: '2010-09-05', class: classA, roll: 4 },
    { admissionNumber: 'STU-1005', name: 'Olivia Davis', gender: 'female' as const, dateOfBirth: '2010-03-30', class: classA, roll: 5 },
    { admissionNumber: 'STU-1006', name: 'Ethan Martinez', gender: 'male' as const, dateOfBirth: '2010-11-14', class: classB, roll: 1 },
    { admissionNumber: 'STU-1007', name: 'Ava Wilson', gender: 'female' as const, dateOfBirth: '2010-08-22', class: classB, roll: 2 },
    { admissionNumber: 'STU-1008', name: 'Mason Anderson', gender: 'male' as const, dateOfBirth: '2010-05-18', class: classB, roll: 3 },
    { admissionNumber: 'STU-1009', name: 'Isabella Thomas', gender: 'female' as const, dateOfBirth: '2010-07-09', class: classB, roll: 4 },
    { admissionNumber: 'STU-1010', name: 'Lucas Jackson', gender: 'male' as const, dateOfBirth: '2010-12-03', class: classB, roll: 5 }
  ];

  const createdStudents = [];
  for (const s of studentData) {
    const student = await Student.create({
      admissionNumber: s.admissionNumber,
      name: s.name,
      gender: s.gender,
      dateOfBirth: s.dateOfBirth,
      status: 'active'
    });

    await Enrollment.create({
      studentId: student._id,
      classId: s.class._id,
      academicYearId: academicYear._id,
      startDate: '2026-09-01',
      rollNumber: s.roll,
      status: 'enrolled'
    });

    createdStudents.push({ ...student.toObject(), classId: s.class._id });
  }

  logger.info('Linking Parents to Students...');
  // John Watson -> Emma Watson (Father)
  await ParentStudentLink.create({
    parentUserId: parent1._id,
    studentId: createdStudents[0]._id,
    relationship: 'father',
    verificationStatus: 'verified',
    verifiedAt: new Date()
  });

  // Maria Garcia -> Sophia Garcia (Mother)
  await ParentStudentLink.create({
    parentUserId: parent2._id,
    studentId: createdStudents[2]._id,
    relationship: 'mother',
    verificationStatus: 'verified',
    verifiedAt: new Date()
  });

  logger.info('Seeding Historical Attendance Sessions & Records...');
  // 3 past days attendance for Class A
  const dates = ['2026-10-22', '2026-10-23', '2026-10-24'];
  const classAStudents = createdStudents.filter(s => s.classId.toString() === classA._id.toString());

  for (const date of dates) {
    const session = await AttendanceSession.create({
      classId: classA._id,
      subjectId: math._id,
      date,
      period: 1,
      markedBy: teacher1._id,
      status: 'submitted',
      submittedAt: new Date(`${date}T09:30:00Z`)
    });

    for (let i = 0; i < classAStudents.length; i++) {
      let status: 'present' | 'absent' | 'late' | 'excused' = 'present';
      let remarks: string | undefined = undefined;

      // Sophia Garcia has absences on 22 and 24 to trigger low attendance alert
      if (i === 2 && (date === '2026-10-22' || date === '2026-10-24')) {
        status = 'absent';
        remarks = 'Unexcused absence';
      } else if (i === 1 && date === '2026-10-23') {
        status = 'late';
        remarks = 'Bus delay';
      }

      await AttendanceRecord.create({
        sessionId: session._id,
        studentId: classAStudents[i]._id,
        status,
        updatedBy: teacher1._id,
        markedAt: new Date(`${date}T09:25:00Z`),
        remarks
      });
    }
  }

  logger.info('Creating Sample Leave Request & Notification...');
  await LeaveRequest.create({
    studentId: createdStudents[0]._id, // Emma Watson
    parentUserId: parent1._id,
    startDate: '2026-10-30',
    endDate: '2026-10-31',
    reason: 'Family medical visit out of town',
    status: 'pending'
  });

  await Notification.create({
    recipientUserId: parent2._id,
    studentId: createdStudents[2]._id,
    type: 'absence',
    title: 'Absence Alert',
    message: 'Notice: Sophia Garcia was marked absent for Period 1 on 2026-10-24. Please contact the school office if you have any questions.',
    deliveryStatus: 'delivered',
    deliveredAt: new Date()
  });

  logger.info('Database seeded successfully!');
  logger.info('--------------------------------------------------');
  logger.info('Credentials:');
  logger.info('Admin:   admin@school.edu / Admin123!');
  logger.info('Teacher: sarah.jenkins@school.edu / Teacher123!');
  logger.info('Teacher: marcus.vance@school.edu / Teacher123!');
  logger.info('Parent:  john.watson@parent.edu / Parent123!');
  logger.info('Parent:  maria.garcia@parent.edu / Parent123!');
  logger.info('--------------------------------------------------');
}

if (require.main === module) {
  seedDatabase()
    .then(() => disconnectDatabase())
    .catch(err => {
      console.error('Seed error:', err);
      process.exit(1);
    });
}
