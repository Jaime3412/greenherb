/**
 * notificationGateway.test.js — Testes de Unidade — Sprint 6
 *
 * Módulo testado: src/services/measurementService.js → recordMeasurement() com notificationGateway
 * Duplo utilizado: MockNotificationGateway (tests/doubles/)
 *
 * Justificação do duplo:
 *   O gateway de notificações é responsável por um efeito lateral observável: alertar
 *   operadores quando condições ambientais são violadas. O MOCK é adequado porque o foco
 *   está na INTERAÇÃO — verificar se sendNotification() foi chamado, com que parâmetros,
 *   e quantas vezes. O Mock regista chamadas e expõe métodos de verificação, ao contrário
 *   do Stub que apenas devolve valores sem verificar comportamento.
 *
 * Técnicas aplicadas:
 *   PE — Particionamento de Equivalência (com/sem alerta, tipos de alerta)
 *   CM — Cobertura de Condições Múltiplas (notificationGateway presente/ausente × alerta gerado/não)
 *
 * ─── Decisão composta: envio de notificação ─────────────────────────────────
 *   C1: alertType != null   (alerta foi gerado pelo classificador)
 *   C2: notificationGateway != null  (gateway fornecido ao serviço)
 *   Notificação enviada apenas se: C1 && C2
 *
 * Tabela MC/DC:
 * | # | C1 (alerta gerado) | C2 (gateway presente) | Notificação enviada | Caso       |
 * |---|--------------------|-----------------------|---------------------|------------|
 * | 1 | false              | false                 | NÃO                 | TU_NG01_S6 |
 * | 2 | false              | true                  | NÃO                 | TU_NG02_S6 |
 * | 3 | true               | false                 | NÃO                 | TU_NG03_S6 |
 * | 4 | true               | true                  | SIM                 | TU_NG04_S6 |
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
const { recordMeasurement } = require('../../src/services/measurementService');
const { MockNotificationGateway } = require('../doubles/MockNotificationGateway');

// Fixtures reutilizáveis
const activeBatch = { _id: 'batch-01', status: 'ativo', planId: 'plan-01' };
const basePlan    = {
  _id: 'plan-01',
  minTemperature: 18, maxTemperature: 28,
  minHumidity:    40, maxHumidity:    80,
  minLuminosity:  5000, maxLuminosity: 25000
};
const normalMeasurement = {
  batchId: 'batch-01', temperature: 23, humidity: 60, luminosity: 15000, sensorOK: true
};
const savedMeasurement = { _id: 'meas-01', ...normalMeasurement };
const savedAlert       = { _id: 'alert-01', type: 'Crítico' };

beforeEach(() => {
  jest.clearAllMocks();
  Batch.findById     = jest.fn().mockResolvedValue(activeBatch);
  Plan.findById      = jest.fn().mockResolvedValue(basePlan);
  Measurement.create = jest.fn().mockResolvedValue(savedMeasurement);
  Alert.create       = jest.fn().mockResolvedValue(savedAlert);
});

// ─────────────────────────────────────────────────────────────────────────────
// Comportamento do Mock
// ─────────────────────────────────────────────────────────────────────────────
describe('MockNotificationGateway — comportamento do duplo', () => {

  // TU_NG_MOCK01_S6 — Mock inicia sem notificações
  test('[TU_NG_MOCK01_S6] mock inicia com zero notificações', () => {
    const mock = new MockNotificationGateway();
    expect(mock.wasNotificationSent()).toBe(false);
    expect(mock.getNotificationCount()).toBe(0);
    expect(mock.getLastNotification()).toBeNull();
  });

  // TU_NG_MOCK02_S6 — Mock regista notificação enviada
  test('[TU_NG_MOCK02_S6] mock regista notificação com todos os campos', async () => {
    const mock = new MockNotificationGateway();
    await mock.sendNotification({ alertType: 'Crítico', batchId: 'b1', alertId: 'a1', message: 'Teste' });

    expect(mock.wasNotificationSent()).toBe(true);
    expect(mock.getNotificationCount()).toBe(1);
    const notif = mock.getLastNotification();
    expect(notif.alertType).toBe('Crítico');
    expect(notif.batchId).toBe('b1');
    expect(notif.sentAt).toBeInstanceOf(Date);
  });

  // TU_NG_MOCK03_S6 — wasNotificationSentWith verifica propriedades parciais
  test('[TU_NG_MOCK03_S6] wasNotificationSentWith verifica subconjunto de propriedades', async () => {
    const mock = new MockNotificationGateway();
    await mock.sendNotification({ alertType: 'Aviso', batchId: 'b2', alertId: 'a2', message: 'X' });

    expect(mock.wasNotificationSentWith({ alertType: 'Aviso' })).toBe(true);
    expect(mock.wasNotificationSentWith({ alertType: 'Crítico' })).toBe(false);
  });

  // TU_NG_MOCK04_S6 — reset() limpa todas as notificações e estado de falha
  test('[TU_NG_MOCK04_S6] reset() repõe o estado inicial do mock', async () => {
    const mock = new MockNotificationGateway();
    await mock.sendNotification({ alertType: 'Aviso', batchId: 'b1', alertId: 'a1', message: 'X' });
    mock.simulateFailure();
    mock.reset();

    expect(mock.wasNotificationSent()).toBe(false);
    await expect(mock.sendNotification({ alertType: 'Info', batchId: 'b1', alertId: 'a1', message: 'Y' }))
      .resolves.not.toThrow();
  });

  // TU_NG_MOCK05_S6 — simulateFailure() faz sendNotification() lançar erro
  test('[TU_NG_MOCK05_S6] simulateFailure() faz sendNotification lançar erro', async () => {
    const mock = new MockNotificationGateway();
    mock.simulateFailure();
    await expect(mock.sendNotification({ alertType: 'Crítico', batchId: 'b1', alertId: 'a1', message: 'X' }))
      .rejects.toThrow('Falha simulada no gateway de notificações');
  });

});

// ─────────────────────────────────────────────────────────────────────────────
// recordMeasurement + MockNotificationGateway — MC/DC
// ─────────────────────────────────────────────────────────────────────────────
describe('recordMeasurement — notificação via mock (PE + CM/MC/DC)', () => {

  // TU_NG01_S6 — C1=false, C2=false → notificação NÃO enviada
  test('[TU_NG01_S6][CM] C1=false (sem alerta), C2=false (sem gateway) → sem notificação', async () => {
    classifyAlert.mockReturnValue(null);

    await recordMeasurement(normalMeasurement, 'user-01', null);

    expect(Alert.create).not.toHaveBeenCalled();
  });

  // TU_NG02_S6 — C1=false, C2=true → notificação NÃO enviada (sem alerta não há chamada)
  test('[TU_NG02_S6][CM] C1=false (sem alerta), C2=true (gateway presente) → sem notificação', async () => {
    classifyAlert.mockReturnValue(null);
    const mock = new MockNotificationGateway();

    await recordMeasurement(normalMeasurement, 'user-01', mock);

    expect(Alert.create).not.toHaveBeenCalled();
    expect(mock.wasNotificationSent()).toBe(false);
  });

  // TU_NG03_S6 — C1=true, C2=false → alerta criado mas notificação NÃO enviada
  test('[TU_NG03_S6][CM] C1=true (alerta gerado), C2=false (sem gateway) → alerta criado, sem notificação', async () => {
    classifyAlert.mockReturnValue('Crítico');

    await recordMeasurement(normalMeasurement, 'user-01', null);

    expect(Alert.create).toHaveBeenCalledTimes(1);
  });

  // TU_NG04_S6 — C1=true, C2=true → alerta criado E notificação enviada (MC/DC completa)
  test('[TU_NG04_S6][CM] C1=true (alerta Crítico), C2=true (gateway presente) → notificação enviada', async () => {
    classifyAlert.mockReturnValue('Crítico');
    const mock = new MockNotificationGateway();

    await recordMeasurement(normalMeasurement, 'user-01', mock);

    expect(Alert.create).toHaveBeenCalledTimes(1);
    expect(mock.wasNotificationSent()).toBe(true);
    expect(mock.getNotificationCount()).toBe(1);

    const notif = mock.getLastNotification();
    expect(notif.alertType).toBe('Crítico');
    expect(notif.batchId).toBe(String(activeBatch._id));
    expect(notif.alertId).toBe(String(savedAlert._id));
    expect(notif.message).toContain('Crítico');
  });

  // TU_NG05_S6 — PE: alerta Aviso → notificação com alertType='Aviso'
  test('[TU_NG05_S6][PE] alerta Aviso → notificação enviada com alertType correto', async () => {
    classifyAlert.mockReturnValue('Aviso');
    const mock = new MockNotificationGateway();

    await recordMeasurement(normalMeasurement, 'user-01', mock);

    expect(mock.wasNotificationSentWith({ alertType: 'Aviso' })).toBe(true);
  });

  // TU_NG06_S6 — PE: alerta Informativo → notificação enviada com alertType='Informativo'
  test('[TU_NG06_S6][PE] alerta Informativo → notificação enviada com alertType correto', async () => {
    classifyAlert.mockReturnValue('Informativo');
    const mock = new MockNotificationGateway();

    await recordMeasurement(normalMeasurement, 'user-01', mock);

    expect(mock.wasNotificationSentWith({ alertType: 'Informativo' })).toBe(true);
  });

  // TU_NG07_S6 — PE: múltiplos alertas → mock regista todas as notificações
  test('[TU_NG07_S6][PE] duas medições com alerta → mock regista duas notificações', async () => {
    classifyAlert.mockReturnValue('Aviso');
    const mock = new MockNotificationGateway();

    await recordMeasurement(normalMeasurement, 'user-01', mock);
    await recordMeasurement(normalMeasurement, 'user-01', mock);

    expect(mock.getNotificationCount()).toBe(2);
  });

  // TU_NG08_S6 — PE: falha no gateway → erro propagado (resiliência)
  test('[TU_NG08_S6][PE] falha no gateway de notificações → erro propagado pelo serviço', async () => {
    classifyAlert.mockReturnValue('Crítico');
    const mock = new MockNotificationGateway();
    mock.simulateFailure();

    await expect(recordMeasurement(normalMeasurement, 'user-01', mock))
      .rejects.toThrow('Falha simulada no gateway de notificações');

    expect(Alert.create).toHaveBeenCalledTimes(1); // alerta é criado antes da falha da notificação
  });

});
