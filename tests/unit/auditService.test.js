/**
 * auditService.test.js — Testes de Unidade — Sprint 3
 *
 * Módulo testado: src/services/auditService.js
 *
 * Técnicas aplicadas:
 *   PE  — Particionamento de Equivalência
 *
 * Requisitos cobertos:
 *   RN-09 — Auditoria de operações: toda ação relevante deve ser registada
 *            com userId, action, resource e timestamp
 *
 * Nota: auditService é um módulo simples (sem lógica condicional complexa),
 * pelo que PE é a técnica mais adequada — identificar classes de inputs
 * válidos e verificar que os dados são persistidos corretamente.
 */

jest.mock('../../src/models/AuditLog');
const AuditLog = require('../../src/models/AuditLog');
const { log, getLogs } = require('../../src/services/auditService');

beforeEach(() => jest.clearAllMocks());

// ─────────────────────────────────────────────────────────────────────────────
// log — PE
// ─────────────────────────────────────────────────────────────────────────────
describe('log (PE)', () => {

  // TU_AU01_S3 — PE: registo com resourceId → AuditLog.create com todos os campos
  test('[TU_AU01_S3][PE] deve criar registo de auditoria com userId, action, resource e resourceId', async () => {
    AuditLog.create = jest.fn().mockResolvedValue({
      userId: 'user-1', action: 'CREATE', resource: 'plans', resourceId: 'plan-1'
    });

    await log('user-1', 'CREATE', 'plans', 'plan-1');

    expect(AuditLog.create).toHaveBeenCalledWith({
      userId:     'user-1',
      action:     'CREATE',
      resource:   'plans',
      resourceId: 'plan-1'
    });
  });

  // TU_AU02_S3 — PE: registo sem resourceId (operações de listagem/login)
  test('[TU_AU02_S3][PE] deve criar registo sem resourceId (valor por defeito null)', async () => {
    AuditLog.create = jest.fn().mockResolvedValue({});

    await log('user-1', 'LOGIN', 'auth');

    expect(AuditLog.create).toHaveBeenCalledWith({
      userId:     'user-1',
      action:     'LOGIN',
      resource:   'auth',
      resourceId: null  // valor por defeito
    });
  });

  // TU_AU03_S3 — PE: ação de DELETE → auditado corretamente
  test('[TU_AU03_S3][PE] deve registar ação de DELETE com resource e resourceId corretos', async () => {
    AuditLog.create = jest.fn().mockResolvedValue({});

    await log('user-admin', 'DELETE', 'users', 'user-xyz');

    expect(AuditLog.create).toHaveBeenCalledWith(expect.objectContaining({
      action:   'DELETE',
      resource: 'users'
    }));
  });

  // TU_AU04_S3 — PE: ação de UPDATE → auditado corretamente
  test('[TU_AU04_S3][PE] deve registar ação de UPDATE', async () => {
    AuditLog.create = jest.fn().mockResolvedValue({});

    await log('user-resp', 'UPDATE', 'alerts', 'alert-1');

    expect(AuditLog.create).toHaveBeenCalledWith(expect.objectContaining({
      action:   'UPDATE',
      resource: 'alerts'
    }));
  });

  // TU_AU05_S3 — PE: função retorna o objeto criado pelo AuditLog
  test('[TU_AU05_S3][PE] deve retornar o objeto de log criado', async () => {
    const mockLog = { _id: 'log-id', userId: 'user-1', action: 'CREATE', resource: 'batches' };
    AuditLog.create = jest.fn().mockResolvedValue(mockLog);

    const result = await log('user-1', 'CREATE', 'batches', 'batch-1');

    expect(result).toEqual(mockLog);
  });

});

// ─────────────────────────────────────────────────────────────────────────────
// getLogs — PE
// ─────────────────────────────────────────────────────────────────────────────
describe('getLogs (PE)', () => {

  // TU_AU06_S3 — PE: devolve logs ordenados por timestamp desc com populate
  test('[TU_AU06_S3][PE] deve chamar find com sort e populate corretos', async () => {
    const mockQuery = {
      sort:     jest.fn().mockReturnThis(),
      populate: jest.fn().mockResolvedValue([])
    };
    AuditLog.find = jest.fn().mockReturnValue(mockQuery);

    await getLogs();

    expect(AuditLog.find).toHaveBeenCalled();
    expect(mockQuery.sort).toHaveBeenCalledWith({ timestamp: -1 });
    expect(mockQuery.populate).toHaveBeenCalledWith('userId', 'name role');
  });

  // TU_AU07_S3 — PE: lista vazia quando não há logs
  test('[TU_AU07_S3][PE] deve devolver lista vazia quando não há logs', async () => {
    const mockQuery = {
      sort:     jest.fn().mockReturnThis(),
      populate: jest.fn().mockResolvedValue([])
    };
    AuditLog.find = jest.fn().mockReturnValue(mockQuery);

    const result = await getLogs();

    expect(result).toHaveLength(0);
  });

  // TU_AU08_S3 — PE: devolve múltiplos logs
  test('[TU_AU08_S3][PE] deve devolver lista com múltiplos logs', async () => {
    const mockLogs = [
      { _id: 'log-1', action: 'CREATE', resource: 'plans' },
      { _id: 'log-2', action: 'UPDATE', resource: 'alerts' },
      { _id: 'log-3', action: 'LOGIN',  resource: 'auth' }
    ];
    const mockQuery = {
      sort:     jest.fn().mockReturnThis(),
      populate: jest.fn().mockResolvedValue(mockLogs)
    };
    AuditLog.find = jest.fn().mockReturnValue(mockQuery);

    const result = await getLogs();

    expect(result).toHaveLength(3);
  });

});
