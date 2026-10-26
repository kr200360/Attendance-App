import mongoose, { Document, Schema } from 'mongoose';
import { ClassStatus } from '@school/shared-types';

export interface IClassDocument extends Document {
  grade: string;
  section: string;
  academicYearId: mongoose.Types.ObjectId;
  classTeacherId?: mongoose.Types.ObjectId;
  status: ClassStatus;
  createdAt: Date;
  updatedAt: Date;
}

const classSchema = new Schema<IClassDocument>(
  {
    grade: { type: String, required: true, trim: true },
    section: { type: String, required: true, trim: true },
    academicYearId: {
      type: Schema.Types.ObjectId,
      ref: 'AcademicYear',
      required: true,
      index: true
    },
    classTeacherId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      index: true
    },
    status: {
      type: String,
      enum: ['active', 'archived'],
      default: 'active',
      index: true
    }
  },
  {
    timestamps: true
  }
);

classSchema.index({ grade: 1, section: 1, academicYearId: 1 }, { unique: true });

export const ClassModel = mongoose.model<IClassDocument>('Class', classSchema);
