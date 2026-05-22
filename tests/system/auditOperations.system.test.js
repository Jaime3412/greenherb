/**
 * auditOperations.system.test.js — Testes de Sistema (E2E)
 *
 * TS-03: Auditoria de operações
 *   Toda operação de escrita produz entrada no log com utilizador, ação e timestamp.
 *   Consultas (GET) não geram entradas no log.
 *
 * Técnica: PE (operações auditáveis vs. consultas)
 * Requisito: RN-09
 */

const request = require('supertest');
const app     = require('../../src/app');
const { connect, disconnect, clearDatabase } = require('../helpers/mongoMemory');
const { generateToken } = require('../../src/services/authService');
const User  = require('../../src/models/User');
const Herb  = require('../../src/models/Herb');
const Plan  = require('../../src/models/Plan');
const Batch = require('../../src/models/Batch');

let adminToken, responsavelToken, tecnicoToken;

beforeAll(connect);
afterAll(disconnect);

beforeEach(async () => {
  await clearDatabase();

  const admin = await User.create({
    name: 'Admin', email: 'admin@test.com', password: 'pass123', role: 'Administrador'
  });
  const responsavel = await User.create({
    name: 'Ana Responsavel', email: 'ana@test.com', password: 'pass123', role: 'Responsavel'
  });
  const tecnico = await User.create({
    name: 'Carlos Tecnico', email: 'carlos@test.com', password: 'pass123', role: 'Tecnico'
  });

  adminToken       = generateToken(admin);
  responsavelToken = generateToken(responsavel);
  tecnicoToken     = generateToken(tecnico);
});

test('[TS-03] Auditoria: escritas geram log; consultas não', async () => {

  // 1. Verificar auditoria vazia no início
  let auditRes = await request(app)
    .get('/audit')
    .set('Authorization', `Bearer ${adminToken}`);
  expect(auditRes.status).toBe(200);
  expect(auditRes.body.data).toHaveLength(0);

  // 2. Administrador cria utilizador → gera 1 entrada de auditoria
  await request(app)
    .post('/users')
    .set('Authorization', `Bearer ${adminToken}`)
    .send({ name: 'Novo User', email: 'novo@test.com', password: 'pass123', role: 'Tecnico' });

  auditRes = await request(app)
    .get('/audit')
    .set('Authorization', `Bearer ${adminToken}`);
  expect(auditRes.body.data).toHaveLength(1);
  expect(auditRes.body.data[0].action).toBe('CREATE_USER');
  expect(auditRes.body.data[0].userId).toBeTruthy();

  // 3. Consultas (GET /plans) não geram entradas
  await request(app)
    .get('/plans')
    .set('Authorization', `Bearer ${responsavelToken}`);

  auditRes = await request(app)
    .get('/audit')
    .set('Authorization', `Bearer ${adminToken}`);
  expect(auditRes.body.data).toHaveLength(1); // ainda 1, GET não auditado

  // 4. Responsável cria plano → mais 1 entrada
  const herb = await Herb.create({
    scientificName: 'Mentha spicata', commonName: 'Hortelã', category: 'Culinária'
  });
  await request(app)
    .post('/plans')
    .set('Authorization', `Bearer ${responsavelToken}`)
    .send({
      type: 'regular', herbId: herb._id.toString(),
      minTemperature: 18, maxTemperature: 28,
      minHumidity: 40,   maxHumidity: 80,
      minLuminosity: 5000, maxLuminosity: 25000,
      durationDays: 30
    });

  auditRes = await request(app)
    .get('/audit')
    .set('Authorization', `Bearer ${adminToken}`);
  expect(auditRes.body.data).toHaveLength(2);

  const actions = auditRes.body.data.map(l => l.action);
  expect(actions).toContain('CREATE_USER');
  expect(actions).toContain('CREATE_PLAN');

  // 5. Verificar que todas as entradas têm userId e timestamp
  auditRes.body.data.forEach(entry => {
    expect(entry.userId).toBeTruthy();
    expect(entry.timestamp).toBeTruthy();
    expect(entry.action).toBeTruthy();
    expect(entry.resource).toBeTruthy();
  });

});
