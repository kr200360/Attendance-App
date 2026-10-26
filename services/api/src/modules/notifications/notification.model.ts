import mongoose, { Document, Schema } from 'mongoose';
import { NotificationType, DeliveryStatus } from '@school/shared-types';

export interface INotificationDocument extends Document {
  recipientUserId: mongoose.Types.ObjectId;
  studentId?: mongoose.Types.ObjectId;
  type: NotificationType;
  title: string;
  message: string;
  deliveryStatus: DeliveryStatus;
  deliveredAt?: Date;
  readAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const notificationSchema = new Schema<INotificationDocument>(
  {
    recipientUserId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true
    },
    studentId: {
      type: Schema.Types.ObjectId,
      ref: 'Student',
      index: true
    },
    type: {
      type: String,
      enum: ['absence', 'leave_update', 'announcement', 'system'],
      required: true,
      index: true
    },
    title: {
      type: String,
      required: true,
      trim: true
    },
    message: {
      type: String,
      required: true,
      trim: true
    },
    deliveryStatus: {
      type: String,
      enum: ['pending', 'delivered', 'failed', 'read'],
      default: 'delivered',
      index: true
    },
    deliveredAt: {
      type: Date,
      default: Date.now
    },
    readAt: {
      type: Date
    }
  },
  {
    timestamps: true
  }
);

notificationSchema.index({ recipientUserId: 1, createdAt: -1 });

export const Notification = mongoose.model<INotificationDocument>('Notification', notificationSchema);
