const { recordMeasurement } = require('../services/measurementService');
const { log } = require('../services/auditService');

const addMeasurement = async (req, res) => {
  try {
    const measurement = await recordMeasurement(req.body, req.user.id);
    await log(req.user.id, 'RECORD_MEASUREMENT', 'measurements', measurement._id);
    return res.status(201).json({ success: true, data: measurement });

  } catch (error) {
    if (error.code === 'VALIDATION_ERROR') return res.status(400).json({ success: false, error: error.message });
    if (error.code === 'NOT_FOUND') return res.status(404).json({ success: false, error: error.message });
    if (error.message.includes('ativo')) return res.status(400).json({ success: false, error: error.message });
    return res.status(500).json({ success: false, error: 'Erro interno do servidor' });
  }
};

module.exports = { addMeasurement };
