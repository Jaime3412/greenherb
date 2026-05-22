/**
 * alertClassifier.additions.test.js — Adições ao Sprint 3
 *
 * Ficheiro complementar ao alertClassifier.test.js dos sprints anteriores.
 * Adiciona os casos de teste em falta identificados na revisão do Sprint 3.
 *
 * Técnicas aplicadas:
 *   VL  — Análise de Valores Limite (valores em falta nos sprints 1+2)
 *   PE  — Particionamento de Equivalência (comportamento de sensorOK por defeito)
 *   CM  — Cobertura de Condições Múltiplas (combinações de C4 em falta)
 *
 * Casos adicionados:
 *   VL — temperatura no limite inferior (18) e abaixo (17)         [em falta]
 *   VL — luminosidade em todos os 5 pontos VL                      [em falta]
 *   PE — sensorOK ausente (undefined) → comportamento por defeito  [em falta]
 *   CM — C4=false com múltiplas violações (C1=T, C2=T, C4=F)      [em falta]
 */

const { classifyAlert } = require('../../src/services/alertClassifier');

const plan = {
  minTemperature: 18, maxTemperature: 28,
  minHumidity:    40, maxHumidity:    80,
  minLuminosity:  5000, maxLuminosity: 25000
};

const base = { temperature: 23, humidity: 60, luminosity: 15000, sensorOK: true };

// ─────────────────────────────────────────────────────────────────────────────
// VL — Temperatura: 5 pontos completos [18, 28]
// Os sprints anteriores testaram 28 e 29. Faltavam 17, 18 e 23 explicitamente
// identificados como VL no limite inferior.
// ─────────────────────────────────────────────────────────────────────────────
describe('classifyAlert — VL temperatura completo [18, 28] — adições S3', () => {

  // TU_AC01_S3 — VL: temperatura=17 (abaixo do limite inferior 18) → Informativo
  test('[TU_AC01_S3][VL] temperatura=17 (abaixo do mínimo 18) → Informativo', () => {
    expect(classifyAlert({ ...base, temperature: 17 }, plan)).toBe('Informativo');
  });

  // TU_AC02_S3 — VL: temperatura=18 (limite inferior exato) → null (dentro do intervalo)
  test('[TU_AC02_S3][VL] temperatura=18 (limite inferior exato) → null (sem alerta)', () => {
    expect(classifyAlert({ ...base, temperature: 18 }, plan)).toBeNull();
  });

  // TU_AC03_S3 — VL: temperatura=23 (valor nominal interior) → null
  // Nota: já coberto implicitamente no base, mas documentado explicitamente como VL
  test('[TU_AC03_S3][VL] temperatura=23 (valor nominal interior) → null (sem alerta)', () => {
    expect(classifyAlert({ ...base, temperature: 23 }, plan)).toBeNull();
  });

});

// ─────────────────────────────────────────────────────────────────────────────
// VL — Luminosidade: 5 pontos completos [5000, 25000]
// Os sprints anteriores não cobriram os 5 pontos VL de luminosidade.
//
// | Valor  | Situação                  | Esperado    | Caso        |
// |--------|---------------------------|-------------|-------------|
// |   4999 | abaixo do limite inferior | Informativo | TU_AC04_S3  |
// |   5000 | limite inferior           | null        | TU_AC05_S3  |
// |  15000 | valor nominal interior    | null        | TU_AC06_S3  |
// |  25000 | limite superior           | null        | TU_AC07_S3  |
// |  25001 | acima do limite superior  | Informativo | TU_AC08_S3  |
// ─────────────────────────────────────────────────────────────────────────────
describe('classifyAlert — VL luminosidade completo [5000, 25000] — adições S3', () => {

  // TU_AC04_S3 — VL: luminosidade=4999 (abaixo do mínimo 5000) → Informativo
  test('[TU_AC04_S3][VL] luminosidade=4999 (abaixo do mínimo) → Informativo', () => {
    expect(classifyAlert({ ...base, luminosity: 4999 }, plan)).toBe('Informativo');
  });

  // TU_AC05_S3 — VL: luminosidade=5000 (limite inferior exato) → null
  test('[TU_AC05_S3][VL] luminosidade=5000 (limite inferior exato) → null', () => {
    expect(classifyAlert({ ...base, luminosity: 5000 }, plan)).toBeNull();
  });

  // TU_AC06_S3 — VL: luminosidade=15000 (valor nominal interior) → null
  test('[TU_AC06_S3][VL] luminosidade=15000 (valor nominal interior) → null', () => {
    expect(classifyAlert({ ...base, luminosity: 15000 }, plan)).toBeNull();
  });

  // TU_AC07_S3 — VL: luminosidade=25000 (limite superior exato) → null
  test('[TU_AC07_S3][VL] luminosidade=25000 (limite superior exato) → null', () => {
    expect(classifyAlert({ ...base, luminosity: 25000 }, plan)).toBeNull();
  });

  // TU_AC08_S3 — VL: luminosidade=25001 (acima do máximo 25000) → Informativo
  test('[TU_AC08_S3][VL] luminosidade=25001 (acima do máximo) → Informativo', () => {
    expect(classifyAlert({ ...base, luminosity: 25001 }, plan)).toBe('Informativo');
  });

});

// ─────────────────────────────────────────────────────────────────────────────
// PE — sensorOK ausente (undefined) → comportamento por defeito = true
//
// O código tem: const { sensorOK = true } = measurement;
// Nunca tinha sido testado diretamente — se sensorOK não vem na medição,
// deve comportar-se como se fosse true (sensor OK).
// ─────────────────────────────────────────────────────────────────────────────
describe('classifyAlert — PE sensorOK por defeito — adições S3', () => {

  // TU_AC09_S3 — PE: sensorOK ausente + violação → deve gerar alerta (default=true)
  test('[TU_AC09_S3][PE] sensorOK ausente + temperatura violada → alerta gerado (default true)', () => {
    const semSensor = { temperature: 29, humidity: 60, luminosity: 15000 }; // sensorOK omitido
    expect(classifyAlert(semSensor, plan)).toBe('Informativo');
  });

  // TU_AC10_S3 — PE: sensorOK ausente + sem violação → null (default=true, mas sem alerta)
  test('[TU_AC10_S3][PE] sensorOK ausente + sem violação → null', () => {
    const semSensor = { temperature: 23, humidity: 60, luminosity: 15000 }; // sensorOK omitido
    expect(classifyAlert(semSensor, plan)).toBeNull();
  });

});

// ─────────────────────────────────────────────────────────────────────────────
// CM — C4=false com múltiplas violações simultâneas
//
// Os sprints anteriores só testaram C4=false com C1=true e C2=C3=false (TU110_S2).
// Faltava confirmar que C4=false anula o alerta MESMO com 2 ou 3 violações.
//
// Tabela CM adicional:
// | # | C1 | C2 | C3 | C4    | Resultado | Caso        |
// |---|----|----|----|----- -|-----------|-------------|
// | A | T  | T  | F  | false | null      | TU_AC11_S3  | ← 2 violações mas sensor KO
// | B | T  | T  | T  | false | null      | TU_AC12_S3  | ← 3 violações mas sensor KO
// ─────────────────────────────────────────────────────────────────────────────
describe('classifyAlert — CM C4=false com múltiplas violações — adições S3', () => {

  // TU_AC11_S3 — CM: C1=T, C2=T, C3=F, C4=false → null (sensor KO cancela 2 violações)
  test('[TU_AC11_S3][CM] C1=T, C2=T, C3=F, C4=false → null (sensor KO cancela alerta de Aviso)', () => {
    const m = { temperature: 29, humidity: 39, luminosity: 15000, sensorOK: false };
    expect(classifyAlert(m, plan)).toBeNull();
  });

  // TU_AC12_S3 — CM: C1=T, C2=T, C3=T, C4=false → null (sensor KO cancela 3 violações)
  test('[TU_AC12_S3][CM] C1=T, C2=T, C3=T, C4=false → null (sensor KO cancela alerta Crítico)', () => {
    const m = { temperature: 29, humidity: 39, luminosity: 4999, sensorOK: false };
    expect(classifyAlert(m, plan)).toBeNull();
  });

});
