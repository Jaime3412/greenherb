/**
 * herbValidator.test.js — Testes de Unidade — Sprint 2
 *
 * Técnicas aplicadas:
 *   PE  — Particionamento de Equivalência
 *   VL  — Análise de Valores Limite
 *   CM  — Cobertura de Condições Múltiplas
 *
 * Requisitos cobertos:
 *   RF-03 — Importação de ervas aromáticas (CSV)
 *   RN-10 — Validação de campos de erva aromática
 *   RN-11 — Categorias válidas de ervas
 */

const {
  validateHerb,
  validateHerbCsvRow,
  VALID_CATEGORIES,
  VALID_GROWTH_TYPES
} = require('../../src/validators/herbValidator');

// Helper: dados base válidos
const validHerb = () => ({
  scientificName: 'Mentha spicata',
  commonName: 'Hortelã',
  category: 'Culinária',
  growthType: 'Rápido',
  description: 'Erva aromática muito comum.'
});

// ─────────────────────────────────────────────────────────────────────────────
// validateHerb — campo scientificName
// ─────────────────────────────────────────────────────────────────────────────
describe('validateHerb — scientificName', () => {

  // TU33_S2 — PE: todos os campos válidos → aceita
  test('[TU33_S2][PE] deve aceitar erva com dados completamente válidos', () => {
    const result = validateHerb(validHerb());
    expect(result.isValid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  // TU34_S2 — PE: nome científico vazio (classe inválida: ausente)
  test('[TU34_S2][PE] deve rejeitar nome científico vazio', () => {
    const result = validateHerb({ ...validHerb(), scientificName: '' });
    expect(result.isValid).toBe(false);
    expect(result.errors).toContain('Nome científico é obrigatório');
  });

  // TU35_S2 — VL: nome científico com 1 char (abaixo do mínimo 2)
  test('[TU35_S2][VL] deve rejeitar nome científico com 1 caractere (abaixo do mínimo 2)', () => {
    const result = validateHerb({ ...validHerb(), scientificName: 'A' });
    expect(result.isValid).toBe(false);
    expect(result.errors).toContain('Nome científico deve ter pelo menos 2 caracteres');
  });

  // TU36_S2 — VL: nome científico com 2 chars (limite inferior)
  test('[TU36_S2][VL] deve aceitar nome científico com 2 caracteres (limite inferior)', () => {
    const result = validateHerb({ ...validHerb(), scientificName: 'Ab' });
    expect(result.isValid).toBe(true);
  });

  // TU37_S2 — VL: nome científico com 75 chars (valor nominal)
  test('[TU37_S2][VL] deve aceitar nome científico com 75 caracteres (valor nominal)', () => {
    const result = validateHerb({ ...validHerb(), scientificName: 'A'.repeat(75) });
    expect(result.isValid).toBe(true);
  });

  // TU38_S2 — VL: nome científico com 150 chars (limite superior)
  test('[TU38_S2][VL] deve aceitar nome científico com 150 caracteres (limite superior)', () => {
    const result = validateHerb({ ...validHerb(), scientificName: 'A'.repeat(150) });
    expect(result.isValid).toBe(true);
  });

  // TU39_S2 — VL: nome científico com 151 chars (acima do limite superior)
  test('[TU39_S2][VL] deve rejeitar nome científico com 151 caracteres (acima do máximo 150)', () => {
    const result = validateHerb({ ...validHerb(), scientificName: 'A'.repeat(151) });
    expect(result.isValid).toBe(false);
    expect(result.errors).toContain('Nome científico não pode exceder 150 caracteres');
  });

});

// ─────────────────────────────────────────────────────────────────────────────
// validateHerb — campo commonName
// ─────────────────────────────────────────────────────────────────────────────
describe('validateHerb — commonName', () => {

  // TU40_S2 — PE: nome comum vazio (classe inválida)
  test('[TU40_S2][PE] deve rejeitar nome comum vazio', () => {
    const result = validateHerb({ ...validHerb(), commonName: '' });
    expect(result.isValid).toBe(false);
    expect(result.errors).toContain('Nome comum é obrigatório');
  });

  // TU41_S2 — VL: nome comum com 1 char (abaixo do mínimo 2)
  test('[TU41_S2][VL] deve rejeitar nome comum com 1 caractere (abaixo do mínimo 2)', () => {
    const result = validateHerb({ ...validHerb(), commonName: 'A' });
    expect(result.isValid).toBe(false);
    expect(result.errors).toContain('Nome comum deve ter pelo menos 2 caracteres');
  });

  // TU42_S2 — VL: nome comum com 2 chars (limite inferior)
  test('[TU42_S2][VL] deve aceitar nome comum com 2 caracteres (limite inferior)', () => {
    const result = validateHerb({ ...validHerb(), commonName: 'Ab' });
    expect(result.isValid).toBe(true);
  });

  // TU43_S2 — VL: nome comum com 100 chars (limite superior)
  test('[TU43_S2][VL] deve aceitar nome comum com 100 caracteres (limite superior)', () => {
    const result = validateHerb({ ...validHerb(), commonName: 'A'.repeat(100) });
    expect(result.isValid).toBe(true);
  });

  // TU44_S2 — VL: nome comum com 101 chars (acima do limite superior)
  test('[TU44_S2][VL] deve rejeitar nome comum com 101 caracteres (acima do máximo 100)', () => {
    const result = validateHerb({ ...validHerb(), commonName: 'A'.repeat(101) });
    expect(result.isValid).toBe(false);
    expect(result.errors).toContain('Nome comum não pode exceder 100 caracteres');
  });

});

// ─────────────────────────────────────────────────────────────────────────────
// validateHerb — campo category (Particionamento de Equivalência)
// ─────────────────────────────────────────────────────────────────────────────
describe('validateHerb — category', () => {

  VALID_CATEGORIES.forEach(cat => {
    test(`[PE] deve aceitar categoria válida: ${cat}`, () => {
      const result = validateHerb({ ...validHerb(), category: cat });
      expect(result.isValid).toBe(true);
    });
  });

  // TU45_S2 — PE: categoria inválida
  test('[TU45_S2][PE] deve rejeitar categoria inválida', () => {
    const result = validateHerb({ ...validHerb(), category: 'Toxica' });
    expect(result.isValid).toBe(false);
    expect(result.errors.some(e => e.includes('Categoria inválida'))).toBe(true);
  });

  // TU46_S2 — PE: categoria vazia
  test('[TU46_S2][PE] deve rejeitar categoria vazia', () => {
    const result = validateHerb({ ...validHerb(), category: '' });
    expect(result.isValid).toBe(false);
    expect(result.errors).toContain('Categoria é obrigatória');
  });

});

// ─────────────────────────────────────────────────────────────────────────────
// validateHerb — campo growthType (opcional)
// ─────────────────────────────────────────────────────────────────────────────
describe('validateHerb — growthType (campo opcional)', () => {

  // TU47_S2 — PE: growthType ausente → válido
  test('[TU47_S2][PE] deve aceitar erva sem growthType (campo opcional)', () => {
    const data = { ...validHerb() };
    delete data.growthType;
    const result = validateHerb(data);
    expect(result.isValid).toBe(true);
  });

  VALID_GROWTH_TYPES.forEach(gt => {
    test(`[PE] deve aceitar growthType válido: ${gt}`, () => {
      const result = validateHerb({ ...validHerb(), growthType: gt });
      expect(result.isValid).toBe(true);
    });
  });

  // TU48_S2 — PE: growthType inválido
  test('[TU48_S2][PE] deve rejeitar growthType inválido quando fornecido', () => {
    const result = validateHerb({ ...validHerb(), growthType: 'Explosivo' });
    expect(result.isValid).toBe(false);
    expect(result.errors.some(e => e.includes('Tipo de crescimento inválido'))).toBe(true);
  });

});

// ─────────────────────────────────────────────────────────────────────────────
// validateHerb — campo description
// ─────────────────────────────────────────────────────────────────────────────
describe('validateHerb — description (campo opcional, máx. 500 chars)', () => {

  // TU49_S2 — VL: descrição com 500 chars (limite superior)
  test('[TU49_S2][VL] deve aceitar descrição com 500 caracteres (limite superior)', () => {
    const result = validateHerb({ ...validHerb(), description: 'A'.repeat(500) });
    expect(result.isValid).toBe(true);
  });

  // TU50_S2 — VL: descrição com 501 chars (acima do limite superior)
  test('[TU50_S2][VL] deve rejeitar descrição com 501 caracteres (acima do máximo 500)', () => {
    const result = validateHerb({ ...validHerb(), description: 'A'.repeat(501) });
    expect(result.isValid).toBe(false);
    expect(result.errors).toContain('Descrição não pode exceder 500 caracteres');
  });

  // TU51_S2 — PE: descrição ausente → válido
  test('[TU51_S2][PE] deve aceitar erva sem descrição', () => {
    const data = { ...validHerb() };
    delete data.description;
    const result = validateHerb(data);
    expect(result.isValid).toBe(true);
  });

});

// ─────────────────────────────────────────────────────────────────────────────
// Cobertura de Condições Múltiplas — validateHerb
//
// Decisão composta: a erva é válida apenas se TODOS os campos obrigatórios
// são válidos: C1 (scientificName OK) && C2 (commonName OK) && C3 (category OK)
//
// Subconjunto MC/DC (cada condição afeta isoladamente o resultado):
// | # | C1    | C2    | C3    | isValid | Caso de teste |
// |---|-------|-------|-------|---------|---------------|
// | 1 | false | true  | true  | false   | TU52_S2       |
// | 2 | true  | false | true  | false   | TU53_S2       |
// | 3 | true  | true  | false | false   | TU54_S2       |
// | 4 | true  | true  | true  | true    | TU33_S2 (base)|
// ─────────────────────────────────────────────────────────────────────────────
describe('validateHerb — Cobertura de Condições Múltiplas (CM)', () => {

  // TU52_S2 — C1=false, C2=true, C3=true → isValid=false
  test('[TU52_S2][CM] C1=false (scientificName inválido), C2=true, C3=true → isValid=false', () => {
    const result = validateHerb({ ...validHerb(), scientificName: '' });
    expect(result.isValid).toBe(false);
    expect(result.errors.some(e => e.includes('científico'))).toBe(true);
    expect(result.errors.some(e => e.includes('comum') || e.includes('Categoria'))).toBe(false);
  });

  // TU53_S2 — C1=true, C2=false, C3=true → isValid=false
  test('[TU53_S2][CM] C1=true, C2=false (commonName inválido), C3=true → isValid=false', () => {
    const result = validateHerb({ ...validHerb(), commonName: '' });
    expect(result.isValid).toBe(false);
    expect(result.errors.some(e => e.includes('comum'))).toBe(true);
    expect(result.errors.some(e => e.includes('científico') || e.includes('Categoria'))).toBe(false);
  });

  // TU54_S2 — C1=true, C2=true, C3=false → isValid=false
  test('[TU54_S2][CM] C1=true, C2=true, C3=false (category inválida) → isValid=false', () => {
    const result = validateHerb({ ...validHerb(), category: '' });
    expect(result.isValid).toBe(false);
    expect(result.errors.some(e => e.includes('Categoria'))).toBe(true);
    expect(result.errors.some(e => e.includes('científico') || e.includes('comum'))).toBe(false);
  });

  // TU55_S2 — todos inválidos → acumula erros
  test('[TU55_S2][CM] todos os campos obrigatórios inválidos → acumula todos os erros', () => {
    const result = validateHerb({ scientificName: '', commonName: '', category: '' });
    expect(result.isValid).toBe(false);
    expect(result.errors.length).toBeGreaterThanOrEqual(3);
  });

});

// ─────────────────────────────────────────────────────────────────────────────
// validateHerbCsvRow — delega em validateHerb e acrescenta lineNumber
// ─────────────────────────────────────────────────────────────────────────────
describe('validateHerbCsvRow', () => {

  // TU56_S2 — PE: linha válida
  test('[TU56_S2][PE] deve devolver isValid=true e lineNumber correto para linha válida', () => {
    const result = validateHerbCsvRow(validHerb(), 3);
    expect(result.isValid).toBe(true);
    expect(result.lineNumber).toBe(3);
  });

  // TU57_S2 — PE: linha inválida
  test('[TU57_S2][PE] deve devolver isValid=false e lineNumber correto para linha inválida', () => {
    const result = validateHerbCsvRow({ ...validHerb(), category: 'Invalida' }, 7);
    expect(result.isValid).toBe(false);
    expect(result.lineNumber).toBe(7);
    expect(result.errors.length).toBeGreaterThan(0);
  });

});
