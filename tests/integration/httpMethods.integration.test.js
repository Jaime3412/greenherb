/**
 * httpMethods.integration.test.js — Testes de Integração
 *
 * Técnica: PE
 * Requisito: Contrato HTTP dos endpoints (método correto vs método inválido)
 *
 * TI-18: validação de método HTTP em endpoints críticos do Sprint 4
 */

const request = require('supertest');
const app = require('../../src/app');
const { connect, disconnect, clearDatabase } = require('../helpers/mongoMemory');
const { generateToken } = require('../../src/services/authService');
const User = require('../../src/models/User');

beforeAll(connect);
afterAll(disconnect);

let adminToken;
let responsavelToken;
let tecnicoToken;

beforeEach(async () => {
  await clearDatabase();

  const admin = await User.create({
    name: 'Admin Methods',
    email: 'admin.methods@test.com',
    password: 'pass123',
    role: 'Administrador'
  });
  const responsavel = await User.create({
    name: 'Resp Methods',
    email: 'resp.methods@test.com',
    password: 'pass123',
    role: 'Responsavel'
  });
  const tecnico = await User.create({
    name: 'Tec Methods',
    email: 'tec.methods@test.com',
    password: 'pass123',
    role: 'Tecnico'
  });

  adminToken = generateToken(admin);
  responsavelToken = generateToken(responsavel);
  tecnicoToken = generateToken(tecnico);
});

describe('[TI-18] Contrato HTTP — método inválido em endpoints críticos (PE)', () => {
  test('[TI-18a][PE] PUT /plans (endpoint aceita POST/GET) → 404', async () => {
    const res = await request(app)
      .put('/plans')
      .set('Authorization', `Bearer ${responsavelToken}`)
      .send({});
    expect(res.status).toBe(404);
  });

  test('[TI-18b][PE] DELETE /measurements (endpoint aceita POST) → 404', async () => {
    const res = await request(app)
      .delete('/measurements')
      .set('Authorization', `Bearer ${tecnicoToken}`);
    expect(res.status).toBe(404);
  });

  test('[TI-18c][PE] POST /alerts/:id (endpoint aceita PATCH) → 404', async () => {
    const res = await request(app)
      .post('/alerts/665f5a501122334455667788')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ resolution: 'resolvido' });
    expect(res.status).toBe(404);
  });

  test('[TI-18d][PE] GET /auth/login (endpoint aceita POST) → 404', async () => {
    const res = await request(app).get('/auth/login');
    expect(res.status).toBe(404);
  });
});
