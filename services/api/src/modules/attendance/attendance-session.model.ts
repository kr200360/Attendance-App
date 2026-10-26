import mongoose, { Document, Schema } from 'mongoose';
import { AttendanceSessionStatus } from '@school/shared-types';

export interface IAttendanceSessionDocument extends Document {
  classId: mongoose.Types.ObjectId;
  subjectId?: mongoose.Types.ObjectId;
  date: string; // YYYY-MM-DD
  period: number;
  markedBy: mongoose.Types.ObjectId;
  status: AttendanceSessionStatus;
  submittedAt?: Date;
  correctionReason?: string;
  createdAt: Date;
  updatedAt: Date;
}

const attendanceSessionSchema = new Schema<IAttendanceSessionDocument>(
  {
    classId: {
      type: Schema.Types.ObjectId,
      ref: 'Class',
      required: true,
      index: true
    },
    subjectId: {
      type: Schema.Types.ObjectId,
      ref: 'Subject',
      index: true
    },
    date: {
      type: String,
      required: true,
      index: true
    },
    period: {
      type: Number,
      required: true,
      default: 1
    },
    markedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true
    },
    status: {
      type: String,
      enum: ['draft', 'submitted', 'corrected'],
      default: 'draft',
      index: true
    },
    submittedAt: {
      type: Date
    },
    correctionReason: {
      type: String
    }
  },
  {
    timestamps: true
  }
);

// Enforce single session per class, date, period (and subject if applicable)
attendanceSessionSchema.index(
  { classId: 1, date: 1, period: 1, subjectId: 1 },
  { unique: true }
);

export const AttendanceSession = mongoose.model<IAttendanceSessionDocument>(
  'AttendanceSession',
  attendanceSessionSchema
);
