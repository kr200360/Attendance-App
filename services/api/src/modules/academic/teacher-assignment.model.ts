import mongoose, { Document, Schema } from 'mongoose';

export interface ITeacherAssignmentDocument extends Document {
  teacherId: mongoose.Types.ObjectId;
  classId: mongoose.Types.ObjectId;
  subjectId?: mongoose.Types.ObjectId;
  academicYearId: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const teacherAssignmentSchema = new Schema<ITeacherAssignmentDocument>(
  {
    teacherId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true
    },
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
    academicYearId: {
      type: Schema.Types.ObjectId,
      ref: 'AcademicYear',
      required: true,
      index: true
    }
  },
  {
    timestamps: true
  }
);

teacherAssignmentSchema.index(
  { teacherId: 1, classId: 1, subjectId: 1, academicYearId: 1 },
  { unique: true }
);

export const TeacherAssignment = mongoose.model<ITeacherAssignmentDocument>(
  'TeacherAssignment',
  teacherAssignmentSchema
);
