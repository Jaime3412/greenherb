/**
 * measurementService.test.js — Testes de Unidade — Sprint 3
 *
 * Módulo testado: src/services/measurementService.js
 *
 * Técnicas aplicadas:
 *   PE  — Particionamento de Equivalência
 *   CM  — Cobertura de Condições Múltiplas
 *
 * Requisitos cobertos:
 *   RF-05 — Registo de medições ambientais
 *   RN-03 — Geração automática de alertas quando medição viola limites do plano
 *
 * ─── Decisão composta de recordMeasurement ───────────────────────────────
 *
 * Duas decisões sequenciais:
 *   D1 — Lote válido para medição:
 *     C1: batch não existe (null)         → NOT_FOUND
 *     C2: batch.status !== 'ativo'        → erro
 *
 *   D2 — Geração de alerta:
 *     C3: plan existe (não null)          → classifyAlert é chamado
 *     C4: classifyAlert devolve não-null  → Alert.create é chamado
 *
 * Tabela MC/DC — D2 (geração de alerta):
 * | # | C3 (plan existe) | C4 (alertType != null) | Alert.create | Caso        |
 * |---|------------------|------------------------|--------------|-------------|
 * | 1 | false            | —                      | NÃO          | TU_MS05_S3  |
 * | 2 | true             | false                  | NÃO          | TU_MS06_S3  |
 * | 3 | true             | true                   | SIM          | TU_MS04_S3  |
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

// Medição base válida
const baseMeasurement = {
  batchId:     'batch-id-mock',
  temperature: 23,
  humidity:    60,
  luminosity:  15000,
  sensorOK:    true
};

// Plano base com limites normais
const basePlan = {
  _id:            'plan-id-mock',
  minTemperature: 18, maxTemperature: 28,
  minHumidity:    40, maxHumidity:    80,
  minLuminosity:  5000, maxLuminosity: 25000
};

// Mock de medição guardada
const savedMeasurement = { _id: 'meas-id-mock', ...baseMeasurement };

beforeEach(() => jest.clearAllMocks());

// ─────────────────────────────────────────────────────────────────────────────
// PE — Validação do lote (D1)
// ─────────────────────────────────────────────────────────────────────────────
describe('recordMeasurement — validação do lote (PE)', () => {

  // TU_MS01_S3 — PE: lote não encontrado → NOT_FOUND
  test('[TU_MS01_S3][PE] deve lançar NOT_FOUND quando o lote não existe', async () => {
    Batch.findById = jest.fn().mockResolvedValue(null);
    const err = await recordMeasurement(baseMeasurement, 'user1').catch(e => e);
    expect(err.message).toBe('Lote não encontrado');
    expect(err.code).toBe('NOT_FOUND');
  });

  // TU_MS02_S3 — PE: lote com status 'concluído' (não ativo) → erro
  test('[TU_MS02_S3][PE] deve rejeitar medição em lote concluído', async () => {
    Batch.findById = jest.fn().mockResolvedValue({ status: 'concluído', planId: 'plan-id-mock' });
    await expect(recordMeasurement(baseMeasurement, 'user1'))
      .rejects.toThrow('Lote não está ativo');
  });

  // TU_MS03_S3 — PE: lote com status 'comprometido' (não ativo) → erro
  test('[TU_MS03_S3][PE] deve rejeitar medição em lote comprometido', async () => {
    Batch.findById = jest.fn().mockResolvedValue({ status: 'comprometido', planId: 'plan-id-mock' });
    await expect(recordMeasurement(baseMeasurement, 'user1'))
      .rejects.toThrow('Lote não está ativo');
  });

});

// ─────────────────────────────────────────────────────────────────────────────
// PE + CM — Geração automática de alertas (D2)
// ─────────────────────────────────────────────────────────────────────────────
describe('recordMeasurement — geração de alerta (PE + CM)', () => {

  // TU_MS04_S3 — CM: C3=true (plan existe), C4=true (classifyAlert='Crítico') → Alert.create chamado
  test('[TU_MS04_S3][CM] C3=true, C4=true → alerta criado com tipo correto', async () => {
    Batch.findById      = jest.fn().mockResolvedValue({ _id: 'batch-id-mock', status: 'ativo', planId: 'plan-id-mock' });
    Plan.findById       = jest.fn().mockResolvedValue(basePlan);
    Measurement.create  = jest.fn().mockResolvedValue(savedMeasurement);
    Alert.create        = jest.fn().mockResolvedValue({});
    classifyAlert.mockReturnValue('Crítico');

    await recordMeasurement(baseMeasurement, 'user1');

    expect(Alert.create).toHaveBeenCalledTimes(1);
    expect(Alert.create).toHaveBeenCalledWith(expect.objectContaining({
      batchId:       'batch-id-mock',
      measurementId: 'meas-id-mock',
      type:          'Crítico'
    }));
  });

  // TU_MS05_S3 — CM: C3=false (plan=null) → classifyAlert NÃO é chamado, Alert.create NÃO é chamado
  test('[TU_MS05_S3][CM] C3=false (plan=null) → sem alerta gerado', async () => {
    Batch.findById      = jest.fn().mockResolvedValue({ _id: 'batch-id-mock', status: 'ativo', planId: 'plan-id-mock' });
    Plan.findById       = jest.fn().mockResolvedValue(null);
    Measurement.create  = jest.fn().mockResolvedValue(savedMeasurement);
    Alert.create        = jest.fn();

    await recordMeasurement(baseMeasurement, 'user1');

    expect(classifyAlert).not.toHaveBeenCalled();
    expect(Alert.create).not.toHaveBeenCalled();
  });

  // TU_MS06_S3 — CM: C3=true (plan existe), C4=false (classifyAlert=null) → Alert.create NÃO chamado
  test('[TU_MS06_S3][CM] C3=true, C4=false (sem violação) → alerta não criado', async () => {
    Batch.findById      = jest.fn().mockResolvedValue({ _id: 'batch-id-mock', status: 'ativo', planId: 'plan-id-mock' });
    Plan.findById       = jest.fn().mockResolvedValue(basePlan);
    Measurement.create  = jest.fn().mockResolvedValue(savedMeasurement);
    Alert.create        = jest.fn();
    classifyAlert.mockReturnValue(null); // sem violação

    await recordMeasurement(baseMeasurement, 'user1');

    expect(classifyAlert).toHaveBeenCalledTimes(1);
    expect(Alert.create).not.toHaveBeenCalled();
  });

});

// ─────────────────────────────────────────────────────────────────────────────
// PE — Medição guardada e retornada corretamente
// ─────────────────────────────────────────────────────────────────────────────
describe('recordMeasurement — dados guardados (PE)', () => {

  // TU_MS07_S3 — PE: medição válida → Measurement.create chamado com recordedBy
  test('[TU_MS07_S3][PE] deve guardar medição com recordedBy preenchido', async () => {
    Batch.findById      = jest.fn().mockResolvedValue({ _id: 'batch-id-mock', status: 'ativo', planId: 'plan-id-mock' });
    Plan.findById       = jest.fn().mockResolvedValue(basePlan);
    Measurement.create  = jest.fn().mockResolvedValue(savedMeasurement);
    Alert.create        = jest.fn();
    classifyAlert.mockReturnValue(null);

    await recordMeasurement(baseMeasurement, 'user-xyz');

    expect(Measurement.create).toHaveBeenCalledWith(
      expect.objectContaining({ recordedBy: 'user-xyz' })
    );
  });

  // TU_MS08_S3 — PE: função retorna o objeto medição criado
  test('[TU_MS08_S3][PE] deve retornar o objeto medição criado', async () => {
    Batch.findById      = jest.fn().mockResolvedValue({ _id: 'batch-id-mock', status: 'ativo', planId: 'plan-id-mock' });
    Plan.findById       = jest.fn().mockResolvedValue(basePlan);
    Measurement.create  = jest.fn().mockResolvedValue(savedMeasurement);
    classifyAlert.mockReturnValue(null);

    const result = await recordMeasurement(baseMeasurement, 'user1');
    expect(result).toEqual(savedMeasurement);
  });

  // TU_MS09_S3 — PE: tipo de alerta 'Informativo' → Alert.create com tipo correto
  test('[TU_MS09_S3][PE] classifyAlert="Informativo" → alerta do tipo Informativo criado', async () => {
    Batch.findById      = jest.fn().mockResolvedValue({ _id: 'batch-id-mock', status: 'ativo', planId: 'plan-id-mock' });
    Plan.findById       = jest.fn().mockResolvedValue(basePlan);
    Measurement.create  = jest.fn().mockResolvedValue(savedMeasurement);
    Alert.create        = jest.fn().mockResolvedValue({});
    classifyAlert.mockReturnValue('Informativo');

    await recordMeasurement(baseMeasurement, 'user1');
    expect(Alert.create).toHaveBeenCalledWith(expect.objectContaining({ type: 'Informativo' }));
  });

  // TU_MS10_S3 — PE: tipo de alerta 'Aviso' → Alert.create com tipo correto
  test('[TU_MS10_S3][PE] classifyAlert="Aviso" → alerta do tipo Aviso criado', async () => {
    Batch.findById      = jest.fn().mockResolvedValue({ _id: 'batch-id-mock', status: 'ativo', planId: 'plan-id-mock' });
    Plan.findById       = jest.fn().mockResolvedValue(basePlan);
    Measurement.create  = jest.fn().mockResolvedValue(savedMeasurement);
    Alert.create        = jest.fn().mockResolvedValue({});
    classifyAlert.mockReturnValue('Aviso');

    await recordMeasurement(baseMeasurement, 'user1');
    expect(Alert.create).toHaveBeenCalledWith(expect.objectContaining({ type: 'Aviso' }));
  });

});
