import mongoose, { Document, Schema } from 'mongoose';
import { AcademicYearStatus } from '@school/shared-types';

export interface IAcademicYearDocument extends Document {
  name: string;
  startDate: string;
  endDate: string;
  status: AcademicYearStatus;
  createdAt: Date;
  updatedAt: Date;
}

const academicYearSchema = new Schema<IAcademicYearDocument>(
  {
    name: { type: String, required: true, unique: true, trim: true },
    startDate: { type: String, required: true },
    endDate: { type: String, required: true },
    status: {
      type: String,
      enum: ['active', 'upcoming', 'completed'],
      default: 'active',
      index: true
    }
  },
  {
    timestamps: true
  }
);

export const AcademicYear = mongoose.model<IAcademicYearDocument>('AcademicYear', academicYearSchema);
