import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../../middleware/auth';
import { ParentStudentLink } from './parent-student-link.model';
import { Enrollment } from '../academic/enrollment.model';
import { sendSuccess } from '../../shared/response';

export class ParentController {
  public static async getMyChildren(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const parentUserId = req.user!._id;

      // Only verified links
      const links = await ParentStudentLink.find({
        parentUserId,
        verificationStatus: 'verified'
      }).populate('studentId').lean();

      const children = [];
      for (const link of links) {
        const student: any = link.studentId;
        if (!student) continue;

        // Fetch active class enrollment
        const enrollment = await Enrollment.findOne({
          studentId: student._id,
          status: 'enrolled'
        }).populate('classId', 'grade section').lean();

        children.push({
          ...student,
          relationship: link.relationship,
          verifiedAt: link.verifiedAt,
          currentClass: enrollment ? enrollment.classId : null
        });
      }

      return sendSuccess(res, children, 'Linked children retrieved successfully');
    } catch (error) {
      next(error);
    }
  }
}
