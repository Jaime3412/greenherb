/**
 * measurements.integration.test.js — Testes de Integração
 *
 * Técnica: VL (Análise de Valores Limite)
 * Requisitos: RF-07, RN-02
 *
 * TI-03: POST /measurements → verifica geração de alertas por parâmetro:
 *   Humidade     [40, 80]%       → valores: 39, 40, 60, 80, 81
 *   Luminosidade [5000, 25000]lux → valores: 4999, 5000, 15000, 25000, 25001
 *   Temperatura  [18, 28]°C      → valores: 17, 18, 23, 28, 29
 */

const request = require('supertest');
const app     = require('../../src/app');
const { connect, disconnect, clearDatabase } = require('../helpers/mongoMemory');
const { generateToken } = require('../../src/services/authService');
const User  = require('../../src/models/User');
const Herb  = require('../../src/models/Herb');
const Plan  = require('../../src/models/Plan');
const Batch = require('../../src/models/Batch');
const Alert = require('../../src/models/Alert');

let tecnicoToken, batchId;

// Medição base dentro de todos os limites
const baseMeasurement = { temperature: 23, humidity: 60, luminosity: 15000, sensorOK: true };

const post = (overrides) =>
  request(app)
    .post('/measurements')
    .set('Authorization', `Bearer ${tecnicoToken}`)
    .send({ batchId, ...baseMeasurement, ...overrides });

beforeAll(connect);
afterAll(disconnect);

beforeEach(async () => {
  await clearDatabase();

  const tecnico = await User.create({
    name: 'Carlos Tecnico', email: 'carlos@test.com',
    password: 'pass123', role: 'Tecnico'
  });
  const responsavel = await User.create({
    name: 'Ana Resp', email: 'ana@test.com',
    password: 'pass123', role: 'Responsavel'
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

  tecnicoToken = generateToken(tecnico);
  batchId      = batch._id.toString();
});

// ─── Humidade [40, 80] % ─────────────────────────────────────────────────────

describe('[TI-03] Humidade (VL) [min=40, max=80] %', () => {

  test('[TI-03a][VL] humidade=39 — abaixo do mínimo → alerta Informativo', async () => {
    await post({ humidity: 39 }).expect(201);
    const alerts = await Alert.find({ batchId });
    expect(alerts).toHaveLength(1);
    expect(alerts[0].type).toBe('Informativo');
  });

  test('[TI-03b][VL] humidade=40 — no mínimo → sem alerta', async () => {
    await post({ humidity: 40 }).expect(201);
    expect(await Alert.find({ batchId })).toHaveLength(0);
  });

  test('[TI-03c][VL] humidade=60 — valor nominal → sem alerta', async () => {
    await post({ humidity: 60 }).expect(201);
    expect(await Alert.find({ batchId })).toHaveLength(0);
  });

  test('[TI-03d][VL] humidade=80 — no máximo → sem alerta', async () => {
    await post({ humidity: 80 }).expect(201);
    expect(await Alert.find({ batchId })).toHaveLength(0);
  });

  test('[TI-03e][VL] humidade=81 — acima do máximo → alerta Informativo', async () => {
    await post({ humidity: 81 }).expect(201);
    const alerts = await Alert.find({ batchId });
    expect(alerts).toHaveLength(1);
    expect(alerts[0].type).toBe('Informativo');
  });

});

// ─── Luminosidade [5000, 25000] lux ──────────────────────────────────────────

describe('[TI-03] Luminosidade (VL) [min=5000, max=25000] lux', () => {

  test('[TI-03f][VL] luminosidade=4999 — abaixo do mínimo → alerta Informativo', async () => {
    await post({ luminosity: 4999 }).expect(201);
    const alerts = await Alert.find({ batchId });
    expect(alerts).toHaveLength(1);
    expect(alerts[0].type).toBe('Informativo');
  });

  test('[TI-03g][VL] luminosidade=5000 — no mínimo → sem alerta', async () => {
    await post({ luminosity: 5000 }).expect(201);
    expect(await Alert.find({ batchId })).toHaveLength(0);
  });

  test('[TI-03h][VL] luminosidade=15000 — valor nominal → sem alerta', async () => {
    await post({ luminosity: 15000 }).expect(201);
    expect(await Alert.find({ batchId })).toHaveLength(0);
  });

  test('[TI-03i][VL] luminosidade=25000 — no máximo → sem alerta', async () => {
    await post({ luminosity: 25000 }).expect(201);
    expect(await Alert.find({ batchId })).toHaveLength(0);
  });

  test('[TI-03j][VL] luminosidade=25001 — acima do máximo → alerta Informativo', async () => {
    await post({ luminosity: 25001 }).expect(201);
    const alerts = await Alert.find({ batchId });
    expect(alerts).toHaveLength(1);
    expect(alerts[0].type).toBe('Informativo');
  });

});

// ─── Temperatura [18, 28] °C ─────────────────────────────────────────────────

describe('[TI-03] Temperatura (VL) [min=18, max=28] °C', () => {

  test('[TI-03k][VL] temperatura=17 — abaixo do mínimo → alerta Informativo', async () => {
    await post({ temperature: 17 }).expect(201);
    const alerts = await Alert.find({ batchId });
    expect(alerts).toHaveLength(1);
    expect(alerts[0].type).toBe('Informativo');
  });

  test('[TI-03l][VL] temperatura=18 — no mínimo → sem alerta', async () => {
    await post({ temperature: 18 }).expect(201);
    expect(await Alert.find({ batchId })).toHaveLength(0);
  });

  test('[TI-03m][VL] temperatura=23 — valor nominal → sem alerta', async () => {
    await post({ temperature: 23 }).expect(201);
    expect(await Alert.find({ batchId })).toHaveLength(0);
  });

  test('[TI-03n][VL] temperatura=28 — no máximo → sem alerta', async () => {
    await post({ temperature: 28 }).expect(201);
    expect(await Alert.find({ batchId })).toHaveLength(0);
  });

  test('[TI-03o][VL] temperatura=29 — acima do máximo → alerta Informativo', async () => {
    await post({ temperature: 29 }).expect(201);
    const alerts = await Alert.find({ batchId });
    expect(alerts).toHaveLength(1);
    expect(alerts[0].type).toBe('Informativo');
  });

});

// ─── Combinações múltiplas → classificação correta ───────────────────────────

describe('[TI-03] Múltiplas violações → tipo de alerta correto (CM)', () => {

  test('[TI-03p][CM] 2 violações (temp + hum) → alerta Aviso', async () => {
    await post({ temperature: 29, humidity: 39 }).expect(201);
    const alerts = await Alert.find({ batchId });
    expect(alerts).toHaveLength(1);
    expect(alerts[0].type).toBe('Aviso');
  });

  test('[TI-03q][CM] 3 violações (temp + hum + lum) → alerta Crítico', async () => {
    await post({ temperature: 29, humidity: 39, luminosity: 4999 }).expect(201);
    const alerts = await Alert.find({ batchId });
    expect(alerts).toHaveLength(1);
    expect(alerts[0].type).toBe('Crítico');
  });

  test('[TI-03r][CM] sensorOK=false com violações → nenhum alerta', async () => {
    await post({ temperature: 29, humidity: 39, sensorOK: false }).expect(201);
    expect(await Alert.find({ batchId })).toHaveLength(0);
  });

});

// ─── Contrato HTTP (headers + payload) ───────────────────────────────────────

describe('[TI-03] POST /measurements — autenticação, payload e content-type (PE)', () => {
  test('[TI-03s][PE] sem token → 401', async () => {
    const res = await request(app)
      .post('/measurements')
      .send({ batchId, ...baseMeasurement });
    expect(res.status).toBe(401);
  });

  test('[TI-03t][PE] payload com batchId inexistente → 404', async () => {
    const res = await request(app)
      .post('/measurements')
      .set('Authorization', `Bearer ${tecnicoToken}`)
      .send({ ...baseMeasurement, batchId: '665f5a501122334455667788' });
    expect(res.status).toBe(404);
  });

  test('[TI-03u][PE] payload incompleto (sem batchId) → 400', async () => {
    const res = await request(app)
      .post('/measurements')
      .set('Authorization', `Bearer ${tecnicoToken}`)
      .send(baseMeasurement);
    expect(res.status).toBe(400);
  });

  test('[TI-03v][PE] content-type text/plain com corpo não JSON → 400', async () => {
    const res = await request(app)
      .post('/measurements')
      .set('Authorization', `Bearer ${tecnicoToken}`)
      .set('Content-Type', 'text/plain')
      .send('batchId=' + batchId);
    expect(res.status).toBe(400);
  });
});
