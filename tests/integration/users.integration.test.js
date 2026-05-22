/**
 * users.integration.test.js — Testes de Integração
 *
 * Técnica: PE (Particionamento de Equivalência)
 * Requisito: RF-01
 *
 * TI-06: POST /users — controlo de acesso por perfil
 *   201 para Administrador; 403 para Técnico e Responsável; 401 sem token
 * TI-15: GET /users — listagem de utilizadores por perfil
 */

const request = require('supertest');
const app     = require('../../src/app');
const { connect, disconnect, clearDatabase } = require('../helpers/mongoMemory');
const { generateToken } = require('../../src/services/authService');
const User = require('../../src/models/User');

let adminToken, responsavelToken, tecnicoToken;

const newUser = () => ({
  name: 'Novo Utilizador',
  email: `novo_${Date.now()}@test.com`,
  password: 'pass123',
  role: 'Tecnico'
});

beforeAll(connect);
afterAll(disconnect);

beforeEach(async () => {
  await clearDatabase();

  const admin = await User.create({
    name: 'Super Admin', email: 'admin@test.com',
    password: 'pass123', role: 'Administrador'
  });
  const responsavel = await User.create({
    name: 'Ana Responsavel', email: 'ana@test.com',
    password: 'pass123', role: 'Responsavel'
  });
  const tecnico = await User.create({
    name: 'Carlos Tecnico', email: 'carlos@test.com',
    password: 'pass123', role: 'Tecnico'
  });

  adminToken      = generateToken(admin);
  responsavelToken = generateToken(responsavel);
  tecnicoToken    = generateToken(tecnico);
});

describe('[TI-06] POST /users — controlo de acesso por perfil (PE)', () => {

  // PE: Administrador → 201
  test('[TI-06a][PE] Administrador cria utilizador → 201', async () => {
    const res = await request(app)
      .post('/users')
      .set('Authorization', `Bearer ${adminToken}`)
      .send(newUser());
    expect(res.status).toBe(201);
    expect(res.body.data.role).toBe('Tecnico');
  });

  // PE: Responsável → 403
  test('[TI-06b][PE] Responsável não pode criar utilizador → 403', async () => {
    const res = await request(app)
      .post('/users')
      .set('Authorization', `Bearer ${responsavelToken}`)
      .send(newUser());
    expect(res.status).toBe(403);
  });

  // PE: Técnico → 403
  test('[TI-06c][PE] Técnico não pode criar utilizador → 403', async () => {
    const res = await request(app)
      .post('/users')
      .set('Authorization', `Bearer ${tecnicoToken}`)
      .send(newUser());
    expect(res.status).toBe(403);
  });

  // PE: sem token → 401
  test('[TI-06d][PE] sem token → 401', async () => {
    const res = await request(app)
      .post('/users')
      .send(newUser());
    expect(res.status).toBe(401);
  });

  // PE: email duplicado → 409
  test('[TI-06e][PE] email duplicado → 409', async () => {
    const data = { name: 'Duplicado', email: 'carlos@test.com', password: 'pass123', role: 'Tecnico' };
    const res = await request(app)
      .post('/users')
      .set('Authorization', `Bearer ${adminToken}`)
      .send(data);
    expect(res.status).toBe(409);
  });

});

describe('[TI-15] GET /users — controlo de acesso por perfil (PE)', () => {
  // PE: Administrador → 200
  test('[TI-15a][PE] Administrador lista utilizadores → 200', async () => {
    const res = await request(app)
      .get('/users')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.data)).toBe(true);
    expect(res.body.data.length).toBeGreaterThanOrEqual(3);
  });

  // PE: Responsável → 403
  test('[TI-15b][PE] Responsável não pode listar utilizadores → 403', async () => {
    const res = await request(app)
      .get('/users')
      .set('Authorization', `Bearer ${responsavelToken}`);
    expect(res.status).toBe(403);
  });

  // PE: Técnico → 403
  test('[TI-15c][PE] Técnico não pode listar utilizadores → 403', async () => {
    const res = await request(app)
      .get('/users')
      .set('Authorization', `Bearer ${tecnicoToken}`);
    expect(res.status).toBe(403);
  });

  // PE: sem token → 401
  test('[TI-15d][PE] sem token → 401', async () => {
    const res = await request(app).get('/users');
    expect(res.status).toBe(401);
  });
});
