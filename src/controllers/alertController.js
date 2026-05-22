const { getAlerts, resolveAlert } = require('../services/alertService');
const { log } = require('../services/auditService');

const listAlerts = async (req, res) => {
  try {
    const alerts = await getAlerts(req.query.batchId);
    return res.status(200).json({ success: true, data: alerts });
  } catch {
    return res.status(500).json({ success: false, error: 'Erro interno do servidor' });
  }
};

const patchAlert = async (req, res) => {
  try {
    const { resolution, justification } = req.body;
    const alert = await resolveAlert(req.params.id, resolution, justification, req.user.id);
    await log(req.user.id, `ALERT_${resolution.toUpperCase()}`, 'alerts', alert._id);
    return res.status(200).json({ success: true, data: alert });

  } catch (error) {
    if (error.code === 'NOT_FOUND') return res.status(404).json({ success: false, error: error.message });
    if (error.code === 'VALIDATION_ERROR') return res.status(422).json({ success: false, error: error.message });
    if (error.message.includes('já foi')) return res.status(409).json({ success: false, error: error.message });
    return res.status(500).json({ success: false, error: 'Erro interno do servidor' });
  }
};

module.exports = { listAlerts, patchAlert };
