import mongoose, { Document, Schema } from 'mongoose';
import { RelationshipType, VerificationStatus } from '@school/shared-types';

export interface IParentStudentLinkDocument extends Document {
  parentUserId: mongoose.Types.ObjectId;
  studentId: mongoose.Types.ObjectId;
  relationship: RelationshipType;
  verificationStatus: VerificationStatus;
  verifiedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const parentStudentLinkSchema = new Schema<IParentStudentLinkDocument>(
  {
    parentUserId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true
    },
    studentId: {
      type: Schema.Types.ObjectId,
      ref: 'Student',
      required: true,
      index: true
    },
    relationship: {
      type: String,
      enum: ['father', 'mother', 'guardian'],
      required: true
    },
    verificationStatus: {
      type: String,
      enum: ['pending', 'verified', 'rejected'],
      default: 'verified',
      index: true
    },
    verifiedAt: {
      type: Date,
      default: Date.now
    }
  },
  {
    timestamps: true
  }
);

// Prevent duplicate links between same parent and student
parentStudentLinkSchema.index({ parentUserId: 1, studentId: 1 }, { unique: true });

export const ParentStudentLink = mongoose.model<IParentStudentLinkDocument>(
  'ParentStudentLink',
  parentStudentLinkSchema
);
