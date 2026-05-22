const Alert = require('../models/Alert');

const getAlerts = async (batchId) => {
  const filter = batchId ? { batchId } : {};
  return Alert.find(filter)
    .populate('measurementId', 'temperature humidity luminosity timestamp')
    .populate('resolvedBy', 'name role');
};

/**
 * Resolve ou ignora um alerta.
 *
 * Regra de negócio (RN-05):
 *   - 'resolvido' → justificação opcional
 *   - 'ignorado'  → justificação obrigatória [10, 500] chars
 */
const resolveAlert = async (alertId, resolution, justification, userId) => {
  const alert = await Alert.findById(alertId);
  if (!alert) {
    const err = new Error('Alerta não encontrado');
    err.code = 'NOT_FOUND';
    throw err;
  }
  if (alert.status !== 'pendente') throw new Error('Alerta já foi resolvido ou ignorado');

  if (!['resolvido', 'ignorado'].includes(resolution)) {
    const err = new Error('Resolução inválida. Use "resolvido" ou "ignorado"');
    err.code = 'VALIDATION_ERROR';
    throw err;
  }

  if (resolution === 'ignorado') {
    const len = justification ? justification.trim().length : 0;
    if (len < 10) {
      const err = new Error('Justificação obrigatória para ignorar alerta (mínimo 10 caracteres)');
      err.code = 'VALIDATION_ERROR';
      throw err;
    }
    if (len > 500) {
      const err = new Error('Justificação não pode exceder 500 caracteres');
      err.code = 'VALIDATION_ERROR';
      throw err;
    }
  }

  alert.status      = resolution;
  alert.justification = justification ? justification.trim() : null;
  alert.resolvedBy  = userId;
  alert.resolvedAt  = new Date();
  await alert.save();
  return alert;
};

module.exports = { getAlerts, resolveAlert };
