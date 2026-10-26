import mongoose, { Document, Schema } from 'mongoose';
import { AttendancePolicy, NotificationSettings, ReportingSettings } from '@school/shared-types';

export interface ISchoolSettingsDocument extends Document {
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
  createdAt: Date;
  updatedAt: Date;
}

const schoolSettingsSchema = new Schema<ISchoolSettingsDocument>(
  {
    schoolName: {
      type: String,
      required: true,
      default: 'Oakwood International Academy'
    },
    schoolCode: {
      type: String,
      required: true,
      default: 'OIA-2026'
    },
    timezone: {
      type: String,
      required: true,
      default: 'America/New_York'
    },
    attendancePolicy: {
      minimumRequiredPercentage: { type: Number, default: 85 },
      lateCountsAsFraction: { type: Number, default: 0.5 },
      excusedCountsAsPresent: { type: Boolean, default: true },
      consecutiveAbsenceAlertThreshold: { type: Number, default: 3 },
      autoCloseDraftHours: { type: Number, default: 24 },
      allowTeacherCorrectionsWithinDays: { type: Number, default: 2 }
    },
    notificationSettings: {
      enablePushNotifications: { type: Boolean, default: true },
      enableEmailNotifications: { type: Boolean, default: true },
      absenceAlertTime: { type: String, default: '10:30' },
      dailyDigestEnabled: { type: Boolean, default: true }
    },
    reportingSettings: {
      academicStartMonth: { type: Number, default: 9 }, // September
      weekStartsOn: { type: Number, default: 1 } // Monday
    },
    holidays: [
      {
        name: { type: String, required: true },
        date: { type: String, required: true }
      }
    ]
  },
  {
    timestamps: true
  }
);

export const SchoolSettings = mongoose.model<ISchoolSettingsDocument>(
  'SchoolSettings',
  schoolSettingsSchema
);
