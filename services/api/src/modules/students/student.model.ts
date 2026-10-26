import mongoose, { Document, Schema } from 'mongoose';
import { StudentStatus } from '@school/shared-types';

export interface IStudentDocument extends Document {
  admissionNumber: string;
  name: string;
  dateOfBirth?: string;
  gender?: 'male' | 'female' | 'other';
  status: StudentStatus;
  createdAt: Date;
  updatedAt: Date;
}

const studentSchema = new Schema<IStudentDocument>(
  {
    admissionNumber: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      index: true
    },
    name: {
      type: String,
      required: true,
      trim: true,
      index: true
    },
    dateOfBirth: {
      type: String, // YYYY-MM-DD
      trim: true
    },
    gender: {
      type: String,
      enum: ['male', 'female', 'other']
    },
    status: {
      type: String,
      enum: ['active', 'inactive', 'transferred', 'graduated'],
      default: 'active',
      index: true
    }
  },
  {
    timestamps: true
  }
);

export const Student = mongoose.model<IStudentDocument>('Student', studentSchema);
