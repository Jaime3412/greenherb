/**
 * fullBatchCycle.system.test.js — Testes de Sistema (E2E)
 *
 * TS-01: Ciclo completo de um lote
 *   Erva → Plano regular → Lote → Medições → Fecho → Produtividade
 *
 * Técnica: Combinação PE + VL ao longo do fluxo
 * Requisitos: RF-04, RF-05, RF-07, RN-08
 */

const request = require('supertest');
const app     = require('../../src/app');
const { connect, disconnect, clearDatabase } = require('../helpers/mongoMemory');
const { generateToken } = require('../../src/services/authService');
const User = require('../../src/models/User');

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

test('[TS-01] Ciclo completo de um lote: erva → plano → lote → medições → fecho + produtividade', async () => {

  // 1. Administrador importa erva via CSV
  const csv = 'scientificName,commonName,category,growthType,description\nMentha spicata,Hortelã,Culinária,Rápido,Erva comum';
  const importRes = await request(app)
    .post('/herbs/import')
    .set('Authorization', `Bearer ${adminToken}`)
    .attach('file', Buffer.from(csv, 'utf8'), 'ervas.csv');
  expect(importRes.status).toBe(200);
  expect(importRes.body.data.inserted).toBe(1);

  // 2. Obter a erva criada directamente via modelo (sem rota GET /herbs)
  const Herb = require('../../src/models/Herb');
  const herb = await Herb.findOne({ commonName: 'Hortelã' });
  expect(herb).toBeTruthy();

  // 3. Responsável cria plano regular
  const planRes = await request(app)
    .post('/plans')
    .set('Authorization', `Bearer ${responsavelToken}`)
    .send({
      type: 'regular', herbId: herb._id.toString(),
      minTemperature: 18, maxTemperature: 28,
      minHumidity: 40,   maxHumidity: 80,
      minLuminosity: 5000, maxLuminosity: 25000,
      durationDays: 30
    });
  expect(planRes.status).toBe(201);
  const planId = planRes.body.data._id;

  // 4. Técnico abre lote
  const batchRes = await request(app)
    .post('/batches')
    .set('Authorization', `Bearer ${tecnicoToken}`)
    .send({ planId });
  expect(batchRes.status).toBe(201);
  const batchId = batchRes.body.data._id;

  // 5. Técnico regista medições dentro dos limites (VL: valores nominais)
  for (const [temp, hum, lum] of [[23, 60, 15000], [20, 50, 10000]]) {
    const mRes = await request(app)
      .post('/measurements')
      .set('Authorization', `Bearer ${tecnicoToken}`)
      .send({ batchId, temperature: temp, humidity: hum, luminosity: lum, sensorOK: true });
    expect(mRes.status).toBe(201);
  }

  // 6. Verificar que não foram gerados alertas (valores dentro dos limites)
  const alertsRes = await request(app)
    .get('/alerts')
    .set('Authorization', `Bearer ${tecnicoToken}`);
  expect(alertsRes.status).toBe(200);
  expect(alertsRes.body.data).toHaveLength(0);

  // 7. Responsável fecha lote como concluído
  const closeRes = await request(app)
    .patch(`/batches/${batchId}`)
    .set('Authorization', `Bearer ${responsavelToken}`)
    .send({ status: 'concluído', losses: 10 });
  expect(closeRes.status).toBe(200);
  expect(closeRes.body.data.status).toBe('concluído');
  expect(closeRes.body.data.productivity).toBeGreaterThan(0);

  // 8. Confirmar estado do lote
  const batchDetailRes = await request(app)
    .get(`/batches/${batchId}`)
    .set('Authorization', `Bearer ${tecnicoToken}`);
  expect(batchDetailRes.status).toBe(200);
  expect(batchDetailRes.body.data.status).toBe('concluído');
  expect(batchDetailRes.body.data.productivity).not.toBeNull();

});
