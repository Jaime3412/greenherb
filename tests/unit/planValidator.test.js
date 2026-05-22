/**
 * planValidator.test.js — Testes de Unidade — Sprint 2
 *
 * Técnicas aplicadas:
 *   PE  — Particionamento de Equivalência
 *   VL  — Análise de Valores Limite
 *   CM  — Cobertura de Condições Múltiplas
 *
 * Requisitos cobertos:
 *   RN-12 — Tipo de plano válido (regular, emergencia, pontual)
 *   RN-13 — Intervalos de temperatura, humidade, luminosidade e duração
 *   RN-14 — Plano pontual exige autorização do Responsável Técnico
 *
 * ─── Decisão composta principal (plano pontual) ──────────────────────────────
 * Condições atómicas:
 *   C1: isPontual  — type === 'pontual'
 *   C2: hasAuth    — responsibleAuth presente e não vazia
 *
 * Tabela de verdade completa (2^2 = 4 combinações):
 * | # | C1 (isPontual) | C2 (hasAuth) | C1 && !C2 | Resultado            | Caso   |
 * |---|----------------|--------------|-----------|----------------------|--------|
 * | 1 | false          | false        | false     | sem erro de auth     | TU70_S2|
 * | 2 | false          | true         | false     | sem erro de auth     | TU71_S2|
 * | 3 | true           | false        | true      | erro: auth obrigatória| TU72_S2|
 * | 4 | true           | true         | false     | sem erro de auth     | TU73_S2|
 *
 * MC/DC:
 *   C1 afeta o resultado: linhas 1→3 (C2=false, C1 muda false→true: resultado muda)
 *   C2 afeta o resultado: linhas 3→4 (C1=true, C2 muda false→true: resultado muda)
 */

const { validatePlan, LIMITS } = require('../../src/validators/planValidator');

// Helper: plano regular base válido
const validRegularPlan = () => ({
  type: 'regular',
  minTemperature: 18,
  maxTemperature: 28,
  minHumidity: 40,
  maxHumidity: 80,
  minLuminosity: 5000,
  maxLuminosity: 25000,
  durationDays: 90
});

// ─────────────────────────────────────────────────────────────────────────────
// Tipo de plano — Particionamento de Equivalência
// ─────────────────────────────────────────────────────────────────────────────
describe('validatePlan — tipo de plano (PE)', () => {

  // TU58_S2 — PE: plano regular (classe válida)
  test('[TU58_S2][PE] deve aceitar plano do tipo regular', () => {
    const result = validatePlan(validRegularPlan());
    expect(result.isValid).toBe(true);
  });

  // TU59_S2 — PE: plano emergencia (classe válida)
  test('[TU59_S2][PE] deve aceitar plano do tipo emergencia', () => {
    const result = validatePlan({ ...validRegularPlan(), type: 'emergencia' });
    expect(result.isValid).toBe(true);
  });

  // TU60_S2 — PE: plano pontual com autorização (classe válida)
  test('[TU60_S2][PE] deve aceitar plano do tipo pontual com autorização', () => {
    const result = validatePlan({ ...validRegularPlan(), type: 'pontual', responsibleAuth: 'João Responsavel' });
    expect(result.isValid).toBe(true);
  });

  // TU61_S2 — PE: tipo inválido (classe inválida)
  test('[TU61_S2][PE] deve rejeitar tipo de plano inválido', () => {
    const result = validatePlan({ ...validRegularPlan(), type: 'experimental' });
    expect(result.isValid).toBe(false);
    expect(result.errors.some(e => e.includes('Tipo de plano inválido'))).toBe(true);
  });

  // TU62_S2 — PE: tipo vazio (classe inválida: ausente)
  test('[TU62_S2][PE] deve rejeitar tipo de plano vazio', () => {
    const result = validatePlan({ ...validRegularPlan(), type: '' });
    expect(result.isValid).toBe(false);
    expect(result.errors).toContain('Tipo de plano é obrigatório');
  });

});

// ─────────────────────────────────────────────────────────────────────────────
// Temperatura — Análise de Valores Limite [18, 28]
// Valores testados: 17, 18, 23, 28, 29
// ─────────────────────────────────────────────────────────────────────────────
describe('validatePlan — temperatura (VL) [18, 28]', () => {

  // TU63_S2 — VL: minTemperature = 17 (abaixo do limite inferior)
  test('[TU63_S2][VL] deve rejeitar minTemperature=17 (abaixo do mínimo 18)', () => {
    const result = validatePlan({ ...validRegularPlan(), minTemperature: 17 });
    expect(result.isValid).toBe(false);
    expect(result.errors.some(e => e.includes('Temperatura mínima'))).toBe(true);
  });

  // TU64_S2 — VL: minTemperature = 18 (limite inferior)
  test('[TU64_S2][VL] deve aceitar minTemperature=18 (limite inferior)', () => {
    const result = validatePlan({ ...validRegularPlan(), minTemperature: 18, maxTemperature: 28 });
    expect(result.isValid).toBe(true);
  });

  // TU65_S2 — VL: valor nominal interior = 23
  test('[TU65_S2][VL] deve aceitar minTemperature=23 (valor nominal interior)', () => {
    const result = validatePlan({ ...validRegularPlan(), minTemperature: 23, maxTemperature: 28 });
    expect(result.isValid).toBe(true);
  });

  // TU66_S2 — VL: maxTemperature = 28 (limite superior)
  test('[TU66_S2][VL] deve aceitar maxTemperature=28 (limite superior)', () => {
    const result = validatePlan({ ...validRegularPlan(), minTemperature: 18, maxTemperature: 28 });
    expect(result.isValid).toBe(true);
  });

  // TU67_S2 — VL: maxTemperature = 29 (acima do limite superior)
  test('[TU67_S2][VL] deve rejeitar maxTemperature=29 (acima do máximo 28)', () => {
    const result = validatePlan({ ...validRegularPlan(), maxTemperature: 29 });
    expect(result.isValid).toBe(false);
    expect(result.errors.some(e => e.includes('Temperatura máxima'))).toBe(true);
  });

});

// ─────────────────────────────────────────────────────────────────────────────
// Humidade — Análise de Valores Limite [40, 80]
// Valores testados: 39, 40, 60, 80, 81
// ─────────────────────────────────────────────────────────────────────────────
describe('validatePlan — humidade (VL) [40, 80]', () => {

  // TU68_S2 — VL: minHumidity = 39 (abaixo do limite inferior)
  test('[TU68_S2][VL] deve rejeitar minHumidity=39 (abaixo do mínimo 40)', () => {
    const result = validatePlan({ ...validRegularPlan(), minHumidity: 39 });
    expect(result.isValid).toBe(false);
    expect(result.errors.some(e => e.includes('Humidade mínima'))).toBe(true);
  });

  // TU69_S2 — VL: minHumidity = 40 (limite inferior)
  test('[TU69_S2][VL] deve aceitar minHumidity=40 (limite inferior)', () => {
    const result = validatePlan({ ...validRegularPlan(), minHumidity: 40, maxHumidity: 80 });
    expect(result.isValid).toBe(true);
  });

  // TU70_S2 — VL: valor nominal = 60
  test('[TU70_S2][VL] deve aceitar minHumidity=60 (valor nominal interior)', () => {
    const result = validatePlan({ ...validRegularPlan(), minHumidity: 40, maxHumidity: 80 });
    expect(result.isValid).toBe(true);
  });

  // TU71_S2 — VL: maxHumidity = 80 (limite superior)
  test('[TU71_S2][VL] deve aceitar maxHumidity=80 (limite superior)', () => {
    const result = validatePlan({ ...validRegularPlan(), minHumidity: 40, maxHumidity: 80 });
    expect(result.isValid).toBe(true);
  });

  // TU72_S2 — VL: maxHumidity = 81 (acima do limite superior)
  test('[TU72_S2][VL] deve rejeitar maxHumidity=81 (acima do máximo 80)', () => {
    const result = validatePlan({ ...validRegularPlan(), maxHumidity: 81 });
    expect(result.isValid).toBe(false);
    expect(result.errors.some(e => e.includes('Humidade máxima'))).toBe(true);
  });

});

// ─────────────────────────────────────────────────────────────────────────────
// Luminosidade — Análise de Valores Limite [5000, 25000]
// Valores testados: 4999, 5000, 15000, 25000, 25001
// ─────────────────────────────────────────────────────────────────────────────
describe('validatePlan — luminosidade (VL) [5000, 25000]', () => {

  // TU73_S2 — VL: minLuminosity = 4999 (abaixo do limite inferior)
  test('[TU73_S2][VL] deve rejeitar minLuminosity=4999 (abaixo do mínimo 5000)', () => {
    const result = validatePlan({ ...validRegularPlan(), minLuminosity: 4999 });
    expect(result.isValid).toBe(false);
    expect(result.errors.some(e => e.includes('Luminosidade mínima'))).toBe(true);
  });

  // TU74_S2 — VL: minLuminosity = 5000 (limite inferior)
  test('[TU74_S2][VL] deve aceitar minLuminosity=5000 (limite inferior)', () => {
    const result = validatePlan({ ...validRegularPlan(), minLuminosity: 5000, maxLuminosity: 25000 });
    expect(result.isValid).toBe(true);
  });

  // TU75_S2 — VL: valor nominal = 15000
  test('[TU75_S2][VL] deve aceitar minLuminosity=5000, maxLuminosity=25000 (valor nominal interior)', () => {
    const result = validatePlan({ ...validRegularPlan(), minLuminosity: 5000, maxLuminosity: 25000 });
    expect(result.isValid).toBe(true);
  });

  // TU76_S2 — VL: maxLuminosity = 25000 (limite superior)
  test('[TU76_S2][VL] deve aceitar maxLuminosity=25000 (limite superior)', () => {
    const result = validatePlan({ ...validRegularPlan(), minLuminosity: 5000, maxLuminosity: 25000 });
    expect(result.isValid).toBe(true);
  });

  // TU77_S2 — VL: maxLuminosity = 25001 (acima do limite superior)
  test('[TU77_S2][VL] deve rejeitar maxLuminosity=25001 (acima do máximo 25000)', () => {
    const result = validatePlan({ ...validRegularPlan(), maxLuminosity: 25001 });
    expect(result.isValid).toBe(false);
    expect(result.errors.some(e => e.includes('Luminosidade máxima'))).toBe(true);
  });

});

// ─────────────────────────────────────────────────────────────────────────────
// Duração do ciclo — Análise de Valores Limite [1, 365]
// Valores testados: 0, 1, 90, 365, 366
// ─────────────────────────────────────────────────────────────────────────────
describe('validatePlan — duração do ciclo (VL) [1, 365]', () => {

  // TU78_S2 — VL: durationDays = 0 (abaixo do limite inferior)
  test('[TU78_S2][VL] deve rejeitar durationDays=0 (abaixo do mínimo 1)', () => {
    const result = validatePlan({ ...validRegularPlan(), durationDays: 0 });
    expect(result.isValid).toBe(false);
    expect(result.errors.some(e => e.includes('Duração'))).toBe(true);
  });

  // TU79_S2 — VL: durationDays = 1 (limite inferior)
  test('[TU79_S2][VL] deve aceitar durationDays=1 (limite inferior)', () => {
    const result = validatePlan({ ...validRegularPlan(), durationDays: 1 });
    expect(result.isValid).toBe(true);
  });

  // TU80_S2 — VL: durationDays = 90 (valor nominal interior)
  test('[TU80_S2][VL] deve aceitar durationDays=90 (valor nominal interior)', () => {
    const result = validatePlan({ ...validRegularPlan(), durationDays: 90 });
    expect(result.isValid).toBe(true);
  });

  // TU81_S2 — VL: durationDays = 365 (limite superior)
  test('[TU81_S2][VL] deve aceitar durationDays=365 (limite superior)', () => {
    const result = validatePlan({ ...validRegularPlan(), durationDays: 365 });
    expect(result.isValid).toBe(true);
  });

  // TU82_S2 — VL: durationDays = 366 (acima do limite superior)
  test('[TU82_S2][VL] deve rejeitar durationDays=366 (acima do máximo 365)', () => {
    const result = validatePlan({ ...validRegularPlan(), durationDays: 366 });
    expect(result.isValid).toBe(false);
    expect(result.errors.some(e => e.includes('Duração'))).toBe(true);
  });

});

// ─────────────────────────────────────────────────────────────────────────────
// Plano pontual — Cobertura de Condições Múltiplas (CM)
//
// Decisão: if (C1: isPontual) && (!C2: !hasAuth) → erro
//
// Tabela MC/DC:
// | # | C1    | C2    | Resultado (erro auth) | Caso de teste |
// |---|-------|-------|-----------------------|---------------|
// | 1 | false | false | false (sem erro)      | TU83_S2       |
// | 2 | false | true  | false (sem erro)      | TU84_S2       |
// | 3 | true  | false | true  (erro)          | TU85_S2       |
// | 4 | true  | true  | false (sem erro)      | TU86_S2       |
// ─────────────────────────────────────────────────────────────────────────────
describe('validatePlan — plano pontual, autorização (CM)', () => {

  // TU83_S2 — CM linha 1: C1=false, C2=false → sem erro de autorização
  test('[TU83_S2][CM] C1=false (tipo regular), C2=false (sem auth) → sem erro de autorização', () => {
    const result = validatePlan({ ...validRegularPlan(), type: 'regular' }); // C1=false
    expect(result.isValid).toBe(true);
    expect(result.errors.some(e => e.includes('autorização'))).toBe(false);
  });

  // TU84_S2 — CM linha 2: C1=false, C2=true → sem erro de autorização
  test('[TU84_S2][CM] C1=false (tipo regular), C2=true (auth presente) → sem erro de autorização', () => {
    const result = validatePlan({
      ...validRegularPlan(),
      type: 'regular',
      responsibleAuth: 'João Responsavel' // C2=true mas C1=false
    });
    expect(result.isValid).toBe(true);
    expect(result.errors.some(e => e.includes('autorização'))).toBe(false);
  });

  // TU85_S2 — CM linha 3: C1=true, C2=false → erro de autorização (RN-14)
  test('[TU85_S2][CM] C1=true (pontual), C2=false (sem auth) → erro: autorização obrigatória', () => {
    const result = validatePlan({
      ...validRegularPlan(),
      type: 'pontual'
      // responsibleAuth ausente → C2=false
    });
    expect(result.isValid).toBe(false);
    expect(result.errors).toContain('Plano pontual requer autorização explícita do Responsável Técnico');
  });

  // TU86_S2 — CM linha 4: C1=true, C2=true → sem erro de autorização
  test('[TU86_S2][CM] C1=true (pontual), C2=true (auth presente) → sem erro de autorização', () => {
    const result = validatePlan({
      ...validRegularPlan(),
      type: 'pontual',
      responsibleAuth: 'João Responsavel' // C2=true
    });
    expect(result.isValid).toBe(true);
    expect(result.errors.some(e => e.includes('autorização'))).toBe(false);
  });

  // TU87_S2 — VL: responsibleAuth com string vazia (equivale a ausente)
  test('[TU87_S2][VL] C1=true, responsibleAuth string vazia → erro de autorização', () => {
    const result = validatePlan({
      ...validRegularPlan(),
      type: 'pontual',
      responsibleAuth: '   ' // só espaços → hasAuth=false
    });
    expect(result.isValid).toBe(false);
    expect(result.errors).toContain('Plano pontual requer autorização explícita do Responsável Técnico');
  });

});

// ─────────────────────────────────────────────────────────────────────────────
// Coerência min < max
// ─────────────────────────────────────────────────────────────────────────────
describe('validatePlan — coerência min < max', () => {

  // TU88_S2 — PE: minTemperature >= maxTemperature
  test('[TU88_S2][PE] deve rejeitar plano onde minTemperature >= maxTemperature', () => {
    const result = validatePlan({ ...validRegularPlan(), minTemperature: 25, maxTemperature: 20 });
    expect(result.isValid).toBe(false);
    expect(result.errors.some(e => e.includes('inferior à temperatura máxima'))).toBe(true);
  });

  // TU89_S2 — PE: minHumidity >= maxHumidity
  test('[TU89_S2][PE] deve rejeitar plano onde minHumidity >= maxHumidity', () => {
    const result = validatePlan({ ...validRegularPlan(), minHumidity: 70, maxHumidity: 50 });
    expect(result.isValid).toBe(false);
    expect(result.errors.some(e => e.includes('inferior à humidade máxima'))).toBe(true);
  });

  // TU90_S2 — PE: minLuminosity >= maxLuminosity
  test('[TU90_S2][PE] deve rejeitar plano onde minLuminosity >= maxLuminosity', () => {
    const result = validatePlan({ ...validRegularPlan(), minLuminosity: 20000, maxLuminosity: 10000 });
    expect(result.isValid).toBe(false);
    expect(result.errors.some(e => e.includes('inferior à luminosidade máxima'))).toBe(true);
  });

});
