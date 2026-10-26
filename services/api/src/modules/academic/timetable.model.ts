import mongoose, { Document, Schema } from 'mongoose';

export interface ITimetablePeriodDocument extends Document {
  classId: mongoose.Types.ObjectId;
  subjectId?: mongoose.Types.ObjectId;
  teacherId: mongoose.Types.ObjectId;
  dayOfWeek: number;
  periodNumber: number;
  startTime: string;
  endTime: string;
  createdAt: Date;
  updatedAt: Date;
}

const timetablePeriodSchema = new Schema<ITimetablePeriodDocument>(
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
    teacherId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true
    },
    dayOfWeek: {
      type: Number,
      required: true,
      min: 1,
      max: 7
    },
    periodNumber: {
      type: Number,
      required: true,
      min: 1,
      max: 12
    },
    startTime: {
      type: String,
      required: true
    },
    endTime: {
      type: String,
      required: true
    }
  },
  {
    timestamps: true
  }
);

timetablePeriodSchema.index({ classId: 1, dayOfWeek: 1, periodNumber: 1 }, { unique: true });

export const TimetablePeriod = mongoose.model<ITimetablePeriodDocument>(
  'TimetablePeriod',
  timetablePeriodSchema
);
