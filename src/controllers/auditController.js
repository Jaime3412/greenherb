const { getLogs } = require('../services/auditService');

const listAudit = async (req, res) => {
  try {
    const logs = await getLogs();
    return res.status(200).json({ success: true, data: logs });
  } catch {
    return res.status(500).json({ success: false, error: 'Erro interno do servidor' });
  }
};

module.exports = { listAudit };
