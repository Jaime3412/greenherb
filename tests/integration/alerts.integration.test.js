/**
 * alerts.integration.test.js — Testes de Integração
 *
 * Técnica: VL (justificação para ignorar alerta)
 * Requisito: RN-05
 *
 * TI-04: PATCH /alerts/:id — ignorar alerta exige justificação [10, 500] chars
 *   Valores testados: 9, 10, 250, 500, 501 chars
 * TI-17: GET /alerts — listagem autenticada de alertas
 */

const request = require('supertest');
const app     = require('../../src/app');
const { connect, disconnect, clearDatabase } = require('../helpers/mongoMemory');
const { generateToken } = require('../../src/services/authService');
const User        = require('../../src/models/User');
const Herb        = require('../../src/models/Herb');
const Plan        = require('../../src/models/Plan');
const Batch       = require('../../src/models/Batch');
const Measurement = require('../../src/models/Measurement');
const Alert       = require('../../src/models/Alert');

let responsavelToken, alertId;
let tecnicoToken;
let adminToken;

beforeAll(connect);
afterAll(disconnect);

beforeEach(async () => {
  await clearDatabase();

  const responsavel = await User.create({
    name: 'Ana Responsavel', email: 'ana@test.com',
    password: 'pass123', role: 'Responsavel'
  });
  const admin = await User.create({
    name: 'Rui Admin', email: 'admin@test.com',
    password: 'pass123', role: 'Administrador'
  });
  const tecnico = await User.create({
    name: 'Carlos Tecnico', email: 'carlos@test.com',
    password: 'pass123', role: 'Tecnico'
  });
  const herb = await Herb.create({
    scientificName: 'Mentha spicata', commonName: 'Hortelã', category: 'Culinária'
  });
  const plan = await Plan.create({
    type: 'regular', herbId: herb._id,
    minTemperature: 18, maxTemperature: 28,
    minHumidity: 40,   maxHumidity: 80,
    minLuminosity: 5000, maxLuminosity: 25000,
    durationDays: 90,  createdBy: responsavel._id
  });
  const batch = await Batch.create({
    herbId: herb._id, planId: plan._id, createdBy: tecnico._id
  });
  const measurement = await Measurement.create({
    batchId: batch._id, temperature: 30, humidity: 39, luminosity: 15000,
    sensorOK: true, recordedBy: tecnico._id
  });
  const alert = await Alert.create({
    batchId: batch._id, measurementId: measurement._id, type: 'Aviso'
  });

  responsavelToken = generateToken(responsavel);
  adminToken = generateToken(admin);
  tecnicoToken = generateToken(tecnico);
  alertId = alert._id.toString();
});

describe('[TI-04] PATCH /alerts/:id — justificação para ignorar (VL) [10, 500]', () => {

  // VL: 9 chars (abaixo do mínimo) → 422
  test('[TI-04a][VL] justificação com 9 chars → 422', async () => {
    const res = await request(app)
      .patch(`/alerts/${alertId}`)
      .set('Authorization', `Bearer ${responsavelToken}`)
      .send({ resolution: 'ignorado', justification: 'A'.repeat(9) });
    expect(res.status).toBe(422);
  });

  // VL: 10 chars (limite inferior) → 200
  test('[TI-04b][VL] justificação com 10 chars → 200', async () => {
    const res = await request(app)
      .patch(`/alerts/${alertId}`)
      .set('Authorization', `Bearer ${responsavelToken}`)
      .send({ resolution: 'ignorado', justification: 'A'.repeat(10) });
    expect(res.status).toBe(200);
    expect(res.body.data.status).toBe('ignorado');
  });

  // VL: 250 chars (valor nominal) → 200
  test('[TI-04c][VL] justificação com 250 chars → 200', async () => {
    // Recriar alerta pendente
    const alert2 = await Alert.create({
      batchId: (await Alert.findById(alertId)).batchId,
      measurementId: (await Alert.findById(alertId)).measurementId,
      type: 'Aviso'
    });
    const res = await request(app)
      .patch(`/alerts/${alert2._id}`)
      .set('Authorization', `Bearer ${responsavelToken}`)
      .send({ resolution: 'ignorado', justification: 'A'.repeat(250) });
    expect(res.status).toBe(200);
  });

  // VL: 500 chars (limite superior) → 200
  test('[TI-04d][VL] justificação com 500 chars → 200', async () => {
    const alert3 = await Alert.create({
      batchId: (await Alert.findById(alertId)).batchId,
      measurementId: (await Alert.findById(alertId)).measurementId,
      type: 'Aviso'
    });
    const res = await request(app)
      .patch(`/alerts/${alert3._id}`)
      .set('Authorization', `Bearer ${responsavelToken}`)
      .send({ resolution: 'ignorado', justification: 'A'.repeat(500) });
    expect(res.status).toBe(200);
  });

  // VL: 501 chars (acima do limite) → 422
  test('[TI-04e][VL] justificação com 501 chars → 422', async () => {
    const alert4 = await Alert.create({
      batchId: (await Alert.findById(alertId)).batchId,
      measurementId: (await Alert.findById(alertId)).measurementId,
      type: 'Aviso'
    });
    const res = await request(app)
      .patch(`/alerts/${alert4._id}`)
      .set('Authorization', `Bearer ${responsavelToken}`)
      .send({ resolution: 'ignorado', justification: 'A'.repeat(501) });
    expect(res.status).toBe(422);
  });

  // PE: resolver alerta (sem justificação) → 200
  test('[TI-04f][PE] resolver alerta sem justificação → 200', async () => {
    const res = await request(app)
      .patch(`/alerts/${alertId}`)
      .set('Authorization', `Bearer ${responsavelToken}`)
      .send({ resolution: 'resolvido' });
    expect(res.status).toBe(200);
    expect(res.body.data.status).toBe('resolvido');
  });

});

describe('[TI-04] PATCH /alerts/:id — autenticação, payload e content-type (PE)', () => {
  test('[TI-04g][PE] sem token → 401', async () => {
    const res = await request(app)
      .patch(`/alerts/${alertId}`)
      .send({ resolution: 'resolvido' });
    expect(res.status).toBe(401);
  });

  test('[TI-04h][PE] técnico não autorizado → 403', async () => {
    const res = await request(app)
      .patch(`/alerts/${alertId}`)
      .set('Authorization', `Bearer ${tecnicoToken}`)
      .send({ resolution: 'resolvido' });
    expect(res.status).toBe(403);
  });

  test('[TI-04i][PE] administrador autorizado → 200', async () => {
    const res = await request(app)
      .patch(`/alerts/${alertId}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ resolution: 'resolvido' });
    expect(res.status).toBe(200);
  });

  test('[TI-04j][PE] payload com resolução inválida → 422', async () => {
    const alert2 = await Alert.create({
      batchId: (await Alert.findById(alertId)).batchId,
      measurementId: (await Alert.findById(alertId)).measurementId,
      type: 'Aviso'
    });

    const res = await request(app)
      .patch(`/alerts/${alert2._id}`)
      .set('Authorization', `Bearer ${responsavelToken}`)
      .send({ resolution: 'fechado' });
    expect(res.status).toBe(422);
  });

  test('[TI-04k][PE] content-type text/plain com corpo não JSON → 422', async () => {
    const alert3 = await Alert.create({
      batchId: (await Alert.findById(alertId)).batchId,
      measurementId: (await Alert.findById(alertId)).measurementId,
      type: 'Aviso'
    });

    const res = await request(app)
      .patch(`/alerts/${alert3._id}`)
      .set('Authorization', `Bearer ${responsavelToken}`)
      .set('Content-Type', 'text/plain')
      .send('resolution=resolvido');
    expect(res.status).toBe(422);
  });
});

describe('[TI-17] GET /alerts — listagem de alertas (PE)', () => {
  test('[TI-17a][PE] Responsável lista alertas → 200', async () => {
    const res = await request(app)
      .get('/alerts')
      .set('Authorization', `Bearer ${responsavelToken}`);

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.data)).toBe(true);
    expect(res.body.data.length).toBeGreaterThanOrEqual(1);
  });

  test('[TI-17b][PE] Técnico lista alertas → 200', async () => {
    const res = await request(app)
      .get('/alerts')
      .set('Authorization', `Bearer ${tecnicoToken}`);

    expect(res.status).toBe(200);
  });

  test('[TI-17c][PE] Administrador lista alertas → 200', async () => {
    const res = await request(app)
      .get('/alerts')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
  });

  test('[TI-17d][PE] sem token → 401', async () => {
    const res = await request(app).get('/alerts');
    expect(res.status).toBe(401);
  });
});
