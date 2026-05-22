const Batch = require('../models/Batch');
const Plan = require('../models/Plan');

const createBatch = async (data, userId) => {
  if (!data || !data.planId) {
    const err = new Error('planId é obrigatório');
    err.code = 'VALIDATION_ERROR';
    throw err;
  }

  const plan = await Plan.findById(data.planId);
  if (!plan) {
    const err = new Error('Plano não encontrado');
    err.code = 'NOT_FOUND';
    throw err;
  }

  return Batch.create({
    herbId:    plan.herbId,
    planId:    data.planId,
    startDate: data.startDate || new Date(),
    createdBy: userId
  });
};

const getBatchById = async (id) =>
  Batch.findById(id)
    .populate('planId', 'type durationDays minTemperature maxTemperature minHumidity maxHumidity')
    .populate('herbId', 'commonName scientificName');

/**
 * Fecha um lote ativo, calculando a produtividade.
 *
 * Decisão composta (caixa-branca):
 *   C1: batch.status !== 'ativo'      → rejeita
 *   C2: newState inválido             → rejeita
 *   C3: endDate < startDate           → rejeita
 */
const closeBatch = async (batchId, newStatus, options = {}) => {
  const batch = await Batch.findById(batchId);
  if (!batch) {
    const err = new Error('Lote não encontrado');
    err.code = 'NOT_FOUND';
    throw err;
  }

  if (batch.status !== 'ativo') throw new Error('Apenas lotes ativos podem ser fechados');
  if (!['concluído', 'comprometido'].includes(newStatus)) throw new Error('Estado de destino inválido');

  const endDate = options.endDate ? new Date(options.endDate) : new Date();
  if (endDate < batch.startDate) throw new Error('Data de conclusão não pode ser anterior ao início');

  const losses = options.losses !== undefined ? options.losses : batch.losses;

  const plan = await Plan.findById(batch.planId);
  const actualDays = Math.max(1, (endDate - batch.startDate) / (1000 * 60 * 60 * 24));
  const timeFactor = plan ? plan.durationDays / actualDays : 1;
  const productivity = Math.round((1 - losses / 100) * timeFactor * 100 * 100) / 100;

  batch.status = newStatus;
  batch.endDate = endDate;
  batch.losses = losses;
  batch.productivity = productivity;
  await batch.save();
  return batch;
};

module.exports = { createBatch, getBatchById, closeBatch };
