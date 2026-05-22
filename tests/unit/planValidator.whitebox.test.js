/**
 * planValidator.whitebox.test.js
 * Testes White-box (Caixa Branca) — Sprint 5
 *
 * Critério: MC/DC (Modified Condition/Decision Coverage)
 * Cobre todas as estruturas if/else do planValidator.js
 * documentando cada decisão e condição atómica.
 */

const { validatePlan } = require('../../src/validators/planValidator');

// ── Dados base válidos ────────────────────────────────────────────────────
const validPlan = () => ({
  type: 'regular',
  minTemperature: 18,
  maxTemperature: 28,
  minHumidity: 40,
  maxHumidity: 80,
  minLuminosity: 5000,
  maxLuminosity: 25000,
  durationDays: 1,
});

// ════════════════════════════════════════════════════════════════════════════
// D1 — Decisão: Tipo de plano
// Estrutura: if (!data.type || data.type.trim() === '') { ... }
//            else if (!VALID_PLAN_TYPES.includes(data.type.toLowerCase())) { ... }
// Ramos: R1=tipo ausente, R2=tipo inválido, R3=tipo válido
// ════════════════════════════════════════════════════════════════════════════
describe('D1 — Tipo de plano (if/else if)', () => {

  test('[WB_D1_R1a] tipo ausente (undefined) → ramo "obrigatório"', () => {
    const data = { ...validPlan(), type: undefined };
    const { isValid, errors } = validatePlan(data);
    expect(isValid).toBe(false);
    expect(errors).toContain('Tipo de plano é obrigatório');
  });

  test('[WB_D1_R1b] tipo vazio ("") → ramo "obrigatório"', () => {
    const data = { ...validPlan(), type: '' };
    const { isValid, errors } = validatePlan(data);
    expect(isValid).toBe(false);
    expect(errors).toContain('Tipo de plano é obrigatório');
  });

  test('[WB_D1_R2] tipo preenchido mas inválido → ramo "inválido"', () => {
    const data = { ...validPlan(), type: 'experimental' };
    const { isValid, errors } = validatePlan(data);
    expect(isValid).toBe(false);
    expect(errors[0]).toMatch(/Tipo de plano inválido/);
  });

  test('[WB_D1_R3a] tipo=regular → ramo válido', () => {
    const { isValid } = validatePlan({ ...validPlan(), type: 'regular' });
    expect(isValid).toBe(true);
  });

  test('[WB_D1_R3b] tipo=emergencia → ramo válido', () => {
    const { isValid } = validatePlan({ ...validPlan(), type: 'emergencia' });
    expect(isValid).toBe(true);
  });

  test('[WB_D1_R3c] tipo=pontual com auth → ramo válido', () => {
    const data = { ...validPlan(), type: 'pontual', responsibleAuth: 'Dr. Silva' };
    const { isValid } = validatePlan(data);
    expect(isValid).toBe(true);
  });

});

// ════════════════════════════════════════════════════════════════════════════
// D2 — Decisão: Temperatura mínima
// Estrutura: if (undefined||null) → else if (!number || <18 || >28)
// Condições atómicas: C1=!number, C2=<18, C3=>28
// ════════════════════════════════════════════════════════════════════════════
describe('D2 — Temperatura mínima (MC/DC)', () => {

  test('[WB_D2_R1] minTemperature ausente → obrigatório', () => {
    const data = { ...validPlan(), minTemperature: undefined };
    const { errors } = validatePlan(data);
    expect(errors).toContain('Temperatura mínima é obrigatória');
  });

  test('[WB_D2_C1] minTemperature não é número (string) → inválido', () => {
    const data = { ...validPlan(), minTemperature: '20' };
    const { errors } = validatePlan(data);
    expect(errors.some(e => e.includes('Temperatura mínima'))).toBe(true);
  });

  test('[WB_D2_C2] minTemperature=17 (abaixo do mínimo) → inválido', () => {
    const data = { ...validPlan(), minTemperature: 17 };
    const { errors } = validatePlan(data);
    expect(errors.some(e => e.includes('Temperatura mínima'))).toBe(true);
  });

  test('[WB_D2_C3] minTemperature=29 (acima do máximo) → inválido', () => {
    const data = { ...validPlan(), minTemperature: 29, maxTemperature: 30 };
    const { errors } = validatePlan(data);
    expect(errors.some(e => e.includes('Temperatura mínima'))).toBe(true);
  });

  test('[WB_D2_valid] minTemperature=18 (limite inferior) → válido', () => {
    const data = { ...validPlan(), minTemperature: 18 };
    const { isValid } = validatePlan(data);
    expect(isValid).toBe(true);
  });

});

// ════════════════════════════════════════════════════════════════════════════
// D3 — Decisão: Temperatura máxima (estrutura idêntica a D2)
// ════════════════════════════════════════════════════════════════════════════
describe('D3 — Temperatura máxima (MC/DC)', () => {

  test('[WB_D3_R1] maxTemperature ausente → obrigatório', () => {
    const data = { ...validPlan(), maxTemperature: undefined };
    const { errors } = validatePlan(data);
    expect(errors).toContain('Temperatura máxima é obrigatória');
  });

  test('[WB_D3_C1] maxTemperature não é número → inválido', () => {
    const data = { ...validPlan(), maxTemperature: '25' };
    const { errors } = validatePlan(data);
    expect(errors.some(e => e.includes('Temperatura máxima'))).toBe(true);
  });

  test('[WB_D3_C2] maxTemperature=17 (abaixo do mínimo) → inválido', () => {
    const data = { ...validPlan(), minTemperature: 18, maxTemperature: 17 };
    const { errors } = validatePlan(data);
    expect(errors.some(e => e.includes('Temperatura máxima'))).toBe(true);
  });

  test('[WB_D3_C3] maxTemperature=29 (acima do máximo) → inválido', () => {
    const data = { ...validPlan(), maxTemperature: 29 };
    const { errors } = validatePlan(data);
    expect(errors.some(e => e.includes('Temperatura máxima'))).toBe(true);
  });

  test('[WB_D3_valid] maxTemperature=28 (limite superior) → válido', () => {
    const data = { ...validPlan(), maxTemperature: 28 };
    const { isValid } = validatePlan(data);
    expect(isValid).toBe(true);
  });

});

// ════════════════════════════════════════════════════════════════════════════
// D4 — Decisão composta: minTemperature >= maxTemperature
// Condições: C1=(typeof min === number), C2=(typeof max === number),
//            C3=(min >= max)
// Tabela MC/DC: 4 casos cobrem todas as condições independentemente
// ════════════════════════════════════════════════════════════════════════════
describe('D4 — Comparação min >= max temperatura (MC/DC)', () => {

  // C1=true, C2=true, C3=true → ERRO (caso base)
  test('[WB_D4_1] C1=true C2=true C3=true → rejeita (min>=max)', () => {
    const data = { ...validPlan(), minTemperature: 25, maxTemperature: 25 };
    const { errors } = validatePlan(data);
    expect(errors).toContain('Temperatura mínima deve ser inferior à temperatura máxima');
  });

  // C1=true, C2=true, C3=false → aceite (min<max)
  test('[WB_D4_2] C1=true C2=true C3=false → aceite (min<max)', () => {
    const data = { ...validPlan(), minTemperature: 18, maxTemperature: 28 };
    const { isValid } = validatePlan(data);
    expect(isValid).toBe(true);
  });

  // C1=false → condição curto-circuito, não avalia C3
  test('[WB_D4_3] C1=false (min não é number) → não avalia comparação', () => {
    const data = { ...validPlan(), minTemperature: '20', maxTemperature: 28 };
    const { errors } = validatePlan(data);
    expect(errors).not.toContain('Temperatura mínima deve ser inferior à temperatura máxima');
  });

  // C2=false → condição curto-circuito, não avalia C3
  test('[WB_D4_4] C2=false (max não é number) → não avalia comparação', () => {
    const data = { ...validPlan(), minTemperature: 18, maxTemperature: '25' };
    const { errors } = validatePlan(data);
    expect(errors).not.toContain('Temperatura mínima deve ser inferior à temperatura máxima');
  });

});

// ════════════════════════════════════════════════════════════════════════════
// D5/D6/D7 — Humidade (estrutura idêntica a D2/D3/D4)
// ════════════════════════════════════════════════════════════════════════════
describe('D5/D6 — Humidade mínima e máxima (MC/DC)', () => {

  test('[WB_D5_R1] minHumidity ausente → obrigatório', () => {
    const data = { ...validPlan(), minHumidity: undefined };
    const { errors } = validatePlan(data);
    expect(errors).toContain('Humidade mínima é obrigatória');
  });

  test('[WB_D5_C2] minHumidity=39 (abaixo do mínimo) → inválido', () => {
    const data = { ...validPlan(), minHumidity: 39 };
    const { errors } = validatePlan(data);
    expect(errors.some(e => e.includes('Humidade mínima'))).toBe(true);
  });

  test('[WB_D5_C3] minHumidity=81 (acima do máximo) → inválido', () => {
    const data = { ...validPlan(), minHumidity: 81, maxHumidity: 82 };
    const { errors } = validatePlan(data);
    expect(errors.some(e => e.includes('Humidade mínima'))).toBe(true);
  });

  test('[WB_D6_R1] maxHumidity ausente → obrigatório', () => {
    const data = { ...validPlan(), maxHumidity: undefined };
    const { errors } = validatePlan(data);
    expect(errors).toContain('Humidade máxima é obrigatória');
  });

  test('[WB_D7_1] minHumidity >= maxHumidity → rejeita', () => {
    const data = { ...validPlan(), minHumidity: 60, maxHumidity: 60 };
    const { errors } = validatePlan(data);
    expect(errors).toContain('Humidade mínima deve ser inferior à humidade máxima');
  });

  test('[WB_D7_2] minHumidity < maxHumidity → aceite', () => {
    const data = { ...validPlan(), minHumidity: 40, maxHumidity: 80 };
    const { isValid } = validatePlan(data);
    expect(isValid).toBe(true);
  });

});

// ════════════════════════════════════════════════════════════════════════════
// D8/D9/D10 — Luminosidade (estrutura idêntica)
// ════════════════════════════════════════════════════════════════════════════
describe('D8/D9 — Luminosidade mínima e máxima (MC/DC)', () => {

  test('[WB_D8_R1] minLuminosity ausente → obrigatório', () => {
    const data = { ...validPlan(), minLuminosity: undefined };
    const { errors } = validatePlan(data);
    expect(errors).toContain('Luminosidade mínima é obrigatória');
  });

  test('[WB_D8_C2] minLuminosity=4999 (abaixo do mínimo) → inválido', () => {
    const data = { ...validPlan(), minLuminosity: 4999 };
    const { errors } = validatePlan(data);
    expect(errors.some(e => e.includes('Luminosidade mínima'))).toBe(true);
  });

  test('[WB_D8_C3] minLuminosity=25001 (acima do máximo) → inválido', () => {
    const data = { ...validPlan(), minLuminosity: 25001, maxLuminosity: 25002 };
    const { errors } = validatePlan(data);
    expect(errors.some(e => e.includes('Luminosidade mínima'))).toBe(true);
  });

  test('[WB_D9_R1] maxLuminosity ausente → obrigatório', () => {
    const data = { ...validPlan(), maxLuminosity: undefined };
    const { errors } = validatePlan(data);
    expect(errors).toContain('Luminosidade máxima é obrigatória');
  });

  test('[WB_D10_1] minLuminosity >= maxLuminosity → rejeita', () => {
    const data = { ...validPlan(), minLuminosity: 15000, maxLuminosity: 15000 };
    const { errors } = validatePlan(data);
    expect(errors).toContain('Luminosidade mínima deve ser inferior à luminosidade máxima');
  });

  test('[WB_D10_2] minLuminosity < maxLuminosity → aceite', () => {
    const data = { ...validPlan(), minLuminosity: 5000, maxLuminosity: 25000 };
    const { isValid } = validatePlan(data);
    expect(isValid).toBe(true);
  });

});

// ════════════════════════════════════════════════════════════════════════════
// D11 — Duração do ciclo
// Condições: C1=!isInteger, C2=<1, C3=>365
// ════════════════════════════════════════════════════════════════════════════
describe('D11 — Duração do ciclo (MC/DC)', () => {

  test('[WB_D11_R1] durationDays ausente → obrigatório', () => {
    const data = { ...validPlan(), durationDays: undefined };
    const { errors } = validatePlan(data);
    expect(errors).toContain('Duração do ciclo é obrigatória');
  });

  test('[WB_D11_C1] durationDays=1.5 (não inteiro) → inválido', () => {
    const data = { ...validPlan(), durationDays: 1.5 };
    const { errors } = validatePlan(data);
    expect(errors.some(e => e.includes('Duração do ciclo'))).toBe(true);
  });

  test('[WB_D11_C2] durationDays=0 (abaixo do mínimo) → inválido', () => {
    const data = { ...validPlan(), durationDays: 0 };
    const { errors } = validatePlan(data);
    expect(errors.some(e => e.includes('Duração do ciclo'))).toBe(true);
  });

  test('[WB_D11_C3] durationDays=366 (acima do máximo) → inválido', () => {
    const data = { ...validPlan(), durationDays: 366 };
    const { errors } = validatePlan(data);
    expect(errors.some(e => e.includes('Duração do ciclo'))).toBe(true);
  });

  test('[WB_D11_min] durationDays=1 (limite inferior) → válido', () => {
    const data = { ...validPlan(), durationDays: 1 };
    const { isValid } = validatePlan(data);
    expect(isValid).toBe(true);
  });

  test('[WB_D11_max] durationDays=365 (limite superior) → válido', () => {
    const data = { ...validPlan(), durationDays: 365 };
    const { isValid } = validatePlan(data);
    expect(isValid).toBe(true);
  });

});

// ════════════════════════════════════════════════════════════════════════════
// D12 — Decisão composta CHAVE: Plano Pontual com autorização
//
// Expressão: isPontual (C1) && !hasAuth (C2)
//
// Tabela de verdade completa (2² = 4 linhas):
// | # | C1 (isPontual) | C2 (hasAuth) | C1 && !C2 | Resultado     |
// |---|----------------|--------------|-----------|---------------|
// | 1 | true           | true         | false     | Aceite ✅     |
// | 2 | true           | false        | true      | Rejeitado ❌  |
// | 3 | false          | true         | false     | Aceite ✅     |
// | 4 | false          | false        | false     | Aceite ✅     |
//
// MC/DC: cada condição muda o resultado isoladamente
//   C1 muda resultado: linha 1→2 (C1=true,C2=true→false) NÃO muda
//                      linha 3→2 (C1 false→true, C2=false) muda ✅
//   C2 muda resultado: linha 1→2 (C2 true→false, C1=true) muda ✅
// ════════════════════════════════════════════════════════════════════════════
describe('D12 — Plano Pontual: C1(isPontual) && !C2(hasAuth) — MC/DC', () => {

  // Linha 1: C1=true, C2=true → aceite
  test('[WB_D12_L1] C1=true C2=true → pontual COM autorização → aceite', () => {
    const data = {
      ...validPlan(),
      type: 'pontual',
      responsibleAuth: 'Dr. Silva autoriza'
    };
    const { isValid, errors } = validatePlan(data);
    expect(isValid).toBe(true);
    expect(errors).not.toContain('Plano pontual requer autorização explícita do Responsável Técnico');
  });

  // Linha 2: C1=true, C2=false → REJEITADO (único caso de erro)
  test('[WB_D12_L2] C1=true C2=false → pontual SEM autorização → rejeitado', () => {
    const data = {
      ...validPlan(),
      type: 'pontual',
      responsibleAuth: ''
    };
    const { isValid, errors } = validatePlan(data);
    expect(isValid).toBe(false);
    expect(errors).toContain('Plano pontual requer autorização explícita do Responsável Técnico');
  });

  // Linha 3: C1=false, C2=true → aceite (não é pontual)
  test('[WB_D12_L3] C1=false C2=true → regular COM auth → aceite (auth ignorada)', () => {
    const data = {
      ...validPlan(),
      type: 'regular',
      responsibleAuth: 'Dr. Silva'
    };
    const { isValid } = validatePlan(data);
    expect(isValid).toBe(true);
  });

  // Linha 4: C1=false, C2=false → aceite (não é pontual, auth irrelevante)
  test('[WB_D12_L4] C1=false C2=false → regular SEM auth → aceite', () => {
    const data = { ...validPlan(), type: 'regular' };
    const { isValid } = validatePlan(data);
    expect(isValid).toBe(true);
  });

  // MC/DC extra: auth com só espaços = sem auth
  test('[WB_D12_L5] C1=true C2=false (só espaços) → rejeitado', () => {
    const data = {
      ...validPlan(),
      type: 'pontual',
      responsibleAuth: '   '
    };
    const { isValid, errors } = validatePlan(data);
    expect(isValid).toBe(false);
    expect(errors).toContain('Plano pontual requer autorização explícita do Responsável Técnico');
  });

});