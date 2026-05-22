const Measurement = require('../models/Measurement');
const Alert = require('../models/Alert');
const Batch = require('../models/Batch');
const Plan = require('../models/Plan');
const { classifyAlert } = require('./alertClassifier');

const recordMeasurement = async (data, userId) => {
  if (!data || !data.batchId) {
    const err = new Error('batchId é obrigatório');
    err.code = 'VALIDATION_ERROR';
    throw err;
  }

  const batch = await Batch.findById(data.batchId);
  if (!batch) {
    const err = new Error('Lote não encontrado');
    err.code = 'NOT_FOUND';
    throw err;
  }
  if (batch.status !== 'ativo') throw new Error('Lote não está ativo');

  const measurement = await Measurement.create({ ...data, recordedBy: userId });

  const plan = await Plan.findById(batch.planId);
  if (plan) {
    const alertType = classifyAlert(data, plan);
    if (alertType) {
      await Alert.create({
        batchId:       batch._id,
        measurementId: measurement._id,
        type:          alertType
      });
    }
  }

  return measurement;
};

module.exports = { recordMeasurement };
