import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '../../api/client';
import { Card, CardHeader, CardContent } from '../../components/Common/Card';
import { Badge } from '../../components/Common/Badge';
import { Button } from '../../components/Common/Button';
import { LoadingSpinner } from '../../components/Common/LoadingSpinner';
import { Calendar, Download, Eye, CheckCircle2, Clock, AlertCircle } from 'lucide-react';

export const AttendanceOverviewPage: React.FC = () => {
  const [date, setDate] = useState(() => new Date().toISOString().split('T')[0]);

  const { data: report, isLoading, refetch } = useQuery({
    queryKey: ['dailyReport', date],
    queryFn: () => api.get(`/reports/attendance/daily?date=${date}`)
  });

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Attendance Monitoring</h1>
          <p className="text-xs text-slate-500 mt-1">Real-time school-wide attendance submission and verification audit</p>
        </div>

        <div className="flex items-center space-x-3">
          <div className="flex items-center space-x-2 bg-white border border-slate-200 rounded-lg px-3 py-1.5 shadow-xs">
            <Calendar className="w-4 h-4 text-slate-400" />
            <input
              type="date"
              value={date}
              onChange={e => setDate(e.target.value)}
              className="text-xs font-semibold text-slate-700 focus:outline-none"
            />
          </div>

          <a
            href={`/api/v1/reports/attendance/export?date=${date}`}
            download
            className="inline-flex items-center space-x-1.5 px-3.5 py-2 bg-blue-600 text-white rounded-lg text-xs font-semibold hover:bg-blue-700 transition-colors shadow-xs"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export CSV</span>
          </a>
        </div>
      </div>

      {/* Summary Cards */}
      {report && (
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
          <Card>
            <CardContent className="p-4 text-center">
              <span className="text-[11px] font-semibold text-slate-500 block">Total Enrolled</span>
              <span className="text-xl font-bold text-slate-800 mt-1 block">{report.totalEnrolled}</span>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <span className="text-[11px] font-semibold text-emerald-600 block">Present</span>
              <span className="text-xl font-bold text-emerald-700 mt-1 block">{report.presentCount}</span>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <span className="text-[11px] font-semibold text-rose-600 block">Absent</span>
              <span className="text-xl font-bold text-rose-700 mt-1 block">{report.absentCount}</span>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <span className="text-[11px] font-semibold text-amber-600 block">Late</span>
              <span className="text-xl font-bold text-amber-700 mt-1 block">{report.lateCount}</span>
            </CardContent>
          </Card>
          <Card className="col-span-2 sm:col-span-1 bg-blue-50 border-blue-200">
            <CardContent className="p-4 text-center">
              <span className="text-[11px] font-semibold text-blue-700 block">Attendance Rate</span>
              <span className="text-xl font-extrabold text-blue-900 mt-1 block">
                {report.attendancePercentage}%
              </span>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Class-by-Class Attendance Table */}
      <Card>
        <CardHeader
          title={`Attendance by Class for ${date}`}
          subtitle="Status of attendance recorded per section"
        />
        <CardContent className="p-0">
          {isLoading ? (
            <LoadingSpinner message="Loading attendance breakdown..." />
          ) : !report?.classBreakdown || report.classBreakdown.length === 0 ? (
            <div className="p-12 text-center text-xs text-slate-400">
              No class attendance recorded for this date.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-100 uppercase tracking-wider">
                    <th className="py-3 px-4">Class</th>
                    <th className="py-3 px-4">Enrolled</th>
                    <th className="py-3 px-4">Present</th>
                    <th className="py-3 px-4">Absent</th>
                    <th className="py-3 px-4">Late</th>
                    <th className="py-3 px-4">Attendance %</th>
                    <th className="py-3 px-4 text-right">Submission Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {report.classBreakdown.map((c: any) => {
                    const statusVariant =
                      c.sessionStatus === 'submitted' || c.sessionStatus === 'corrected'
                        ? 'success'
                        : c.sessionStatus === 'draft'
                        ? 'warning'
                        : 'neutral';

                    return (
                      <tr key={c.classId} className="hover:bg-slate-50 transition-colors">
                        <td className="py-3.5 px-4 font-semibold text-slate-900">
                          {c.grade} - Section {c.section}
                        </td>
                        <td className="py-3.5 px-4 font-mono">{c.total}</td>
                        <td className="py-3.5 px-4 font-mono text-emerald-600 font-medium">{c.present}</td>
                        <td className="py-3.5 px-4 font-mono text-rose-600 font-medium">{c.absent}</td>
                        <td className="py-3.5 px-4 font-mono text-amber-600 font-medium">{c.late}</td>
                        <td className="py-3.5 px-4">
                          <span
                            className={`font-bold px-2 py-0.5 rounded ${
                              c.percentage >= 85
                                ? 'bg-emerald-50 text-emerald-700'
                                : c.percentage > 0
                                ? 'bg-rose-50 text-rose-700'
                                : 'bg-slate-100 text-slate-500'
                            }`}
                          >
                            {c.percentage}%
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-right">
                          <Badge variant={statusVariant} size="sm" className="capitalize">
                            {c.sessionStatus}
                          </Badge>
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
