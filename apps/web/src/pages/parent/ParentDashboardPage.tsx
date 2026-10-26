import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../../api/client';
import { Card, CardHeader, CardContent } from '../../components/Common/Card';
import { Button } from '../../components/Common/Button';
import { Badge } from '../../components/Common/Badge';
import { Modal } from '../../components/Common/Modal';
import { LoadingSpinner } from '../../components/Common/LoadingSpinner';
import {
  CalendarDays,
  Calendar,
  CheckCircle,
  XCircle,
  Clock,
  FileCheck2,
  Bell,
  Plus
} from 'lucide-react';
import { IStudent } from '@school/shared-types';

export const ParentDashboardPage: React.FC = () => {
  const queryClient = useQueryClient();
  const [selectedChildId, setSelectedChildId] = useState<string | null>(null);
  const [isLeaveModalOpen, setIsLeaveModalOpen] = useState(false);

  // Leave request form
  const [leaveData, setLeaveData] = useState({
    startDate: new Date().toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0],
    reason: ''
  });

  // Fetch verified linked children
  const { data: children = [], isLoading: childrenLoading } = useQuery<any[]>({
    queryKey: ['myChildren'],
    queryFn: () => api.get('/parents/me/children')
  });

  // Auto-select first child
  const activeChild = children.find(c => c._id === selectedChildId) || children[0];

  // Fetch attendance for selected child
  const { data: attendanceData, isLoading: attendanceLoading } = useQuery({
    queryKey: ['childAttendance', activeChild?._id],
    queryFn: () => api.get(`/attendance/students/${activeChild?._id}/attendance`),
    enabled: !!activeChild?._id
  });

  // Fetch child leave requests
  const { data: leaves = [], isLoading: leavesLoading } = useQuery<any[]>({
    queryKey: ['myLeaveRequests'],
    queryFn: () => api.get('/leave-requests')
  });

  // Submit leave mutation
  const leaveMutation = useMutation({
    mutationFn: (data: typeof leaveData) =>
      api.post('/leave-requests', {
        ...data,
        studentId: activeChild?._id
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['myLeaveRequests'] });
      setIsLeaveModalOpen(false);
      setLeaveData({
        startDate: new Date().toISOString().split('T')[0],
        endDate: new Date().toISOString().split('T')[0],
        reason: ''
      });
    }
  });

  const handleLeaveSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    leaveMutation.mutate(leaveData);
  };

  if (childrenLoading) {
    return <LoadingSpinner message="Loading family student profiles..." />;
  }

  if (children.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-12 text-center">
        <h2 className="text-xl font-bold text-slate-800">No Verified Student Account Linked</h2>
        <p className="text-xs text-slate-500 mt-2 max-w-sm">
          Your parent account is not currently linked to any enrolled student. Please contact the school office to verify your student relationship.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Parent Attendance Portal</h1>
          <p className="text-xs text-slate-500 mt-1">Official attendance logs, term percentages, and student leave submissions</p>
        </div>

        <Button
          size="md"
          onClick={() => setIsLeaveModalOpen(true)}
          className="inline-flex items-center space-x-1.5 shadow-sm"
        >
          <Plus className="w-4 h-4" />
          <span>Submit Student Leave</span>
        </Button>
      </div>

      {/* Child Switcher Tabs (Supports Multiple Children) */}
      <div className="flex items-center space-x-2 border-b border-slate-200 pb-2">
        <span className="text-xs font-semibold text-slate-400 mr-2">Children:</span>
        {children.map(ch => (
          <button
            key={ch._id}
            onClick={() => setSelectedChildId(ch._id)}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              activeChild?._id === ch._id
                ? 'bg-blue-600 text-white shadow-sm shadow-blue-500/20'
                : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
            }`}
          >
            {ch.name} ({ch.currentClass ? `${ch.currentClass.grade}-${ch.currentClass.section}` : 'Student'})
          </button>
        ))}
      </div>

      {/* Attendance Metrics Cards for Selected Child */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-br from-blue-900 to-indigo-900 text-white border-0 shadow-md col-span-2 sm:col-span-1">
          <CardContent className="p-5 flex flex-col justify-between h-full">
            <span className="text-xs text-blue-200 font-semibold uppercase tracking-wider">Attendance Rate</span>
            <div className="mt-2">
              <span className="text-4xl font-extrabold">{attendanceData?.percentage ?? 100}%</span>
              <span className="block text-[11px] text-blue-200 mt-1">
                {attendanceData?.percentage >= 85 ? 'Meets school standard' : 'Below 85% requirement'}
              </span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-5">
            <span className="text-xs font-semibold text-emerald-600 block">Present Days</span>
            <span className="text-2xl font-bold text-slate-800 mt-2 block">
              {attendanceData?.present ?? 0}
            </span>
            <span className="text-[11px] text-slate-400 mt-1 block">Full days attended</span>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-5">
            <span className="text-xs font-semibold text-rose-600 block">Absences</span>
            <span className="text-2xl font-bold text-slate-800 mt-2 block">
              {attendanceData?.absent ?? 0}
            </span>
            <span className="text-[11px] text-slate-400 mt-1 block">Unexcused missed days</span>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-5">
            <span className="text-xs font-semibold text-amber-600 block">Late Arrivals</span>
            <span className="text-2xl font-bold text-slate-800 mt-2 block">
              {attendanceData?.late ?? 0}
            </span>
            <span className="text-[11px] text-slate-400 mt-1 block">Periods arrived after bell</span>
          </CardContent>
        </Card>
      </div>

      {/* Attendance History Calendar Table */}
      <Card>
        <CardHeader
          title={`Attendance History: ${activeChild?.name}`}
          subtitle={`Admission No: ${activeChild?.admissionNumber}`}
        />
        <CardContent className="p-0">
          {attendanceLoading ? (
            <LoadingSpinner message="Loading attendance history..." />
          ) : !attendanceData?.records || attendanceData.records.length === 0 ? (
            <div className="p-12 text-center text-xs text-slate-400">
              No verified attendance records logged for this student yet.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-100 uppercase tracking-wider">
                    <th className="py-3 px-4">Date</th>
                    <th className="py-3 px-4">Period / Course</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4">Notes</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {attendanceData.records.map((rec: any) => (
                    <tr key={rec._id} className="hover:bg-slate-50 transition-colors">
                      <td className="py-3.5 px-4 font-mono font-medium text-slate-900">{rec.date}</td>
                      <td className="py-3.5 px-4 font-medium text-slate-800">
                        Period {rec.period} • {rec.subject}
                      </td>
                      <td className="py-3.5 px-4">
                        <Badge
                          variant={
                            rec.status === 'present'
                              ? 'success'
                              : rec.status === 'absent'
                              ? 'danger'
                              : rec.status === 'late'
                              ? 'warning'
                              : 'info'
                          }
                          size="sm"
                          className="capitalize font-semibold"
                        >
                          {rec.status}
                        </Badge>
                      </td>
                      <td className="py-3.5 px-4 text-slate-500">{rec.remarks || '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Leave Requests Log */}
      <Card>
        <CardHeader
          title="Submitted Student Leave Requests"
          subtitle="Track approval status of requested absence periods"
        />
        <CardContent className="p-0">
          {leavesLoading ? (
            <LoadingSpinner message="Loading leave status..." />
          ) : leaves.length === 0 ? (
            <div className="p-8 text-center text-xs text-slate-400">
              You haven't submitted any leave requests yet.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-100 uppercase tracking-wider">
                    <th className="py-3 px-4">Date Range</th>
                    <th className="py-3 px-4">Reason</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4">School Remarks</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {leaves.map((l: any) => (
                    <tr key={l._id} className="hover:bg-slate-50">
                      <td className="py-3.5 px-4 font-medium text-slate-900">
                        {l.startDate} {l.startDate !== l.endDate ? `to ${l.endDate}` : ''}
                      </td>
                      <td className="py-3.5 px-4 text-slate-600">{l.reason}</td>
                      <td className="py-3.5 px-4">
                        <Badge
                          variant={
                            l.status === 'approved'
                              ? 'success'
                              : l.status === 'rejected'
                              ? 'danger'
                              : 'warning'
                          }
                          size="sm"
                          className="capitalize"
                        >
                          {l.status}
                        </Badge>
                      </td>
                      <td className="py-3.5 px-4 text-slate-500 italic">{l.remarks || 'Pending Review'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Submit Leave Modal */}
      <Modal
        isOpen={isLeaveModalOpen}
        onClose={() => setIsLeaveModalOpen(false)}
        title={`Request Absence Leave for ${activeChild?.name}`}
      >
        <form onSubmit={handleLeaveSubmit} className="space-y-4 text-xs">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Start Date</label>
              <input
                type="date"
                required
                value={leaveData.startDate}
                onChange={e => setLeaveData({ ...leaveData, startDate: e.target.value })}
                className="w-full p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">End Date</label>
              <input
                type="date"
                required
                value={leaveData.endDate}
                onChange={e => setLeaveData({ ...leaveData, endDate: e.target.value })}
                className="w-full p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Reason for Leave</label>
            <textarea
              required
              rows={3}
              value={leaveData.reason}
              onChange={e => setLeaveData({ ...leaveData, reason: e.target.value })}
              placeholder="e.g. Medical appointment, family bereavement, religious holiday"
              className="w-full p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
            />
          </div>

          <div className="pt-2 flex justify-end space-x-2">
            <Button type="button" variant="ghost" size="sm" onClick={() => setIsLeaveModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" size="sm" isLoading={leaveMutation.isPending}>
              Submit Request
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
