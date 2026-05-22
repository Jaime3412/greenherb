/**
 * planService.test.js — Testes de Unidade — Sprint 3
 *
 * Módulo testado: src/services/planService.js
 *
 * Técnicas aplicadas:
 *   PE  — Particionamento de Equivalência
 *   CM  — Cobertura de Condições Múltiplas
 *
 * Requisitos cobertos:
 *   RF-04 — Criação de planos de cultivo (regular, emergência, pontual)
 *   RN-14 — Plano pontual requer autorização do Responsável Técnico
 *
 * ─── Decisão composta de createPlan ──────────────────────────────────────
 *
 * Duas guardas sequenciais:
 *   C1: validatePlan().isValid === false  → lança VALIDATION_ERROR com lista de erros
 *   C2: Herb.findById() === null          → lança NOT_FOUND
 *
 * Tabela MC/DC:
 * | # | C1    | C2    | Resultado         | Caso        |
 * |---|-------|-------|-------------------|-------------|
 * | 0 | false | false | Plan.create ok    | TU_PS01_S3  |
 * | 1 | true  | false | erro C1           | TU_PS02_S3  |
 * | 2 | false | true  | erro C2           | TU_PS03_S3  |
 */

jest.mock('../../src/models/Plan');
jest.mock('../../src/models/Herb');
jest.mock('../../src/validators/planValidator');

const Plan  = require('../../src/models/Plan');
const Herb  = require('../../src/models/Herb');
const { validatePlan } = require('../../src/validators/planValidator');
const { createPlan, getPlans, getPlanById } = require('../../src/services/planService');

// Plano base válido para passar ao serviço
const validPlanData = {
  type:           'regular',
  herbId:         'herb-id-mock',
  minTemperature: 18, maxTemperature: 28,
  minHumidity:    40, maxHumidity:    80,
  minLuminosity:  5000, maxLuminosity: 25000,
  durationDays:   90
};

beforeEach(() => jest.clearAllMocks());

// ─────────────────────────────────────────────────────────────────────────────
// createPlan — CM (guardas C1 e C2)
// ─────────────────────────────────────────────────────────────────────────────
describe('createPlan — CM (C1: validação, C2: erva existe)', () => {

  // TU_PS01_S3 — CM baseline: C1=false, C2=false → plano criado com sucesso
  test('[TU_PS01_S3][CM] C1=F, C2=F → plano criado com sucesso', async () => {
    validatePlan.mockReturnValue({ isValid: true, errors: [] });
    Herb.findById  = jest.fn().mockResolvedValue({ _id: 'herb-id-mock', commonName: 'Hortelã' });
    Plan.create    = jest.fn().mockResolvedValue({ _id: 'plan-id-mock', ...validPlanData });

    const result = await createPlan(validPlanData, 'user-resp');

    expect(Plan.create).toHaveBeenCalledTimes(1);
    expect(result._id).toBe('plan-id-mock');
  });

  // TU_PS02_S3 — CM C1=true: validação falha → lança VALIDATION_ERROR com lista de erros
  test('[TU_PS02_S3][CM] C1=true (validação falha) → lança VALIDATION_ERROR com erros', async () => {
    validatePlan.mockReturnValue({
      isValid: false,
      errors:  ['Temperatura mínima deve estar entre 18 e 28 °C']
    });

    const err = await createPlan({ ...validPlanData, minTemperature: 5 }, 'user-resp').catch(e => e);

    expect(err.message).toBe('Validação falhou');
    expect(err.code).toBe('VALIDATION_ERROR');
    expect(err.errors).toContain('Temperatura mínima deve estar entre 18 e 28 °C');
    // C2 não deve ser avaliado quando C1=true
    expect(Herb.findById).not.toHaveBeenCalled();
  });

  // TU_PS03_S3 — CM C2=true: erva não encontrada → lança NOT_FOUND
  test('[TU_PS03_S3][CM] C2=true (erva não encontrada) → lança NOT_FOUND', async () => {
    validatePlan.mockReturnValue({ isValid: true, errors: [] });
    Herb.findById = jest.fn().mockResolvedValue(null); // C2=true

    const err = await createPlan(validPlanData, 'user-resp').catch(e => e);

    expect(err.message).toBe('Erva aromática não encontrada');
    expect(err.code).toBe('NOT_FOUND');
    expect(Plan.create).not.toHaveBeenCalled();
  });

});

// ─────────────────────────────────────────────────────────────────────────────
// createPlan — PE (tipos de plano e dados passados ao Plan.create)
// ─────────────────────────────────────────────────────────────────────────────
describe('createPlan — PE (tipos de plano e dados gravados)', () => {

  // TU_PS04_S3 — PE: plano regular → Plan.create chamado com createdBy
  test('[TU_PS04_S3][PE] deve passar createdBy ao Plan.create', async () => {
    validatePlan.mockReturnValue({ isValid: true, errors: [] });
    Herb.findById = jest.fn().mockResolvedValue({ _id: 'herb-id-mock' });
    Plan.create   = jest.fn().mockResolvedValue({ _id: 'plan-id-mock' });

    await createPlan(validPlanData, 'user-resp-id');

    expect(Plan.create).toHaveBeenCalledWith(
      expect.objectContaining({ createdBy: 'user-resp-id' })
    );
  });

  // TU_PS05_S3 — PE: plano de emergência → aceite (não exige autorização)
  test('[TU_PS05_S3][PE] plano de emergência sem authorização → aceite pelo serviço', async () => {
    validatePlan.mockReturnValue({ isValid: true, errors: [] });
    Herb.findById = jest.fn().mockResolvedValue({ _id: 'herb-id-mock' });
    Plan.create   = jest.fn().mockResolvedValue({ _id: 'plan-em-id', type: 'emergencia' });

    const result = await createPlan({ ...validPlanData, type: 'emergencia' }, 'user-resp');

    expect(result.type).toBe('emergencia');
  });

  // TU_PS06_S3 — PE: plano pontual com autorização → aceite
  test('[TU_PS06_S3][PE] plano pontual com responsibleAuth → aceite pelo serviço', async () => {
    validatePlan.mockReturnValue({ isValid: true, errors: [] });
    Herb.findById = jest.fn().mockResolvedValue({ _id: 'herb-id-mock' });
    Plan.create   = jest.fn().mockResolvedValue({ _id: 'plan-pt-id', type: 'pontual' });

    const result = await createPlan(
      { ...validPlanData, type: 'pontual', responsibleAuth: 'João Responsável' },
      'user-resp'
    );

    expect(result.type).toBe('pontual');
  });

  // TU_PS07_S3 — PE: validatePlan é sempre chamado antes de qualquer operação BD
  test('[TU_PS07_S3][PE] validatePlan deve ser invocado antes de Herb.findById', async () => {
    const callOrder = [];
    validatePlan.mockImplementation(() => { callOrder.push('validatePlan'); return { isValid: true, errors: [] }; });
    Herb.findById = jest.fn().mockImplementation(async () => { callOrder.push('Herb.findById'); return { _id: 'herb-id' }; });
    Plan.create   = jest.fn().mockResolvedValue({ _id: 'plan-id' });

    await createPlan(validPlanData, 'user-1');

    expect(callOrder[0]).toBe('validatePlan');
    expect(callOrder[1]).toBe('Herb.findById');
  });

});

// ─────────────────────────────────────────────────────────────────────────────
// getPlans e getPlanById — PE
// ─────────────────────────────────────────────────────────────────────────────
describe('getPlans e getPlanById — PE', () => {

  // TU_PS08_S3 — PE: getPlans chama populate em herbId e createdBy
  test('[TU_PS08_S3][PE] getPlans deve chamar populate em herbId e createdBy', async () => {
    const mockQuery = {
      populate: jest.fn().mockReturnThis()
    };
    // segundo populate retorna a lista
    let callCount = 0;
    mockQuery.populate.mockImplementation(() => {
      callCount++;
      return callCount === 2 ? Promise.resolve([]) : mockQuery;
    });
    Plan.find = jest.fn().mockReturnValue(mockQuery);

    await getPlans();

    expect(mockQuery.populate).toHaveBeenCalledWith('herbId', 'commonName scientificName');
    expect(mockQuery.populate).toHaveBeenCalledWith('createdBy', 'name role');
  });

  // TU_PS09_S3 — PE: getPlanById chama Plan.findById com o id correto
  test('[TU_PS09_S3][PE] getPlanById deve chamar Plan.findById com o id fornecido', async () => {
    Plan.findById = jest.fn().mockResolvedValue({ _id: 'plan-123', type: 'regular' });

    const result = await getPlanById('plan-123');

    expect(Plan.findById).toHaveBeenCalledWith('plan-123');
    expect(result._id).toBe('plan-123');
  });

  // TU_PS10_S3 — PE: getPlanById devolve null quando plano não existe
  test('[TU_PS10_S3][PE] getPlanById deve devolver null quando plano não existe', async () => {
    Plan.findById = jest.fn().mockResolvedValue(null);

    const result = await getPlanById('plan-inexistente');

    expect(result).toBeNull();
  });

});
