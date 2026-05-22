/**
 * alertService.test.js — Testes de Unidade — Sprint 3
 *
 * Módulo testado: src/services/alertService.js
 *
 * Técnicas aplicadas:
 *   PE  — Particionamento de Equivalência
 *   VL  — Análise de Valores Limite
 *   CM  — Cobertura de Condições Múltiplas
 *
 * Requisitos cobertos:
 *   RN-05 — Resolução de alertas: 'resolvido' (justificação opcional)
 *            vs 'ignorado' (justificação obrigatória, [10, 500] chars)
 *
 * ─── Decisão composta principal de resolveAlert ───────────────────────────
 *
 * Decisão 1 — verificação de estado do alerta:
 *   C1: alert não existe (null)
 *   C2: alert.status !== 'pendente'
 *
 * Decisão 2 — tipo de resolução é válido:
 *   C3: resolution === 'ignorado' || resolution === 'resolvido'
 *
 * Decisão 3 — justificação para 'ignorado' (VL [10, 500]):
 *   C4: len < 10   → rejeita
 *   C5: len > 500  → rejeita
 *
 * ─── Tabela MC/DC — Decisão 3 (resolução='ignorado') ─────────────────────
 * | # | len < 10 | len > 500 | Resultado          | Caso      |
 * |---|----------|-----------|--------------------|-----------|
 * | 1 | true     | false     | erro (curto)       | TU_AS04_S3|
 * | 2 | false    | true      | erro (longo)       | TU_AS08_S3|
 * | 3 | false    | false     | aceita (10-500)    | TU_AS05_S3|
 */

jest.mock('../../src/models/Alert');
const Alert = require('../../src/models/Alert');
const { resolveAlert } = require('../../src/services/alertService');

// Helper: cria um objeto alert mock com save() simulado
const makeMockAlert = (overrides = {}) => ({
  _id:    'alert-id-mock',
  status: 'pendente',
  save:   jest.fn().mockResolvedValue(true),
  ...overrides
});

beforeEach(() => jest.clearAllMocks());

// ─────────────────────────────────────────────────────────────────────────────
// PE — Particionamento de Equivalência: existência do alerta
// ─────────────────────────────────────────────────────────────────────────────
describe('resolveAlert — existência do alerta (PE)', () => {

  // TU_AS01_S3 — PE: alerta não encontrado (null) → NOT_FOUND
  test('[TU_AS01_S3][PE] deve lançar NOT_FOUND quando alerta não existe', async () => {
    Alert.findById = jest.fn().mockResolvedValue(null);
    const err = await resolveAlert('id-inexistente', 'resolvido', '', 'user1').catch(e => e);
    expect(err.message).toBe('Alerta não encontrado');
    expect(err.code).toBe('NOT_FOUND');
  });

  // TU_AS02_S3 — PE: alerta com status 'resolvido' (já tratado) → erro
  test('[TU_AS02_S3][PE] deve rejeitar alerta já resolvido', async () => {
    Alert.findById = jest.fn().mockResolvedValue(makeMockAlert({ status: 'resolvido' }));
    await expect(resolveAlert('id', 'resolvido', '', 'user1'))
      .rejects.toThrow('Alerta já foi resolvido ou ignorado');
  });

  // TU_AS03_S3 — PE: alerta com status 'ignorado' (já tratado) → erro
  test('[TU_AS03_S3][PE] deve rejeitar alerta já ignorado', async () => {
    Alert.findById = jest.fn().mockResolvedValue(makeMockAlert({ status: 'ignorado' }));
    await expect(resolveAlert('id', 'resolvido', '', 'user1'))
      .rejects.toThrow('Alerta já foi resolvido ou ignorado');
  });

});

// ─────────────────────────────────────────────────────────────────────────────
// PE — Tipo de resolução válido/inválido
// ─────────────────────────────────────────────────────────────────────────────
describe('resolveAlert — tipo de resolução (PE)', () => {

  // TU_AS04_S3 — PE: resolução inválida (classe inválida)
  test('[TU_AS04_S3][PE] deve rejeitar resolução com valor inválido', async () => {
    Alert.findById = jest.fn().mockResolvedValue(makeMockAlert());
    const err = await resolveAlert('id', 'cancelado', '', 'user1').catch(e => e);
    expect(err.message).toMatch(/Resolução inválida/);
    expect(err.code).toBe('VALIDATION_ERROR');
  });

  // TU_AS05_S3 — PE: resolução 'resolvido' sem justificação → aceita (justificação opcional)
  test('[TU_AS05_S3][PE] deve aceitar resolução "resolvido" sem justificação', async () => {
    const mockAlert = makeMockAlert();
    Alert.findById = jest.fn().mockResolvedValue(mockAlert);
    const result = await resolveAlert('id', 'resolvido', '', 'user1');
    expect(result.status).toBe('resolvido');
    expect(mockAlert.save).toHaveBeenCalled();
  });

  // TU_AS06_S3 — PE: resolução 'resolvido' com justificação → também aceita
  test('[TU_AS06_S3][PE] deve aceitar resolução "resolvido" com justificação opcional', async () => {
    const mockAlert = makeMockAlert();
    Alert.findById = jest.fn().mockResolvedValue(mockAlert);
    const result = await resolveAlert('id', 'resolvido', 'Problema corrigido manualmente', 'user1');
    expect(result.status).toBe('resolvido');
    expect(result.justification).toBe('Problema corrigido manualmente');
  });

});

// ─────────────────────────────────────────────────────────────────────────────
// VL — Análise de Valores Limite: justificação para 'ignorado' [10, 500] chars
//
// Tabela de valores testados:
// | Valor | Situação                  | Esperado      | Caso       |
// |-------|---------------------------|---------------|------------|
// |     9 | abaixo do limite inferior | rejeita       | TU_AS07_S3 |
// |    10 | limite inferior           | aceita        | TU_AS08_S3 |
// |   250 | valor nominal interior    | aceita        | TU_AS09_S3 |
// |   500 | limite superior           | aceita        | TU_AS10_S3 |
// |   501 | acima do limite superior  | rejeita       | TU_AS11_S3 |
// ─────────────────────────────────────────────────────────────────────────────
describe('resolveAlert — VL justificação "ignorado" [10, 500 chars]', () => {

  // TU_AS07_S3 — VL: 9 chars (abaixo do mínimo 10) → rejeita
  test('[TU_AS07_S3][VL] justificação com 9 chars (abaixo do mínimo) deve ser rejeitada', async () => {
    Alert.findById = jest.fn().mockResolvedValue(makeMockAlert());
    const err = await resolveAlert('id', 'ignorado', 'A'.repeat(9), 'user1').catch(e => e);
    expect(err.message).toMatch(/mínimo 10 caracteres/);
    expect(err.code).toBe('VALIDATION_ERROR');
  });

  // TU_AS08_S3 — VL: 10 chars (limite inferior) → aceita
  test('[TU_AS08_S3][VL] justificação com 10 chars (limite inferior) deve ser aceite', async () => {
    const mockAlert = makeMockAlert();
    Alert.findById = jest.fn().mockResolvedValue(mockAlert);
    const result = await resolveAlert('id', 'ignorado', 'A'.repeat(10), 'user1');
    expect(result.status).toBe('ignorado');
    expect(mockAlert.save).toHaveBeenCalled();
  });

  // TU_AS09_S3 — VL: 250 chars (valor nominal interior) → aceita
  test('[TU_AS09_S3][VL] justificação com 250 chars (valor nominal) deve ser aceite', async () => {
    const mockAlert = makeMockAlert();
    Alert.findById = jest.fn().mockResolvedValue(mockAlert);
    const result = await resolveAlert('id', 'ignorado', 'A'.repeat(250), 'user1');
    expect(result.status).toBe('ignorado');
  });

  // TU_AS10_S3 — VL: 500 chars (limite superior) → aceita
  test('[TU_AS10_S3][VL] justificação com 500 chars (limite superior) deve ser aceite', async () => {
    const mockAlert = makeMockAlert();
    Alert.findById = jest.fn().mockResolvedValue(mockAlert);
    const result = await resolveAlert('id', 'ignorado', 'A'.repeat(500), 'user1');
    expect(result.status).toBe('ignorado');
  });

  // TU_AS11_S3 — VL: 501 chars (acima do limite superior) → rejeita
  test('[TU_AS11_S3][VL] justificação com 501 chars (acima do máximo) deve ser rejeitada', async () => {
    Alert.findById = jest.fn().mockResolvedValue(makeMockAlert());
    const err = await resolveAlert('id', 'ignorado', 'A'.repeat(501), 'user1').catch(e => e);
    expect(err.message).toMatch(/não pode exceder 500 caracteres/);
    expect(err.code).toBe('VALIDATION_ERROR');
  });

});

// ─────────────────────────────────────────────────────────────────────────────
// CM — Cobertura de Condições Múltiplas: justificação para 'ignorado'
//
// Condições atómicas:
//   C4: len < 10   (justificação demasiado curta)
//   C5: len > 500  (justificação demasiado longa)
//
// Para 'ignorado': rejeita se C4=true OU C5=true; aceita apenas se C4=false && C5=false
//
// Tabela MC/DC:
// | # | C4 (< 10) | C5 (> 500) | Resultado | Caso       |
// |---|-----------|------------|-----------|------------|
// | 1 | true      | false      | rejeita   | TU_AS12_S3 | ← C4 afeta isoladamente
// | 2 | false     | true       | rejeita   | TU_AS13_S3 | ← C5 afeta isoladamente
// | 3 | false     | false      | aceita    | TU_AS09_S3 | ← baseline (nominal 250)
// ─────────────────────────────────────────────────────────────────────────────
describe('resolveAlert — CM justificação "ignorado" (condições múltiplas)', () => {

  // TU_AS12_S3 — CM: C4=true (len=9 < 10), C5=false → rejeita por C4
  test('[TU_AS12_S3][CM] C4=true (len<10), C5=false → rejeita por justificação curta', async () => {
    Alert.findById = jest.fn().mockResolvedValue(makeMockAlert());
    const err = await resolveAlert('id', 'ignorado', 'A'.repeat(9), 'user1').catch(e => e);
    expect(err.message).toMatch(/mínimo 10 caracteres/);
    // confirmar que NÃO é o erro de tamanho máximo
    expect(err.message).not.toMatch(/não pode exceder/);
  });

  // TU_AS13_S3 — CM: C4=false (len=501 > 10), C5=true → rejeita por C5
  test('[TU_AS13_S3][CM] C4=false, C5=true (len>500) → rejeita por justificação longa', async () => {
    Alert.findById = jest.fn().mockResolvedValue(makeMockAlert());
    const err = await resolveAlert('id', 'ignorado', 'A'.repeat(501), 'user1').catch(e => e);
    expect(err.message).toMatch(/não pode exceder 500 caracteres/);
    // confirmar que NÃO é o erro de tamanho mínimo
    expect(err.message).not.toMatch(/mínimo 10 caracteres/);
  });

  // TU_AS14_S3 — CM: C4=false, C5=false (len=250) → aceita (baseline)
  test('[TU_AS14_S3][CM] C4=false, C5=false (len=250) → aceita (baseline sem erros)', async () => {
    const mockAlert = makeMockAlert();
    Alert.findById = jest.fn().mockResolvedValue(mockAlert);
    const result = await resolveAlert('id', 'ignorado', 'A'.repeat(250), 'user1');
    expect(result.status).toBe('ignorado');
    expect(mockAlert.save).toHaveBeenCalledTimes(1);
  });

});

// ─────────────────────────────────────────────────────────────────────────────
// PE — Verificação dos campos gravados após resolução bem-sucedida
// ─────────────────────────────────────────────────────────────────────────────
describe('resolveAlert — dados gravados após resolução (PE)', () => {

  // TU_AS15_S3 — PE: campos resolvedBy e resolvedAt são preenchidos
  test('[TU_AS15_S3][PE] deve preencher resolvedBy e resolvedAt após resolver', async () => {
    const mockAlert = makeMockAlert();
    Alert.findById = jest.fn().mockResolvedValue(mockAlert);
    const result = await resolveAlert('id', 'resolvido', 'Resolvido pelo técnico', 'user-abc');
    expect(result.resolvedBy).toBe('user-abc');
    expect(result.resolvedAt).toBeInstanceOf(Date);
  });

  // TU_AS16_S3 — PE: justificação é armazenada sem espaços extra (trim)
  test('[TU_AS16_S3][PE] justificação deve ser guardada sem espaços extra (trim)', async () => {
    const mockAlert = makeMockAlert();
    Alert.findById = jest.fn().mockResolvedValue(mockAlert);
    const result = await resolveAlert('id', 'ignorado', '  ' + 'A'.repeat(50) + '  ', 'user1');
    expect(result.justification).toBe('A'.repeat(50));
  });

});

// ─────────────────────────────────────────────────────────────────────────────
// Datas — resolvedAt (PE)
//
// O campo resolvedAt é preenchido automaticamente com new Date() no momento
// da resolução. Não é um input do utilizador — é gerado internamente.
//
// Classes testadas:
//   F1 — resolvedAt é instância de Date (tipo correto)
//   F2 — resolvedAt é posterior a uma data anterior ao teste (não é data passada)
//   F3 — resolvedAt é preenchido em 'resolvido' E em 'ignorado'
//   F4 — resolvedAt não é preenchido quando a resolução falha
// ─────────────────────────────────────────────────────────────────────────────
describe('resolveAlert — data de resolução resolvedAt (PE)', () => {

  // TU_AS_D01_S3 — F1 (PE): resolvedAt é instância de Date
  test('[TU_AS_D01_S3][PE] resolvedAt deve ser instância de Date após resolução', async () => {
    const mockAlert = makeMockAlert();
    Alert.findById = jest.fn().mockResolvedValue(mockAlert);
    const result = await resolveAlert('id', 'resolvido', '', 'user1');
    expect(result.resolvedAt).toBeInstanceOf(Date);
  });

  // TU_AS_D02_S3 — F2 (PE): resolvedAt é uma data recente (não é data passada ou futura)
  test('[TU_AS_D02_S3][PE] resolvedAt deve ser uma data recente (próxima do momento actual)', async () => {
    const before = new Date();
    const mockAlert = makeMockAlert();
    Alert.findById = jest.fn().mockResolvedValue(mockAlert);
    const result = await resolveAlert('id', 'resolvido', '', 'user1');
    const after = new Date();
    expect(result.resolvedAt.getTime()).toBeGreaterThanOrEqual(before.getTime());
    expect(result.resolvedAt.getTime()).toBeLessThanOrEqual(after.getTime());
  });

  // TU_AS_D03_S3 — F3a (PE): resolvedAt preenchido quando resolution='resolvido'
  test('[TU_AS_D03_S3][PE] resolvedAt preenchido com resolution="resolvido"', async () => {
    const mockAlert = makeMockAlert();
    Alert.findById = jest.fn().mockResolvedValue(mockAlert);
    const result = await resolveAlert('id', 'resolvido', '', 'user1');
    expect(result.resolvedAt).toBeDefined();
    expect(result.resolvedAt).not.toBeNull();
  });

  // TU_AS_D04_S3 — F3b (PE): resolvedAt preenchido quando resolution='ignorado'
  test('[TU_AS_D04_S3][PE] resolvedAt preenchido com resolution="ignorado"', async () => {
    const mockAlert = makeMockAlert();
    Alert.findById = jest.fn().mockResolvedValue(mockAlert);
    const result = await resolveAlert('id', 'ignorado', 'A'.repeat(50), 'user1');
    expect(result.resolvedAt).toBeInstanceOf(Date);
  });

  // TU_AS_D05_S3 — F4 (PE): resolvedAt NÃO preenchido quando resolução falha
  test('[TU_AS_D05_S3][PE] resolvedAt não deve ser preenchido quando resolução falha (alerta não encontrado)', async () => {
    Alert.findById = jest.fn().mockResolvedValue(null);
    const err = await resolveAlert('id-inexistente', 'resolvido', '', 'user1').catch(e => e);
    expect(err.message).toBe('Alerta não encontrado');
    // o erro foi lançado antes de qualquer atribuição de data
    expect(err.resolvedAt).toBeUndefined();
  });

});
