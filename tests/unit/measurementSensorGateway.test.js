/**
 * measurementSensorGateway.test.js — Testes de Unidade — Sprint 6
 *
 * Módulo testado: src/services/measurementService.js → recordFromSensor()
 * Duplo utilizado: StubTemperatureSensorGateway (tests/doubles/)
 *
 * Justificação do duplo:
 *   A medição de temperatura é um processo automático — o sistema consulta o gateway
 *   de sensores IoT sem intervenção do utilizador. O STUB é adequado porque o foco
 *   está nos DADOS DEVOLVIDOS pelo sensor (entradas indiretas), não na interação
 *   com o gateway. Configuramos o stub com leituras pré-definidas e verificamos que
 *   o serviço as processa corretamente.
 *
 * Técnicas aplicadas:
 *   PE — Particionamento de Equivalência (leituras normais, críticas, sensor avariado)
 *   VL — Análise de Valores Limite (temperatura no limite e fora do limite)
 */

jest.mock('../../src/models/Batch');
jest.mock('../../src/models/Plan');
jest.mock('../../src/models/Measurement');
jest.mock('../../src/models/Alert');
jest.mock('../../src/services/alertClassifier');

const Batch       = require('../../src/models/Batch');
const Plan        = require('../../src/models/Plan');
const Measurement = require('../../src/models/Measurement');
const Alert       = require('../../src/models/Alert');
const { classifyAlert } = require('../../src/services/alertClassifier');
const { recordFromSensor } = require('../../src/services/measurementService');
const { StubTemperatureSensorGateway } = require('../doubles/StubTemperatureSensorGateway');

// Fixtures reutilizáveis
const activeBatch = { _id: 'batch-01', status: 'ativo', planId: 'plan-01' };
const basePlan    = {
  _id: 'plan-01',
  minTemperature: 18, maxTemperature: 28,
  minHumidity:    40, maxHumidity:    80,
  minLuminosity:  5000, maxLuminosity: 25000
};
const savedMeasurement = { _id: 'meas-01', batchId: 'batch-01' };

beforeEach(() => {
  jest.clearAllMocks();
  Batch.findById     = jest.fn().mockResolvedValue(activeBatch);
  Plan.findById      = jest.fn().mockResolvedValue(basePlan);
  Measurement.create = jest.fn().mockResolvedValue(savedMeasurement);
  Alert.create       = jest.fn().mockResolvedValue({ _id: 'alert-01' });
  classifyAlert.mockReturnValue(null);
});

// ─────────────────────────────────────────────────────────────────────────────
// Comportamento do Stub
// ─────────────────────────────────────────────────────────────────────────────
describe('StubTemperatureSensorGateway — comportamento do duplo', () => {

  // TU_SG01_S6 — Stub devolve leitura configurada com sensorOK=true por defeito
  test('[TU_SG01_S6][PE] stub devolve leitura configurada com sensorOK=true por defeito', async () => {
    const stub = new StubTemperatureSensorGateway({ temperature: 23, humidity: 60, luminosity: 15000 });
    const reading = await stub.getLatestReading();
    expect(reading).toEqual({ temperature: 23, humidity: 60, luminosity: 15000, sensorOK: true });
  });

  // TU_SG02_S6 — Stub respeita sensorOK=false quando configurado explicitamente
  test('[TU_SG02_S6][PE] stub respeita sensorOK=false quando configurado explicitamente', async () => {
    const stub = new StubTemperatureSensorGateway({ temperature: 23, humidity: 60, luminosity: 15000, sensorOK: false });
    const reading = await stub.getLatestReading();
    expect(reading.sensorOK).toBe(false);
  });

  // TU_SG03_S6 — Stub com array avança sequencialmente pelas leituras
  test('[TU_SG03_S6][PE] stub com array devolve leituras em sequência', async () => {
    const readings = [
      { temperature: 20, humidity: 50, luminosity: 10000 },
      { temperature: 35, humidity: 90, luminosity: 2000 }
    ];
    const stub = new StubTemperatureSensorGateway(readings);
    const first  = await stub.getLatestReading();
    const second = await stub.getLatestReading();
    expect(first.temperature).toBe(20);
    expect(second.temperature).toBe(35);
  });

  // TU_SG04_S6 — Stub esgotado repete sempre a última leitura
  test('[TU_SG04_S6][PE] stub esgotado repete sempre a última leitura', async () => {
    const stub = new StubTemperatureSensorGateway({ temperature: 25, humidity: 55, luminosity: 12000 });
    await stub.getLatestReading(); // 1.ª
    const second = await stub.getLatestReading(); // 2.ª — deve repetir
    expect(second.temperature).toBe(25);
  });

  // TU_SG05_S6 — reset() reinicia o índice para a primeira leitura
  test('[TU_SG05_S6][PE] reset() faz o stub devolver novamente a primeira leitura', async () => {
    const stub = new StubTemperatureSensorGateway([
      { temperature: 20, humidity: 50, luminosity: 10000 },
      { temperature: 30, humidity: 70, luminosity: 8000 }
    ]);
    await stub.getLatestReading(); // avança para índice 1
    stub.reset();
    const afterReset = await stub.getLatestReading();
    expect(afterReset.temperature).toBe(20);
  });

});

// ─────────────────────────────────────────────────────────────────────────────
// recordFromSensor — fluxo automático de medição com Stub
// ─────────────────────────────────────────────────────────────────────────────
describe('recordFromSensor — leitura automática via stub (PE + VL)', () => {

  // TU_SG06_S6 — PE: leitura normal → medição guardada sem alerta
  test('[TU_SG06_S6][PE] leitura normal → Measurement.create chamado com dados do stub', async () => {
    const stub = new StubTemperatureSensorGateway({ temperature: 23, humidity: 60, luminosity: 15000 });
    classifyAlert.mockReturnValue(null);

    await recordFromSensor('batch-01', 'user-01', stub);

    expect(Measurement.create).toHaveBeenCalledWith(expect.objectContaining({
      temperature: 23,
      humidity:    60,
      luminosity:  15000,
      batchId:     'batch-01',
      recordedBy:  'user-01'
    }));
    expect(Alert.create).not.toHaveBeenCalled();
  });

  // TU_SG07_S6 — VL: temperatura no limite superior (28 ºC) → sem alerta
  test('[TU_SG07_S6][VL] temperatura no limite superior (28 ºC) → sem alerta', async () => {
    const stub = new StubTemperatureSensorGateway({ temperature: 28, humidity: 60, luminosity: 15000 });
    classifyAlert.mockReturnValue(null);

    await recordFromSensor('batch-01', 'user-01', stub);

    expect(Alert.create).not.toHaveBeenCalled();
  });

  // TU_SG08_S6 — VL: temperatura acima do limite (29 ºC) → alerta Informativo
  test('[TU_SG08_S6][VL] temperatura acima do limite (29 ºC) → alerta Informativo gerado', async () => {
    const stub = new StubTemperatureSensorGateway({ temperature: 29, humidity: 60, luminosity: 15000 });
    classifyAlert.mockReturnValue('Informativo');

    await recordFromSensor('batch-01', 'user-01', stub);

    expect(Alert.create).toHaveBeenCalledWith(expect.objectContaining({ type: 'Informativo' }));
  });

  // TU_SG09_S6 — VL: temperatura abaixo do limite (17 ºC) → alerta Informativo gerado
  test('[TU_SG09_S6][VL] temperatura abaixo do limite (17 ºC) → alerta Informativo gerado', async () => {
    const stub = new StubTemperatureSensorGateway({ temperature: 17, humidity: 60, luminosity: 15000 });
    classifyAlert.mockReturnValue('Informativo');

    await recordFromSensor('batch-01', 'user-01', stub);

    expect(Alert.create).toHaveBeenCalledWith(expect.objectContaining({ type: 'Informativo' }));
  });

  // TU_SG10_S6 — PE: sensor avariado (sensorOK=false) → classifyAlert devolve null → sem alerta
  test('[TU_SG10_S6][PE] sensor avariado (sensorOK=false) → alerta não gerado', async () => {
    const stub = new StubTemperatureSensorGateway({
      temperature: 35, humidity: 90, luminosity: 1000, sensorOK: false
    });
    classifyAlert.mockReturnValue(null);

    await recordFromSensor('batch-01', 'user-01', stub);

    expect(Alert.create).not.toHaveBeenCalled();
  });

  // TU_SG11_S6 — PE: leitura crítica (3 violações) → alerta Crítico gerado
  test('[TU_SG11_S6][PE] leitura crítica (3 violações) → alerta Crítico gerado', async () => {
    const stub = new StubTemperatureSensorGateway({
      temperature: 35, humidity: 90, luminosity: 1000, sensorOK: true
    });
    classifyAlert.mockReturnValue('Crítico');

    await recordFromSensor('batch-01', 'user-01', stub);

    expect(Alert.create).toHaveBeenCalledWith(expect.objectContaining({ type: 'Crítico' }));
  });

  // TU_SG12_S6 — PE: lote não encontrado → stub não impede o erro correto
  test('[TU_SG12_S6][PE] lote não encontrado → erro NOT_FOUND lançado mesmo com stub configurado', async () => {
    Batch.findById = jest.fn().mockResolvedValue(null);
    const stub = new StubTemperatureSensorGateway({ temperature: 23, humidity: 60, luminosity: 15000 });

    const err = await recordFromSensor('batch-inexistente', 'user-01', stub).catch(e => e);
    expect(err.code).toBe('NOT_FOUND');
  });

  // TU_SG13_S6 — PE: lote inativo → erro lançado mesmo com stub configurado
  test('[TU_SG13_S6][PE] lote inativo → erro lançado mesmo com stub configurado', async () => {
    Batch.findById = jest.fn().mockResolvedValue({ _id: 'batch-01', status: 'concluído', planId: 'plan-01' });
    const stub = new StubTemperatureSensorGateway({ temperature: 23, humidity: 60, luminosity: 15000 });

    await expect(recordFromSensor('batch-01', 'user-01', stub))
      .rejects.toThrow('Lote não está ativo');
  });

});
