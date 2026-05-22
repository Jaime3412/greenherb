/**
 * planValidator.additions.test.js — Adições ao Sprint 3
 *
 * Ficheiro complementar ao planValidator.test.js dos sprints anteriores.
 * Adiciona os casos de teste em falta identificados na revisão do Sprint 3.
 *
 * Técnicas aplicadas:
 *   PE  — Particionamento de Equivalência
 *   CM  — Cobertura de Condições Múltiplas
 *
 * Lacunas identificadas nos sprints anteriores:
 *   1. Campos numéricos (minTemperature, maxTemperature, etc.) nunca testados
 *      com null, undefined ou string — ramos distintos no código sem cobertura.
 *   2. durationDays com valor decimal (ex: 1.5) → Number.isInteger() rejeita,
 *      mas nunca foi testado.
 *   3. CM na coerência min < max: faltava o caso base (todos os pares OK → sem erro)
 *      e a combinação de dois pares em violação simultânea.
 *   4. Mensagens de erro nos VL existentes nunca verificadas (só isValid).
 *
 * ─── Decisão de coerência min < max (CM) ─────────────────────────────────
 * Três condições independentes:
 *   CA: minTemperature >= maxTemperature
 *   CB: minHumidity    >= maxHumidity
 *   CC: minLuminosity  >= maxLuminosity
 *
 * Tabela MC/DC (cada condição afeta isoladamente):
 * | # | CA    | CB    | CC    | Resultado     | Caso        |
 * |---|-------|-------|-------|---------------|-------------|
 * | 0 | false | false | false | sem erro      | TU_PV01_S3  |
 * | 1 | true  | false | false | erro temp     | TU88_S2 ✓   |
 * | 2 | false | true  | false | erro hum      | TU89_S2 ✓   |
 * | 3 | false | false | true  | erro lum      | TU90_S2 ✓   |
 * | 4 | true  | true  | false | 2 erros       | TU_PV02_S3  |
 */

const { validatePlan } = require('../../src/validators/planValidator');

// Plano base completamente válido
const validPlan = () => ({
  type:           'regular',
  minTemperature: 18, maxTemperature: 28,
  minHumidity:    40, maxHumidity:    80,
  minLuminosity:  5000, maxLuminosity: 25000,
  durationDays:   90
});

// ─────────────────────────────────────────────────────────────────────────────
// PE — campos numéricos: null, undefined, string
// O código tem dois ramos distintos para cada campo numérico:
//   1) if (undefined || null) → "campo é obrigatório"
//   2) else if (typeof !== 'number' || fora do intervalo) → "deve estar entre X e Y"
// Nenhum destes ramos estava testado nos sprints anteriores.
// ─────────────────────────────────────────────────────────────────────────────
describe('validatePlan — PE campos numéricos: null, undefined, string (adições S3)', () => {

  // ── minTemperature ────────────────────────────────────────────────────────

  // TU_PV03_S3 — PE: minTemperature=null → "Temperatura mínima é obrigatória"
  test('[TU_PV03_S3][PE] minTemperature=null → erro "obrigatória"', () => {
    const result = validatePlan({ ...validPlan(), minTemperature: null });
    expect(result.isValid).toBe(false);
    expect(result.errors).toContain('Temperatura mínima é obrigatória');
  });

  // TU_PV04_S3 — PE: minTemperature=undefined → "Temperatura mínima é obrigatória"
  test('[TU_PV04_S3][PE] minTemperature=undefined → erro "obrigatória"', () => {
    const data = validPlan();
    delete data.minTemperature;
    const result = validatePlan(data);
    expect(result.isValid).toBe(false);
    expect(result.errors).toContain('Temperatura mínima é obrigatória');
  });

  // TU_PV05_S3 — PE: minTemperature="23" (string) → "deve estar entre" (typeof !== number)
  test('[TU_PV05_S3][PE] minTemperature="23" (string) → rejeitado como tipo inválido', () => {
    const result = validatePlan({ ...validPlan(), minTemperature: '23' });
    expect(result.isValid).toBe(false);
    expect(result.errors.some(e => e.includes('Temperatura mínima deve estar entre'))).toBe(true);
  });

  // ── maxTemperature ────────────────────────────────────────────────────────

  // TU_PV06_S3 — PE: maxTemperature=null → "Temperatura máxima é obrigatória"
  test('[TU_PV06_S3][PE] maxTemperature=null → erro "obrigatória"', () => {
    const result = validatePlan({ ...validPlan(), maxTemperature: null });
    expect(result.isValid).toBe(false);
    expect(result.errors).toContain('Temperatura máxima é obrigatória');
  });

  // TU_PV07_S3 — PE: maxTemperature="28" (string) → rejeitado
  test('[TU_PV07_S3][PE] maxTemperature="28" (string) → rejeitado como tipo inválido', () => {
    const result = validatePlan({ ...validPlan(), maxTemperature: '28' });
    expect(result.isValid).toBe(false);
    expect(result.errors.some(e => e.includes('Temperatura máxima deve estar entre'))).toBe(true);
  });

  // ── minHumidity / maxHumidity ─────────────────────────────────────────────

  // TU_PV08_S3 — PE: minHumidity=null → "Humidade mínima é obrigatória"
  test('[TU_PV08_S3][PE] minHumidity=null → erro "obrigatória"', () => {
    const result = validatePlan({ ...validPlan(), minHumidity: null });
    expect(result.isValid).toBe(false);
    expect(result.errors).toContain('Humidade mínima é obrigatória');
  });

  // TU_PV09_S3 — PE: maxHumidity=null → "Humidade máxima é obrigatória"
  test('[TU_PV09_S3][PE] maxHumidity=null → erro "obrigatória"', () => {
    const result = validatePlan({ ...validPlan(), maxHumidity: null });
    expect(result.isValid).toBe(false);
    expect(result.errors).toContain('Humidade máxima é obrigatória');
  });

  // TU_PV10_S3 — PE: minHumidity="60" (string) → rejeitado
  test('[TU_PV10_S3][PE] minHumidity="60" (string) → rejeitado como tipo inválido', () => {
    const result = validatePlan({ ...validPlan(), minHumidity: '60' });
    expect(result.isValid).toBe(false);
    expect(result.errors.some(e => e.includes('Humidade mínima deve estar entre'))).toBe(true);
  });

  // ── minLuminosity / maxLuminosity ─────────────────────────────────────────

  // TU_PV11_S3 — PE: minLuminosity=null → "Luminosidade mínima é obrigatória"
  test('[TU_PV11_S3][PE] minLuminosity=null → erro "obrigatória"', () => {
    const result = validatePlan({ ...validPlan(), minLuminosity: null });
    expect(result.isValid).toBe(false);
    expect(result.errors).toContain('Luminosidade mínima é obrigatória');
  });

  // TU_PV12_S3 — PE: maxLuminosity=null → "Luminosidade máxima é obrigatória"
  test('[TU_PV12_S3][PE] maxLuminosity=null → erro "obrigatória"', () => {
    const result = validatePlan({ ...validPlan(), maxLuminosity: null });
    expect(result.isValid).toBe(false);
    expect(result.errors).toContain('Luminosidade máxima é obrigatória');
  });

  // ── durationDays ──────────────────────────────────────────────────────────

  // TU_PV13_S3 — PE: durationDays=null → "Duração do ciclo é obrigatória"
  test('[TU_PV13_S3][PE] durationDays=null → erro "obrigatória"', () => {
    const result = validatePlan({ ...validPlan(), durationDays: null });
    expect(result.isValid).toBe(false);
    expect(result.errors).toContain('Duração do ciclo é obrigatória');
  });

  // TU_PV14_S3 — PE: durationDays=1.5 (decimal) → Number.isInteger() rejeita
  test('[TU_PV14_S3][PE] durationDays=1.5 (decimal) → rejeitado (deve ser inteiro)', () => {
    const result = validatePlan({ ...validPlan(), durationDays: 1.5 });
    expect(result.isValid).toBe(false);
    expect(result.errors.some(e => e.includes('inteiro'))).toBe(true);
  });

  // TU_PV15_S3 — PE: durationDays="90" (string) → rejeitado
  test('[TU_PV15_S3][PE] durationDays="90" (string) → rejeitado como tipo inválido', () => {
    const result = validatePlan({ ...validPlan(), durationDays: '90' });
    expect(result.isValid).toBe(false);
    expect(result.errors.some(e => e.includes('inteiro'))).toBe(true);
  });

});

// ─────────────────────────────────────────────────────────────────────────────
// CM — coerência min < max: caso base + combinação dupla
// ─────────────────────────────────────────────────────────────────────────────
describe('validatePlan — CM coerência min < max (adições S3)', () => {

  // TU_PV01_S3 — CM baseline: CA=false, CB=false, CC=false → sem erros de coerência
  test('[TU_PV01_S3][CM] CA=F, CB=F, CC=F → sem erros de coerência min<max (baseline)', () => {
    const result = validatePlan(validPlan());
    expect(result.isValid).toBe(true);
    expect(result.errors.some(e => e.includes('inferior à'))).toBe(false);
  });

  // TU_PV02_S3 — CM: CA=true + CB=true, CC=false → acumula 2 erros de coerência
  test('[TU_PV02_S3][CM] CA=T + CB=T, CC=F → acumula erros de temperatura e humidade', () => {
    const result = validatePlan({
      ...validPlan(),
      minTemperature: 25, maxTemperature: 20, // CA=true
      minHumidity:    70, maxHumidity:    50  // CB=true
    });
    expect(result.isValid).toBe(false);
    expect(result.errors.some(e => e.includes('inferior à temperatura máxima'))).toBe(true);
    expect(result.errors.some(e => e.includes('inferior à humidade máxima'))).toBe(true);
    expect(result.errors.some(e => e.includes('inferior à luminosidade máxima'))).toBe(false);
  });

  // TU_PV16_S3 — PE: min === max → rejeita (condição >= no código)
  test('[TU_PV16_S3][PE] minTemperature === maxTemperature → rejeita (>= no código)', () => {
    const result = validatePlan({ ...validPlan(), minTemperature: 23, maxTemperature: 23 });
    expect(result.isValid).toBe(false);
    expect(result.errors.some(e => e.includes('inferior à temperatura máxima'))).toBe(true);
  });

});

// ─────────────────────────────────────────────────────────────────────────────
// VL — mensagens de erro confirmadas (em falta nos sprints anteriores)
// ─────────────────────────────────────────────────────────────────────────────
describe('validatePlan — VL mensagens de erro confirmadas (adições S3)', () => {

  // TU_PV17_S3 — VL: minTemperature=17 → mensagem exata confirmada
  test('[TU_PV17_S3][VL] minTemperature=17 → mensagem "deve estar entre 18 e 28 °C"', () => {
    const result = validatePlan({ ...validPlan(), minTemperature: 17 });
    expect(result.isValid).toBe(false);
    expect(result.errors).toContain('Temperatura mínima deve estar entre 18 e 28 °C');
    // confirmar que é apenas este erro (isolado)
    expect(result.errors.filter(e => e.includes('Temperatura mínima')).length).toBe(1);
  });

  // TU_PV18_S3 — VL: maxHumidity=81 → mensagem exata confirmada
  test('[TU_PV18_S3][VL] maxHumidity=81 → mensagem "deve estar entre 40 e 80 %"', () => {
    const result = validatePlan({ ...validPlan(), maxHumidity: 81 });
    expect(result.isValid).toBe(false);
    expect(result.errors).toContain('Humidade máxima deve estar entre 40 e 80 %');
  });

  // TU_PV19_S3 — VL: durationDays=366 → mensagem exata confirmada
  test('[TU_PV19_S3][VL] durationDays=366 → mensagem "deve ser um inteiro entre 1 e 365 dias"', () => {
    const result = validatePlan({ ...validPlan(), durationDays: 366 });
    expect(result.isValid).toBe(false);
    expect(result.errors).toContain('Duração do ciclo deve ser um inteiro entre 1 e 365 dias');
  });

});

// ─────────────────────────────────────────────────────────────────────────────
// PE — Caracteres Especiais em responsibleAuth (adições S3)
// ─────────────────────────────────────────────────────────────────────────────
describe('validatePlan — caracteres especiais em responsibleAuth (PE — adições S3)', () => {

  // TU_PV_CS01_S3 — Classe E: só espaços → rejeita (trim() === '' → hasAuth=false)
  // Lacuna identificada: string vazia já estava testada (TU87_S2) mas só espaços não
  test('[TU_PV_CS01_S3][PE] responsibleAuth com só espaços ("   ") → rejeita como ausente', () => {
    const result = validatePlan({ ...validPlan(), type: 'pontual', responsibleAuth: '   ' });
    expect(result.isValid).toBe(false);
    expect(result.errors).toContain('Plano pontual requer autorização explícita do Responsável Técnico');
  });

  // TU_PV_CS02_S3 — Classe A: símbolos em responsibleAuth → aceita (qualquer texto não vazio)
  test('[TU_PV_CS02_S3][PE] responsibleAuth com símbolos ("João R. (RT#001)") → aceita', () => {
    const result = validatePlan({ ...validPlan(), type: 'pontual', responsibleAuth: 'João R. (RT#001)' });
    expect(result.isValid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  // TU_PV_CS03_S3 — Classe F: apóstrofe em responsibleAuth → aceita
  test('[TU_PV_CS03_S3][PE] responsibleAuth com apóstrofe ("D\'Silva Responsável") → aceita', () => {
    const result = validatePlan({ ...validPlan(), type: 'pontual', responsibleAuth: "D'Silva Responsável" });
    expect(result.isValid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  // TU_PV_CS04_S3 — Classe C: acentos em responsibleAuth → aceita
  test('[TU_PV_CS04_S3][PE] responsibleAuth com acentos ("José Técnico Responsável") → aceita', () => {
    const result = validatePlan({ ...validPlan(), type: 'pontual', responsibleAuth: 'José Técnico Responsável' });
    expect(result.isValid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

});
