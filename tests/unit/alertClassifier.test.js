/**
 * alertClassifier.test.js — Testes de Unidade — Sprint 2
 *
 * Técnica aplicada: Cobertura de Condições Múltiplas (CM / MC/DC)
 *
 * Requisito coberto:
 *   RN-02 — Classificação de alertas com base em medições ambientais
 *
 * ─── Decisão composta principal ───────────────────────────────────────────────
 * Condições atómicas:
 *   C1: tempViolated — temperatura fora do intervalo do plano
 *   C2: humViolated  — humidade fora do intervalo do plano
 *   C3: lumViolated  — luminosidade fora do intervalo do plano
 *   C4: sensorOK     — sensor a funcionar corretamente
 *
 * Expressão: gera alerta se (C1 || C2 || C3) && C4
 *
 * Tabela MC/DC — subconjunto mínimo (cada condição afeta isoladamente o resultado):
 * | # | C1 | C2 | C3 | C4 | Resultado   | Caso     |
 * |---|----|----|----|----|-------------|----------|
 * | 1 | F  | F  | F  | T  | null        | TU106_S2 | ← baseline: sem violações
 * | 2 | T  | F  | F  | T  | Informativo | TU107_S2 | ← C1 afeta (F→T com C2=F,C3=F,C4=T)
 * | 3 | F  | T  | F  | T  | Informativo | TU108_S2 | ← C2 afeta (F→T com C1=F,C3=F,C4=T)
 * | 4 | F  | F  | T  | T  | Informativo | TU109_S2 | ← C3 afeta (F→T com C1=F,C2=F,C4=T)
 * | 5 | T  | F  | F  | F  | null        | TU110_S2 | ← C4 afeta (T→F com C1=T,C2=F,C3=F)
 *
 * Tabela completa de classificação (2 violações → Aviso, 3 → Crítico):
 * | # | C1 | C2 | C3 | C4 | Resultado   | Caso     |
 * |---|----|----|----|----|-------------|----------|
 * | 6 | T  | T  | F  | T  | Aviso       | TU111_S2 |
 * | 7 | F  | T  | T  | T  | Aviso       | TU112_S2 |
 * | 8 | T  | F  | T  | T  | Aviso       | TU113_S2 |
 * | 9 | T  | T  | T  | T  | Crítico     | TU114_S2 |
 */

const { classifyAlert } = require('../../src/services/alertClassifier');

// Plano base dentro dos limites do enunciado
const plan = {
  minTemperature: 18, maxTemperature: 28,
  minHumidity:    40, maxHumidity:    80,
  minLuminosity:  5000, maxLuminosity: 25000
};

// Medição base — todos os valores dentro dos limites
const base = { temperature: 23, humidity: 60, luminosity: 15000, sensorOK: true };

describe('classifyAlert — MC/DC sobre (C1||C2||C3) && C4', () => {

  // TU106_S2 — linha 1: nenhuma violação, sensorOK → null
  test('[TU106_S2][CM] C1=F, C2=F, C3=F, C4=T → null (sem alerta)', () => {
    expect(classifyAlert(base, plan)).toBeNull();
  });

  // TU107_S2 — linha 2: C1=T, C2=F, C3=F, C4=T → Informativo
  test('[TU107_S2][CM] C1=T (temp violada), C2=F, C3=F, C4=T → Informativo', () => {
    expect(classifyAlert({ ...base, temperature: 29 }, plan)).toBe('Informativo');
  });

  // TU108_S2 — linha 3: C1=F, C2=T, C3=F, C4=T → Informativo
  test('[TU108_S2][CM] C1=F, C2=T (hum violada), C3=F, C4=T → Informativo', () => {
    expect(classifyAlert({ ...base, humidity: 39 }, plan)).toBe('Informativo');
  });

  // TU109_S2 — linha 4: C1=F, C2=F, C3=T, C4=T → Informativo
  test('[TU109_S2][CM] C1=F, C2=F, C3=T (lum violada), C4=T → Informativo', () => {
    expect(classifyAlert({ ...base, luminosity: 4999 }, plan)).toBe('Informativo');
  });

  // TU110_S2 — linha 5: C1=T, C4=F → null (sensor não OK, dado não fiável)
  test('[TU110_S2][CM] C1=T (temp violada), C4=F (sensor falhou) → null', () => {
    expect(classifyAlert({ ...base, temperature: 29, sensorOK: false }, plan)).toBeNull();
  });

});

describe('classifyAlert — classificação por nº de violações', () => {

  // TU111_S2 — C1=T, C2=T, C3=F → 2 violações → Aviso
  test('[TU111_S2][CM] C1=T, C2=T, C3=F → 2 violações → Aviso', () => {
    expect(classifyAlert({ ...base, temperature: 29, humidity: 39 }, plan)).toBe('Aviso');
  });

  // TU112_S2 — C1=F, C2=T, C3=T → 2 violações → Aviso
  test('[TU112_S2][CM] C1=F, C2=T, C3=T → 2 violações → Aviso', () => {
    expect(classifyAlert({ ...base, humidity: 39, luminosity: 4999 }, plan)).toBe('Aviso');
  });

  // TU113_S2 — C1=T, C2=F, C3=T → 2 violações → Aviso
  test('[TU113_S2][CM] C1=T, C2=F, C3=T → 2 violações → Aviso', () => {
    expect(classifyAlert({ ...base, temperature: 29, luminosity: 4999 }, plan)).toBe('Aviso');
  });

  // TU114_S2 — C1=T, C2=T, C3=T → 3 violações → Crítico
  test('[TU114_S2][CM] C1=T, C2=T, C3=T → 3 violações → Crítico', () => {
    expect(classifyAlert({ ...base, temperature: 29, humidity: 39, luminosity: 4999 }, plan)).toBe('Crítico');
  });

});

describe('classifyAlert — casos limite de valores (VL)', () => {

  // TU115_S2 — temperatura no limite superior exato (28) → sem alerta
  test('[TU115_S2][VL] temperatura=28 (limite superior) → null', () => {
    expect(classifyAlert({ ...base, temperature: 28 }, plan)).toBeNull();
  });

  // TU116_S2 — temperatura acima do limite (29) → alerta
  test('[TU116_S2][VL] temperatura=29 (acima do limite) → Informativo', () => {
    expect(classifyAlert({ ...base, temperature: 29 }, plan)).toBe('Informativo');
  });

  // TU117_S2 — humidade no limite inferior exato (40) → sem alerta
  test('[TU117_S2][VL] humidade=40 (limite inferior) → null', () => {
    expect(classifyAlert({ ...base, humidity: 40 }, plan)).toBeNull();
  });

  // TU118_S2 — humidade abaixo do limite (39) → alerta
  test('[TU118_S2][VL] humidade=39 (abaixo do limite) → Informativo', () => {
    expect(classifyAlert({ ...base, humidity: 39 }, plan)).toBe('Informativo');
  });

});
