import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../../api/client';
import { Card, CardHeader, CardContent } from '../../components/Common/Card';
import { Button } from '../../components/Common/Button';
import { LoadingSpinner } from '../../components/Common/LoadingSpinner';
import { Save, CheckCircle2 } from 'lucide-react';
import { ISchoolSettings } from '@school/shared-types';

export const SettingsPage: React.FC = () => {
  const queryClient = useQueryClient();
  const [successMsg, setSuccessMsg] = useState(false);

  const { data: settings, isLoading } = useQuery<ISchoolSettings>({
    queryKey: ['schoolSettings'],
    queryFn: () => api.get('/admin/settings')
  });

  const [formData, setFormData] = useState({
    schoolName: '',
    timezone: 'America/New_York',
    minimumRequiredPercentage: 85,
    lateCountsAsFraction: 0.5,
    excusedCountsAsPresent: true,
    consecutiveAbsenceAlertThreshold: 3,
    allowTeacherCorrectionsWithinDays: 2
  });

  useEffect(() => {
    if (settings) {
      setFormData({
        schoolName: settings.schoolName || 'Oakwood International Academy',
        timezone: settings.timezone || 'America/New_York',
        minimumRequiredPercentage: settings.attendancePolicy?.minimumRequiredPercentage ?? 85,
        lateCountsAsFraction: settings.attendancePolicy?.lateCountsAsFraction ?? 0.5,
        excusedCountsAsPresent: settings.attendancePolicy?.excusedCountsAsPresent ?? true,
        consecutiveAbsenceAlertThreshold: settings.attendancePolicy?.consecutiveAbsenceAlertThreshold ?? 3,
        allowTeacherCorrectionsWithinDays: settings.attendancePolicy?.allowTeacherCorrectionsWithinDays ?? 2
      });
    }
  }, [settings]);

  const updateMutation = useMutation({
    mutationFn: (data: typeof formData) =>
      api.patch('/admin/settings', {
        schoolName: data.schoolName,
        timezone: data.timezone,
        attendancePolicy: {
          minimumRequiredPercentage: data.minimumRequiredPercentage,
          lateCountsAsFraction: data.lateCountsAsFraction,
          excusedCountsAsPresent: data.excusedCountsAsPresent,
          consecutiveAbsenceAlertThreshold: data.consecutiveAbsenceAlertThreshold,
          allowTeacherCorrectionsWithinDays: data.allowTeacherCorrectionsWithinDays
        }
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['schoolSettings'] });
      setSuccessMsg(true);
      setTimeout(() => setSuccessMsg(false), 3000);
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateMutation.mutate(formData);
  };

  if (isLoading) {
    return <LoadingSpinner message="Loading school settings..." />;
  }

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">School Attendance Policy & Settings</h1>
        <p className="text-xs text-slate-500 mt-1">Configure global institutional attendance rules, thresholds, and administrative parameters</p>
      </div>

      {successMsg && (
        <div className="rounded-lg bg-emerald-50 border border-emerald-200 p-3 flex items-center space-x-2 text-xs text-emerald-800">
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          <span>School attendance policies updated successfully.</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <Card>
          <CardHeader title="General Institutional Identity" subtitle="Basic school naming and localized time zone" />
          <CardContent className="space-y-4 text-xs">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">School Name</label>
                <input
                  type="text"
                  required
                  value={formData.schoolName}
                  onChange={e => setFormData({ ...formData, schoolName: e.target.value })}
                  className="w-full p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Timezone</label>
                <select
                  value={formData.timezone}
                  onChange={e => setFormData({ ...formData, timezone: e.target.value })}
                  className="w-full p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none bg-white"
                >
                  <option value="America/New_York">Eastern Time (America/New_York)</option>
                  <option value="America/Chicago">Central Time (America/Chicago)</option>
                  <option value="America/Denver">Mountain Time (America/Denver)</option>
                  <option value="America/Los_Angeles">Pacific Time (America/Los_Angeles)</option>
                  <option value="Asia/Kolkata">India Standard Time (Asia/Kolkata)</option>
                  <option value="Europe/London">Greenwich Mean Time (Europe/London)</option>
                </select>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader title="Attendance Calculation Business Rules" subtitle="Governs attendance percentage formulas and at-risk thresholds" />
          <CardContent className="space-y-4 text-xs">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Minimum Required Attendance (%)</label>
                <input
                  type="number"
                  min={50}
                  max={100}
                  required
                  value={formData.minimumRequiredPercentage}
                  onChange={e => setFormData({ ...formData, minimumRequiredPercentage: Number(e.target.value) })}
                  className="w-full p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
                <span className="text-[11px] text-slate-400 mt-1 block">Students below this rate appear on the warning report.</span>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Weight of 'Late' Status (0.0 to 1.0)</label>
                <input
                  type="number"
                  step="0.1"
                  min={0}
                  max={1}
                  required
                  value={formData.lateCountsAsFraction}
                  onChange={e => setFormData({ ...formData, lateCountsAsFraction: Number(e.target.value) })}
                  className="w-full p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
                <span className="text-[11px] text-slate-400 mt-1 block">e.g. 0.5 means 2 late arrivals equal 1 present period.</span>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Teacher Correction Window (Days)</label>
                <input
                  type="number"
                  min={0}
                  max={30}
                  required
                  value={formData.allowTeacherCorrectionsWithinDays}
                  onChange={e => setFormData({ ...formData, allowTeacherCorrectionsWithinDays: Number(e.target.value) })}
                  className="w-full p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
                <span className="text-[11px] text-slate-400 mt-1 block">Days after attendance date that teachers can submit adjustments.</span>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Excused Absence Policy</label>
                <label className="flex items-center space-x-2 mt-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.excusedCountsAsPresent}
                    onChange={e => setFormData({ ...formData, excusedCountsAsPresent: e.target.checked })}
                    className="rounded border-slate-300 text-blue-600 focus:ring-blue-500 h-4 w-4"
                  />
                  <span className="text-slate-700 font-medium">Count officially excused absences as attended</span>
                </label>
              </div>
            </div>

            <div className="pt-4 flex justify-end">
              <Button type="submit" size="md" isLoading={updateMutation.isPending} className="space-x-1.5">
                <Save className="w-4 h-4" />
                <span>Save School Policy Changes</span>
              </Button>
            </div>
          </CardContent>
        </Card>
      </form>
    </div>
  );
};
