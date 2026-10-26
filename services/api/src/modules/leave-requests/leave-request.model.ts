import mongoose, { Document, Schema } from 'mongoose';
import { LeaveStatus } from '@school/shared-types';

export interface ILeaveRequestDocument extends Document {
  studentId: mongoose.Types.ObjectId;
  parentUserId: mongoose.Types.ObjectId;
  startDate: string;
  endDate: string;
  reason: string;
  status: LeaveStatus;
  reviewedBy?: mongoose.Types.ObjectId;
  reviewedAt?: Date;
  remarks?: string;
  createdAt: Date;
  updatedAt: Date;
}

const leaveRequestSchema = new Schema<ILeaveRequestDocument>(
  {
    studentId: {
      type: Schema.Types.ObjectId,
      ref: 'Student',
      required: true,
      index: true
    },
    parentUserId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true
    },
    startDate: {
      type: String,
      required: true
    },
    endDate: {
      type: String,
      required: true
    },
    reason: {
      type: String,
      required: true,
      trim: true
    },
    status: {
      type: String,
      enum: ['pending', 'approved', 'rejected'],
      default: 'pending',
      index: true
    },
    reviewedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User'
    },
    reviewedAt: {
      type: Date
    },
    remarks: {
      type: String
    }
  },
  {
    timestamps: true
  }
);

leaveRequestSchema.index({ studentId: 1, startDate: 1, endDate: 1 });

export const LeaveRequest = mongoose.model<ILeaveRequestDocument>('LeaveRequest', leaveRequestSchema);
