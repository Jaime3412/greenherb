/**
 * authService.additions.test.js — Adições ao Sprint 3
 *
 * Ficheiro complementar ao authService.test.js dos sprints anteriores.
 * Adiciona os casos de teste em falta identificados na revisão do Sprint 3.
 *
 * Técnicas aplicadas:
 *   PE  — Particionamento de Equivalência
 *   CM  — Cobertura de Condições Múltiplas
 *
 * Lacunas identificadas:
 *   1. generateToken só testava role='Tecnico' — faltavam Responsavel e Administrador
 *   2. registerUser não verificava os campos do objeto 'user' retornado (id, name, email, role)
 *   3. registerUser não confirmava que User.create não é chamado quando email duplicado (CM)
 *   4. loginUser não confirmava que comparePassword não é chamado quando utilizador inativo (CM)
 *   5. renewToken não confirmava o payload do token gerado
 */

jest.mock('../../src/models/User');
jest.mock('jsonwebtoken');
const User = require('../../src/models/User');
const jwt  = require('jsonwebtoken');
const { generateToken, registerUser, loginUser, renewToken } = require('../../src/services/authService');

beforeEach(() => jest.clearAllMocks());

// ─────────────────────────────────────────────────────────────────────────────
// generateToken — PE: payload por perfil
// ─────────────────────────────────────────────────────────────────────────────
describe('generateToken — PE payload por perfil (adições S3)', () => {

  // TU_AS_G01_S3 — PE: role=Responsavel → payload contém role correto
  test('[TU_AS_G01_S3][PE] deve incluir role=Responsavel no payload do token', () => {
    jwt.sign.mockReturnValue('token_resp');
    const user = { _id: 'user-2', role: 'Responsavel' };

    const token = generateToken(user);

    expect(jwt.sign).toHaveBeenCalledWith(
      { id: 'user-2', role: 'Responsavel' },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN }
    );
    expect(token).toBe('token_resp');
  });

  // TU_AS_G02_S3 — PE: role=Administrador → payload contém role correto
  test('[TU_AS_G02_S3][PE] deve incluir role=Administrador no payload do token', () => {
    jwt.sign.mockReturnValue('token_admin');
    const user = { _id: 'user-3', role: 'Administrador' };

    generateToken(user);

    expect(jwt.sign).toHaveBeenCalledWith(
      { id: 'user-3', role: 'Administrador' },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN }
    );
  });

  // TU_AS_G03_S3 — PE: payload contém apenas id e role (não name, email, etc.)
  test('[TU_AS_G03_S3][PE] payload do token deve conter apenas id e role', () => {
    jwt.sign.mockReturnValue('token_mock');
    generateToken({ _id: 'u1', role: 'Tecnico', name: 'João', email: 'j@g.pt' });

    const callArgs = jwt.sign.mock.calls[0][0];
    expect(Object.keys(callArgs)).toEqual(['id', 'role']);
  });

});

// ─────────────────────────────────────────────────────────────────────────────
// registerUser — PE: campos do objeto retornado + CM
// ─────────────────────────────────────────────────────────────────────────────
describe('registerUser — PE campos retornados + CM (adições S3)', () => {

  // TU_AS_R01_S3 — PE: objeto user retornado tem id, name, email, role (sem password)
  test('[TU_AS_R01_S3][PE] deve retornar objeto user com id, name, email, role', async () => {
    User.findOne = jest.fn().mockResolvedValue(null);
    User.create  = jest.fn().mockResolvedValue({
      _id:   'user-id-123',
      name:  'Maria',
      email: 'maria@greenherb.pt',
      role:  'Responsavel'
    });
    jwt.sign.mockReturnValue('token_mock');

    const result = await registerUser({ name: 'Maria', email: 'maria@greenherb.pt', password: 'senha123', role: 'Responsavel' });

    expect(result.user).toEqual({
      id:    'user-id-123',
      name:  'Maria',
      email: 'maria@greenherb.pt',
      role:  'Responsavel'
    });
    expect(result.user).not.toHaveProperty('password');
  });

  // TU_AS_R02_S3 — CM: email duplicado → User.create NÃO é chamado
  test('[TU_AS_R02_S3][CM] email duplicado → User.create não deve ser chamado', async () => {
    User.findOne = jest.fn().mockResolvedValue({ email: 'maria@greenherb.pt' });
    User.create  = jest.fn();

    await registerUser({ name: 'Maria', email: 'maria@greenherb.pt', password: 'senha123', role: 'Tecnico' }).catch(() => {});

    expect(User.create).not.toHaveBeenCalled();
  });

  // TU_AS_R03_S3 — PE: token é retornado junto com o utilizador
  test('[TU_AS_R03_S3][PE] deve retornar token gerado após registo', async () => {
    User.findOne = jest.fn().mockResolvedValue(null);
    User.create  = jest.fn().mockResolvedValue({ _id: 'u1', name: 'X', email: 'x@g.pt', role: 'Tecnico' });
    jwt.sign.mockReturnValue('token_gerado');

    const result = await registerUser({ name: 'X', email: 'x@g.pt', password: 'senha123', role: 'Tecnico' });

    expect(result.token).toBe('token_gerado');
  });

});

// ─────────────────────────────────────────────────────────────────────────────
// loginUser — CM: comparePassword não chamado quando utilizador inativo
// ─────────────────────────────────────────────────────────────────────────────
describe('loginUser — CM comparePassword (adições S3)', () => {

  // TU_AS_L01_S3 — CM: utilizador inativo → comparePassword NÃO é chamado
  test('[TU_AS_L01_S3][CM] utilizador desativado → comparePassword não deve ser invocado', async () => {
    const mockCompare = jest.fn();
    User.findOne = jest.fn().mockResolvedValue({ active: false, comparePassword: mockCompare });

    await loginUser({ email: 'joao@g.pt', password: 'senha123' }).catch(() => {});

    expect(mockCompare).not.toHaveBeenCalled();
  });

  // TU_AS_L02_S3 — PE: login com sucesso devolve user com id, name, email, role
  test('[TU_AS_L02_S3][PE] login com sucesso → objeto user com campos corretos', async () => {
    User.findOne = jest.fn().mockResolvedValue({
      _id: 'u1', name: 'João', email: 'joao@g.pt', role: 'Tecnico',
      active: true,
      comparePassword: jest.fn().mockResolvedValue(true)
    });
    jwt.sign.mockReturnValue('token_login');

    const result = await loginUser({ email: 'joao@g.pt', password: 'senha123' });

    expect(result.user).toEqual({ id: 'u1', name: 'João', email: 'joao@g.pt', role: 'Tecnico' });
    expect(result.token).toBe('token_login');
  });

});

// ─────────────────────────────────────────────────────────────────────────────
// renewToken — PE: payload do token renovado
// ─────────────────────────────────────────────────────────────────────────────
describe('renewToken — PE payload renovado (adições S3)', () => {

  // TU_AS_RN01_S3 — PE: token renovado inclui o role correto do utilizador
  test('[TU_AS_RN01_S3][PE] token renovado deve conter o role do utilizador na BD', async () => {
    User.findById = jest.fn().mockResolvedValue({
      _id: 'u1', name: 'Pedro', email: 'pedro@g.pt', role: 'Responsavel', active: true
    });
    jwt.sign.mockReturnValue('token_renovado');

    const result = await renewToken('u1');

    expect(jwt.sign).toHaveBeenCalledWith(
      expect.objectContaining({ role: 'Responsavel' }),
      process.env.JWT_SECRET,
      expect.any(Object)
    );
    expect(result.token).toBe('token_renovado');
  });

});
