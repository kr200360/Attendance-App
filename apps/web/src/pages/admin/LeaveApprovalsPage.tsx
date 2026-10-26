import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../../api/client';
import { Card, CardHeader, CardContent } from '../../components/Common/Card';
import { Badge } from '../../components/Common/Badge';
import { Button } from '../../components/Common/Button';
import { Modal } from '../../components/Common/Modal';
import { LoadingSpinner } from '../../components/Common/LoadingSpinner';
import { Check, X, Clock, FileCheck2, User } from 'lucide-react';
import { ILeaveRequest } from '@school/shared-types';

export const LeaveApprovalsPage: React.FC = () => {
  const queryClient = useQueryClient();
  const [selectedLeave, setSelectedLeave] = useState<ILeaveRequest | null>(null);
  const [reviewModalOpen, setReviewModalOpen] = useState(false);
  const [actionType, setActionType] = useState<'approved' | 'rejected'>('approved');
  const [remarks, setRemarks] = useState('');

  const { data: leaves = [], isLoading } = useQuery<ILeaveRequest[]>({
    queryKey: ['leaveRequests'],
    queryFn: () => api.get('/leave-requests')
  });

  const reviewMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: { status: 'approved' | 'rejected'; remarks?: string } }) =>
      api.patch(`/leave-requests/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['leaveRequests'] });
      setReviewModalOpen(false);
      setSelectedLeave(null);
      setRemarks('');
    }
  });

  const handleOpenReview = (leave: ILeaveRequest, status: 'approved' | 'rejected') => {
    setSelectedLeave(leave);
    setActionType(status);
    setRemarks(status === 'approved' ? 'Leave authorized per school policy' : 'Insufficient reason or notice period');
    setReviewModalOpen(true);
  };

  const handleReviewSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedLeave) return;
    reviewMutation.mutate({
      id: selectedLeave._id,
      data: { status: actionType, remarks }
    });
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">Student Leave Management</h1>
        <p className="text-xs text-slate-500 mt-1">Review and authorize parent-submitted student absence and leave requests</p>
      </div>

      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <LoadingSpinner message="Loading leave requests..." />
          ) : leaves.length === 0 ? (
            <div className="p-12 text-center text-xs text-slate-400">
              No leave requests currently logged in the system.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-100 uppercase tracking-wider">
                    <th className="py-3 px-4">Student</th>
                    <th className="py-3 px-4">Parent / Guardian</th>
                    <th className="py-3 px-4">Duration</th>
                    <th className="py-3 px-4">Reason</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {leaves.map(req => {
                    const student: any = req.studentId;
                    const parent: any = req.parentUserId;

                    return (
                      <tr key={req._id} className="hover:bg-slate-50 transition-colors">
                        <td className="py-3.5 px-4">
                          <span className="font-semibold text-slate-900 block">{student?.name || '—'}</span>
                          <span className="text-[11px] font-mono text-slate-400">{student?.admissionNumber}</span>
                        </td>
                        <td className="py-3.5 px-4">
                          <span className="font-medium text-slate-800 block">{parent?.name || '—'}</span>
                          <span className="text-[11px] text-slate-400">{parent?.email}</span>
                        </td>
                        <td className="py-3.5 px-4 font-medium text-slate-800">
                          {req.startDate} {req.startDate !== req.endDate ? `to ${req.endDate}` : ''}
                        </td>
                        <td className="py-3.5 px-4 max-w-xs truncate text-slate-600" title={req.reason}>
                          {req.reason}
                        </td>
                        <td className="py-3.5 px-4">
                          <Badge
                            variant={
                              req.status === 'approved'
                                ? 'success'
                                : req.status === 'rejected'
                                ? 'danger'
                                : 'warning'
                            }
                            size="sm"
                            className="capitalize"
                          >
                            {req.status}
                          </Badge>
                        </td>
                        <td className="py-3.5 px-4 text-right space-x-1.5 whitespace-nowrap">
                          {req.status === 'pending' ? (
                            <>
                              <Button
                                size="sm"
                                variant="success"
                                onClick={() => handleOpenReview(req, 'approved')}
                                className="space-x-1"
                              >
                                <Check className="w-3.5 h-3.5" />
                                <span>Approve</span>
                              </Button>
                              <Button
                                size="sm"
                                variant="danger"
                                onClick={() => handleOpenReview(req, 'rejected')}
                                className="space-x-1"
                              >
                                <X className="w-3.5 h-3.5" />
                                <span>Reject</span>
                              </Button>
                            </>
                          ) : (
                            <span className="text-[11px] text-slate-400 italic">
                              Reviewed {req.reviewedAt ? new Date(req.reviewedAt).toLocaleDateString() : ''}
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Review Modal */}
      <Modal
        isOpen={reviewModalOpen}
        onClose={() => setReviewModalOpen(false)}
        title={`${actionType === 'approved' ? 'Approve' : 'Reject'} Leave Request`}
      >
        <form onSubmit={handleReviewSubmit} className="space-y-4 text-xs">
          <div>
            <label className="block font-semibold text-slate-700 mb-1">Official Review Remarks</label>
            <textarea
              required
              rows={3}
              value={remarks}
              onChange={e => setRemarks(e.target.value)}
              className="w-full p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
            />
          </div>

          <div className="pt-2 flex justify-end space-x-2">
            <Button type="button" variant="ghost" size="sm" onClick={() => setReviewModalOpen(false)}>
              Cancel
            </Button>
            <Button
              type="submit"
              size="sm"
              variant={actionType === 'approved' ? 'success' : 'danger'}
              isLoading={reviewMutation.isPending}
            >
              Confirm {actionType === 'approved' ? 'Approval' : 'Rejection'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
