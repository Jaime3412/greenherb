/**
 * authValidator.additions.test.js — Adições ao Sprint 3
 *
 * Ficheiro complementar ao authValidator.test.js dos sprints anteriores.
 * Adiciona os casos de teste em falta identificados na revisão do Sprint 3.
 *
 * Técnicas aplicadas:
 *   VL  — Análise de Valores Limite (mensagens de erro verificadas + valores em falta)
 *   PE  — Particionamento de Equivalência (novos formatos de email inválido)
 *   CM  — Cobertura de Condições Múltiplas (caso base explícito + combinações parciais)
 *
 * Problema identificado nos sprints anteriores:
 *   1. Nos testes VL de aceitação (TU04, TU05, TU06, TU14, TU15, TU16...)
 *      só era verificado isValid=true, sem confirmar que errors=[] (sem erros).
 *   2. Faltava o valor VL 99 chars para o nome (um abaixo do limite superior 100).
 *   3. Faltavam formatos de email inválidos mais específicos (sem domínio, sem TLD).
 *   4. A tabela CM não tinha o caso base explícito (todos os campos válidos = 0 erros).
 *   5. Faltavam combinações parciais de CM (2 campos inválidos em simultâneo).
 */

const { validateRegister, validateLogin } = require('../../src/validators/authValidator');

// ─────────────────────────────────────────────────────────────────────────────
// VL — Nome: verificação de mensagens de erro + valor 99 chars em falta
// ─────────────────────────────────────────────────────────────────────────────
describe('validateRegister — VL nome: mensagens confirmadas + valor 99 — adições S3', () => {

  // TU_AV01_S3 — VL: nome=1 char → confirmar mensagem de erro exata
  test('[TU_AV01_S3][VL] nome com 1 char → errors contém mensagem de mínimo exata', () => {
    const result = validateRegister({ name: 'A', email: 'joao@greenherb.pt', password: 'senha123', role: 'Tecnico' });
    expect(result.isValid).toBe(false);
    expect(result.errors).toContain('Nome deve ter pelo menos 2 caracteres');
    // confirmar que não há outros erros (erro é isolado ao nome)
    expect(result.errors.filter(e => !e.includes('Nome'))).toHaveLength(0);
  });

  // TU_AV02_S3 — VL: nome=2 chars → aceita E confirma errors=[]
  test('[TU_AV02_S3][VL] nome com 2 chars (limite inferior) → isValid=true E errors vazio', () => {
    const result = validateRegister({ name: 'AB', email: 'joao@greenherb.pt', password: 'senha123', role: 'Tecnico' });
    expect(result.isValid).toBe(true);
    expect(result.errors).toHaveLength(0); // ← verificação em falta nos sprints anteriores
  });

  // TU_AV03_S3 — VL: nome=99 chars (um abaixo do limite superior 100) → aceita
  // Este valor estava em falta na tabela VL original.
  test('[TU_AV03_S3][VL] nome com 99 chars (um abaixo do limite superior) → aceita', () => {
    const result = validateRegister({ name: 'A'.repeat(99), email: 'joao@greenherb.pt', password: 'senha123', role: 'Tecnico' });
    expect(result.isValid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  // TU_AV04_S3 — VL: nome=100 chars → aceita E confirma errors=[]
  test('[TU_AV04_S3][VL] nome com 100 chars (limite superior) → isValid=true E errors vazio', () => {
    const result = validateRegister({ name: 'A'.repeat(100), email: 'joao@greenherb.pt', password: 'senha123', role: 'Tecnico' });
    expect(result.isValid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  // TU_AV05_S3 — VL: nome=101 chars → rejeita E confirma mensagem exata
  test('[TU_AV05_S3][VL] nome com 101 chars (acima do máximo) → mensagem de erro confirmada', () => {
    const result = validateRegister({ name: 'A'.repeat(101), email: 'joao@greenherb.pt', password: 'senha123', role: 'Tecnico' });
    expect(result.isValid).toBe(false);
    expect(result.errors).toContain('Nome não pode exceder 100 caracteres');
    expect(result.errors.filter(e => !e.includes('Nome'))).toHaveLength(0);
  });

});

// ─────────────────────────────────────────────────────────────────────────────
// VL — Password: verificação de mensagens de erro (em falta nos sprints anteriores)
// ─────────────────────────────────────────────────────────────────────────────
describe('validateRegister — VL password: mensagens confirmadas — adições S3', () => {

  // TU_AV06_S3 — VL: password=5 chars → confirmar mensagem exata
  test('[TU_AV06_S3][VL] password com 5 chars → mensagem de mínimo confirmada', () => {
    const result = validateRegister({ name: 'João', email: 'joao@greenherb.pt', password: '12345', role: 'Tecnico' });
    expect(result.isValid).toBe(false);
    expect(result.errors).toContain('Password deve ter pelo menos 6 caracteres');
    expect(result.errors.filter(e => !e.includes('Password'))).toHaveLength(0);
  });

  // TU_AV07_S3 — VL: password=6 chars → aceita E confirma errors=[]
  test('[TU_AV07_S3][VL] password com 6 chars (limite inferior) → isValid=true E errors vazio', () => {
    const result = validateRegister({ name: 'João', email: 'joao@greenherb.pt', password: '123456', role: 'Tecnico' });
    expect(result.isValid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  // TU_AV08_S3 — VL: password=127 chars (um abaixo do limite superior 128) → aceita
  // Este valor estava em falta na tabela VL original.
  test('[TU_AV08_S3][VL] password com 127 chars (um abaixo do limite superior) → aceita', () => {
    const result = validateRegister({ name: 'João', email: 'joao@greenherb.pt', password: 'a'.repeat(127), role: 'Tecnico' });
    expect(result.isValid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  // TU_AV09_S3 — VL: password=128 chars → aceita E confirma errors=[]
  test('[TU_AV09_S3][VL] password com 128 chars (limite superior) → isValid=true E errors vazio', () => {
    const result = validateRegister({ name: 'João', email: 'joao@greenherb.pt', password: 'a'.repeat(128), role: 'Tecnico' });
    expect(result.isValid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  // TU_AV10_S3 — VL: password=129 chars → rejeita E confirma mensagem exata
  test('[TU_AV10_S3][VL] password com 129 chars (acima do máximo) → mensagem de erro confirmada', () => {
    const result = validateRegister({ name: 'João', email: 'joao@greenherb.pt', password: 'a'.repeat(129), role: 'Tecnico' });
    expect(result.isValid).toBe(false);
    expect(result.errors).toContain('Password não pode exceder 128 caracteres');
    expect(result.errors.filter(e => !e.includes('Password'))).toHaveLength(0);
  });

});

// ─────────────────────────────────────────────────────────────────────────────
// PE — Email: novos formatos inválidos em falta
// ─────────────────────────────────────────────────────────────────────────────
describe('validateRegister — PE email: formatos inválidos adicionais — adições S3', () => {

  // TU_AV11_S3 — PE: email sem domínio (ex: "joao@") → classe inválida
  test('[TU_AV11_S3][PE] email sem domínio ("joao@") → rejeita com Email inválido', () => {
    const result = validateRegister({ name: 'João', email: 'joao@', password: 'senha123', role: 'Tecnico' });
    expect(result.isValid).toBe(false);
    expect(result.errors).toContain('Email inválido');
  });

  // TU_AV12_S3 — PE: email sem TLD (ex: "joao@greenherb") → classe inválida
  test('[TU_AV12_S3][PE] email sem TLD ("joao@greenherb") → rejeita com Email inválido', () => {
    const result = validateRegister({ name: 'João', email: 'joao@greenherb', password: 'senha123', role: 'Tecnico' });
    expect(result.isValid).toBe(false);
    expect(result.errors).toContain('Email inválido');
  });

  // TU_AV13_S3 — PE: email com espaço embebido → classe inválida
  test('[TU_AV13_S3][PE] email com espaço ("joao @greenherb.pt") → rejeita com Email inválido', () => {
    const result = validateRegister({ name: 'João', email: 'joao @greenherb.pt', password: 'senha123', role: 'Tecnico' });
    expect(result.isValid).toBe(false);
    expect(result.errors).toContain('Email inválido');
  });

});

// ─────────────────────────────────────────────────────────────────────────────
// CM — caso base explícito + combinações parciais em falta
//
// Os sprints anteriores tinham cada condição isolada (TU23-TU26) e todos=inválidos (TU27).
// Faltava:
//   - O caso base explícito (todos válidos → 0 erros), claramente identificado como CM
//   - Combinações com 2 campos inválidos em simultâneo
//
// Tabela CM completa (4 condições — C1:nome, C2:email, C3:password, C4:perfil):
// | # | C1 | C2 | C3 | C4 | errors | Caso        |
// |---|----|----|----|----|--------|-------------|
// | 0 | F  | F  | F  | F  | 0      | TU_AV14_S3  | ← caso base (em falta)
// | 1 | T  | F  | F  | F  | 1      | TU23 (S1)   |
// | 2 | F  | T  | F  | F  | 1      | TU24 (S1)   |
// | 3 | F  | F  | T  | F  | 1      | TU25 (S1)   |
// | 4 | F  | F  | F  | T  | 1      | TU26 (S1)   |
// | 5 | T  | T  | F  | F  | 2      | TU_AV15_S3  | ← combinação parcial (em falta)
// | 6 | F  | F  | T  | T  | 2      | TU_AV16_S3  | ← combinação parcial (em falta)
// |15 | T  | T  | T  | T  | ≥4     | TU27 (S1)   |
// ─────────────────────────────────────────────────────────────────────────────
describe('validateRegister — CM caso base e combinações parciais — adições S3', () => {

  // TU_AV14_S3 — CM linha 0: todos válidos → 0 erros (caso base explícito)
  test('[TU_AV14_S3][CM] linha 0: C1=F, C2=F, C3=F, C4=F → isValid=true, errors=[]', () => {
    const result = validateRegister({
      name: 'João Silva',
      email: 'joao@greenherb.pt',
      password: 'senha123',
      role: 'Tecnico'
    });
    expect(result.isValid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  // TU_AV15_S3 — CM linha 5: C1=T (nome inválido) + C2=T (email inválido), C3=F, C4=F → 2 erros
  test('[TU_AV15_S3][CM] C1=T + C2=T, C3=F, C4=F → 2 erros (nome e email)', () => {
    const result = validateRegister({
      name: 'A',            // C1=true: 1 char → inválido
      email: 'invalido',   // C2=true: sem @ → inválido
      password: 'senha123',
      role: 'Tecnico'
    });
    expect(result.isValid).toBe(false);
    expect(result.errors.some(e => e.includes('Nome'))).toBe(true);
    expect(result.errors.some(e => e.includes('Email'))).toBe(true);
    expect(result.errors.some(e => e.includes('Password') || e.includes('Perfil'))).toBe(false);
    expect(result.errors).toHaveLength(2);
  });

  // TU_AV16_S3 — CM linha 6: C3=T (password inválida) + C4=T (perfil inválido), C1=F, C2=F → 2 erros
  test('[TU_AV16_S3][CM] C3=T + C4=T, C1=F, C2=F → 2 erros (password e perfil)', () => {
    const result = validateRegister({
      name: 'João Silva',
      email: 'joao@greenherb.pt',
      password: '123',       // C3=true: < 6 chars → inválido
      role: 'Hacker'         // C4=true: perfil desconhecido → inválido
    });
    expect(result.isValid).toBe(false);
    expect(result.errors.some(e => e.includes('Password'))).toBe(true);
    expect(result.errors.some(e => e.includes('Perfil'))).toBe(true);
    expect(result.errors.some(e => e.includes('Nome') || e.includes('Email'))).toBe(false);
    expect(result.errors).toHaveLength(2);
  });

});

// ─────────────────────────────────────────────────────────────────────────────
// PE — Caracteres Especiais (adições S3)
//
// Classes testadas:
//   Classe A — Símbolos (!@#$%&*)
//   Classe B — HTML/Script (<script>, <b>)
//   Classe C — Acentos e Unicode latino (ã, é, ç)
//   Classe D — Emojis (😀, 🌿)
//   Classe E — Só espaços e caracteres de controlo (\n)
//   Classe F — Apóstrofes e aspas (', ")
// ─────────────────────────────────────────────────────────────────────────────
describe('validateRegister — caracteres especiais em name (PE — adições S3)', () => {

  // TU_AV_CS01_S3 — Classe F: apóstrofe em nome próprio → aceita
  test('[TU_AV_CS01_S3][PE] name com apóstrofe ("O\'Brien") → aceita', () => {
    const result = validateRegister({ name: "O'Brien", email: 'joao@greenherb.pt', password: 'senha123', role: 'Tecnico' });
    expect(result.isValid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  // TU_AV_CS02_S3 — Classe C: acentos em nome → aceita (nomes portugueses válidos)
  test('[TU_AV_CS02_S3][PE] name com acentos ("João Gonçalves") → aceita', () => {
    const result = validateRegister({ name: 'João Gonçalves', email: 'joao@greenherb.pt', password: 'senha123', role: 'Tecnico' });
    expect(result.isValid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  // TU_AV_CS03_S3 — Classe B: HTML em name → aceita (sem sanitização no validador de domínio)
  test('[TU_AV_CS03_S3][PE] name com HTML ("<script>alert(1)</script>") → aceita (sanitização é responsabilidade do output)', () => {
    const result = validateRegister({ name: '<script>alert(1)</script>', email: 'joao@greenherb.pt', password: 'senha123', role: 'Tecnico' });
    expect(result.isValid).toBe(true); // 26 chars, dentro de [2,100]
  });

  // TU_AV_CS04_S3 — Classe A: símbolos em name → aceita (sem restrição de charset)
  test('[TU_AV_CS04_S3][PE] name com símbolos ("Ana & Carlos") → aceita', () => {
    const result = validateRegister({ name: 'Ana & Carlos', email: 'joao@greenherb.pt', password: 'senha123', role: 'Tecnico' });
    expect(result.isValid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  // TU_AV_CS05_S3 — Classe E: só espaços no name → rejeita (trim() === '')
  test('[TU_AV_CS05_S3][PE] name com só espaços ("   ") → rejeita como vazio', () => {
    const result = validateRegister({ name: '   ', email: 'joao@greenherb.pt', password: 'senha123', role: 'Tecnico' });
    expect(result.isValid).toBe(false);
    expect(result.errors).toContain('Nome é obrigatório');
  });

  // TU_AV_CS06_S3 — Classe E: newline em name → trim remove, aceita
  test('[TU_AV_CS06_S3][PE] name com newline ("\\nJoão\\n") → aceita (trim remove whitespace)', () => {
    const result = validateRegister({ name: '\nJoão\n', email: 'joao@greenherb.pt', password: 'senha123', role: 'Tecnico' });
    expect(result.isValid).toBe(true);
  });

  // TU_AV_CS07_S3 — Classe D: emoji em name → aceita (sem restrição de charset)
  test('[TU_AV_CS07_S3][PE] name com emoji ("João 😀") → aceita', () => {
    const result = validateRegister({ name: 'João 😀', email: 'joao@greenherb.pt', password: 'senha123', role: 'Tecnico' });
    expect(result.isValid).toBe(true);
  });

});

describe('validateRegister — caracteres especiais em password (PE — adições S3)', () => {

  // TU_AV_CS08_S3 — Classe A: símbolos na password → aceita (passwords fortes)
  test('[TU_AV_CS08_S3][PE] password com símbolos ("P@ss!#$%") → aceita', () => {
    const result = validateRegister({ name: 'João', email: 'joao@greenherb.pt', password: 'P@ss!#$%', role: 'Tecnico' });
    expect(result.isValid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  // TU_AV_CS09_S3 — Classe C: password com acentos → aceita
  test('[TU_AV_CS09_S3][PE] password com acentos ("sénh@123") → aceita', () => {
    const result = validateRegister({ name: 'João', email: 'joao@greenherb.pt', password: 'sénh@123', role: 'Tecnico' });
    expect(result.isValid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  // TU_AV_CS10_S3 — Classe E: password só com espaços → rejeita (trim() === '')
  test('[TU_AV_CS10_S3][PE] password só com espaços ("      ") → rejeita como vazia', () => {
    const result = validateRegister({ name: 'João', email: 'joao@greenherb.pt', password: '      ', role: 'Tecnico' });
    expect(result.isValid).toBe(false);
    expect(result.errors).toContain('Password é obrigatória');
  });

  // TU_AV_CS11_S3 — Classe F: aspas na password → aceita
  test('[TU_AV_CS11_S3][PE] password com aspas ("pass\\"word\\"") → aceita', () => {
    const result = validateRegister({ name: 'João', email: 'joao@greenherb.pt', password: 'pass"word"', role: 'Tecnico' });
    expect(result.isValid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  // TU_AV_CS12_S3 — Classe D: emoji na password → aceita
  test('[TU_AV_CS12_S3][PE] password com emoji ("pass🌿word") → aceita', () => {
    const result = validateRegister({ name: 'João', email: 'joao@greenherb.pt', password: 'pass🌿word', role: 'Tecnico' });
    expect(result.isValid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

});

describe('validateRegister — caracteres especiais em email (PE — adições S3)', () => {

  // TU_AV_CS13_S3 — Classe A: dois @ no email → rejeita
  test('[TU_AV_CS13_S3][PE] email com dois @ ("jo@ao@greenherb.pt") → rejeita', () => {
    const result = validateRegister({ name: 'João', email: 'jo@ao@greenherb.pt', password: 'senha123', role: 'Tecnico' });
    expect(result.isValid).toBe(false);
    expect(result.errors).toContain('Email inválido');
  });

});
