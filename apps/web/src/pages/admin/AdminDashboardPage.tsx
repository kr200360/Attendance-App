import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '../../api/client';
import {
  Users,
  GraduationCap,
  CalendarCheck,
  FileCheck2,
  TrendingUp,
  ArrowUpRight,
  AlertTriangle
} from 'lucide-react';
import { Card, CardHeader, CardContent } from '../../components/Common/Card';
import { Badge } from '../../components/Common/Badge';
import { LoadingSpinner } from '../../components/Common/LoadingSpinner';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';
import { Link } from 'react-router-dom';

export const AdminDashboardPage: React.FC = () => {
  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ['adminDashboardStats'],
    queryFn: () => api.get('/admin/dashboard')
  });

  const { data: dailyReport, isLoading: reportLoading } = useQuery({
    queryKey: ['adminDailyReport'],
    queryFn: () => api.get('/reports/attendance/daily')
  });

  const { data: belowThreshold = [] } = useQuery({
    queryKey: ['studentsBelowThreshold'],
    queryFn: () => api.get('/reports/attendance/below-threshold')
  });

  if (statsLoading || reportLoading) {
    return <LoadingSpinner message="Loading dashboard statistics..." />;
  }

  const kpis = [
    {
      title: 'Enrolled Students',
      value: stats?.totalStudents || 0,
      icon: GraduationCap,
      color: 'bg-blue-500 text-white',
      link: '/admin/students'
    },
    {
      title: 'Faculty Members',
      value: stats?.totalTeachers || 0,
      icon: Users,
      color: 'bg-emerald-500 text-white',
      link: '/admin/teachers'
    },
    {
      title: 'Active Classes',
      value: stats?.totalClasses || 0,
      icon: CalendarCheck,
      color: 'bg-violet-500 text-white',
      link: '/admin/classes'
    },
    {
      title: 'Pending Leaves',
      value: stats?.pendingLeaves || 0,
      icon: FileCheck2,
      color: 'bg-amber-500 text-white',
      link: '/admin/leave-approvals'
    }
  ];

  // Recharts data from class breakdown
  const chartData = dailyReport?.classBreakdown?.map((c: any) => ({
    name: `${c.grade}-${c.section}`,
    Present: c.present,
    Absent: c.absent,
    Late: c.late
  })) || [];

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">School Administration Overview</h1>
          <p className="text-xs text-slate-500 mt-1">
            Academic Year 2026-2027 • Today: {stats?.todayDate || new Date().toISOString().split('T')[0]}
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <Link
            to="/admin/attendance"
            className="inline-flex items-center space-x-1.5 px-3.5 py-2 bg-blue-600 text-white rounded-lg text-xs font-semibold hover:bg-blue-700 transition-colors shadow-xs"
          >
            <span>Attendance Monitor</span>
            <ArrowUpRight className="w-3.5 h-3.5" />
          </Link>
          <a
            href={`/api/v1/reports/attendance/export?date=${stats?.todayDate || ''}`}
            download
            className="inline-flex items-center space-x-1.5 px-3.5 py-2 bg-white border border-slate-300 text-slate-700 rounded-lg text-xs font-semibold hover:bg-slate-50 transition-colors"
          >
            Export Daily CSV
          </a>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {kpis.map((kpi, idx) => {
          const Icon = kpi.icon;
          return (
            <Link key={idx} to={kpi.link} className="block transition-transform hover:-translate-y-0.5">
              <Card className="hover:border-blue-200">
                <CardContent className="p-5 flex items-center justify-between">
                  <div>
                    <span className="text-xs font-medium text-slate-500 block">{kpi.title}</span>
                    <span className="text-2xl font-bold text-slate-900 block mt-1">{kpi.value}</span>
                  </div>
                  <div className={`h-11 w-11 rounded-xl flex items-center justify-center ${kpi.color}`}>
                    <Icon className="h-5 w-5" />
                  </div>
                </CardContent>
              </Card>
            </Link>
          );
        })}
      </div>

      {/* Today School-wide Attendance Rate Banner */}
      <Card className="bg-gradient-to-r from-blue-900 to-indigo-900 text-white border-0 shadow-md">
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <span className="text-xs font-semibold tracking-wider uppercase text-blue-200">
                Today's Overall Attendance
              </span>
              <div className="flex items-baseline space-x-3 mt-1">
                <span className="text-4xl font-extrabold">{dailyReport?.attendancePercentage ?? 0}%</span>
                <span className="text-xs text-blue-200">
                  {dailyReport?.presentCount ?? 0} Present • {dailyReport?.absentCount ?? 0} Absent • {dailyReport?.lateCount ?? 0} Late
                </span>
              </div>
            </div>

            <div className="flex items-center space-x-4">
              <div className="text-right">
                <span className="text-xs text-blue-200 block">Class Sessions Submitted</span>
                <span className="text-lg font-bold">
                  {stats?.todaySubmittedSessions ?? 0} / {stats?.totalClasses ?? 0} Classes
                </span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Analytics Charts & At-Risk Students Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Attendance Breakdown Chart */}
        <Card className="lg:col-span-2">
          <CardHeader
            title="Class Attendance Breakdown Today"
            subtitle="Real-time headcount per class and section"
          />
          <CardContent className="p-4 h-80">
            {chartData.length === 0 ? (
              <div className="flex items-center justify-center h-full text-xs text-slate-400">
                No attendance sessions submitted for today yet.
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip />
                  <Bar dataKey="Present" fill="#2563eb" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="Absent" fill="#f43f5e" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="Late" fill="#f59e0b" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        {/* At-Risk Students (Below Threshold) */}
        <Card>
          <CardHeader
            title="Attendance Alerts (<85%)"
            subtitle="Students requiring intervention"
            action={<AlertTriangle className="w-4 h-4 text-amber-500" />}
          />
          <CardContent className="p-0">
            {belowThreshold.length === 0 ? (
              <div className="p-6 text-center text-xs text-slate-400">
                All students currently meet the required attendance policy.
              </div>
            ) : (
              <div className="divide-y divide-slate-100 max-h-80 overflow-y-auto">
                {belowThreshold.map((st: any) => (
                  <div key={st.studentId} className="p-4 hover:bg-slate-50 flex items-center justify-between">
                    <div>
                      <span className="text-xs font-semibold text-slate-800 block">{st.name}</span>
                      <span className="text-[11px] text-slate-400">
                        {st.admissionNumber} • {st.class ? `${st.class.grade}-${st.class.section}` : 'Unassigned'}
                      </span>
                    </div>
                    <div className="text-right">
                      <Badge variant="danger" size="sm">
                        {st.percentage}%
                      </Badge>
                      <span className="text-[10px] text-slate-400 block mt-0.5">
                        {st.absent} absences
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
