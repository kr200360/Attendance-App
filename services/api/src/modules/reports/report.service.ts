import { AttendanceSession } from '../attendance/attendance-session.model';
import { AttendanceRecord } from '../attendance/attendance-record.model';
import { ClassModel } from '../academic/class.model';
import { Enrollment } from '../academic/enrollment.model';
import { Student } from '../students/student.model';
import { SchoolSettings } from '../settings/school-settings.model';
import { stringify } from 'csv-stringify/sync';

export class ReportService {
  /**
   * Daily attendance report across all classes for a specific date
   */
  public static async getDailyReport(date: string) {
    const settings = await SchoolSettings.findOne();
    const lateFraction = settings?.attendancePolicy?.lateCountsAsFraction ?? 0.5;
    const excusedPresent = settings?.attendancePolicy?.excusedCountsAsPresent ?? true;

    const classes = await ClassModel.find({ status: 'active' }).sort({ grade: 1, section: 1 }).lean();

    let totalEnrolled = 0;
    let schoolPresent = 0;
    let schoolAbsent = 0;
    let schoolLate = 0;
    let schoolExcused = 0;

    const classBreakdown = [];

    for (const c of classes) {
      const enrollmentsCount = await Enrollment.countDocuments({ classId: c._id, status: 'enrolled' });
      totalEnrolled += enrollmentsCount;

      // Find submitted or draft session for this class on date
      const session = await AttendanceSession.findOne({ classId: c._id, date }).lean();

      if (!session) {
        classBreakdown.push({
          classId: c._id,
          grade: c.grade,
          section: c.section,
          total: enrollmentsCount,
          present: 0,
          absent: 0,
          late: 0,
          excused: 0,
          percentage: 0,
          sessionStatus: 'unmarked'
        });
        continue;
      }

      const records = await AttendanceRecord.find({ sessionId: session._id }).lean();
      let present = 0;
      let absent = 0;
      let late = 0;
      let excused = 0;

      records.forEach(r => {
        if (r.status === 'present') present++;
        else if (r.status === 'absent') absent++;
        else if (r.status === 'late') late++;
        else if (r.status === 'excused') excused++;
      });

      schoolPresent += present;
      schoolAbsent += absent;
      schoolLate += late;
      schoolExcused += excused;

      const totalRecorded = records.length;
      const effectivePresent = present + (late * lateFraction) + (excusedPresent ? excused : 0);
      const percentage = totalRecorded > 0 ? Math.round((effectivePresent / totalRecorded) * 100) : 0;

      classBreakdown.push({
        classId: c._id,
        grade: c.grade,
        section: c.section,
        total: enrollmentsCount,
        present,
        absent,
        late,
        excused,
        percentage,
        sessionStatus: session.status
      });
    }

    const totalSchoolRecorded = schoolPresent + schoolAbsent + schoolLate + schoolExcused;
    const effectiveSchoolPresent = schoolPresent + (schoolLate * lateFraction) + (excusedPresent ? schoolExcused : 0);
    const overallPercentage = totalSchoolRecorded > 0
      ? Math.round((effectiveSchoolPresent / totalSchoolRecorded) * 100)
      : 0;

    return {
      date,
      totalEnrolled,
      presentCount: schoolPresent,
      absentCount: schoolAbsent,
      lateCount: schoolLate,
      excusedCount: schoolExcused,
      attendancePercentage: overallPercentage,
      classBreakdown
    };
  }

  /**
   * Monthly attendance aggregation (day by day trend)
   */
  public static async getMonthlyReport(year: number, month: number, classId?: string) {
    const startStr = `${year}-${String(month).padStart(2, '0')}-01`;
    const lastDay = new Date(year, month, 0).getDate();
    const endStr = `${year}-${String(month).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`;

    const filter: any = {
      date: { $gte: startStr, $lte: endStr },
      status: { $in: ['submitted', 'corrected'] }
    };
    if (classId) filter.classId = classId;

    const sessions = await AttendanceSession.find(filter).lean();
    const sessionIds = sessions.map(s => s._id);

    const records = await AttendanceRecord.find({
      sessionId: { $in: sessionIds }
    }).populate('sessionId', 'date').lean();

    // Group by date
    const dailyMap = new Map<string, { present: number; absent: number; late: number; excused: number }>();

    records.forEach((r: any) => {
      const d = r.sessionId.date;
      if (!dailyMap.has(d)) {
        dailyMap.set(d, { present: 0, absent: 0, late: 0, excused: 0 });
      }
      const item = dailyMap.get(d)!;
      if (r.status === 'present') item.present++;
      else if (r.status === 'absent') item.absent++;
      else if (r.status === 'late') item.late++;
      else if (r.status === 'excused') item.excused++;
    });

    const days = [];
    for (const [date, counts] of Array.from(dailyMap.entries()).sort()) {
      const total = counts.present + counts.absent + counts.late + counts.excused;
      const pct = total > 0 ? Math.round(((counts.present + counts.late * 0.5 + counts.excused) / total) * 100) : 0;
      days.push({
        date,
        ...counts,
        total,
        percentage: pct
      });
    }

    return {
      year,
      month,
      days
    };
  }

  /**
   * Students below threshold
   */
  public static async getStudentsBelowThreshold(threshold?: number) {
    const settings = await SchoolSettings.findOne();
    const targetThreshold = threshold ?? settings?.attendancePolicy?.minimumRequiredPercentage ?? 85;

    const students = await Student.find({ status: 'active' }).lean();
    const belowList = [];

    for (const student of students) {
      const records = await AttendanceRecord.find({ studentId: student._id }).lean();
      if (records.length === 0) continue;

      let present = 0;
      let late = 0;
      let excused = 0;
      let absent = 0;

      records.forEach(r => {
        if (r.status === 'present') present++;
        else if (r.status === 'absent') absent++;
        else if (r.status === 'late') late++;
        else if (r.status === 'excused') excused++;
      });

      const effectivePresent = present + late * 0.5 + excused;
      const pct = Math.round((effectivePresent / records.length) * 100);

      if (pct < targetThreshold) {
        const enrollment = await Enrollment.findOne({ studentId: student._id, status: 'enrolled' })
          .populate('classId', 'grade section')
          .lean();

        belowList.push({
          studentId: student._id,
          admissionNumber: student.admissionNumber,
          name: student.name,
          class: enrollment?.classId || null,
          totalSessions: records.length,
          present,
          absent,
          late,
          percentage: pct,
          threshold: targetThreshold
        });
      }
    }

    return belowList;
  }

  /**
   * CSV export for attendance
   */
  public static async exportAttendanceCsv(date: string) {
    const dailyReport = await this.getDailyReport(date);

    const rows = dailyReport.classBreakdown.map(c => [
      dailyReport.date,
      `${c.grade} - ${c.section}`,
      c.total,
      c.present,
      c.absent,
      c.late,
      c.excused,
      `${c.percentage}%`,
      c.sessionStatus
    ]);

    const csvContent = stringify([
      ['Date', 'Class & Section', 'Enrolled', 'Present', 'Absent', 'Late', 'Excused', 'Percentage', 'Status'],
      ...rows
    ]);

    return csvContent;
  }
}
