import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '../../api/client';
import { Card, CardHeader, CardContent } from '../../components/Common/Card';
import { Badge } from '../../components/Common/Badge';
import { Button } from '../../components/Common/Button';
import { LoadingSpinner } from '../../components/Common/LoadingSpinner';
import { Download, FileBarChart, Filter } from 'lucide-react';
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';

export const ReportsPage: React.FC = () => {
  const [selectedMonth, setSelectedMonth] = useState(10);
  const [selectedYear, setSelectedYear] = useState(2026);

  const { data: monthlyData, isLoading: monthlyLoading } = useQuery({
    queryKey: ['monthlyReport', selectedYear, selectedMonth],
    queryFn: () => api.get(`/reports/attendance/monthly?year=${selectedYear}&month=${selectedMonth}`)
  });

  const { data: belowThreshold = [], isLoading: thresholdLoading } = useQuery({
    queryKey: ['studentsBelowThreshold'],
    queryFn: () => api.get('/reports/attendance/below-threshold?threshold=85')
  });

  const chartData = monthlyData?.days?.map((d: any) => ({
    date: d.date.split('-').slice(1).join('/'),
    Rate: d.percentage
  })) || [];

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Attendance Reports & Analytics</h1>
          <p className="text-xs text-slate-500 mt-1">Institutional attendance metrics, compliance monitoring, and data exports</p>
        </div>

        <a
          href={`/api/v1/reports/attendance/export?date=${new Date().toISOString().split('T')[0]}`}
          download
          className="inline-flex items-center space-x-1.5 px-3.5 py-2 bg-blue-600 text-white rounded-lg text-xs font-semibold hover:bg-blue-700 transition-colors shadow-xs"
        >
          <Download className="w-3.5 h-3.5" />
          <span>Export School Attendance CSV</span>
        </a>
      </div>

      {/* Monthly Trend Chart */}
      <Card>
        <CardHeader
          title="Monthly School Attendance Trend"
          subtitle="Daily aggregated attendance percentage across all verified classes"
          action={
            <div className="flex items-center space-x-2">
              <select
                value={selectedMonth}
                onChange={e => setSelectedMonth(Number(e.target.value))}
                className="text-xs p-1.5 border border-slate-200 rounded-md bg-white font-medium"
              >
                <option value={9}>September</option>
                <option value={10}>October</option>
                <option value={11}>November</option>
                <option value={12}>December</option>
              </select>
            </div>
          }
        />
        <CardContent className="p-4 h-72">
          {monthlyLoading ? (
            <LoadingSpinner message="Calculating monthly trends..." />
          ) : chartData.length === 0 ? (
            <div className="flex items-center justify-center h-full text-xs text-slate-400">
              No historical submitted attendance recorded for this month yet.
            </div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData} margin={{ top: 10, right: 20, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                <YAxis domain={[0, 100]} tick={{ fontSize: 11 }} />
                <Tooltip />
                <Line
                  type="monotone"
                  dataKey="Rate"
                  stroke="#2563eb"
                  strokeWidth={3}
                  dot={{ r: 4, fill: '#2563eb' }}
                  activeDot={{ r: 6 }}
                />
              </LineChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>

      {/* Low Attendance Intervention Roster */}
      <Card>
        <CardHeader
          title="Policy Compliance: Students Below 85% Threshold"
          subtitle="Active students requiring automated counselor or guardian follow-up"
        />
        <CardContent className="p-0">
          {thresholdLoading ? (
            <LoadingSpinner message="Evaluating policy compliance..." />
          ) : belowThreshold.length === 0 ? (
            <div className="p-8 text-center text-xs text-slate-400">
              No students are currently falling below the 85% school attendance minimum.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-100 uppercase tracking-wider">
                    <th className="py-3 px-4">Admission No</th>
                    <th className="py-3 px-4">Student Name</th>
                    <th className="py-3 px-4">Class</th>
                    <th className="py-3 px-4">Total Sessions</th>
                    <th className="py-3 px-4">Absences</th>
                    <th className="py-3 px-4">Calculated Rate</th>
                    <th className="py-3 px-4 text-right">Intervention Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {belowThreshold.map((st: any) => (
                    <tr key={st.studentId} className="hover:bg-slate-50">
                      <td className="py-3 px-4 font-mono font-medium">{st.admissionNumber}</td>
                      <td className="py-3 px-4 font-semibold text-slate-900">{st.name}</td>
                      <td className="py-3 px-4">
                        {st.class ? `${st.class.grade} - ${st.class.section}` : '—'}
                      </td>
                      <td className="py-3 px-4 font-mono">{st.totalSessions}</td>
                      <td className="py-3 px-4 font-mono text-rose-600 font-bold">{st.absent}</td>
                      <td className="py-3 px-4">
                        <span className="font-bold text-rose-700 bg-rose-50 px-2 py-0.5 rounded">
                          {st.percentage}%
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <Badge variant="danger" size="sm">
                          Warning Alert Sent
                        </Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
