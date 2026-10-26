import { AuditLog } from './audit-log.model';

export class AuditService {
  public static async log(
    actorId: string,
    action: string,
    entityType: string,
    entityId: string,
    before?: Record<string, any>,
    after?: Record<string, any>
  ) {
    try {
      return await AuditLog.create({
        actorId,
        action,
        entityType,
        entityId,
        before,
        after,
        timestamp: new Date()
      });
    } catch (err: any) {
      console.error('Failed to create audit log:', err.message);
    }
  }

  public static async getLogs(query: {
    page?: number;
    limit?: number;
    entityType?: string;
    entityId?: string;
    actorId?: string;
  }) {
    const page = Number(query.page) || 1;
    const limit = Number(query.limit) || 50;
    const skip = (page - 1) * limit;

    const filter: any = {};
    if (query.entityType) filter.entityType = query.entityType;
    if (query.entityId) filter.entityId = query.entityId;
    if (query.actorId) filter.actorId = query.actorId;

    const [logs, total] = await Promise.all([
      AuditLog.find(filter)
        .sort({ timestamp: -1 })
        .skip(skip)
        .limit(limit)
        .populate('actorId', 'name email role'),
      AuditLog.countDocuments(filter)
    ]);

    return {
      logs,
      total,
      page,
      totalPages: Math.ceil(total / limit)
    };
  }
}
