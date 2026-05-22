const AuditLog = require('../models/AuditLog');

const log = async (userId, action, resource, resourceId = null) =>
  AuditLog.create({ userId, action, resource, resourceId });

const getLogs = async () =>
  AuditLog.find()
    .sort({ timestamp: -1 })
    .populate('userId', 'name role');

module.exports = { log, getLogs };
