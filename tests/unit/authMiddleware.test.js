/**
 * authMiddleware.test.js — Testes de Unidade (Sprint 1 — melhorado)
 *
 * Técnicas aplicadas:
 *   PE — Particionamento de Equivalência
 *   CM — Cobertura de Condições Múltiplas (tabela de verdade explícita)
 *
 * Requisitos cobertos: RN-08 (middleware JWT), RN-09 (autorização por perfil)
 *
 * ─── Decisão composta em `protect` ──────────────────────────────────────────
 * A função protect contém a seguinte decisão composta chave:
 *   if (!user || !user.active)  →  retorna 401 "Token inválido"
 *
 * Condições atómicas:
 *   C1: user === null  (utilizador não existe na BD)
 *   C2: user.active === false  (utilizador desativado)
 *
 * Tabela de verdade (2^2 = 4 combinações):
 * | # | C1    | C2    | C1 || C2 | Resultado          | Caso de teste |
 * |---|-------|-------|----------|--------------------|---------------|
 * | 1 | true  | -     | true     | 401 Token inválido | TU36          |
 * | 2 | false | true  | true     | 401 Token inválido | TU37          |
 * | 3 | false | false | false    | next() chamado     | TU38          |
 * | 4 | -     | -     | -        | (C1=true cobre já) |               |
 *
 * MC/DC: TU36 demonstra C1 a afetar isoladamente; TU37 demonstra C2 a afetar
 * isoladamente (C1=false, C2=true→true vs C1=false, C2=false→false).
 */

const { protect, authorize } = require('../../src/middleware/auth');

jest.mock('jsonwebtoken');
jest.mock('../../src/models/User');
const jwt = require('jsonwebtoken');
const User = require('../../src/models/User');

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

// ─────────────────────────────────────────────────────────────────────────────
// protect middleware
// ─────────────────────────────────────────────────────────────────────────────
describe('protect middleware', () => {

  beforeEach(() => jest.clearAllMocks());

  // TU33 — PE: sem header Authorization (classe inválida: token ausente)
  test('[TU33][PE] deve retornar 401 quando não há token', async () => {
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

  // TU34 — PE: token com assinatura inválida (classe inválida: token malformado)
  test('[TU34][PE] deve retornar 401 quando o token é inválido ou expirado', async () => {
    const req = mockReq('token_invalido');
    const res = mockRes();
    const next = jest.fn();

    jwt.verify.mockImplementation(() => { throw new Error('invalid token'); });

    await protect(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({
      success: false,
      error: 'Token inválido ou expirado'
    });
    expect(next).not.toHaveBeenCalled();
  });

  // TU35 — PE: token expirado (classe inválida distinta: TokenExpiredError)
  test('[TU35][PE] deve retornar 401 quando o token está expirado', async () => {
    const req = mockReq('token_expirado');
    const res = mockRes();
    const next = jest.fn();

    const err = new Error('jwt expired');
    err.name = 'TokenExpiredError';
    jwt.verify.mockImplementation(() => { throw err; });

    await protect(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(next).not.toHaveBeenCalled();
  });

  // TU36 — CM linha 1: C1=true (user===null) → 401 Token inválido
  test('[TU36][CM] deve retornar 401 quando C1=true: utilizador não existe na BD (user===null)', async () => {
    const req = mockReq('token_valido');
    const res = mockRes();
    const next = jest.fn();

    jwt.verify.mockReturnValue({ id: '123', role: 'Tecnico' });
    User.findById.mockResolvedValue(null); // C1=true, C2 irrelevante

    await protect(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ success: false, error: 'Token inválido' });
    expect(next).not.toHaveBeenCalled();
  });

  // TU37 — CM linha 2: C1=false, C2=true (user.active===false) → 401 Token inválido
  test('[TU37][CM] deve retornar 401 quando C1=false, C2=true: utilizador desativado', async () => {
    const req = mockReq('token_valido');
    const res = mockRes();
    const next = jest.fn();

    jwt.verify.mockReturnValue({ id: '123', role: 'Tecnico' });
    User.findById.mockResolvedValue({ active: false }); // C1=false, C2=true

    await protect(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ success: false, error: 'Token inválido' });
    expect(next).not.toHaveBeenCalled();
  });

  // TU38 — CM linha 3: C1=false, C2=false → next() chamado (caminho feliz)
  test('[TU38][CM] deve chamar next() quando C1=false, C2=false: utilizador existe e ativo', async () => {
    const req = mockReq('token_valido');
    const res = mockRes();
    const next = jest.fn();

    jwt.verify.mockReturnValue({ id: '123', role: 'Tecnico' });
    User.findById.mockResolvedValue({
      _id: '123',
      name: 'João Silva',
      email: 'joao@greenherb.pt',
      role: 'Tecnico',
      active: true  // C1=false, C2=false
    });

    await protect(req, res, next);

    expect(next).toHaveBeenCalled();
    expect(req.user).toBeDefined();
    expect(req.user.id).toBeDefined();
    expect(req.user.role).toBe('Tecnico');
    expect(req.user.email).toBe('joao@greenherb.pt');
  });

});

// ─────────────────────────────────────────────────────────────────────────────
// authorize middleware
// ─────────────────────────────────────────────────────────────────────────────
describe('authorize middleware', () => {

  // TU39 — PE: perfil 'Administrador' tem acesso (classe válida)
  test('[TU39][PE] deve chamar next() para perfil Administrador autorizado', () => {
    const req = { user: { role: 'Administrador' } };
    const res = mockRes();
    const next = jest.fn();

    authorize('Administrador')(req, res, next);

    expect(next).toHaveBeenCalled();
  });

  // TU40 — PE: perfil 'Tecnico' sem permissão (classe inválida)
  test('[TU40][PE] deve retornar 403 para perfil sem permissão', () => {
    const req = { user: { role: 'Tecnico' } };
    const res = mockRes();
    const next = jest.fn();

    authorize('Administrador')(req, res, next);

    expect(res.status).toHaveBeenCalledWith(403);
    expect(next).not.toHaveBeenCalled();
  });

  // TU41 — PE: perfil 'Responsavel' em rota multi-perfil (classe válida composta)
  test('[TU41][PE] deve chamar next() para Responsavel em rota com múltiplos perfis autorizados', () => {
    const req = { user: { role: 'Responsavel' } };
    const res = mockRes();
    const next = jest.fn();

    authorize('Administrador', 'Responsavel')(req, res, next);

    expect(next).toHaveBeenCalled();
  });

  // TU42 — PE: perfil 'Tecnico' excluído de rota multi-perfil (classe inválida)
  test('[TU42][PE] deve retornar 403 para Tecnico excluído de rota multi-perfil', () => {
    const req = { user: { role: 'Tecnico' } };
    const res = mockRes();
    const next = jest.fn();

    authorize('Administrador', 'Responsavel')(req, res, next);

    expect(res.status).toHaveBeenCalledWith(403);
    expect(next).not.toHaveBeenCalled();
  });

});
