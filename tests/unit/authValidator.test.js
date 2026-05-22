/**
 * authValidator.test.js — Testes de Unidade (Sprint 1 — melhorado)
 *
 * Técnicas aplicadas:
 *   PE  — Particionamento de Equivalência
 *   VL  — Análise de Valores Limite
 *   CM  — Cobertura de Condições Múltiplas
 *
 * Requisitos cobertos: RN-01 (validação de registo), RN-02 (perfis), RN-03 (login)
 */

const { validateRegister, validateLogin } = require('../../src/validators/authValidator');

// ─────────────────────────────────────────────────────────────────────────────
// validateRegister
// ─────────────────────────────────────────────────────────────────────────────
describe('validateRegister', () => {

  // ── Caso base válido ──────────────────────────────────────────────────────
  // TU01 — PE: todos os campos no intervalo válido
  test('[TU01][PE] deve aceitar dados completamente válidos', () => {
    const result = validateRegister({
      name: 'João Silva',
      email: 'joao@greenherb.pt',
      password: 'senha123',
      role: 'Tecnico'
    });
    expect(result.isValid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  // ── Nome ─────────────────────────────────────────────────────────────────
  // TU02 — PE: nome vazio (classe inválida: ausente)
  test('[TU02][PE] deve rejeitar nome vazio', () => {
    const result = validateRegister({ name: '', email: 'joao@greenherb.pt', password: 'senha123', role: 'Tecnico' });
    expect(result.isValid).toBe(false);
    expect(result.errors).toContain('Nome é obrigatório');
  });

  // TU03 — VL: nome com 1 char (abaixo do limite inferior 2)
  test('[TU03][VL] deve rejeitar nome com 1 caractere (abaixo do mínimo 2)', () => {
    const result = validateRegister({ name: 'A', email: 'joao@greenherb.pt', password: 'senha123', role: 'Tecnico' });
    expect(result.isValid).toBe(false);
    expect(result.errors).toContain('Nome deve ter pelo menos 2 caracteres');
  });

  // TU04 — VL: nome com 2 chars (limite inferior)
  test('[TU04][VL] deve aceitar nome com 2 caracteres (limite inferior)', () => {
    const result = validateRegister({ name: 'AB', email: 'joao@greenherb.pt', password: 'senha123', role: 'Tecnico' });
    expect(result.isValid).toBe(true);
  });

  // TU05 — VL: nome com 50 chars (valor nominal interior)
  test('[TU05][VL] deve aceitar nome com 50 caracteres (valor nominal)', () => {
    const result = validateRegister({ name: 'A'.repeat(50), email: 'joao@greenherb.pt', password: 'senha123', role: 'Tecnico' });
    expect(result.isValid).toBe(true);
  });

  // TU06 — VL: nome com 100 chars (limite superior)
  test('[TU06][VL] deve aceitar nome com 100 caracteres (limite superior)', () => {
    const result = validateRegister({ name: 'A'.repeat(100), email: 'joao@greenherb.pt', password: 'senha123', role: 'Tecnico' });
    expect(result.isValid).toBe(true);
  });

  // TU07 — VL: nome com 101 chars (acima do limite superior)
  test('[TU07][VL] deve rejeitar nome com 101 caracteres (acima do máximo 100)', () => {
    const result = validateRegister({ name: 'A'.repeat(101), email: 'joao@greenherb.pt', password: 'senha123', role: 'Tecnico' });
    expect(result.isValid).toBe(false);
    expect(result.errors).toContain('Nome não pode exceder 100 caracteres');
  });

  // ── Email ─────────────────────────────────────────────────────────────────
  // TU08 — PE: email vazio (classe inválida: ausente)
  test('[TU08][PE] deve rejeitar email vazio', () => {
    const result = validateRegister({ name: 'João', email: '', password: 'senha123', role: 'Tecnico' });
    expect(result.isValid).toBe(false);
    expect(result.errors).toContain('Email é obrigatório');
  });

  // TU09 — PE: email sem @ (classe inválida: formato)
  test('[TU09][PE] deve rejeitar email com formato inválido', () => {
    const result = validateRegister({ name: 'João', email: 'email-invalido', password: 'senha123', role: 'Tecnico' });
    expect(result.isValid).toBe(false);
    expect(result.errors).toContain('Email inválido');
  });

  // TU10 — VL: email com 254 chars (limite superior — RFC 5321)
  test('[TU10][VL] deve aceitar email com 254 caracteres (limite superior RFC 5321)', () => {
    // local(64) + @ + domínio(189) = 254
    const local = 'a'.repeat(64);
    const domain = 'b'.repeat(185) + '.pt'; // 185+3 = 188 → local+@+domain = 64+1+188 = 253… ajustar
    const email = 'a'.repeat(50) + '@' + 'b'.repeat(199) + '.pt'; // 50+1+199+3=253 → pad to 254
    const emailExact = 'a'.repeat(50) + '@' + 'b'.repeat(200) + '.pt'; // 50+1+200+3=254
    const result = validateRegister({ name: 'João', email: emailExact, password: 'senha123', role: 'Tecnico' });
    expect(result.isValid).toBe(true);
  });

  // TU11 — VL: email com 255 chars (acima do limite superior)
  test('[TU11][VL] deve rejeitar email com 255 caracteres (acima do máximo 254)', () => {
    const emailLong = 'a'.repeat(50) + '@' + 'b'.repeat(201) + '.pt'; // 50+1+201+3=255
    const result = validateRegister({ name: 'João', email: emailLong, password: 'senha123', role: 'Tecnico' });
    expect(result.isValid).toBe(false);
    expect(result.errors).toContain('Email não pode exceder 254 caracteres');
  });

  // ── Password ──────────────────────────────────────────────────────────────
  // TU12 — PE: password vazia (classe inválida: ausente)
  test('[TU12][PE] deve rejeitar password vazia', () => {
    const result = validateRegister({ name: 'João', email: 'joao@greenherb.pt', password: '', role: 'Tecnico' });
    expect(result.isValid).toBe(false);
    expect(result.errors).toContain('Password é obrigatória');
  });

  // TU13 — VL: password com 5 chars (abaixo do limite inferior 6)
  test('[TU13][VL] deve rejeitar password com 5 caracteres (abaixo do mínimo 6)', () => {
    const result = validateRegister({ name: 'João', email: 'joao@greenherb.pt', password: '12345', role: 'Tecnico' });
    expect(result.isValid).toBe(false);
    expect(result.errors).toContain('Password deve ter pelo menos 6 caracteres');
  });

  // TU14 — VL: password com 6 chars (limite inferior)
  test('[TU14][VL] deve aceitar password com 6 caracteres (limite inferior)', () => {
    const result = validateRegister({ name: 'João', email: 'joao@greenherb.pt', password: '123456', role: 'Tecnico' });
    expect(result.isValid).toBe(true);
  });

  // TU15 — VL: password com 64 chars (valor nominal interior)
  test('[TU15][VL] deve aceitar password com 64 caracteres (valor nominal)', () => {
    const result = validateRegister({ name: 'João', email: 'joao@greenherb.pt', password: 'a'.repeat(64), role: 'Tecnico' });
    expect(result.isValid).toBe(true);
  });

  // TU16 — VL: password com 128 chars (limite superior)
  test('[TU16][VL] deve aceitar password com 128 caracteres (limite superior)', () => {
    const result = validateRegister({ name: 'João', email: 'joao@greenherb.pt', password: 'a'.repeat(128), role: 'Tecnico' });
    expect(result.isValid).toBe(true);
  });

  // TU17 — VL: password com 129 chars (acima do limite superior)
  test('[TU17][VL] deve rejeitar password com 129 caracteres (acima do máximo 128)', () => {
    const result = validateRegister({ name: 'João', email: 'joao@greenherb.pt', password: 'a'.repeat(129), role: 'Tecnico' });
    expect(result.isValid).toBe(false);
    expect(result.errors).toContain('Password não pode exceder 128 caracteres');
  });

  // ── Perfil ────────────────────────────────────────────────────────────────
  // TU18 — PE: perfil 'Tecnico' (classe válida)
  test('[TU18][PE] deve aceitar perfil Tecnico', () => {
    const result = validateRegister({ name: 'João', email: 'joao@greenherb.pt', password: 'senha123', role: 'Tecnico' });
    expect(result.isValid).toBe(true);
  });

  // TU19 — PE: perfil 'Responsavel' (classe válida)
  test('[TU19][PE] deve aceitar perfil Responsavel', () => {
    const result = validateRegister({ name: 'João', email: 'joao@greenherb.pt', password: 'senha123', role: 'Responsavel' });
    expect(result.isValid).toBe(true);
  });

  // TU20 — PE: perfil 'Administrador' (classe válida)
  test('[TU20][PE] deve aceitar perfil Administrador', () => {
    const result = validateRegister({ name: 'João', email: 'joao@greenherb.pt', password: 'senha123', role: 'Administrador' });
    expect(result.isValid).toBe(true);
  });

  // TU21 — PE: perfil desconhecido (classe inválida)
  test('[TU21][PE] deve rejeitar perfil inválido', () => {
    const result = validateRegister({ name: 'João', email: 'joao@greenherb.pt', password: 'senha123', role: 'SuperAdmin' });
    expect(result.isValid).toBe(false);
    expect(result.errors).toContain('Perfil inválido. Valores aceites: Tecnico, Responsavel, Administrador');
  });

  // TU22 — PE: perfil vazio (classe inválida: ausente)
  test('[TU22][PE] deve rejeitar perfil vazio', () => {
    const result = validateRegister({ name: 'João', email: 'joao@greenherb.pt', password: 'senha123', role: '' });
    expect(result.isValid).toBe(false);
    expect(result.errors).toContain('Perfil é obrigatório');
  });

  // ── Condições Múltiplas (CM) ──────────────────────────────────────────────
  // A decisão composta em validateRegister combina 4 condições atómicas:
  //   C1: nome inválido  C2: email inválido  C3: password inválida  C4: perfil inválido
  //
  // Subconjunto MC/DC — cada condição, isolada, altera o resultado:
  // TU23 — apenas C1=true → isValid=false
  test('[TU23][CM] apenas nome inválido deve tornar isValid=false', () => {
    const result = validateRegister({ name: '', email: 'joao@greenherb.pt', password: 'senha123', role: 'Tecnico' });
    expect(result.isValid).toBe(false);
    expect(result.errors.some(e => e.includes('Nome'))).toBe(true);
    expect(result.errors.some(e => e.includes('Email'))).toBe(false);
  });

  // TU24 — apenas C2=true → isValid=false
  test('[TU24][CM] apenas email inválido deve tornar isValid=false', () => {
    const result = validateRegister({ name: 'João', email: 'invalido', password: 'senha123', role: 'Tecnico' });
    expect(result.isValid).toBe(false);
    expect(result.errors.some(e => e.includes('Email'))).toBe(true);
    expect(result.errors.some(e => e.includes('Nome'))).toBe(false);
  });

  // TU25 — apenas C3=true → isValid=false
  test('[TU25][CM] apenas password inválida deve tornar isValid=false', () => {
    const result = validateRegister({ name: 'João', email: 'joao@greenherb.pt', password: '123', role: 'Tecnico' });
    expect(result.isValid).toBe(false);
    expect(result.errors.some(e => e.includes('Password'))).toBe(true);
    expect(result.errors.some(e => e.includes('Nome') || e.includes('Email') || e.includes('Perfil'))).toBe(false);
  });

  // TU26 — apenas C4=true → isValid=false
  test('[TU26][CM] apenas perfil inválido deve tornar isValid=false', () => {
    const result = validateRegister({ name: 'João', email: 'joao@greenherb.pt', password: 'senha123', role: 'Hacker' });
    expect(result.isValid).toBe(false);
    expect(result.errors.some(e => e.includes('Perfil'))).toBe(true);
    expect(result.errors.some(e => e.includes('Nome') || e.includes('Email') || e.includes('Password'))).toBe(false);
  });

  // TU27 — C1=C2=C3=C4=true → todos os erros acumulados
  test('[TU27][CM] todos os campos inválidos devem acumular todos os erros', () => {
    const result = validateRegister({ name: '', email: '', password: '', role: '' });
    expect(result.isValid).toBe(false);
    expect(result.errors.length).toBeGreaterThanOrEqual(4);
  });

});

// ─────────────────────────────────────────────────────────────────────────────
// validateLogin
// ─────────────────────────────────────────────────────────────────────────────
describe('validateLogin', () => {

  // TU28 — PE: dados válidos
  test('[TU28][PE] deve aceitar dados válidos', () => {
    const result = validateLogin({ email: 'joao@greenherb.pt', password: 'senha123' });
    expect(result.isValid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  // TU29 — PE: email vazio
  test('[TU29][PE] deve rejeitar email vazio', () => {
    const result = validateLogin({ email: '', password: 'senha123' });
    expect(result.isValid).toBe(false);
    expect(result.errors).toContain('Email é obrigatório');
  });

  // TU30 — PE: password vazia
  test('[TU30][PE] deve rejeitar password vazia', () => {
    const result = validateLogin({ email: 'joao@greenherb.pt', password: '' });
    expect(result.isValid).toBe(false);
    expect(result.errors).toContain('Password é obrigatória');
  });

  // TU31 — CM: ambos em falta → acumula erros
  test('[TU31][CM] email e password em falta devem gerar dois erros', () => {
    const result = validateLogin({ email: '', password: '' });
    expect(result.isValid).toBe(false);
    expect(result.errors).toContain('Email é obrigatório');
    expect(result.errors).toContain('Password é obrigatória');
  });

});
