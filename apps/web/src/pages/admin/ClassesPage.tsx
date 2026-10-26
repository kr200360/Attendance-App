import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../../api/client';
import { Card, CardHeader, CardContent } from '../../components/Common/Card';
import { Button } from '../../components/Common/Button';
import { Badge } from '../../components/Common/Badge';
import { Modal } from '../../components/Common/Modal';
import { LoadingSpinner } from '../../components/Common/LoadingSpinner';
import { Plus, Users, BookOpen, Layers } from 'lucide-react';
import { IClass, IUser, IAcademicYear } from '@school/shared-types';

export const ClassesPage: React.FC = () => {
  const queryClient = useQueryClient();
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isRosterModalOpen, setIsRosterModalOpen] = useState(false);
  const [selectedClass, setSelectedClass] = useState<IClass | null>(null);

  const [formData, setFormData] = useState({
    grade: 'Grade 10',
    section: 'C',
    academicYearId: '',
    classTeacherId: ''
  });

  const { data: classes = [], isLoading } = useQuery<IClass[]>({
    queryKey: ['classes'],
    queryFn: () => api.get('/classes')
  });

  const { data: teachers = [] } = useQuery<IUser[]>({
    queryKey: ['teachers'],
    queryFn: () => api.get('/teachers')
  });

  const { data: academicYears = [] } = useQuery<IAcademicYear[]>({
    queryKey: ['academicYears'],
    queryFn: () => api.get('/academic-years')
  });

  // Fetch roster when class is selected
  const { data: rosterData, isLoading: rosterLoading } = useQuery({
    queryKey: ['classRoster', selectedClass?._id],
    queryFn: () => api.get(`/classes/${selectedClass?._id}/roster`),
    enabled: !!selectedClass
  });

  const createMutation = useMutation({
    mutationFn: (data: typeof formData) => api.post('/classes', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['classes'] });
      setIsAddModalOpen(false);
    }
  });

  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createMutation.mutate(formData);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Classes & Sections</h1>
          <p className="text-xs text-slate-500 mt-1">Configure grade levels, assigned homeroom teachers, and class cohorts</p>
        </div>

        <Button onClick={() => setIsAddModalOpen(true)} className="inline-flex items-center space-x-1.5">
          <Plus className="w-4 h-4" />
          <span>Create New Class</span>
        </Button>
      </div>

      {/* Grid */}
      {isLoading ? (
        <LoadingSpinner message="Loading classes..." />
      ) : classes.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center text-xs text-slate-400">
            No classes created yet.
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {classes.map(c => {
            const teacher: any = c.classTeacherId;
            const year: any = c.academicYearId;

            return (
              <Card key={c._id} className="hover:border-blue-200 transition-all hover:shadow-md">
                <CardHeader
                  title={`${c.grade} - Section ${c.section}`}
                  subtitle={year?.name || 'Academic 2026-2027'}
                  action={
                    <Badge variant={c.status === 'active' ? 'success' : 'neutral'} size="sm">
                      {c.status}
                    </Badge>
                  }
                />
                <CardContent className="p-5 space-y-4">
                  <div className="text-xs text-slate-600 space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400">Class Teacher:</span>
                      <span className="font-semibold text-slate-800">{teacher?.name || 'Unassigned'}</span>
                    </div>
                  </div>

                  <div className="pt-2 border-t border-slate-100 flex items-center justify-end">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setSelectedClass(c);
                        setIsRosterModalOpen(true);
                      }}
                      className="w-full space-x-1"
                    >
                      <Users className="w-3.5 h-3.5" />
                      <span>View Enrolled Roster</span>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Add Class Modal */}
      <Modal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        title="Create New Class & Section"
      >
        <form onSubmit={handleAddSubmit} className="space-y-4 text-xs">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Grade Level</label>
              <input
                type="text"
                required
                value={formData.grade}
                onChange={e => setFormData({ ...formData, grade: e.target.value })}
                placeholder="e.g. Grade 11"
                className="w-full p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Section</label>
              <input
                type="text"
                required
                value={formData.section}
                onChange={e => setFormData({ ...formData, section: e.target.value })}
                placeholder="e.g. A"
                className="w-full p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Academic Year</label>
            <select
              required
              value={formData.academicYearId}
              onChange={e => setFormData({ ...formData, academicYearId: e.target.value })}
              className="w-full p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none bg-white"
            >
              <option value="">Select Academic Year</option>
              {academicYears.map(y => (
                <option key={y._id} value={y._id}>
                  {y.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Class Teacher (Optional)</label>
            <select
              value={formData.classTeacherId}
              onChange={e => setFormData({ ...formData, classTeacherId: e.target.value })}
              className="w-full p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none bg-white"
            >
              <option value="">Select Class Teacher</option>
              {teachers.map(t => (
                <option key={t._id} value={t._id}>
                  {t.name} ({t.email})
                </option>
              ))}
            </select>
          </div>

          <div className="pt-2 flex justify-end space-x-2">
            <Button type="button" variant="ghost" size="sm" onClick={() => setIsAddModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" size="sm" isLoading={createMutation.isPending}>
              Create Class
            </Button>
          </div>
        </form>
      </Modal>

      {/* Class Roster Modal */}
      <Modal
        isOpen={isRosterModalOpen}
        onClose={() => setIsRosterModalOpen(false)}
        title={`Roster: ${selectedClass?.grade || ''} - Section ${selectedClass?.section || ''}`}
        maxWidth="lg"
      >
        {rosterLoading ? (
          <LoadingSpinner message="Loading student roster..." />
        ) : !rosterData?.students || rosterData.students.length === 0 ? (
          <div className="p-6 text-center text-xs text-slate-400">
            No students currently enrolled in this class.
          </div>
        ) : (
          <div className="space-y-3">
            <div className="max-h-80 overflow-y-auto border border-slate-100 rounded-lg">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-100">
                    <th className="py-2.5 px-3">Roll #</th>
                    <th className="py-2.5 px-3">Admission No</th>
                    <th className="py-2.5 px-3">Student Name</th>
                    <th className="py-2.5 px-3">Gender</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {rosterData.students.map((st: any) => (
                    <tr key={st._id} className="hover:bg-slate-50">
                      <td className="py-2.5 px-3 font-mono font-medium text-slate-500">{st.rollNumber || '—'}</td>
                      <td className="py-2.5 px-3 font-mono font-semibold text-slate-800">{st.admissionNumber}</td>
                      <td className="py-2.5 px-3 font-medium text-slate-900">{st.name}</td>
                      <td className="py-2.5 px-3 capitalize">{st.gender || '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="text-right text-xs text-slate-500">
              Total Enrolled: <span className="font-semibold text-slate-800">{rosterData.students.length} students</span>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};
