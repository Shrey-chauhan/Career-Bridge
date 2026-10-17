const AdminAuditLog = require('../models/AdminAuditLog');
const { isConnected } = require('../config/db');

// In-memory fallback storage
const memoryAuditLogs = [];

const createAuditLog = async ({
  actorId,
  actorRole,
  action,
  entityType,
  entityId,
  description,
  metadata = {},
}) => {
  if (!actorId || !action || !entityType || !entityId || !description) {
    console.error('Audit Log parameters missing:', { actorId, action, entityType, entityId });
    return null;
  }

  if (isConnected()) {
    try {
      const log = await AdminAuditLog.create({
        actorId,
        actorRole: actorRole || 'ADMIN',
        action,
        entityType,
        entityId,
        description,
        metadata,
      });
      return log;
    } catch (err) {
      console.error('Failed to write Audit Log to DB:', err);
      return null;
    }
  } else {
    const memLog = {
      id: 'mem_audit_' + Date.now() + '_' + Math.random().toString(36).substr(2, 4),
      actorId: actorId.toString(),
      actorRole: actorRole || 'ADMIN',
      action,
      entityType,
      entityId: entityId.toString(),
      description,
      metadata,
      createdAt: new Date(),
    };
    memoryAuditLogs.unshift(memLog);
    return memLog;
  }
};

const getAuditLogs = async (queryParams = {}) => {
  const page = Math.max(1, parseInt(queryParams.page, 10) || 1);
  const limit = Math.min(100, Math.max(1, parseInt(queryParams.limit, 10) || 20));
  const skip = (page - 1) * limit;

  if (isConnected()) {
    const filter = {};
    if (queryParams.action) filter.action = queryParams.action;
    if (queryParams.entityType) filter.entityType = queryParams.entityType;

    const total = await AdminAuditLog.countDocuments(filter);
    const logs = await AdminAuditLog.find(filter)
      .populate('actorId', 'name email role')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    return {
      logs,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit) || 0,
      },
    };
  } else {
    let list = [...memoryAuditLogs];
    if (queryParams.action) list = list.filter((l) => l.action === queryParams.action);
    if (queryParams.entityType) list = list.filter((l) => l.entityType === queryParams.entityType);

    const total = list.length;
    const paginated = list.slice(skip, skip + limit);

    return {
      logs: paginated,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit) || 0,
      },
    };
  }
};

module.exports = {
  createAuditLog,
  getAuditLogs,
};
