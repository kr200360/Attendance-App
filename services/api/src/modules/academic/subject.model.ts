import mongoose, { Document, Schema } from 'mongoose';

export interface ISubjectDocument extends Document {
  name: string;
  code: string;
  description?: string;
  createdAt: Date;
  updatedAt: Date;
}

const subjectSchema = new Schema<ISubjectDocument>(
  {
    name: { type: String, required: true, trim: true },
    code: { type: String, required: true, unique: true, uppercase: true, trim: true, index: true },
    description: { type: String, trim: true }
  },
  {
    timestamps: true
  }
);

export const Subject = mongoose.model<ISubjectDocument>('Subject', subjectSchema);
