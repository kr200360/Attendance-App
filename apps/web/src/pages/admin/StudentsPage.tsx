import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../../api/client';
import { Card, CardHeader, CardContent } from '../../components/Common/Card';
import { Button } from '../../components/Common/Button';
import { Badge } from '../../components/Common/Badge';
import { Modal } from '../../components/Common/Modal';
import { LoadingSpinner } from '../../components/Common/LoadingSpinner';
import { Plus, Search, UserPlus, Filter, Link2 } from 'lucide-react';
import { IStudent, IClass } from '@school/shared-types';

export const StudentsPage: React.FC = () => {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [selectedClassId, setSelectedClassId] = useState('');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isLinkModalOpen, setIsLinkModalOpen] = useState(false);
  const [activeStudent, setActiveStudent] = useState<IStudent | null>(null);

  // Form states
  const [formData, setFormData] = useState({
    admissionNumber: '',
    name: '',
    gender: 'female',
    dateOfBirth: '2010-05-15',
    classId: ''
  });

  const [linkData, setLinkData] = useState({
    parentUserId: '',
    relationship: 'father'
  });

  // Fetch classes for dropdown
  const { data: classes = [] } = useQuery<IClass[]>({
    queryKey: ['classes'],
    queryFn: () => api.get('/classes')
  });

  // Fetch students
  const { data: studentsData, isLoading } = useQuery({
    queryKey: ['students', search, selectedClassId],
    queryFn: () =>
      api.get(
        `/students?search=${encodeURIComponent(search)}&classId=${selectedClassId}`
      )
  });

  const students: IStudent[] = (studentsData as any) || [];

  // Create student mutation
  const createMutation = useMutation({
    mutationFn: (data: typeof formData) => api.post('/students', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['students'] });
      setIsAddModalOpen(false);
      setFormData({
        admissionNumber: '',
        name: '',
        gender: 'female',
        dateOfBirth: '2010-05-15',
        classId: ''
      });
    }
  });

  // Link parent mutation
  const linkMutation = useMutation({
    mutationFn: ({ studentId, data }: { studentId: string; data: typeof linkData }) =>
      api.post(`/students/${studentId}/parent-links`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['students'] });
      setIsLinkModalOpen(false);
    }
  });

  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createMutation.mutate(formData);
  };

  const handleLinkSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeStudent) return;
    linkMutation.mutate({ studentId: activeStudent._id, data: linkData });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Student Directory</h1>
          <p className="text-xs text-slate-500 mt-1">Manage student admissions, classroom enrollments, and parent links</p>
        </div>

        <Button onClick={() => setIsAddModalOpen(true)} className="inline-flex items-center space-x-1.5">
          <Plus className="w-4 h-4" />
          <span>Register Student</span>
        </Button>
      </div>

      {/* Filter and Search Bar */}
      <Card>
        <CardContent className="p-4 flex flex-col sm:flex-row items-center gap-3">
          <div className="relative flex-1 w-full">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search by student name or admission number..."
              className="w-full pl-9 pr-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="w-full sm:w-64">
            <select
              value={selectedClassId}
              onChange={e => setSelectedClassId(e.target.value)}
              className="w-full py-2 px-3 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
            >
              <option value="">All Classes & Sections</option>
              {classes.map(c => (
                <option key={c._id} value={c._id}>
                  {c.grade} - Section {c.section}
                </option>
              ))}
            </select>
          </div>
        </CardContent>
      </Card>

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <LoadingSpinner message="Loading students..." />
          ) : students.length === 0 ? (
            <div className="p-12 text-center text-xs text-slate-400">
              No students found matching your query.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50/75 text-slate-500 font-semibold uppercase tracking-wider">
                    <th className="py-3 px-4">Admission No</th>
                    <th className="py-3 px-4">Student Name</th>
                    <th className="py-3 px-4">Class</th>
                    <th className="py-3 px-4">Gender</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {students.map(st => (
                    <tr key={st._id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3 px-4 font-mono font-medium text-slate-900">{st.admissionNumber}</td>
                      <td className="py-3 px-4 font-semibold text-slate-800">{st.name}</td>
                      <td className="py-3 px-4">
                        {st.currentClass ? (
                          <span className="font-medium text-blue-700 bg-blue-50 px-2 py-0.5 rounded-md">
                            {st.currentClass.grade} - {st.currentClass.section}
                          </span>
                        ) : (
                          <span className="text-slate-400 italic">Not Enrolled</span>
                        )}
                      </td>
                      <td className="py-3 px-4 capitalize">{st.gender || '—'}</td>
                      <td className="py-3 px-4">
                        <Badge variant={st.status === 'active' ? 'success' : 'neutral'} size="sm">
                          {st.status}
                        </Badge>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setActiveStudent(st);
                            setIsLinkModalOpen(true);
                          }}
                          className="space-x-1"
                        >
                          <Link2 className="w-3.5 h-3.5" />
                          <span>Link Parent</span>
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Add Student Modal */}
      <Modal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        title="Register New Student"
      >
        <form onSubmit={handleAddSubmit} className="space-y-4 text-xs">
          <div>
            <label className="block font-semibold text-slate-700 mb-1">Admission Number</label>
            <input
              type="text"
              required
              value={formData.admissionNumber}
              onChange={e => setFormData({ ...formData, admissionNumber: e.target.value })}
              placeholder="e.g. STU-1025"
              className="w-full p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Full Name</label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={e => setFormData({ ...formData, name: e.target.value })}
              placeholder="e.g. Charlotte Bennett"
              className="w-full p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Gender</label>
              <select
                value={formData.gender}
                onChange={e => setFormData({ ...formData, gender: e.target.value as any })}
                className="w-full p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none bg-white"
              >
                <option value="male">Male</option>
                <option value="female">Female</option>
                <option value="other">Other</option>
              </select>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Date of Birth</label>
              <input
                type="date"
                required
                value={formData.dateOfBirth}
                onChange={e => setFormData({ ...formData, dateOfBirth: e.target.value })}
                className="w-full p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Class & Section Enrollment</label>
            <select
              required
              value={formData.classId}
              onChange={e => setFormData({ ...formData, classId: e.target.value })}
              className="w-full p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none bg-white"
            >
              <option value="">Select Class to Enroll</option>
              {classes.map(c => (
                <option key={c._id} value={c._id}>
                  {c.grade} - Section {c.section}
                </option>
              ))}
            </select>
          </div>

          <div className="pt-2 flex justify-end space-x-2">
            <Button type="button" variant="ghost" size="sm" onClick={() => setIsAddModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" size="sm" isLoading={createMutation.isPending}>
              Create & Enroll Student
            </Button>
          </div>
        </form>
      </Modal>

      {/* Link Parent Modal */}
      <Modal
        isOpen={isLinkModalOpen}
        onClose={() => setIsLinkModalOpen(false)}
        title={`Link Parent to ${activeStudent?.name || ''}`}
      >
        <form onSubmit={handleLinkSubmit} className="space-y-4 text-xs">
          <div>
            <label className="block font-semibold text-slate-700 mb-1">Parent User ID</label>
            <input
              type="text"
              required
              value={linkData.parentUserId}
              onChange={e => setLinkData({ ...linkData, parentUserId: e.target.value })}
              placeholder="Paste Parent MongoDB ObjectId"
              className="w-full p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
            />
            <p className="text-[11px] text-slate-400 mt-1">
              You can obtain the Parent User ID from the User Accounts list or directory.
            </p>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Relationship</label>
            <select
              value={linkData.relationship}
              onChange={e => setLinkData({ ...linkData, relationship: e.target.value as any })}
              className="w-full p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none bg-white"
            >
              <option value="father">Father</option>
              <option value="mother">Mother</option>
              <option value="guardian">Guardian</option>
            </select>
          </div>

          <div className="pt-2 flex justify-end space-x-2">
            <Button type="button" variant="ghost" size="sm" onClick={() => setIsLinkModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" size="sm" isLoading={linkMutation.isPending}>
              Establish Parent Link
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
