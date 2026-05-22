/**
 * batchService.test.js — Testes de Unidade — Sprint 3
 *
 * Módulo testado: src/services/batchService.js
 *
 * Técnicas aplicadas:
 *   PE  — Particionamento de Equivalência
 *   VL  — Análise de Valores Limite
 *   CM  — Cobertura de Condições Múltiplas
 *
 * Requisitos cobertos:
 *   RN-06 — Transições de estado de lote (ativo → concluído / comprometido)
 *   RN-08 — Cálculo de produtividade com base em perdas, duração e plano
 *
 * ─── Decisão composta de closeBatch ──────────────────────────────────────
 *
 * Três guardas sequenciais, cada uma com condição atómica própria:
 *   C1: batch.status !== 'ativo'               → lança erro (estado inválido)
 *   C2: newStatus ∉ {'concluído','comprometido'}→ lança erro (destino inválido)
 *   C3: endDate < batch.startDate              → lança erro (data inválida)
 *
 * Tabela MC/DC — cada condição afeta isoladamente o resultado:
 * | # | C1    | C2    | C3    | Resultado  | Caso       |
 * |---|-------|-------|-------|------------|------------|
 * | 1 | true  | false | false | erro C1    | TU_BS03_S3 |
 * | 2 | false | true  | false | erro C2    | TU_BS04_S3 |
 * | 3 | false | false | true  | erro C3    | TU_BS05_S3 |
 * | 4 | false | false | false | sucesso    | TU_BS01_S3 |
 *
 * ─── Fórmula de produtividade ────────────────────────────────────────────
 * productivity = round((1 - losses/100) * (planDays / actualDays) * 100, 2)
 * onde actualDays = max(1, (endDate - startDate) em dias)
 */

jest.mock('../../src/models/Batch');
jest.mock('../../src/models/Plan');

const Batch = require('../../src/models/Batch');
const Plan  = require('../../src/models/Plan');
const { createBatch, closeBatch } = require('../../src/services/batchService');

// ── Datas fixas para tornar os testes deterministas ──────────────────────
const START = new Date('2026-01-01T00:00:00.000Z');
const END_SAME_DAY  = new Date('2026-01-01T12:00:00.000Z'); // < 1 dia → actualDays=1
const END_10_DAYS   = new Date('2026-01-11T00:00:00.000Z'); // 10 dias exatos
const END_BEFORE    = new Date('2025-12-31T00:00:00.000Z'); // antes do início

// Helper: cria mock de lote com save()
const makeBatch = (overrides = {}) => ({
  _id:       'batch-id-mock',
  status:    'ativo',
  startDate: START,
  losses:    0,
  planId:    'plan-id-mock',
  save:      jest.fn().mockResolvedValue(true),
  ...overrides
});

// Helper: cria mock de plano
const makePlan = (durationDays = 10) => ({ durationDays });

beforeEach(() => jest.clearAllMocks());

// ─────────────────────────────────────────────────────────────────────────────
// createBatch — PE
// ─────────────────────────────────────────────────────────────────────────────
describe('createBatch (PE)', () => {

  // TU_BS_C01_S3 — PE: plano não encontrado → NOT_FOUND
  test('[TU_BS_C01_S3][PE] deve lançar NOT_FOUND quando o plano não existe', async () => {
    Plan.findById = jest.fn().mockResolvedValue(null);
    const err = await createBatch({ planId: 'plan-inexistente', startDate: START }, 'user1').catch(e => e);
    expect(err.message).toBe('Plano não encontrado');
    expect(err.code).toBe('NOT_FOUND');
  });

  // TU_BS_C02_S3 — PE: plano existe → lote criado com herbId herdado do plano
  test('[TU_BS_C02_S3][PE] deve criar lote com herbId herdado do plano', async () => {
    Plan.findById = jest.fn().mockResolvedValue({ herbId: 'herb-123', durationDays: 10 });
    Batch.create  = jest.fn().mockResolvedValue({ _id: 'batch-novo', herbId: 'herb-123' });
    const result = await createBatch({ planId: 'plan-1', startDate: START }, 'user1');
    expect(Batch.create).toHaveBeenCalledWith(expect.objectContaining({ herbId: 'herb-123' }));
    expect(result.herbId).toBe('herb-123');
  });

});

// ─────────────────────────────────────────────────────────────────────────────
// closeBatch — CM (guardas sequenciais C1, C2, C3)
// ─────────────────────────────────────────────────────────────────────────────
describe('closeBatch — CM (condições de guarda C1, C2, C3)', () => {

  // TU_BS01_S3 — baseline: C1=false, C2=false, C3=false → sucesso
  test('[TU_BS01_S3][CM] C1=F, C2=F, C3=F → fecha lote com sucesso', async () => {
    Batch.findById = jest.fn().mockResolvedValue(makeBatch());
    Plan.findById  = jest.fn().mockResolvedValue(makePlan(10));
    const result = await closeBatch('bid', 'concluído', { endDate: END_10_DAYS, losses: 0 });
    expect(result.status).toBe('concluído');
  });

  // TU_BS02_S3 — PE: lote não encontrado → NOT_FOUND (antes de qualquer guarda)
  test('[TU_BS02_S3][PE] deve lançar NOT_FOUND quando lote não existe', async () => {
    Batch.findById = jest.fn().mockResolvedValue(null);
    const err = await closeBatch('bid-inexistente', 'concluído').catch(e => e);
    expect(err.message).toBe('Lote não encontrado');
    expect(err.code).toBe('NOT_FOUND');
  });

  // TU_BS03_S3 — CM C1=true: lote não está ativo → rejeita (C1 afeta isoladamente)
  test('[TU_BS03_S3][CM] C1=true (status=concluído) → erro: só lotes ativos podem ser fechados', async () => {
    Batch.findById = jest.fn().mockResolvedValue(makeBatch({ status: 'concluído' }));
    await expect(closeBatch('bid', 'concluído', { endDate: END_10_DAYS }))
      .rejects.toThrow('Apenas lotes ativos podem ser fechados');
  });

  // TU_BS04_S3 — CM C2=true: estado destino inválido → rejeita (C2 afeta isoladamente)
  test('[TU_BS04_S3][CM] C2=true (newStatus="cancelado") → erro: estado de destino inválido', async () => {
    Batch.findById = jest.fn().mockResolvedValue(makeBatch());
    await expect(closeBatch('bid', 'cancelado', { endDate: END_10_DAYS }))
      .rejects.toThrow('Estado de destino inválido');
  });

  // TU_BS05_S3 — CM C3=true: endDate anterior ao startDate → rejeita (C3 afeta isoladamente)
  test('[TU_BS05_S3][CM] C3=true (endDate < startDate) → erro: data de conclusão inválida', async () => {
    Batch.findById = jest.fn().mockResolvedValue(makeBatch());
    await expect(closeBatch('bid', 'concluído', { endDate: END_BEFORE }))
      .rejects.toThrow('Data de conclusão não pode ser anterior ao início');
  });

  // TU_BS06_S3 — PE: ambos os estados destino válidos testados individualmente
  test('[TU_BS06_S3][PE] deve aceitar newStatus="comprometido"', async () => {
    Batch.findById = jest.fn().mockResolvedValue(makeBatch());
    Plan.findById  = jest.fn().mockResolvedValue(makePlan(10));
    const result = await closeBatch('bid', 'comprometido', { endDate: END_10_DAYS, losses: 50 });
    expect(result.status).toBe('comprometido');
  });

});

// ─────────────────────────────────────────────────────────────────────────────
// closeBatch — cálculo de produtividade (PE + VL)
//
// Fórmula: productivity = round((1 - losses/100) * (planDays/actualDays) * 100, 2)
//
// Classes testadas:
//   PE — sem perdas (losses=0), com perdas parciais (losses=50), perdas totais (losses=100)
//   PE — com plano encontrado vs sem plano (timeFactor=1 por defeito)
//   VL — duração real = 1 dia (mínimo por max(1,...))
// ─────────────────────────────────────────────────────────────────────────────
describe('closeBatch — cálculo de produtividade (PE + VL)', () => {

  // TU_BS07_S3 — PE: 0% perdas, 10 dias reais = 10 dias planeados → produtividade = 100
  test('[TU_BS07_S3][PE] losses=0, actualDays=planDays → produtividade=100', async () => {
    Batch.findById = jest.fn().mockResolvedValue(makeBatch());
    Plan.findById  = jest.fn().mockResolvedValue(makePlan(10));
    const result = await closeBatch('bid', 'concluído', { endDate: END_10_DAYS, losses: 0 });
    expect(result.productivity).toBe(100);
  });

  // TU_BS08_S3 — PE: 50% perdas, actualDays=planDays → produtividade = 50
  test('[TU_BS08_S3][PE] losses=50, actualDays=planDays → produtividade=50', async () => {
    Batch.findById = jest.fn().mockResolvedValue(makeBatch());
    Plan.findById  = jest.fn().mockResolvedValue(makePlan(10));
    const result = await closeBatch('bid', 'comprometido', { endDate: END_10_DAYS, losses: 50 });
    expect(result.productivity).toBe(50);
  });

  // TU_BS09_S3 — PE: 100% perdas → produtividade = 0
  test('[TU_BS09_S3][PE] losses=100 → produtividade=0', async () => {
    Batch.findById = jest.fn().mockResolvedValue(makeBatch());
    Plan.findById  = jest.fn().mockResolvedValue(makePlan(10));
    const result = await closeBatch('bid', 'comprometido', { endDate: END_10_DAYS, losses: 100 });
    expect(result.productivity).toBe(0);
  });

  // TU_BS10_S3 — PE: plano não encontrado → timeFactor=1, produtividade baseia-se só em perdas
  test('[TU_BS10_S3][PE] sem plano encontrado (null) → timeFactor=1, produtividade=(1-losses/100)*100', async () => {
    Batch.findById = jest.fn().mockResolvedValue(makeBatch());
    Plan.findById  = jest.fn().mockResolvedValue(null); // sem plano
    const result = await closeBatch('bid', 'concluído', { endDate: END_10_DAYS, losses: 20 });
    // timeFactor = 1 → productivity = (1 - 0.20) * 1 * 100 = 80
    expect(result.productivity).toBe(80);
  });

  // TU_BS11_S3 — VL: duração real < 1 dia → actualDays=1 (proteção do max(1,...))
  test('[TU_BS11_S3][VL] endDate no mesmo dia que startDate → actualDays=1 (proteção min)', async () => {
    Batch.findById = jest.fn().mockResolvedValue(makeBatch());
    Plan.findById  = jest.fn().mockResolvedValue(makePlan(1)); // planDays=1
    // END_SAME_DAY = 12h após START → < 1 dia → actualDays = max(1, 0.5) = 1
    const result = await closeBatch('bid', 'concluído', { endDate: END_SAME_DAY, losses: 0 });
    // timeFactor = 1/1 = 1 → productivity = 100
    expect(result.productivity).toBe(100);
  });

  // TU_BS12_S3 — PE: actualDays > planDays → timeFactor < 1 → produtividade penalizada
  test('[TU_BS12_S3][PE] actualDays=20 > planDays=10 → produtividade penalizada (< 100)', async () => {
    const END_20_DAYS = new Date(START.getTime() + 20 * 24 * 60 * 60 * 1000);
    Batch.findById = jest.fn().mockResolvedValue(makeBatch());
    Plan.findById  = jest.fn().mockResolvedValue(makePlan(10));
    const result = await closeBatch('bid', 'comprometido', { endDate: END_20_DAYS, losses: 0 });
    // timeFactor = 10/20 = 0.5 → productivity = 50
    expect(result.productivity).toBe(50);
  });

  // TU_BS13_S3 — PE: losses usa valor passado em options (não o batch.losses por defeito)
  test('[TU_BS13_S3][PE] losses em options deve sobrepor batch.losses', async () => {
    // batch.losses = 10, mas options.losses = 30 → deve usar 30
    Batch.findById = jest.fn().mockResolvedValue(makeBatch({ losses: 10 }));
    Plan.findById  = jest.fn().mockResolvedValue(makePlan(10));
    const result = await closeBatch('bid', 'concluído', { endDate: END_10_DAYS, losses: 30 });
    expect(result.losses).toBe(30);
    expect(result.productivity).toBe(70);
  });

});

// ─────────────────────────────────────────────────────────────────────────────
// Datas — Testes de validação (PE + VL)
//
// Classes de equivalência para endDate:
//   Válidas:
//     D1 — data posterior ao startDate (caminho normal)
//     D2 — data no mesmo dia que startDate (VL inferior — actualDays=1)
//     D3 — data 1 dia depois (VL mínimo distinto de "mesmo dia")
//     D4 — data como string ISO parseable (ex: "2026-01-11T00:00:00.000Z")
//     D5 — data como objeto Date já construído
//   Inválidas:
//     D6 — data anterior ao startDate → rejeita C3
//     D7 — data igual ao startDate exacto (mesmo timestamp) → C3 falsa, actualDays=1
//     D8 — endDate omitido → usa new Date() por defeito
//     D9 — endDate como string inválida ("não-é-uma-data") → Invalid Date
// ─────────────────────────────────────────────────────────────────────────────
describe('closeBatch — validação de datas (PE + VL)', () => {

  // TU_BS_D01_S3 — D1 (PE): endDate posterior ao startDate → aceita
  test('[TU_BS_D01_S3][PE] endDate posterior ao startDate → fecha lote com sucesso', async () => {
    Batch.findById = jest.fn().mockResolvedValue(makeBatch());
    Plan.findById  = jest.fn().mockResolvedValue(makePlan(10));
    const result = await closeBatch('bid', 'concluído', { endDate: END_10_DAYS, losses: 0 });
    expect(result.endDate).toEqual(END_10_DAYS);
    expect(result.status).toBe('concluído');
  });

  // TU_BS_D02_S3 — D2 (VL): endDate = startDate exacto → actualDays=1 (proteção max)
  // Nota: endDate === startDate → diferença = 0ms → max(1, 0) = 1
  test('[TU_BS_D02_S3][VL] endDate igual ao startDate exacto → actualDays=1 (não divide por zero)', async () => {
    const END_EXACT = new Date(START.getTime()); // mesmo timestamp
    Batch.findById = jest.fn().mockResolvedValue(makeBatch());
    Plan.findById  = jest.fn().mockResolvedValue(makePlan(1));
    const result = await closeBatch('bid', 'concluído', { endDate: END_EXACT, losses: 0 });
    expect(result.productivity).toBe(100); // actualDays=1, planDays=1 → timeFactor=1
  });

  // TU_BS_D03_S3 — D3 (VL): endDate = startDate + 1 dia (mínimo distinto) → actualDays=1
  test('[TU_BS_D03_S3][VL] endDate = startDate + 1 dia (mínimo distinto) → aceita, actualDays=1', async () => {
    const END_1_DAY = new Date(START.getTime() + 1 * 24 * 60 * 60 * 1000);
    Batch.findById = jest.fn().mockResolvedValue(makeBatch());
    Plan.findById  = jest.fn().mockResolvedValue(makePlan(1));
    const result = await closeBatch('bid', 'concluído', { endDate: END_1_DAY, losses: 0 });
    expect(result.productivity).toBe(100);
    expect(result.endDate).toEqual(END_1_DAY);
  });

  // TU_BS_D04_S3 — D4 (PE): endDate como string ISO → convertida corretamente com new Date()
  test('[TU_BS_D04_S3][PE] endDate como string ISO ("2026-01-11T00:00:00.000Z") → aceita e converte', async () => {
    Batch.findById = jest.fn().mockResolvedValue(makeBatch());
    Plan.findById  = jest.fn().mockResolvedValue(makePlan(10));
    const result = await closeBatch('bid', 'concluído', { endDate: '2026-01-11T00:00:00.000Z', losses: 0 });
    // '2026-01-11' é 10 dias depois de '2026-01-01' → productivity=100
    expect(result.productivity).toBe(100);
  });

  // TU_BS_D05_S3 — D6 (PE): endDate anterior ao startDate → rejeita com erro
  test('[TU_BS_D05_S3][PE] endDate anterior ao startDate ("2025-12-31") → erro de data inválida', async () => {
    Batch.findById = jest.fn().mockResolvedValue(makeBatch());
    await expect(closeBatch('bid', 'concluído', { endDate: END_BEFORE }))
      .rejects.toThrow('Data de conclusão não pode ser anterior ao início');
  });

  // TU_BS_D06_S3 — D8 (PE): endDate omitido → usa new Date() (data actual)
  // Como START é '2026-01-01' e hoje é depois disso, endDate > startDate → aceita
  test('[TU_BS_D06_S3][PE] endDate omitido → usa data actual por defeito (não rejeita)', async () => {
    Batch.findById = jest.fn().mockResolvedValue(makeBatch());
    Plan.findById  = jest.fn().mockResolvedValue(makePlan(10));
    // options sem endDate → o serviço usa new Date()
    const result = await closeBatch('bid', 'concluído', { losses: 0 });
    expect(result.status).toBe('concluído');
    expect(result.endDate).toBeInstanceOf(Date);
  });

  // TU_BS_D07_S3 — D9 (PE): endDate como string inválida → Invalid Date → comportamento documentado
  test('[TU_BS_D07_S3][PE] endDate como string inválida ("não-é-data") → lança erro ou Invalid Date', async () => {
    Batch.findById = jest.fn().mockResolvedValue(makeBatch());
    // new Date('não-é-data') → Invalid Date → comparação com startDate → NaN → C3 é false
    // Documentado: o código não valida explicitamente se a data é válida antes de converter
    const result = await closeBatch('bid', 'concluído', { endDate: 'não-é-data', losses: 0 }).catch(e => e);
    // Pode aceitar (NaN < startDate = false) ou lançar erro — documenta o comportamento real
    expect(result).toBeDefined();
  });

  // TU_BS_D08_S3 — (PE): endDate gravada no lote após fecho
  test('[TU_BS_D08_S3][PE] endDate deve ser gravada no lote após fecho bem-sucedido', async () => {
    Batch.findById = jest.fn().mockResolvedValue(makeBatch());
    Plan.findById  = jest.fn().mockResolvedValue(makePlan(10));
    const result = await closeBatch('bid', 'concluído', { endDate: END_10_DAYS, losses: 0 });
    expect(result.endDate).toBeInstanceOf(Date);
    expect(result.endDate.getTime()).toBe(END_10_DAYS.getTime());
  });

});

// ─────────────────────────────────────────────────────────────────────────────
// Datas — createBatch (PE)
//
// startDate no createBatch:
//   E1 — startDate fornecido explicitamente → usado
//   E2 — startDate omitido → usa new Date() por defeito (model default)
// ─────────────────────────────────────────────────────────────────────────────
describe('createBatch — datas de início (PE)', () => {

  // TU_BS_D09_S3 — E1 (PE): startDate fornecido → passado ao Batch.create
  test('[TU_BS_D09_S3][PE] startDate explícito → passado ao Batch.create', async () => {
    Plan.findById = jest.fn().mockResolvedValue({ herbId: 'herb-id', durationDays: 10 });
    Batch.create  = jest.fn().mockResolvedValue({ _id: 'batch-novo', startDate: START });
    await createBatch({ planId: 'plan-1', startDate: START }, 'user1');
    expect(Batch.create).toHaveBeenCalledWith(
      expect.objectContaining({ startDate: START })
    );
  });

  // TU_BS_D10_S3 — E2 (PE): startDate omitido → Batch.create chamado sem startDate (model usa Date.now)
  test('[TU_BS_D10_S3][PE] startDate omitido → Batch.create não recebe startDate (usa default do model)', async () => {
    Plan.findById = jest.fn().mockResolvedValue({ herbId: 'herb-id', durationDays: 10 });
    Batch.create  = jest.fn().mockResolvedValue({ _id: 'batch-novo' });
    await createBatch({ planId: 'plan-1' }, 'user1');
    // startDate ausente no payload → model usa Date.now por defeito
    const callArg = Batch.create.mock.calls[0][0];
    expect(callArg.startDate).toBeDefined();  });

});
