import { LeaveRequest } from './leave-request.model';
import { ParentStudentLink } from '../parents/parent-student-link.model';
import { Student } from '../students/student.model';
import { NotificationService } from '../notifications/notification.service';
import { AuditService } from '../audit/audit.service';
import { NotFoundError, ForbiddenError, BadRequestError } from '../../shared/errors';

export class LeaveRequestService {
  public static async createLeaveRequest(
    data: { studentId: string; startDate: string; endDate: string; reason: string },
    parentUserId: string
  ) {
    // Verify parent is linked to this student
    const isLinked = await ParentStudentLink.exists({
      parentUserId,
      studentId: data.studentId,
      verificationStatus: 'verified'
    });

    if (!isLinked) {
      throw new ForbiddenError('You can only submit leave requests for your verified children');
    }

    const leave = await LeaveRequest.create({
      studentId: data.studentId,
      parentUserId,
      startDate: data.startDate,
      endDate: data.endDate,
      reason: data.reason,
      status: 'pending'
    });

    await AuditService.log(parentUserId, 'LEAVE_REQUEST_SUBMITTED', 'LeaveRequest', leave._id.toString());
    return leave;
  }

  public static async listLeaveRequests(user: any) {
    const filter: any = {};
    if (user.role === 'parent') {
      filter.parentUserId = user._id;
    }

    return LeaveRequest.find(filter)
      .populate('studentId', 'name admissionNumber')
      .populate('parentUserId', 'name email phone')
      .populate('reviewedBy', 'name')
      .sort({ createdAt: -1 })
      .lean();
  }

  public static async reviewLeaveRequest(
    id: string,
    review: { status: 'approved' | 'rejected'; remarks?: string },
    reviewerId: string
  ) {
    const leave = await LeaveRequest.findById(id).populate('studentId', 'name');
    if (!leave) {
      throw new NotFoundError('Leave request not found');
    }

    leave.status = review.status;
    leave.reviewedBy = reviewerId as any;
    leave.reviewedAt = new Date();
    leave.remarks = review.remarks;
    await leave.save();

    await AuditService.log(reviewerId, `LEAVE_REQUEST_${review.status.toUpperCase()}`, 'LeaveRequest', id, undefined, review);

    // Notify parent
    await NotificationService.notifyLeaveRequestStatus(
      leave.parentUserId.toString(),
      (leave.studentId as any)?.name || 'your child',
      review.status,
      review.remarks
    );

    return leave;
  }
}
