import mongoose, { Document, Schema } from 'mongoose';
import { EnrollmentStatus } from '@school/shared-types';

export interface IEnrollmentDocument extends Document {
  studentId: mongoose.Types.ObjectId;
  classId: mongoose.Types.ObjectId;
  academicYearId: mongoose.Types.ObjectId;
  startDate: string;
  endDate?: string;
  status: EnrollmentStatus;
  rollNumber?: number;
  createdAt: Date;
  updatedAt: Date;
}

const enrollmentSchema = new Schema<IEnrollmentDocument>(
  {
    studentId: {
      type: Schema.Types.ObjectId,
      ref: 'Student',
      required: true,
      index: true
    },
    classId: {
      type: Schema.Types.ObjectId,
      ref: 'Class',
      required: true,
      index: true
    },
    academicYearId: {
      type: Schema.Types.ObjectId,
      ref: 'AcademicYear',
      required: true,
      index: true
    },
    startDate: {
      type: String,
      required: true
    },
    endDate: {
      type: String
    },
    status: {
      type: String,
      enum: ['enrolled', 'transferred', 'withdrawn', 'graduated'],
      default: 'enrolled',
      index: true
    },
    rollNumber: {
      type: Number
    }
  },
  {
    timestamps: true
  }
);

enrollmentSchema.index({ studentId: 1, classId: 1, academicYearId: 1 }, { unique: true });

export const Enrollment = mongoose.model<IEnrollmentDocument>('Enrollment', enrollmentSchema);
