const { validateRegister, validateLogin } = require('../../src/validators/authValidator');

describe('validateRegister', () => {

  // ✅ Caso válido
  test('deve aceitar dados válidos', () => {
    const data = {
      name: 'João Silva',
      email: 'joao@greenherb.pt',
      password: 'senha123',
      role: 'Tecnico'
    };
    const result = validateRegister(data);
    expect(result.isValid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  // ❌ Nome em falta
  test('deve rejeitar nome vazio', () => {
    const data = { name: '', email: 'joao@greenherb.pt', password: 'senha123', role: 'Tecnico' };
    const result = validateRegister(data);
    expect(result.isValid).toBe(false);
    expect(result.errors).toContain('Nome é obrigatório');
  });

  // ❌ Email inválido
  test('deve rejeitar email inválido', () => {
    const data = { name: 'João', email: 'email-invalido', password: 'senha123', role: 'Tecnico' };
    const result = validateRegister(data);
    expect(result.isValid).toBe(false);
    expect(result.errors).toContain('Email inválido');
  });

  // ❌ Email em falta
  test('deve rejeitar email vazio', () => {
    const data = { name: 'João', email: '', password: 'senha123', role: 'Tecnico' };
    const result = validateRegister(data);
    expect(result.isValid).toBe(false);
    expect(result.errors).toContain('Email é obrigatório');
  });

  // ❌ Password curta
  test('deve rejeitar password com menos de 6 caracteres', () => {
    const data = { name: 'João', email: 'joao@greenherb.pt', password: '123', role: 'Tecnico' };
    const result = validateRegister(data);
    expect(result.isValid).toBe(false);
    expect(result.errors).toContain('Password deve ter pelo menos 6 caracteres');
  });

  // ❌ Password em falta
  test('deve rejeitar password vazia', () => {
    const data = { name: 'João', email: 'joao@greenherb.pt', password: '', role: 'Tecnico' };
    const result = validateRegister(data);
    expect(result.isValid).toBe(false);
    expect(result.errors).toContain('Password é obrigatória');
  });

  // ✅ Perfis válidos — particionamento de equivalência
  test('deve aceitar perfil Tecnico', () => {
    const data = { name: 'João', email: 'joao@greenherb.pt', password: 'senha123', role: 'Tecnico' };
    const result = validateRegister(data);
    expect(result.isValid).toBe(true);
  });

  test('deve aceitar perfil Responsavel', () => {
    const data = { name: 'João', email: 'joao@greenherb.pt', password: 'senha123', role: 'Responsavel' };
    const result = validateRegister(data);
    expect(result.isValid).toBe(true);
  });

  test('deve aceitar perfil Administrador', () => {
    const data = { name: 'João', email: 'joao@greenherb.pt', password: 'senha123', role: 'Administrador' };
    const result = validateRegister(data);
    expect(result.isValid).toBe(true);
  });

  // ❌ Perfil inválido — particionamento de equivalência
  test('deve rejeitar perfil inválido', () => {
    const data = { name: 'João', email: 'joao@greenherb.pt', password: 'senha123', role: 'SuperAdmin' };
    const result = validateRegister(data);
    expect(result.isValid).toBe(false);
    expect(result.errors).toContain('Perfil inválido. Valores aceites: Tecnico, Responsavel, Administrador');
  });

  // ❌ Perfil em falta
  test('deve rejeitar perfil vazio', () => {
    const data = { name: 'João', email: 'joao@greenherb.pt', password: 'senha123', role: '' };
    const result = validateRegister(data);
    expect(result.isValid).toBe(false);
    expect(result.errors).toContain('Perfil é obrigatório');
  });

});

describe('validateLogin', () => {

  // ✅ Caso válido
  test('deve aceitar dados válidos', () => {
    const data = { email: 'joao@greenherb.pt', password: 'senha123' };
    const result = validateLogin(data);
    expect(result.isValid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  // ❌ Email em falta
  test('deve rejeitar email vazio', () => {
    const data = { email: '', password: 'senha123' };
    const result = validateLogin(data);
    expect(result.isValid).toBe(false);
    expect(result.errors).toContain('Email é obrigatório');
  });

  // ❌ Password em falta
  test('deve rejeitar password vazia', () => {
    const data = { email: 'joao@greenherb.pt', password: '' };
    const result = validateLogin(data);
    expect(result.isValid).toBe(false);
    expect(result.errors).toContain('Password é obrigatória');
  });

});