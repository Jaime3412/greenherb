/**
 * userService.test.js — Testes de Unidade — Sprint 3
 *
 * Módulo testado: src/services/userService.js
 *
 * Técnicas aplicadas:
 *   PE  — Particionamento de Equivalência
 *   CM  — Cobertura de Condições Múltiplas
 *
 * Requisitos cobertos:
 *   RF-01 — Gestão de utilizadores (criação e listagem)
 *   RN-02 — Unicidade de email (código CONFLICT distinto do authService)
 *
 * ─── Decisão composta de createUser ──────────────────────────────────────
 *   C1: User.findOne devolve utilizador existente (email duplicado)
 *   Resultado: C1=true → lança erro com code='CONFLICT'
 *              C1=false → cria utilizador e devolve campos sem password
 */

jest.mock('../../src/models/User');
const User = require('../../src/models/User');
const { createUser, getUsers } = require('../../src/services/userService');

beforeEach(() => jest.clearAllMocks());

// ─────────────────────────────────────────────────────────────────────────────
// createUser — PE
// ─────────────────────────────────────────────────────────────────────────────
describe('createUser (PE)', () => {

  // TU_US01_S3 — PE: email único → utilizador criado com campos corretos
  test('[TU_US01_S3][PE] deve criar utilizador quando email não existe', async () => {
    User.findOne = jest.fn().mockResolvedValue(null);
    User.create  = jest.fn().mockResolvedValue({
      _id:   'user-id-mock',
      name:  'Ana Costa',
      email: 'ana@greenherb.pt',
      role:  'Tecnico'
    });

    const result = await createUser({
      name:     'Ana Costa',
      email:    'ana@greenherb.pt',
      password: 'senha123',
      role:     'Tecnico'
    });

    expect(result.id).toBe('user-id-mock');
    expect(result.name).toBe('Ana Costa');
    expect(result.email).toBe('ana@greenherb.pt');
    expect(result.role).toBe('Tecnico');
  });

  // TU_US02_S3 — PE: password não está no objeto retornado
  test('[TU_US02_S3][PE] objeto retornado não deve conter password', async () => {
    User.findOne = jest.fn().mockResolvedValue(null);
    User.create  = jest.fn().mockResolvedValue({
      _id:   'user-id-mock',
      name:  'Ana Costa',
      email: 'ana@greenherb.pt',
      role:  'Tecnico'
    });

    const result = await createUser({ name: 'Ana Costa', email: 'ana@greenherb.pt', password: 'senha123', role: 'Tecnico' });

    expect(result).not.toHaveProperty('password');
  });

  // TU_US03_S3 — PE: email duplicado → lança erro com code='CONFLICT'
  test('[TU_US03_S3][PE] deve lançar CONFLICT quando email já existe', async () => {
    User.findOne = jest.fn().mockResolvedValue({ email: 'ana@greenherb.pt' });

    const err = await createUser({ name: 'Ana Costa', email: 'ana@greenherb.pt', password: 'senha123', role: 'Tecnico' }).catch(e => e);

    expect(err.message).toBe('Email já está em uso');
    expect(err.code).toBe('CONFLICT');
  });

  // TU_US04_S3 — CM: C1=true → User.create NÃO é chamado
  test('[TU_US04_S3][CM] C1=true (email duplicado) → User.create não deve ser chamado', async () => {
    User.findOne = jest.fn().mockResolvedValue({ email: 'ana@greenherb.pt' });
    User.create  = jest.fn();

    await createUser({ name: 'Ana', email: 'ana@greenherb.pt', password: 'senha123', role: 'Tecnico' }).catch(() => {});

    expect(User.create).not.toHaveBeenCalled();
  });

  // TU_US05_S3 — CM: C1=false → User.create É chamado com os dados corretos
  test('[TU_US05_S3][CM] C1=false (email livre) → User.create chamado com dados corretos', async () => {
    User.findOne = jest.fn().mockResolvedValue(null);
    User.create  = jest.fn().mockResolvedValue({ _id: 'id', name: 'Ana Costa', email: 'ana@greenherb.pt', role: 'Tecnico' });

    await createUser({ name: 'Ana Costa', email: 'ana@greenherb.pt', password: 'senha123', role: 'Tecnico' });

    expect(User.create).toHaveBeenCalledWith(expect.objectContaining({
      name:  'Ana Costa',
      email: 'ana@greenherb.pt',
      role:  'Tecnico'
    }));
  });

  // TU_US06_S3 — PE: cada perfil válido cria utilizador (Responsavel)
  test('[TU_US06_S3][PE] deve criar utilizador com perfil Responsavel', async () => {
    User.findOne = jest.fn().mockResolvedValue(null);
    User.create  = jest.fn().mockResolvedValue({ _id: 'id', name: 'Pedro', email: 'pedro@greenherb.pt', role: 'Responsavel' });

    const result = await createUser({ name: 'Pedro', email: 'pedro@greenherb.pt', password: 'senha123', role: 'Responsavel' });

    expect(result.role).toBe('Responsavel');
  });

  // TU_US07_S3 — PE: cada perfil válido cria utilizador (Administrador)
  test('[TU_US07_S3][PE] deve criar utilizador com perfil Administrador', async () => {
    User.findOne = jest.fn().mockResolvedValue(null);
    User.create  = jest.fn().mockResolvedValue({ _id: 'id', name: 'Admin', email: 'admin@greenherb.pt', role: 'Administrador' });

    const result = await createUser({ name: 'Admin', email: 'admin@greenherb.pt', password: 'senha123', role: 'Administrador' });

    expect(result.role).toBe('Administrador');
  });

});

// ─────────────────────────────────────────────────────────────────────────────
// getUsers — PE
// ─────────────────────────────────────────────────────────────────────────────
describe('getUsers (PE)', () => {

  // TU_US08_S3 — PE: devolve lista de utilizadores (sem password)
  test('[TU_US08_S3][PE] deve devolver lista de utilizadores sem campo password', async () => {
    const mockUsers = [
      { _id: '1', name: 'Ana', email: 'ana@greenherb.pt', role: 'Tecnico' },
      { _id: '2', name: 'Pedro', email: 'pedro@greenherb.pt', role: 'Responsavel' }
    ];
    User.find = jest.fn().mockResolvedValue(mockUsers);

    const result = await getUsers();

    expect(User.find).toHaveBeenCalledWith({}, '-password');
    expect(result).toHaveLength(2);
  });

  // TU_US09_S3 — PE: lista vazia (nenhum utilizador registado)
  test('[TU_US09_S3][PE] deve devolver lista vazia quando não há utilizadores', async () => {
    User.find = jest.fn().mockResolvedValue([]);

    const result = await getUsers();

    expect(result).toHaveLength(0);
  });

});
