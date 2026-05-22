/**
 * herbValidator.additions.test.js — Adições ao Sprint 3
 *
 * Ficheiro complementar ao herbValidator.test.js dos sprints anteriores.
 * Adiciona os casos de teste em falta identificados na revisão do Sprint 3.
 *
 * Técnicas aplicadas:
 *   VL  — Análise de Valores Limite (description: valor 499, string vazia como opcional)
 *   PE  — Particionamento de Equivalência (category case-sensitive, growthType individual)
 *   CM  — Cobertura de Condições Múltiplas (combinação C1+C2 em falta)
 *
 * Problema identificado nos sprints anteriores:
 *   1. description: testados 500 (ok) e 501 (rejeita), mas faltava 499 e string vazia.
 *   2. category case-sensitive: nunca testado "medicinal" vs "Medicinal".
 *   3. growthType: cada valor válido era testado num forEach, sem ID de teste rastreável.
 *   4. CM: faltava a combinação C1=false + C2=false (dois campos obrigatórios inválidos).
 *   5. Nos testes VL de aceitação só se verificava isValid=true, sem confirmar errors=[].
 */

const { validateHerb, VALID_CATEGORIES, VALID_GROWTH_TYPES } = require('../../src/validators/herbValidator');

const validHerb = () => ({
  scientificName: 'Mentha spicata',
  commonName: 'Hortelã',
  category: 'Culinária',
  growthType: 'Rápido',
  description: 'Erva aromática muito comum.'
});

// ─────────────────────────────────────────────────────────────────────────────
// VL — description: pontos em falta [0, 500]
//
// | Valor | Situação                  | Esperado | Caso        |
// |-------|---------------------------|----------|-------------|
// |     0 | string vazia (opcional)   | aceita   | TU_HV01_S3  |
// |   499 | um abaixo do limite sup.  | aceita   | TU_HV02_S3  |
// |   500 | limite superior           | aceita   | TU49_S2 ✓   |
// |   501 | acima do limite superior  | rejeita  | TU50_S2 ✓   |
// ─────────────────────────────────────────────────────────────────────────────
describe('validateHerb — VL description: valores em falta — adições S3', () => {

  // TU_HV01_S3 — VL: description="" (string vazia) → campo opcional, deve aceitar
  test('[TU_HV01_S3][VL] description="" (string vazia) → aceita como campo opcional', () => {
    const result = validateHerb({ ...validHerb(), description: '' });
    expect(result.isValid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  // TU_HV02_S3 — VL: description=499 chars (um abaixo do limite superior 500) → aceita
  test('[TU_HV02_S3][VL] description com 499 chars (um abaixo do máximo) → aceita', () => {
    const result = validateHerb({ ...validHerb(), description: 'A'.repeat(499) });
    expect(result.isValid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  // TU_HV03_S3 — VL: description=500 chars → confirma errors=[] (em falta no sprint anterior)
  test('[TU_HV03_S3][VL] description com 500 chars (limite superior) → isValid=true E errors vazio', () => {
    const result = validateHerb({ ...validHerb(), description: 'A'.repeat(500) });
    expect(result.isValid).toBe(true);
    expect(result.errors).toHaveLength(0); // ← verificação que faltava
  });

  // TU_HV04_S3 — VL: description=501 chars → rejeita E confirma mensagem exata
  test('[TU_HV04_S3][VL] description com 501 chars → mensagem de erro confirmada', () => {
    const result = validateHerb({ ...validHerb(), description: 'A'.repeat(501) });
    expect(result.isValid).toBe(false);
    expect(result.errors).toContain('Descrição não pode exceder 500 caracteres');
    expect(result.errors.filter(e => !e.includes('Descrição'))).toHaveLength(0);
  });

});

// ─────────────────────────────────────────────────────────────────────────────
// PE — category: verificação case-sensitive
//
// O validador usa includes() sobre VALID_CATEGORIES (["Medicinal", "Culinária", ...]).
// Nunca foi testado se "medicinal" (minúsculas) é rejeitado.
// ─────────────────────────────────────────────────────────────────────────────
describe('validateHerb — PE category: case-sensitive — adições S3', () => {

  // TU_HV05_S3 — PE: category em minúsculas → rejeita (validação é case-sensitive)
  test('[TU_HV05_S3][PE] category="medicinal" (minúsculas) → rejeita (case-sensitive)', () => {
    const result = validateHerb({ ...validHerb(), category: 'medicinal' });
    expect(result.isValid).toBe(false);
    expect(result.errors.some(e => e.includes('Categoria inválida'))).toBe(true);
  });

  // TU_HV06_S3 — PE: category="CULINÁRIA" (maiúsculas) → rejeita
  test('[TU_HV06_S3][PE] category="CULINÁRIA" (maiúsculas) → rejeita (case-sensitive)', () => {
    const result = validateHerb({ ...validHerb(), category: 'CULINÁRIA' });
    expect(result.isValid).toBe(false);
    expect(result.errors.some(e => e.includes('Categoria inválida'))).toBe(true);
  });

  // TU_HV07_S3 — PE: cada categoria válida aceite individualmente (rastreável)
  // Substituição do forEach anónimo do sprint anterior por testes com IDs rastreáveis
  test('[TU_HV07_S3][PE] category="Medicinal" (caixa correta) → aceita', () => {
    expect(validateHerb({ ...validHerb(), category: 'Medicinal' }).isValid).toBe(true);
  });

  test('[TU_HV08_S3][PE] category="Culinária" (caixa correta) → aceita', () => {
    expect(validateHerb({ ...validHerb(), category: 'Culinária' }).isValid).toBe(true);
  });

  test('[TU_HV09_S3][PE] category="Ornamental" (caixa correta) → aceita', () => {
    expect(validateHerb({ ...validHerb(), category: 'Ornamental' }).isValid).toBe(true);
  });

  test('[TU_HV10_S3][PE] category="Aromática" (caixa correta) → aceita', () => {
    expect(validateHerb({ ...validHerb(), category: 'Aromática' }).isValid).toBe(true);
  });

});

// ─────────────────────────────────────────────────────────────────────────────
// PE — growthType: cada valor válido com ID rastreável
// Os sprints anteriores usavam forEach sem IDs de teste na matriz.
// ─────────────────────────────────────────────────────────────────────────────
describe('validateHerb — PE growthType: valores válidos rastreáveis — adições S3', () => {

  // TU_HV11_S3 — PE: growthType="Rápido" → aceita
  test('[TU_HV11_S3][PE] growthType="Rápido" → aceita', () => {
    expect(validateHerb({ ...validHerb(), growthType: 'Rápido' }).isValid).toBe(true);
  });

  // TU_HV12_S3 — PE: growthType="Moderado" → aceita
  test('[TU_HV12_S3][PE] growthType="Moderado" → aceita', () => {
    expect(validateHerb({ ...validHerb(), growthType: 'Moderado' }).isValid).toBe(true);
  });

  // TU_HV13_S3 — PE: growthType="Lento" → aceita
  test('[TU_HV13_S3][PE] growthType="Lento" → aceita', () => {
    expect(validateHerb({ ...validHerb(), growthType: 'Lento' }).isValid).toBe(true);
  });

  // TU_HV14_S3 — PE: growthType="rápido" (minúsculas) → rejeita (case-sensitive)
  test('[TU_HV14_S3][PE] growthType="rápido" (minúsculas) → rejeita (case-sensitive)', () => {
    const result = validateHerb({ ...validHerb(), growthType: 'rápido' });
    expect(result.isValid).toBe(false);
    expect(result.errors.some(e => e.includes('Tipo de crescimento inválido'))).toBe(true);
  });

});

// ─────────────────────────────────────────────────────────────────────────────
// CM — combinação C1+C2 em falta
//
// A tabela MC/DC dos sprints anteriores tinha:
//   C1=F, C2=T, C3=T → false  (TU52_S2)
//   C1=T, C2=F, C3=T → false  (TU53_S2)
//   C1=T, C2=T, C3=F → false  (TU54_S2)
//   C1=T, C2=T, C3=T → true   (TU33_S2)
//
// Faltava: C1=F, C2=F, C3=T → false (dois campos obrigatórios inválidos)
// Esta linha testa que os erros se acumulam corretamente quando C1 e C2 falham juntos.
// ─────────────────────────────────────────────────────────────────────────────
describe('validateHerb — CM combinação C1+C2 em falta — adições S3', () => {

  // TU_HV15_S3 — CM: C1=F (scientificName inválido) + C2=F (commonName inválido), C3=T → false
  test('[TU_HV15_S3][CM] C1=F, C2=F, C3=T → false, acumula erros de scientificName e commonName', () => {
    const result = validateHerb({
      ...validHerb(),
      scientificName: '',  // C1=false
      commonName: ''       // C2=false
      // category válida → C3=true
    });
    expect(result.isValid).toBe(false);
    expect(result.errors.some(e => e.includes('científico'))).toBe(true);
    expect(result.errors.some(e => e.includes('comum'))).toBe(true);
    expect(result.errors.some(e => e.includes('Categoria'))).toBe(false);
    expect(result.errors.length).toBeGreaterThanOrEqual(2);
  });

  // TU_HV16_S3 — CM: C1=T, C2=T, C3=T → true, confirma errors=[] (caso base com verificação)
  test('[TU_HV16_S3][CM] C1=T, C2=T, C3=T → true, errors=[] (baseline verificado)', () => {
    const result = validateHerb(validHerb());
    expect(result.isValid).toBe(true);
    expect(result.errors).toHaveLength(0); // ← em falta no sprint anterior
  });

});

// ─────────────────────────────────────────────────────────────────────────────
// PE — Caracteres Especiais em campos de texto (adições S3)
// ─────────────────────────────────────────────────────────────────────────────
describe('validateHerb — caracteres especiais (PE — adições S3)', () => {

  // TU_HV_CS01_S3 — Classe C: acentos em scientificName → aceita
  test('[TU_HV_CS01_S3][PE] scientificName com acentos ("Mentha aquática") → aceita', () => {
    const result = validateHerb({ ...validHerb(), scientificName: 'Mentha aquática' });
    expect(result.isValid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  // TU_HV_CS02_S3 — Classe B: HTML em scientificName → aceita (sem sanitização no validador)
  test('[TU_HV_CS02_S3][PE] scientificName com HTML ("<b>Mentha</b> spicata") → aceita sem sanitização', () => {
    const result = validateHerb({ ...validHerb(), scientificName: '<b>Mentha</b> spicata' });
    expect(result.isValid).toBe(true); // 22 chars, dentro de [2,150]
  });

  // TU_HV_CS03_S3 — Classe F: ampersand em commonName → aceita
  test('[TU_HV_CS03_S3][PE] commonName com ampersand ("Hortelã & Menta") → aceita', () => {
    const result = validateHerb({ ...validHerb(), commonName: 'Hortelã & Menta' });
    expect(result.isValid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  // TU_HV_CS04_S3 — Classe E: só espaços em scientificName → rejeita (trim() === '')
  test('[TU_HV_CS04_S3][PE] scientificName com só espaços ("   ") → rejeita como vazio', () => {
    const result = validateHerb({ ...validHerb(), scientificName: '   ' });
    expect(result.isValid).toBe(false);
    expect(result.errors).toContain('Nome científico é obrigatório');
  });

  // TU_HV_CS05_S3 — Classe E: só espaços em commonName → rejeita
  test('[TU_HV_CS05_S3][PE] commonName com só espaços ("   ") → rejeita como vazio', () => {
    const result = validateHerb({ ...validHerb(), commonName: '   ' });
    expect(result.isValid).toBe(false);
    expect(result.errors).toContain('Nome comum é obrigatório');
  });

  // TU_HV_CS06_S3 — Classe E: newline em description → aceita
  test('[TU_HV_CS06_S3][PE] description com newline ("linha1\\nlinha2") → aceita', () => {
    const result = validateHerb({ ...validHerb(), description: 'linha1\nlinha2' });
    expect(result.isValid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  // TU_HV_CS07_S3 — Classe D: emoji em description → aceita
  test('[TU_HV_CS07_S3][PE] description com emoji ("Erva 🌿 aromática") → aceita', () => {
    const result = validateHerb({ ...validHerb(), description: 'Erva 🌿 aromática' });
    expect(result.isValid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

});
