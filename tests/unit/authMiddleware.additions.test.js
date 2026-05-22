/**
 * authMiddleware.additions.test.js — Adições ao Sprint 3
 *
 * Ficheiro complementar ao authMiddleware.test.js dos sprints anteriores.
 * Adiciona os casos de teste em falta identificados na revisão do Sprint 3.
 *
 * Técnicas aplicadas:
 *   PE  — Particionamento de Equivalência
 *   CM  — Cobertura de Condições Múltiplas
 *
 * Lacunas identificadas:
 *   1. protect: header Authorization sem prefixo "Bearer" nunca testado
 *      → o código só extrai token se startsWith('Bearer'), caso contrário token=undefined → 401
 *   2. protect: req.user preenchido com todos os campos corretos (id, name, email, role)
 *      → TU38 já verificava parcialmente mas sem confirmar name e email
 *   3. authorize: mensagem de erro 403 nunca confirmada explicitamente
 *   4. authorize: caso base CM (todos os 3 perfis, cada um autorizado numa rota própria)
 */

const { protect, authorize } = require('../../src/middleware/auth');

jest.mock('jsonwebtoken');
jest.mock('../../src/models/User');
const jwt  = require('jsonwebtoken');
const User = require('../../src/models/User');

const mockRes = () => {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json   = jest.fn().mockReturnValue(res);
  return res;
};

beforeEach(() => jest.clearAllMocks());

// ─────────────────────────────────────────────────────────────────────────────
// protect — PE: header Authorization sem prefixo "Bearer"
// ─────────────────────────────────────────────────────────────────────────────
describe('protect — PE: header sem prefixo Bearer (adições S3)', () => {

  // TU_AM01_S3 — PE: Authorization="Token abc123" (sem Bearer) → 401 token não fornecido
  test('[TU_AM01_S3][PE] header Authorization sem prefixo "Bearer" → 401 token não fornecido', async () => {
    const req = { headers: { authorization: 'Token abc123' } };
    const res = mockRes();
    const next = jest.fn();

    await protect(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
      error: 'Acesso negado. Token não fornecido'
    }));
    expect(next).not.toHaveBeenCalled();
  });

  // TU_AM02_S3 — PE: Authorization="bearer abc123" (Bearer em minúsculas) → 401
  // startsWith('Bearer') é case-sensitive, 'bearer' não passa
  test('[TU_AM02_S3][PE] "bearer" em minúsculas → 401 token não fornecido', async () => {
    const req = { headers: { authorization: 'bearer token123' } };
    const res = mockRes();
    const next = jest.fn();

    await protect(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(next).not.toHaveBeenCalled();
  });

  // TU_AM03_S3 — PE: Authorization="" (string vazia) → 401 token não fornecido
  test('[TU_AM03_S3][PE] Authorization="" (string vazia) → 401 token não fornecido', async () => {
    const req = { headers: { authorization: '' } };
    const res = mockRes();
    const next = jest.fn();

    await protect(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(next).not.toHaveBeenCalled();
  });

});

// ─────────────────────────────────────────────────────────────────────────────
// protect — PE: req.user preenchido corretamente após autenticação
// ─────────────────────────────────────────────────────────────────────────────
describe('protect — PE: req.user completo após autenticação (adições S3)', () => {

  const mockUserAtivo = {
    _id:   'user-id-123',
    name:  'Ana Costa',
    email: 'ana@greenherb.pt',
    role:  'Responsavel',
    active: true
  };

  // TU_AM04_S3 — PE: req.user preenchido com id, name, email, role todos corretos
  test('[TU_AM04_S3][PE] req.user deve ter id, name, email e role corretos após autenticação', async () => {
    const req  = { headers: { authorization: 'Bearer token_valido' } };
    const res  = mockRes();
    const next = jest.fn();

    jwt.verify    = jest.fn().mockReturnValue({ id: 'user-id-123', role: 'Responsavel' });
    User.findById = jest.fn().mockResolvedValue(mockUserAtivo);

    await protect(req, res, next);

    expect(next).toHaveBeenCalled();
    expect(req.user).toEqual({
      id:    'user-id-123',
      name:  'Ana Costa',
      email: 'ana@greenherb.pt',
      role:  'Responsavel'
    });
  });

  // TU_AM05_S3 — PE: req.user não deve conter password ou active
  test('[TU_AM05_S3][PE] req.user não deve expor campos sensíveis (password, active)', async () => {
    const req  = { headers: { authorization: 'Bearer token_valido' } };
    const res  = mockRes();
    const next = jest.fn();

    jwt.verify    = jest.fn().mockReturnValue({ id: 'user-id-123' });
    User.findById = jest.fn().mockResolvedValue(mockUserAtivo);

    await protect(req, res, next);

    expect(req.user).not.toHaveProperty('password');
    expect(req.user).not.toHaveProperty('active');
  });

});

// ─────────────────────────────────────────────────────────────────────────────
// authorize — PE: mensagem de erro 403 confirmada + CM todos os perfis
// ─────────────────────────────────────────────────────────────────────────────
describe('authorize — PE mensagem 403 + CM todos os perfis (adições S3)', () => {

  // TU_AM06_S3 — PE: mensagem de erro 403 inclui o perfil do utilizador
  test('[TU_AM06_S3][PE] mensagem 403 deve indicar o perfil que não tem permissão', () => {
    const req  = { user: { role: 'Tecnico' } };
    const res  = mockRes();
    const next = jest.fn();

    authorize('Administrador')(req, res, next);

    expect(res.status).toHaveBeenCalledWith(403);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
      success: false,
      error:   expect.stringContaining('Tecnico')
    }));
  });

  // TU_AM07_S3 — CM: Tecnico autorizado numa rota exclusiva de Tecnico
  test('[TU_AM07_S3][CM] Tecnico autorizado em rota exclusiva de Tecnico → next() chamado', () => {
    const req  = { user: { role: 'Tecnico' } };
    const res  = mockRes();
    const next = jest.fn();

    authorize('Tecnico')(req, res, next);

    expect(next).toHaveBeenCalled();
    expect(res.status).not.toHaveBeenCalled();
  });

  // TU_AM08_S3 — CM: Responsavel autorizado numa rota exclusiva de Responsavel
  test('[TU_AM08_S3][CM] Responsavel autorizado em rota exclusiva de Responsavel → next() chamado', () => {
    const req  = { user: { role: 'Responsavel' } };
    const res  = mockRes();
    const next = jest.fn();

    authorize('Responsavel')(req, res, next);

    expect(next).toHaveBeenCalled();
  });

  // TU_AM09_S3 — PE: Administrador sem acesso a rota exclusiva de Tecnico → 403
  test('[TU_AM09_S3][PE] Administrador sem acesso a rota exclusiva de Tecnico → 403', () => {
    const req  = { user: { role: 'Administrador' } };
    const res  = mockRes();
    const next = jest.fn();

    authorize('Tecnico')(req, res, next);

    expect(res.status).toHaveBeenCalledWith(403);
    expect(next).not.toHaveBeenCalled();
  });

  // TU_AM10_S3 — PE: todos os 3 perfis autorizados numa rota aberta → todos passam
  test('[TU_AM10_S3][PE] rota aberta a todos os perfis → Tecnico, Responsavel e Administrador passam', () => {
    const perfis = ['Tecnico', 'Responsavel', 'Administrador'];
    perfis.forEach(role => {
      const req  = { user: { role } };
      const res  = mockRes();
      const next = jest.fn();
      authorize('Tecnico', 'Responsavel', 'Administrador')(req, res, next);
      expect(next).toHaveBeenCalled();
    });
  });

});
