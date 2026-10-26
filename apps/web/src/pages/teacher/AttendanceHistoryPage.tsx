import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '../../api/client';
import { Card, CardHeader, CardContent } from '../../components/Common/Card';
import { Badge } from '../../components/Common/Badge';
import { Button } from '../../components/Common/Button';
import { LoadingSpinner } from '../../components/Common/LoadingSpinner';
import { History, Calendar, CheckCircle, ExternalLink } from 'lucide-react';
import { Link } from 'react-router-dom';
import { IAttendanceSession } from '@school/shared-types';

export const AttendanceHistoryPage: React.FC = () => {
  const { data: sessions = [], isLoading } = useQuery<IAttendanceSession[]>({
    queryKey: ['teacherSessionsHistory'],
    queryFn: () => api.get('/attendance/sessions')
  });

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">Attendance Submission History</h1>
        <p className="text-xs text-slate-500 mt-1">Review your submitted roll call logs and official attendance records</p>
      </div>

      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <LoadingSpinner message="Loading historical sessions..." />
          ) : sessions.length === 0 ? (
            <div className="p-12 text-center text-xs text-slate-400">
              No previous attendance sessions recorded.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-100 uppercase tracking-wider">
                    <th className="py-3 px-4">Date</th>
                    <th className="py-3 px-4">Class</th>
                    <th className="py-3 px-4">Period</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4">Submitted At</th>
                    <th className="py-3 px-4 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {sessions.map(s => {
                    const c: any = s.classId;
                    const subject: any = s.subjectId;

                    return (
                      <tr key={s._id} className="hover:bg-slate-50 transition-colors">
                        <td className="py-3.5 px-4 font-mono font-medium text-slate-900">{s.date}</td>
                        <td className="py-3.5 px-4 font-semibold text-slate-800">
                          {c?.grade} - Section {c?.section} {subject ? `(${subject.name})` : ''}
                        </td>
                        <td className="py-3.5 px-4 font-medium">Period {s.period}</td>
                        <td className="py-3.5 px-4">
                          <Badge
                            variant={s.status === 'submitted' || s.status === 'corrected' ? 'success' : 'warning'}
                            size="sm"
                            className="capitalize"
                          >
                            {s.status}
                          </Badge>
                        </td>
                        <td className="py-3.5 px-4 text-slate-500 text-[11px]">
                          {s.submittedAt ? new Date(s.submittedAt).toLocaleString() : 'Draft'}
                        </td>
                        <td className="py-3.5 px-4 text-right">
                          <Link
                            to={`/teacher/mark-attendance?classId=${c?._id}&date=${s.date}&period=${s.period}`}
                            className="inline-flex items-center space-x-1 text-xs font-semibold text-blue-600 hover:text-blue-700"
                          >
                            <span>Inspect</span>
                            <ExternalLink className="w-3.5 h-3.5" />
                          </Link>
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
    </div>
  );
};
