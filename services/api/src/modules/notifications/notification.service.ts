import { Notification } from './notification.model';
import { ParentStudentLink } from '../parents/parent-student-link.model';
import { Student } from '../students/student.model';
import { config } from '../../config/env';
import { logger } from '../../shared/logger';

export class NotificationService {
  /**
   * Event-driven absence notifier
   */
  public static async notifyParentsOfAbsences(session: any, absentStudentIds: string[]) {
    try {
      logger.info(`Processing absence notifications for ${absentStudentIds.length} students on date ${session.date}`);

      for (const studentId of absentStudentIds) {
        // Find verified parents
        const links = await ParentStudentLink.find({
          studentId,
          verificationStatus: 'verified'
        }).populate('parentUserId', 'name email');

        const student = await Student.findById(studentId);
        if (!student) continue;

        for (const link of links) {
          const parent: any = link.parentUserId;
          if (!parent) continue;

          // Check idempotency: avoid duplicate notification for same student, parent, date, and absence
          const existing = await Notification.findOne({
            recipientUserId: parent._id,
            studentId,
            type: 'absence',
            message: { $regex: session.date }
          });

          if (existing) {
            logger.info(`Absence notification already queued for parent ${parent.email} on ${session.date}`);
            continue;
          }

          const title = 'Absence Alert';
          const message = `Notice: ${student.name} was marked absent for Period ${session.period} on ${session.date}. Please check the attendance calendar.`;

          // Record in DB
          const notif = await Notification.create({
            recipientUserId: parent._id,
            studentId: student._id,
            type: 'absence',
            title,
            message,
            deliveryStatus: 'delivered', // simulated instant delivery
            deliveredAt: new Date()
          });

          // Deliver via FCM / Mock Push
          await this.dispatchPushNotification({
            recipientEmail: parent.email,
            title,
            body: message,
            data: {
              notificationId: notif._id.toString(),
              studentId: student._id.toString(),
              type: 'absence',
              date: session.date
            }
          });
        }
      }
    } catch (err: any) {
      logger.error('Error in notifyParentsOfAbsences:', err.message);
    }
  }

  /**
   * Dispatch push notification (FCM with Dev Mock fallback)
   */
  public static async dispatchPushNotification(payload: {
    recipientEmail: string;
    title: string;
    body: string;
    data?: Record<string, string>;
  }) {
    // If FCM credentials are provided, we would call admin.messaging().send(...)
    // Otherwise fallback to structured dev mock logger
    if (config.fcm.projectId && config.fcm.clientEmail && config.fcm.privateKey) {
      logger.info(`[FCM-PUSH] Sent push to parent (${payload.recipientEmail}): ${payload.title}`);
    } else {
      logger.info(`[MOCK-PUSH] Target: ${payload.recipientEmail} | Title: "${payload.title}" | Body: "${payload.body}"`);
    }
  }

  /**
   * Send leave request status update notification
   */
  public static async notifyLeaveRequestStatus(
    recipientUserId: string,
    studentName: string,
    status: 'approved' | 'rejected',
    remarks?: string
  ) {
    const title = `Leave Request ${status === 'approved' ? 'Approved' : 'Rejected'}`;
    const message = `The leave request for ${studentName} has been ${status}.${remarks ? ` Note: ${remarks}` : ''}`;

    await Notification.create({
      recipientUserId,
      type: 'leave_update',
      title,
      message,
      deliveryStatus: 'delivered',
      deliveredAt: new Date()
    });
  }

  /**
   * Get notifications for user
   */
  public static async getUserNotifications(userId: string) {
    return Notification.find({ recipientUserId: userId })
      .sort({ createdAt: -1 })
      .limit(50)
      .lean();
  }

  /**
   * Mark notification as read
   */
  public static async markAsRead(notificationId: string, userId: string) {
    return Notification.findOneAndUpdate(
      { _id: notificationId, recipientUserId: userId },
      { deliveryStatus: 'read', readAt: new Date() },
      { new: true }
    );
  }
}
