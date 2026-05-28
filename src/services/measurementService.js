const Measurement = require('../models/Measurement');
const Alert = require('../models/Alert');
const Batch = require('../models/Batch');
const Plan = require('../models/Plan');
const { classifyAlert } = require('./alertClassifier');

/**
 * Regista uma medição ambiental e gera alerta se os limites do plano forem violados.
 *
 * @param {object} data - Dados da medição (batchId, temperature, humidity, luminosity, sensorOK).
 * @param {string} userId - ID do utilizador que regista a medição.
 * @param {import('../gateways/NotificationGateway').NotificationGateway|null} notificationGateway
 *   Gateway de notificações (opcional). Se fornecido, será chamado sempre que um alerta for gerado.
 *   Em produção passa-se a implementação real; em testes passa-se o MockNotificationGateway.
 */
const recordMeasurement = async (data, userId, notificationGateway = null) => {
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
      const alert = await Alert.create({
        batchId:       batch._id,
        measurementId: measurement._id,
        type:          alertType
      });

      if (notificationGateway) {
        await notificationGateway.sendNotification({
          alertType,
          batchId:  String(batch._id),
          alertId:  String(alert._id),
          message:  `Alerta ${alertType} gerado para o lote ${batch._id}`
        });
      }
    }
  }

  return measurement;
};

/**
 * Lê automaticamente os dados do sensor através do gateway e regista a medição.
 *
 * Esta função representa o fluxo automático de medição: o sistema consulta o gateway
 * de sensores (hardware IoT) e regista a leitura obtida sem intervenção do utilizador.
 *
 * Em testes, sensorGateway é substituído pelo StubTemperatureSensorGateway,
 * que devolve leituras pré-configuradas em vez de aceder ao hardware real.
 *
 * @param {string} batchId - ID do lote a associar à medição.
 * @param {string} userId - ID do utilizador/sistema que despoleta a leitura.
 * @param {import('../gateways/TemperatureSensorGateway').TemperatureSensorGateway} sensorGateway
 *   Gateway de sensores. Em produção é a implementação IoT real; em testes é o Stub.
 * @param {import('../gateways/NotificationGateway').NotificationGateway|null} notificationGateway
 *   Gateway de notificações (opcional).
 */
const recordFromSensor = async (batchId, userId, sensorGateway, notificationGateway = null) => {
  const reading = await sensorGateway.getLatestReading();
  return recordMeasurement({ ...reading, batchId }, userId, notificationGateway);
};

module.exports = { recordMeasurement, recordFromSensor };
