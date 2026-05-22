/**
 * audit.integration.test.js — Testes de Integração
 *
 * Técnica: PE
 * Requisito: RN-09
 *
 * TI-14: GET /audit — controlo de acesso e resposta
 */

const request = require('supertest');
const app = require('../../src/app');
const { connect, disconnect, clearDatabase } = require('../helpers/mongoMemory');
const { generateToken } = require('../../src/services/authService');
const { log } = require('../../src/services/auditService');
const User = require('../../src/models/User');

beforeAll(connect);
afterAll(disconnect);

let adminToken;
let responsavelToken;
let tecnicoToken;
let adminId;

beforeEach(async () => {
  await clearDatabase();

  const admin = await User.create({
    name: 'Admin Audit',
    email: 'admin.audit@test.com',
    password: 'pass123',
    role: 'Administrador'
  });
  const responsavel = await User.create({
    name: 'Resp Audit',
    email: 'resp.audit@test.com',
    password: 'pass123',
    role: 'Responsavel'
  });
  const tecnico = await User.create({
    name: 'Tec Audit',
    email: 'tec.audit@test.com',
    password: 'pass123',
    role: 'Tecnico'
  });

  adminId = admin._id.toString();
  adminToken = generateToken(admin);
  responsavelToken = generateToken(responsavel);
  tecnicoToken = generateToken(tecnico);
});

describe('[TI-14] GET /audit — controlo de acesso por perfil (PE)', () => {
  test('[TI-14a][PE] Administrador consulta auditoria → 200', async () => {
    await log(adminId, 'MANUAL_TEST_EVENT', 'tests', '665f5a501122334455667788');

    const res = await request(app)
      .get('/audit')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.data)).toBe(true);
    expect(res.body.data.length).toBeGreaterThan(0);
  });

  test('[TI-14b][PE] Responsável não pode consultar auditoria → 403', async () => {
    const res = await request(app)
      .get('/audit')
      .set('Authorization', `Bearer ${responsavelToken}`);

    expect(res.status).toBe(403);
  });

  test('[TI-14c][PE] Técnico não pode consultar auditoria → 403', async () => {
    const res = await request(app)
      .get('/audit')
      .set('Authorization', `Bearer ${tecnicoToken}`);

    expect(res.status).toBe(403);
  });

  test('[TI-14d][PE] sem token → 401', async () => {
    const res = await request(app).get('/audit');
    expect(res.status).toBe(401);
  });
});
