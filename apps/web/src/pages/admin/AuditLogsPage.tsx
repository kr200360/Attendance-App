import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '../../api/client';
import { Card, CardHeader, CardContent } from '../../components/Common/Card';
import { Badge } from '../../components/Common/Badge';
import { LoadingSpinner } from '../../components/Common/LoadingSpinner';
import { History, Shield, Clock } from 'lucide-react';
import { IAuditLog } from '@school/shared-types';

export const AuditLogsPage: React.FC = () => {
  const { data: logsData, isLoading } = useQuery({
    queryKey: ['auditLogs'],
    queryFn: () => api.get('/admin/audit-logs?limit=50')
  });

  const logs: IAuditLog[] = (logsData as any) || [];

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">System Audit Trail</h1>
        <p className="text-xs text-slate-500 mt-1">Immutable log of attendance finalizations, staff modifications, and administrative security events</p>
      </div>

      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <LoadingSpinner message="Retrieving audit records..." />
          ) : logs.length === 0 ? (
            <div className="p-12 text-center text-xs text-slate-400">
              No audit logs registered yet.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-100 uppercase tracking-wider">
                    <th className="py-3 px-4">Timestamp</th>
                    <th className="py-3 px-4">Actor</th>
                    <th className="py-3 px-4">Action</th>
                    <th className="py-3 px-4">Target Entity</th>
                    <th className="py-3 px-4">Changes Recorded</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {logs.map(log => {
                    const actor: any = log.actorId;

                    return (
                      <tr key={log._id} className="hover:bg-slate-50 transition-colors">
                        <td className="py-3.5 px-4 text-slate-500 whitespace-nowrap font-mono text-[11px]">
                          {new Date(log.timestamp).toLocaleString()}
                        </td>
                        <td className="py-3.5 px-4">
                          <span className="font-semibold text-slate-900 block">{actor?.name || 'System / Service'}</span>
                          <span className="text-[10px] text-slate-400">{actor?.email}</span>
                        </td>
                        <td className="py-3.5 px-4">
                          <Badge variant="info" size="sm" className="font-mono text-[10px]">
                            {log.action}
                          </Badge>
                        </td>
                        <td className="py-3.5 px-4 font-medium text-slate-800">
                          {log.entityType} <span className="text-slate-400 font-mono text-[10px]">({log.entityId.slice(-6)})</span>
                        </td>
                        <td className="py-3.5 px-4 text-slate-500 max-w-sm truncate text-[11px]">
                          {log.after ? JSON.stringify(log.after) : log.before ? 'State updated' : 'No diff payload'}
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
