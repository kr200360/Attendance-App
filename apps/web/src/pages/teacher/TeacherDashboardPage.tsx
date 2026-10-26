import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '../../api/client';
import { Card, CardHeader, CardContent } from '../../components/Common/Card';
import { Button } from '../../components/Common/Button';
import { Badge } from '../../components/Common/Badge';
import { LoadingSpinner } from '../../components/Common/LoadingSpinner';
import { CalendarCheck, BookOpen, Clock, ArrowRight, UserCheck } from 'lucide-react';
import { Link } from 'react-router-dom';
import { ITeacherAssignment } from '@school/shared-types';

export const TeacherDashboardPage: React.FC = () => {
  const { data: assignments = [], isLoading: assignmentsLoading } = useQuery<ITeacherAssignment[]>({
    queryKey: ['myTeacherAssignments'],
    queryFn: () => api.get('/teacher-assignments/me')
  });

  const today = new Date().toISOString().split('T')[0];

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Teacher Classroom Portal</h1>
          <p className="text-xs text-slate-500 mt-1">Today's assigned courses, timetable periods, and attendance duties</p>
        </div>

        <Link to="/teacher/mark-attendance">
          <Button size="md" className="space-x-1.5 shadow-sm">
            <CalendarCheck className="w-4 h-4" />
            <span>Mark Daily Attendance</span>
          </Button>
        </Link>
      </div>

      {/* Assigned Classes Grid */}
      <div>
        <h2 className="text-sm font-bold text-slate-800 uppercase tracking-wider mb-3">My Assigned Classes</h2>
        {assignmentsLoading ? (
          <LoadingSpinner message="Loading assigned classes..." />
        ) : assignments.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center text-xs text-slate-400">
              You do not have any classes assigned for the current academic session.
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {assignments.map(a => {
              const classObj: any = a.classId;
              const subject: any = a.subjectId;

              return (
                <Card key={a._id} className="hover:border-blue-200 transition-all hover:shadow-sm">
                  <CardContent className="p-5 space-y-4">
                    <div className="flex items-start justify-between">
                      <div>
                        <span className="text-[11px] font-semibold text-blue-600 uppercase tracking-wider block">
                          {subject?.name || 'Class Attendance'}
                        </span>
                        <h3 className="text-lg font-bold text-slate-900 mt-0.5">
                          {classObj?.grade} - Section {classObj?.section}
                        </h3>
                      </div>
                      <Badge variant="info" size="sm">
                        {subject?.code || 'HOMEROOM'}
                      </Badge>
                    </div>

                    <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                      <span className="text-xs text-slate-400 font-medium">Session {today}</span>
                      <Link
                        to={`/teacher/mark-attendance?classId=${classObj?._id}`}
                        className="inline-flex items-center space-x-1 text-xs font-semibold text-blue-600 hover:text-blue-700"
                      >
                        <span>Mark Roster</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </Link>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>

      {/* Classroom Guidelines */}
      <Card className="bg-blue-50/50 border-blue-100">
        <CardContent className="p-5 text-xs text-slate-600 space-y-2">
          <div className="flex items-center space-x-2 font-semibold text-blue-900">
            <UserCheck className="w-4 h-4 text-blue-600" />
            <span>Attendance Submission Protocol</span>
          </div>
          <p className="leading-relaxed">
            Please record attendance within the first 15 minutes of each scheduled period. Saving drafts allows you to make adjustments before final submission. Submitting final attendance notifies verified parents of unexcused absences via push notification.
          </p>
        </CardContent>
      </Card>
    </div>
  );
};
