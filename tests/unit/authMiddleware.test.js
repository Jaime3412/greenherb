const { protect, authorize } = require('../../src/middleware/auth');

// Mocks
jest.mock('jsonwebtoken');
jest.mock('../../src/models/User');
const jwt = require('jsonwebtoken');
const User = require('../../src/models/User');

// Helpers para simular req, res, next
const mockRes = () => {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
};

const mockReq = (token = null) => ({
  headers: {
    authorization: token ? `Bearer ${token}` : undefined
  }
});

describe('protect middleware', () => {

  beforeEach(() => jest.clearAllMocks());

  test('deve rejeitar request sem token', async () => {
    const req = mockReq();
    const res = mockRes();
    const next = jest.fn();

    await protect(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({
      success: false,
      error: 'Acesso negado. Token não fornecido'
    });
    expect(next).not.toHaveBeenCalled();
  });

  test('deve rejeitar token inválido', async () => {
    const req = mockReq('token_invalido');
    const res = mockRes();
    const next = jest.fn();

    jwt.verify.mockImplementation(() => { throw new Error('invalid token'); });

    await protect(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(next).not.toHaveBeenCalled();
  });

  test('deve rejeitar se utilizador não existe na BD', async () => {
    const req = mockReq('token_valido');
    const res = mockRes();
    const next = jest.fn();

    jwt.verify.mockReturnValue({ id: '123', role: 'Tecnico' });
    User.findById.mockResolvedValue(null);

    await protect(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(next).not.toHaveBeenCalled();
  });

  test('deve rejeitar se utilizador está desativado', async () => {
    const req = mockReq('token_valido');
    const res = mockRes();
    const next = jest.fn();

    jwt.verify.mockReturnValue({ id: '123', role: 'Tecnico' });
    User.findById.mockResolvedValue({ active: false });

    await protect(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(next).not.toHaveBeenCalled();
  });

  test('deve permitir acesso com token válido', async () => {
    const req = mockReq('token_valido');
    const res = mockRes();
    const next = jest.fn();

    jwt.verify.mockReturnValue({ id: '123', role: 'Tecnico' });
    User.findById.mockResolvedValue({
      _id: '123',
      name: 'João Silva',
      email: 'joao@greenherb.pt',
      role: 'Tecnico',
      active: true
    });

    await protect(req, res, next);

    expect(next).toHaveBeenCalled();
    expect(req.user).toBeDefined();
    expect(req.user.role).toBe('Tecnico');
  });

});

describe('authorize middleware', () => {

  test('deve permitir acesso ao perfil correto', () => {
    const req = { user: { role: 'Administrador' } };
    const res = mockRes();
    const next = jest.fn();

    authorize('Administrador')(req, res, next);

    expect(next).toHaveBeenCalled();
  });

  test('deve rejeitar perfil sem permissão', () => {
    const req = { user: { role: 'Tecnico' } };
    const res = mockRes();
    const next = jest.fn();

    authorize('Administrador')(req, res, next);

    expect(res.status).toHaveBeenCalledWith(403);
    expect(next).not.toHaveBeenCalled();
  });

  test('deve permitir acesso a múltiplos perfis', () => {
    const req = { user: { role: 'Responsavel' } };
    const res = mockRes();
    const next = jest.fn();

    authorize('Administrador', 'Responsavel')(req, res, next);

    expect(next).toHaveBeenCalled();
  });

});