import { describe, it, before, after } from 'node:test';
import assert from 'node:assert';
import request from 'supertest';
import app from '../app';
import { connectDatabase, disconnectDatabase } from '../config/database';
import { User } from '../modules/users/user.model';
import { Student } from '../modules/students/student.model';
import { ParentStudentLink } from '../modules/parents/parent-student-link.model';
import { ClassModel } from '../modules/academic/class.model';
import { AcademicYear } from '../modules/academic/academic-year.model';
import { Enrollment } from '../modules/academic/enrollment.model';
import { TeacherAssignment } from '../modules/academic/teacher-assignment.model';
import { AttendanceSession } from '../modules/attendance/attendance-session.model';
import { AttendanceRecord } from '../modules/attendance/attendance-record.model';
import { Notification } from '../modules/notifications/notification.model';
import { AuditLog } from '../modules/audit/audit-log.model';
import bcrypt from 'bcryptjs';

describe('End-to-End Attendance & RBAC Lifecycle', () => {
  let adminToken: string;
  let teacherToken: string;
  let unauthorizedTeacherToken: string;
  let parentToken: string;
  let parentUserId: string;

  let academicYearId: string;
  let classId: string;
  let student1Id: string;
  let student2Id: string;
  let sessionId: string;

  before(async () => {
    await connectDatabase();

    // Clean tables
    await Promise.all([
      User.deleteMany({}),
      Student.deleteMany({}),
      ParentStudentLink.deleteMany({}),
      ClassModel.deleteMany({}),
      AcademicYear.deleteMany({}),
      Enrollment.deleteMany({}),
      TeacherAssignment.deleteMany({}),
      AttendanceSession.deleteMany({}),
      AttendanceRecord.deleteMany({}),
      Notification.deleteMany({}),
      AuditLog.deleteMany({})
    ]);

    const salt = await bcrypt.genSalt(10);
    const pass = await bcrypt.hash('TestPass123!', salt);

    // Create users
    const [admin, teacher, otherTeacher, parent] = await User.create([
      { name: 'Admin Boss', email: 'admin@e2e.com', passwordHash: pass, role: 'admin', isActive: true },
      { name: 'Assigned Teacher', email: 'assigned@e2e.com', passwordHash: pass, role: 'teacher', isActive: true },
      { name: 'Other Teacher', email: 'other@e2e.com', passwordHash: pass, role: 'teacher', isActive: true },
      { name: 'Parent Watson', email: 'parent@e2e.com', passwordHash: pass, role: 'parent', isActive: true }
    ]);

    parentUserId = parent._id.toString();

    // Get tokens
    const adminLogin = await request(app).post('/api/v1/auth/login').send({ email: 'admin@e2e.com', password: 'TestPass123!' });
    adminToken = adminLogin.body.data.accessToken;

    const teacherLogin = await request(app).post('/api/v1/auth/login').send({ email: 'assigned@e2e.com', password: 'TestPass123!' });
    teacherToken = teacherLogin.body.data.accessToken;

    const otherLogin = await request(app).post('/api/v1/auth/login').send({ email: 'other@e2e.com', password: 'TestPass123!' });
    unauthorizedTeacherToken = otherLogin.body.data.accessToken;

    const parentLogin = await request(app).post('/api/v1/auth/login').send({ email: 'parent@e2e.com', password: 'TestPass123!' });
    parentToken = parentLogin.body.data.accessToken;
  });

  after(async () => {
    await disconnectDatabase();
  });

  it('Step 1: Admin creates academic year, class, and registers students', async () => {
    // Create Academic Year
    const yearRes = await request(app)
      .post('/api/v1/academic-years')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ name: '2026-2027', startDate: '2026-09-01', endDate: '2027-06-30' });
    assert.strictEqual(yearRes.status, 201);
    academicYearId = yearRes.body.data._id;

    // Create Class
    const classRes = await request(app)
      .post('/api/v1/classes')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ grade: 'Grade 10', section: 'A', academicYearId });
    assert.strictEqual(classRes.status, 201);
    classId = classRes.body.data._id;

    // Create Student 1 & 2
    const s1Res = await request(app)
      .post('/api/v1/students')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ admissionNumber: 'E2E-001', name: 'Alice Watson', classId });
    assert.strictEqual(s1Res.status, 201);
    student1Id = s1Res.body.data._id;

    const s2Res = await request(app)
      .post('/api/v1/students')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ admissionNumber: 'E2E-002', name: 'Bob Dylan', classId });
    assert.strictEqual(s2Res.status, 201);
    student2Id = s2Res.body.data._id;

    // Link Parent to Alice Watson
    const linkRes = await request(app)
      .post(`/api/v1/students/${student1Id}/parent-links`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ parentUserId, relationship: 'father', verificationStatus: 'verified' });
    assert.strictEqual(linkRes.status, 201);
  });

  it('Step 2: Admin assigns teacher to class', async () => {
    const teacherUser = await User.findOne({ email: 'assigned@e2e.com' });
    const assignRes = await request(app)
      .post('/api/v1/teacher-assignments')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        teacherId: teacherUser!._id.toString(),
        classId,
        academicYearId
      });
    assert.strictEqual(assignRes.status, 201);
  });

  it('Step 3: Unauthorized teacher is blocked from accessing the class roster', async () => {
    const res = await request(app)
      .get(`/api/v1/classes/${classId}/roster`)
      .set('Authorization', `Bearer ${unauthorizedTeacherToken}`);

    assert.strictEqual(res.status, 403);
  });

  it('Step 4: Assigned teacher fetches class roster successfully', async () => {
    const res = await request(app)
      .get(`/api/v1/classes/${classId}/roster`)
      .set('Authorization', `Bearer ${teacherToken}`);

    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.body.data.students.length, 2);
  });

  it('Step 5: Teacher creates attendance session and marks attendance', async () => {
    const sessionRes = await request(app)
      .post('/api/v1/attendance/sessions')
      .set('Authorization', `Bearer ${teacherToken}`)
      .send({ classId, date: '2026-10-26', period: 1 });

    assert.strictEqual(sessionRes.status, 200);
    sessionId = sessionRes.body.data.session._id;
    assert.ok(sessionId);

    // Save Draft records (Alice present, Bob absent)
    const draftRes = await request(app)
      .put(`/api/v1/attendance/sessions/${sessionId}/records`)
      .set('Authorization', `Bearer ${teacherToken}`)
      .send({
        records: [
          { studentId: student1Id, status: 'present' },
          { studentId: student2Id, status: 'absent', remarks: 'Unexcused' }
        ]
      });

    assert.strictEqual(draftRes.status, 200);
  });

  it('Step 6: Teacher submits attendance; triggers absence notification', async () => {
    const submitRes = await request(app)
      .post(`/api/v1/attendance/sessions/${sessionId}/submit`)
      .set('Authorization', `Bearer ${teacherToken}`)
      .send({
        records: [
          { studentId: student1Id, status: 'present' },
          { studentId: student2Id, status: 'absent', remarks: 'Unexcused' }
        ]
      });

    assert.strictEqual(submitRes.status, 200);
    assert.strictEqual(submitRes.body.data.session.status, 'submitted');

    // Duplicate submission should be rejected
    const retryRes = await request(app)
      .post(`/api/v1/attendance/sessions/${sessionId}/submit`)
      .set('Authorization', `Bearer ${teacherToken}`)
      .send({ records: [{ studentId: student1Id, status: 'present' }] });

    assert.strictEqual(retryRes.status, 409);
  });

  it('Step 7: Parent can view only their verified child attendance', async () => {
    // Parent views Alice Watson's attendance
    const aliceAtt = await request(app)
      .get(`/api/v1/attendance/students/${student1Id}/attendance`)
      .set('Authorization', `Bearer ${parentToken}`);

    assert.strictEqual(aliceAtt.status, 200);
    assert.strictEqual(aliceAtt.body.data.records.length, 1);
    assert.strictEqual(aliceAtt.body.data.records[0].status, 'present');

    // Parent attempts to view Bob Dylan's attendance (must be FORBIDDEN 403)
    const bobAtt = await request(app)
      .get(`/api/v1/attendance/students/${student2Id}/attendance`)
      .set('Authorization', `Bearer ${parentToken}`);

    assert.strictEqual(bobAtt.status, 403);
  });

  it('Step 8: Teacher submits authorized correction and audit log is recorded', async () => {
    const correctionRes = await request(app)
      .post(`/api/v1/attendance/sessions/${sessionId}/correction-requests`)
      .set('Authorization', `Bearer ${teacherToken}`)
      .send({
        reason: 'Student arrived late after bus delay',
        records: [
          { studentId: student2Id, status: 'late', remarks: 'Bus breakdown' }
        ]
      });

    assert.strictEqual(correctionRes.status, 200);
    assert.strictEqual(correctionRes.body.data.session.status, 'corrected');

    // Check audit log
    const auditRes = await request(app)
      .get('/api/v1/admin/audit-logs')
      .set('Authorization', `Bearer ${adminToken}`);

    assert.strictEqual(auditRes.status, 200);
    const hasCorrectionLog = auditRes.body.data.some((l: any) => l.action === 'ATTENDANCE_CORRECTED');
    assert.strictEqual(hasCorrectionLog, true);
  });

  it('Step 9: Reports calculate attendance and CSV exports properly', async () => {
    const reportRes = await request(app)
      .get('/api/v1/reports/attendance/daily?date=2026-10-26')
      .set('Authorization', `Bearer ${adminToken}`);

    assert.strictEqual(reportRes.status, 200);
    assert.strictEqual(reportRes.body.data.classBreakdown.length, 1);

    const exportRes = await request(app)
      .get('/api/v1/reports/attendance/export?date=2026-10-26')
      .set('Authorization', `Bearer ${adminToken}`);

    assert.strictEqual(exportRes.status, 200);
    assert.ok(exportRes.text.includes('Grade 10 - A'));
  });
});
