const { createBatch, getBatchById, closeBatch } = require('../services/batchService');
const { log } = require('../services/auditService');

const addBatch = async (req, res) => {
  try {
    const batch = await createBatch(req.body, req.user.id);
    await log(req.user.id, 'CREATE_BATCH', 'batches', batch._id);
    return res.status(201).json({ success: true, data: batch });

  } catch (error) {
    if (error.code === 'VALIDATION_ERROR') return res.status(400).json({ success: false, error: error.message });
    if (error.code === 'NOT_FOUND') return res.status(404).json({ success: false, error: error.message });
    return res.status(500).json({ success: false, error: 'Erro interno do servidor' });
  }
};

const getBatch = async (req, res) => {
  try {
    const batch = await getBatchById(req.params.id);
    if (!batch) return res.status(404).json({ success: false, error: 'Lote não encontrado' });
    return res.status(200).json({ success: true, data: batch });
  } catch {
    return res.status(500).json({ success: false, error: 'Erro interno do servidor' });
  }
};

const updateBatch = async (req, res) => {
  try {
    const { status, losses, endDate } = req.body;
    const batch = await closeBatch(req.params.id, status, { losses, endDate });
    await log(req.user.id, 'CLOSE_BATCH', 'batches', batch._id);
    return res.status(200).json({ success: true, data: batch });

  } catch (error) {
    if (error.code === 'NOT_FOUND') return res.status(404).json({ success: false, error: error.message });
    if (error.message.includes('ativo') || error.message.includes('inválido') || error.message.includes('anterior')) {
      return res.status(400).json({ success: false, error: error.message });
    }
    return res.status(500).json({ success: false, error: 'Erro interno do servidor' });
  }
};

module.exports = { addBatch, getBatch, updateBatch };
