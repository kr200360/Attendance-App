import mongoose, { Document, Schema } from 'mongoose';
import { AttendanceStatus } from '@school/shared-types';

export interface IAttendanceRecordDocument extends Document {
  sessionId: mongoose.Types.ObjectId;
  studentId: mongoose.Types.ObjectId;
  status: AttendanceStatus;
  markedAt: Date;
  updatedBy: mongoose.Types.ObjectId;
  remarks?: string;
}

const attendanceRecordSchema = new Schema<IAttendanceRecordDocument>(
  {
    sessionId: {
      type: Schema.Types.ObjectId,
      ref: 'AttendanceSession',
      required: true,
      index: true
    },
    studentId: {
      type: Schema.Types.ObjectId,
      ref: 'Student',
      required: true,
      index: true
    },
    status: {
      type: String,
      enum: ['present', 'absent', 'late', 'excused'],
      required: true,
      index: true
    },
    markedAt: {
      type: Date,
      default: Date.now
    },
    updatedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    remarks: {
      type: String,
      maxlength: 250
    }
  },
  {
    timestamps: true
  }
);

// Enforce single record per student per attendance session
attendanceRecordSchema.index({ sessionId: 1, studentId: 1 }, { unique: true });

export const AttendanceRecord = mongoose.model<IAttendanceRecordDocument>(
  'AttendanceRecord',
  attendanceRecordSchema
);
