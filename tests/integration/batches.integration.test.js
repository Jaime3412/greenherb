/**
 * batches.integration.test.js — Testes de Integração
 *
 * Técnicas: PE
 * Requisitos: RF-05, RN-06
 *
 * TI-11: POST /batches   — autenticação, payload e criação de lote
 * TI-12: GET  /batches/:id — leitura de lote
 * TI-13: PATCH /batches/:id — fecho de lote e regras de estado
 */

const request = require('supertest');
const app = require('../../src/app');
const { connect, disconnect, clearDatabase } = require('../helpers/mongoMemory');
const { generateToken } = require('../../src/services/authService');
const User = require('../../src/models/User');
const Herb = require('../../src/models/Herb');
const Plan = require('../../src/models/Plan');
const Batch = require('../../src/models/Batch');

beforeAll(connect);
afterAll(disconnect);

let adminToken;
let responsavelToken;
let tecnicoToken;
let planId;
let batchId;

const newBatchPayload = () => ({ planId });

beforeEach(async () => {
  await clearDatabase();

  const admin = await User.create({
    name: 'Admin',
    email: 'admin.batch@test.com',
    password: 'pass123',
    role: 'Administrador'
  });
  const responsavel = await User.create({
    name: 'Resp',
    email: 'resp.batch@test.com',
    password: 'pass123',
    role: 'Responsavel'
  });
  const tecnico = await User.create({
    name: 'Tecnico',
    email: 'tec.batch@test.com',
    password: 'pass123',
    role: 'Tecnico'
  });

  const herb = await Herb.create({
    scientificName: 'Mentha spicata',
    commonName: 'Hortela',
    category: 'Culinária'
  });

  const plan = await Plan.create({
    type: 'regular',
    herbId: herb._id,
    minTemperature: 18,
    maxTemperature: 28,
    minHumidity: 40,
    maxHumidity: 80,
    minLuminosity: 5000,
    maxLuminosity: 25000,
    durationDays: 90,
    createdBy: responsavel._id
  });
  planId = plan._id.toString();

  const batch = await Batch.create({
    herbId: herb._id,
    planId: plan._id,
    createdBy: tecnico._id
  });
  batchId = batch._id.toString();

  adminToken = generateToken(admin);
  responsavelToken = generateToken(responsavel);
  tecnicoToken = generateToken(tecnico);
});

describe('[TI-11] POST /batches — criação de lote (PE)', () => {
  test('[TI-11a][PE] Técnico cria lote com payload válido → 201', async () => {
    const res = await request(app)
      .post('/batches')
      .set('Authorization', `Bearer ${tecnicoToken}`)
      .set('Content-Type', 'application/json')
      .send(newBatchPayload());

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.status).toBe('ativo');
  });

  test('[TI-11b][PE] sem token → 401', async () => {
    const res = await request(app)
      .post('/batches')
      .send(newBatchPayload());

    expect(res.status).toBe(401);
  });

  test('[TI-11c][PE] payload sem planId → 400', async () => {
    const res = await request(app)
      .post('/batches')
      .set('Authorization', `Bearer ${tecnicoToken}`)
      .send({});

    expect(res.status).toBe(400);
  });

  test('[TI-11d][PE] content-type inválido (text/plain) → 400', async () => {
    const res = await request(app)
      .post('/batches')
      .set('Authorization', `Bearer ${tecnicoToken}`)
      .set('Content-Type', 'text/plain')
      .send('planId=' + planId);

    expect(res.status).toBe(400);
  });

  test('[TI-11e][PE] planId inexistente → 404', async () => {
    const res = await request(app)
      .post('/batches')
      .set('Authorization', `Bearer ${tecnicoToken}`)
      .send({ planId: '665f5a501122334455667788' });

    expect(res.status).toBe(404);
  });
});

describe('[TI-12] GET /batches/:id — leitura de lote (PE)', () => {
  test('[TI-12a][PE] utilizador autenticado obtém lote existente → 200', async () => {
    const res = await request(app)
      .get(`/batches/${batchId}`)
      .set('Authorization', `Bearer ${responsavelToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data._id).toBe(batchId);
  });

  test('[TI-12b][PE] lote inexistente → 404', async () => {
    const res = await request(app)
      .get('/batches/665f5a501122334455667788')
      .set('Authorization', `Bearer ${responsavelToken}`);

    expect(res.status).toBe(404);
  });
});

describe('[TI-13] PATCH /batches/:id — fecho de lote (PE)', () => {
  test('[TI-13a][PE] Responsável fecha lote com status concluído → 200', async () => {
    const res = await request(app)
      .patch(`/batches/${batchId}`)
      .set('Authorization', `Bearer ${responsavelToken}`)
      .send({ status: 'concluído', losses: 10 });

    expect(res.status).toBe(200);
    expect(res.body.data.status).toBe('concluído');
  });

  test('[TI-13b][PE] Técnico não autorizado a fechar lote → 403', async () => {
    const res = await request(app)
      .patch(`/batches/${batchId}`)
      .set('Authorization', `Bearer ${tecnicoToken}`)
      .send({ status: 'concluído', losses: 10 });

    expect(res.status).toBe(403);
  });

  test('[TI-13c][PE] payload com status inválido → 400', async () => {
    const res = await request(app)
      .patch(`/batches/${batchId}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ status: 'invalido' });

    expect(res.status).toBe(400);
  });

  test('[TI-13d][PE] sem token → 401', async () => {
    const res = await request(app)
      .patch(`/batches/${batchId}`)
      .send({ status: 'concluído' });

    expect(res.status).toBe(401);
  });
});
