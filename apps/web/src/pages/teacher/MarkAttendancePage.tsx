import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../../api/client';
import { Card, CardHeader, CardContent } from '../../components/Common/Card';
import { Button } from '../../components/Common/Button';
import { Badge } from '../../components/Common/Badge';
import { Modal } from '../../components/Common/Modal';
import { LoadingSpinner } from '../../components/Common/LoadingSpinner';
import {
  CalendarCheck,
  CheckCircle2,
  XCircle,
  Clock,
  AlertTriangle,
  Save,
  Send,
  Sparkles,
  ArrowRight
} from 'lucide-react';
import { AttendanceStatus, ITeacherAssignment } from '@school/shared-types';

export const MarkAttendancePage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const queryClient = useQueryClient();

  // Inputs
  const [selectedClassId, setSelectedClassId] = useState(searchParams.get('classId') || '');
  const [date, setDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [period, setPeriod] = useState(1);

  // Loaded session and records state
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [sessionStatus, setSessionStatus] = useState<string>('draft');
  const [recordsMap, setRecordsMap] = useState<Record<string, { status: AttendanceStatus; remarks?: string }>>({});
  const [studentsList, setStudentsList] = useState<any[]>([]);

  // Confirmation modal state
  const [isSubmitModalOpen, setIsSubmitModalOpen] = useState(false);
  const [successNotice, setSuccessNotice] = useState<string | null>(null);

  // Correction request modal state
  const [isCorrectionModalOpen, setIsCorrectionModalOpen] = useState(false);
  const [correctionReason, setCorrectionReason] = useState('');

  // Fetch teacher's assigned classes
  const { data: assignments = [], isLoading: classesLoading } = useQuery<ITeacherAssignment[]>({
    queryKey: ['myTeacherAssignments'],
    queryFn: () => api.get('/teacher-assignments/me')
  });

  // Automatically select first class if none in query params
  useEffect(() => {
    if (!selectedClassId && assignments.length > 0) {
      setSelectedClassId((assignments[0].classId as any)._id);
    }
  }, [assignments, selectedClassId]);

  // Fetch or create attendance session when Class, Date, or Period changes
  const { data: sessionData, isLoading: sessionLoading, refetch: refetchSession } = useQuery({
    queryKey: ['attendanceSession', selectedClassId, date, period],
    queryFn: () =>
      api.post('/attendance/sessions', {
        classId: selectedClassId,
        date,
        period: Number(period)
      }),
    enabled: !!selectedClassId
  });

  useEffect(() => {
    if (sessionData) {
      setSessionId(sessionData.session._id);
      setSessionStatus(sessionData.session.status);

      const map: Record<string, { status: AttendanceStatus; remarks?: string }> = {};
      const students: any[] = [];

      sessionData.records.forEach((r: any) => {
        const student = r.studentId;
        if (student) {
          students.push(student);
          map[student._id] = {
            status: r.status,
            remarks: r.remarks || ''
          };
        }
      });

      setStudentsList(students);
      setRecordsMap(map);
    }
  }, [sessionData]);

  // Save Draft Mutation
  const saveDraftMutation = useMutation({
    mutationFn: (records: any[]) =>
      api.put(`/attendance/sessions/${sessionId}/records`, { records }),
    onSuccess: () => {
      setSuccessNotice('Draft saved successfully.');
      setTimeout(() => setSuccessNotice(null), 3000);
      refetchSession();
    }
  });

  // Submit Final Mutation
  const submitMutation = useMutation({
    mutationFn: (records: any[]) =>
      api.post(`/attendance/sessions/${sessionId}/submit`, { records }),
    onSuccess: () => {
      setIsSubmitModalOpen(false);
      setSuccessNotice('Attendance submitted successfully! Parents have been notified of absences.');
      refetchSession();
      queryClient.invalidateQueries({ queryKey: ['dailyReport'] });
    }
  });

  // Submit Correction Mutation
  const correctionMutation = useMutation({
    mutationFn: ({ reason, records }: { reason: string; records: any[] }) =>
      api.post(`/attendance/sessions/${sessionId}/correction-requests`, { reason, records }),
    onSuccess: () => {
      setIsCorrectionModalOpen(false);
      setSuccessNotice('Correction submitted and logged in audit trail.');
      refetchSession();
    }
  });

  const handleStatusChange = (studentId: string, status: AttendanceStatus) => {
    if (sessionStatus === 'submitted') return; // Cannot edit directly once submitted
    setRecordsMap(prev => ({
      ...prev,
      [studentId]: {
        ...prev[studentId],
        status
      }
    }));
  };

  const handleRemarksChange = (studentId: string, remarks: string) => {
    if (sessionStatus === 'submitted') return;
    setRecordsMap(prev => ({
      ...prev,
      [studentId]: {
        ...prev[studentId],
        remarks
      }
    }));
  };

  const markAll = (status: AttendanceStatus) => {
    if (sessionStatus === 'submitted') return;
    setRecordsMap(prev => {
      const next = { ...prev };
      Object.keys(next).forEach(stId => {
        next[stId] = { ...next[stId], status };
      });
      return next;
    });
  };

  const getPayloadRecords = () => {
    return Object.entries(recordsMap).map(([studentId, data]) => ({
      studentId,
      status: data.status,
      remarks: data.remarks
    }));
  };

  const handleSaveDraft = () => {
    saveDraftMutation.mutate(getPayloadRecords());
  };

  const counts = {
    present: Object.values(recordsMap).filter(r => r.status === 'present').length,
    absent: Object.values(recordsMap).filter(r => r.status === 'absent').length,
    late: Object.values(recordsMap).filter(r => r.status === 'late').length,
    excused: Object.values(recordsMap).filter(r => r.status === 'excused').length,
    total: studentsList.length
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">Classroom Attendance Roster</h1>
        <p className="text-xs text-slate-500 mt-1">Take roll call, save drafts, and submit attendance for parent notifications</p>
      </div>

      {/* Control Bar */}
      <Card>
        <CardContent className="p-4 flex flex-col md:flex-row items-center gap-4">
          <div className="w-full md:w-1/3">
            <label className="block text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1">
              Select Class
            </label>
            <select
              value={selectedClassId}
              onChange={e => setSelectedClassId(e.target.value)}
              className="w-full py-2 px-3 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white font-medium"
            >
              {assignments.map(a => {
                const c: any = a.classId;
                const s: any = a.subjectId;
                return (
                  <option key={c._id} value={c._id}>
                    {c.grade} - Section {c.section} {s ? `(${s.name})` : ''}
                  </option>
                );
              })}
            </select>
          </div>

          <div className="w-full md:w-1/4">
            <label className="block text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1">
              Attendance Date
            </label>
            <input
              type="date"
              value={date}
              onChange={e => setDate(e.target.value)}
              className="w-full py-2 px-3 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white font-medium"
            />
          </div>

          <div className="w-full md:w-1/4">
            <label className="block text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1">
              Period / Session
            </label>
            <select
              value={period}
              onChange={e => setPeriod(Number(e.target.value))}
              className="w-full py-2 px-3 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white font-medium"
            >
              <option value={1}>Period 1 (Morning)</option>
              <option value={2}>Period 2</option>
              <option value={3}>Period 3</option>
              <option value={4}>Period 4 (Afternoon)</option>
            </select>
          </div>

          <div className="w-full md:w-auto md:ml-auto self-end pt-2 md:pt-0">
            <Badge
              variant={
                sessionStatus === 'submitted' || sessionStatus === 'corrected'
                  ? 'success'
                  : 'warning'
              }
              size="md"
              className="capitalize text-xs px-3 py-1.5"
            >
              Status: {sessionStatus}
            </Badge>
          </div>
        </CardContent>
      </Card>

      {/* Success Banner */}
      {successNotice && (
        <div className="rounded-xl bg-emerald-50 border border-emerald-200 p-4 flex items-center space-x-3 text-xs text-emerald-800">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          <span>{successNotice}</span>
        </div>
      )}

      {/* Status Warning if Already Submitted */}
      {sessionStatus === 'submitted' && (
        <div className="rounded-xl bg-blue-50 border border-blue-200 p-4 flex items-center justify-between text-xs text-blue-900">
          <div className="flex items-center space-x-2">
            <CheckCircle2 className="w-4 h-4 text-blue-600" />
            <span>This session has already been finalized and locked. Direct edits are disabled.</span>
          </div>
          <Button
            size="sm"
            variant="outline"
            onClick={() => setIsCorrectionModalOpen(true)}
            className="bg-white hover:bg-blue-100"
          >
            Submit Correction Request
          </Button>
        </div>
      )}

      {/* Attendance Roster Table */}
      <Card>
        <CardHeader
          title="Student Roll Call"
          subtitle={`Showing ${studentsList.length} enrolled students`}
          action={
            sessionStatus !== 'submitted' && (
              <div className="flex items-center space-x-2">
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={() => markAll('present')}
                  className="text-xs"
                >
                  <Sparkles className="w-3.5 h-3.5 mr-1 text-emerald-600" />
                  Mark All Present
                </Button>
              </div>
            )
          }
        />
        <CardContent className="p-0">
          {sessionLoading ? (
            <LoadingSpinner message="Loading enrolled student roster..." />
          ) : studentsList.length === 0 ? (
            <div className="p-12 text-center text-xs text-slate-400">
              No students enrolled in this class roster.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-100 uppercase tracking-wider">
                    <th className="py-3 px-4">Admission #</th>
                    <th className="py-3 px-4">Student</th>
                    <th className="py-3 px-4 text-center">Status Selection</th>
                    <th className="py-3 px-4">Notes / Remarks</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {studentsList.map(st => {
                    const record = recordsMap[st._id] || { status: 'present', remarks: '' };
                    const currentStatus = record.status;

                    return (
                      <tr key={st._id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="py-3.5 px-4 font-mono font-medium text-slate-500">
                          {st.admissionNumber}
                        </td>
                        <td className="py-3.5 px-4 font-semibold text-slate-900">
                          {st.name}
                        </td>
                        <td className="py-3.5 px-4 text-center">
                          <div className="inline-flex rounded-lg border border-slate-200 bg-slate-50 p-1 space-x-1">
                            <button
                              type="button"
                              disabled={sessionStatus === 'submitted'}
                              onClick={() => handleStatusChange(st._id, 'present')}
                              className={`px-3 py-1 rounded-md text-xs font-semibold transition-all ${
                                currentStatus === 'present'
                                  ? 'bg-emerald-600 text-white shadow-xs'
                                  : 'text-slate-600 hover:text-emerald-700'
                              }`}
                            >
                              Present
                            </button>
                            <button
                              type="button"
                              disabled={sessionStatus === 'submitted'}
                              onClick={() => handleStatusChange(st._id, 'absent')}
                              className={`px-3 py-1 rounded-md text-xs font-semibold transition-all ${
                                currentStatus === 'absent'
                                  ? 'bg-rose-600 text-white shadow-xs'
                                  : 'text-slate-600 hover:text-rose-700'
                              }`}
                            >
                              Absent
                            </button>
                            <button
                              type="button"
                              disabled={sessionStatus === 'submitted'}
                              onClick={() => handleStatusChange(st._id, 'late')}
                              className={`px-3 py-1 rounded-md text-xs font-semibold transition-all ${
                                currentStatus === 'late'
                                  ? 'bg-amber-500 text-white shadow-xs'
                                  : 'text-slate-600 hover:text-amber-700'
                              }`}
                            >
                              Late
                            </button>
                            <button
                              type="button"
                              disabled={sessionStatus === 'submitted'}
                              onClick={() => handleStatusChange(st._id, 'excused')}
                              className={`px-3 py-1 rounded-md text-xs font-semibold transition-all ${
                                currentStatus === 'excused'
                                  ? 'bg-blue-600 text-white shadow-xs'
                                  : 'text-slate-600 hover:text-blue-700'
                              }`}
                            >
                              Excused
                            </button>
                          </div>
                        </td>
                        <td className="py-3.5 px-4">
                          <input
                            type="text"
                            disabled={sessionStatus === 'submitted'}
                            value={record.remarks || ''}
                            onChange={e => handleRemarksChange(st._id, e.target.value)}
                            placeholder="Optional note e.g. Doctor's note, bus delay"
                            className="w-full p-1.5 border border-slate-200 rounded-md text-xs focus:ring-1 focus:ring-blue-500 focus:outline-none"
                          />
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

      {/* Action Footer */}
      {sessionStatus !== 'submitted' && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 bg-white rounded-xl border border-slate-200 shadow-sm">
          <div className="text-xs text-slate-500 flex items-center space-x-3">
            <span>
              Summary: <strong className="text-emerald-700">{counts.present} Present</strong> •{' '}
              <strong className="text-rose-700">{counts.absent} Absent</strong> •{' '}
              <strong className="text-amber-700">{counts.late} Late</strong> •{' '}
              <strong className="text-blue-700">{counts.excused} Excused</strong>
            </span>
          </div>

          <div className="flex items-center space-x-3 w-full sm:w-auto">
            <Button
              type="button"
              variant="outline"
              size="md"
              onClick={handleSaveDraft}
              isLoading={saveDraftMutation.isPending}
              className="space-x-1.5 flex-1 sm:flex-initial"
            >
              <Save className="w-4 h-4" />
              <span>Save Draft</span>
            </Button>
            <Button
              type="button"
              variant="primary"
              size="md"
              onClick={() => setIsSubmitModalOpen(true)}
              className="space-x-1.5 flex-1 sm:flex-initial"
            >
              <Send className="w-4 h-4" />
              <span>Review & Submit</span>
            </Button>
          </div>
        </div>
      )}

      {/* Submit Confirmation Modal */}
      <Modal
        isOpen={isSubmitModalOpen}
        onClose={() => setIsSubmitModalOpen(false)}
        title="Confirm Attendance Submission"
      >
        <div className="space-y-4 text-xs text-slate-600">
          <p>
            Please verify the attendance summary before final submission. Once submitted, this session will become locked and verified.
          </p>

          <div className="grid grid-cols-2 gap-2 p-3 bg-slate-50 rounded-lg border border-slate-200 text-slate-800">
            <div>Total Enrolled: <strong>{counts.total}</strong></div>
            <div>Present: <strong className="text-emerald-700">{counts.present}</strong></div>
            <div>Absent: <strong className="text-rose-700">{counts.absent}</strong></div>
            <div>Late: <strong className="text-amber-700">{counts.late}</strong></div>
          </div>

          {counts.absent > 0 && (
            <div className="rounded-lg bg-amber-50 border border-amber-200 p-3 flex items-start space-x-2 text-amber-800">
              <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <span>
                <strong>{counts.absent} student(s)</strong> are marked absent. Submitting will immediately dispatch automated absence push alerts to verified parents.
              </span>
            </div>
          )}

          <div className="pt-2 flex justify-end space-x-2">
            <Button variant="ghost" size="sm" onClick={() => setIsSubmitModalOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={() => submitMutation.mutate(getPayloadRecords())}
              isLoading={submitMutation.isPending}
            >
              Confirm & Submit
            </Button>
          </div>
        </div>
      </Modal>

      {/* Correction Request Modal */}
      <Modal
        isOpen={isCorrectionModalOpen}
        onClose={() => setIsCorrectionModalOpen(false)}
        title="Request Authorized Attendance Correction"
      >
        <div className="space-y-4 text-xs">
          <div>
            <label className="block font-semibold text-slate-700 mb-1">
              Reason for Adjustment
            </label>
            <textarea
              required
              rows={3}
              value={correctionReason}
              onChange={e => setCorrectionReason(e.target.value)}
              placeholder="e.g. Student Liam arrived at 09:10 due to school bus delay; change status from absent to late."
              className="w-full p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
            />
          </div>

          <div className="pt-2 flex justify-end space-x-2">
            <Button variant="ghost" size="sm" onClick={() => setIsCorrectionModalOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="primary"
              size="sm"
              disabled={correctionReason.length < 5}
              onClick={() =>
                correctionMutation.mutate({
                  reason: correctionReason,
                  records: getPayloadRecords()
                })
              }
              isLoading={correctionMutation.isPending}
            >
              Submit Correction
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
