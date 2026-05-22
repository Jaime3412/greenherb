/**
 * incidentManagement.system.test.js — Testes de Sistema (E2E)
 *
 * TS-02: Gestão de incidente
 *   Medições fora dos limites → Alerta Crítico → Plano emergência → Resolução
 *
 * Técnica: CM + VL
 * Requisitos: RF-07, RN-02, RN-05, RN-04
 */

const request = require('supertest');
const app     = require('../../src/app');
const { connect, disconnect, clearDatabase } = require('../helpers/mongoMemory');
const { generateToken } = require('../../src/services/authService');
const User  = require('../../src/models/User');
const Herb  = require('../../src/models/Herb');
const Plan  = require('../../src/models/Plan');
const Batch = require('../../src/models/Batch');

let responsavelToken, tecnicoToken, batchId;

beforeAll(connect);
afterAll(disconnect);

beforeEach(async () => {
  await clearDatabase();

  const responsavel = await User.create({
    name: 'Ana Responsavel', email: 'ana@test.com', password: 'pass123', role: 'Responsavel'
  });
  const tecnico = await User.create({
    name: 'Carlos Tecnico', email: 'carlos@test.com', password: 'pass123', role: 'Tecnico'
  });
  const herb = await Herb.create({
    scientificName: 'Mentha spicata', commonName: 'Hortelã', category: 'Culinária'
  });
  const plan = await Plan.create({
    type: 'regular', herbId: herb._id,
    minTemperature: 18, maxTemperature: 28,
    minHumidity: 40,   maxHumidity: 80,
    minLuminosity: 5000, maxLuminosity: 25000,
    durationDays: 30,  createdBy: responsavel._id
  });
  const batch = await Batch.create({
    herbId: herb._id, planId: plan._id, createdBy: tecnico._id
  });

  responsavelToken = generateToken(responsavel);
  tecnicoToken     = generateToken(tecnico);
  batchId          = batch._id.toString();
});

test('[TS-02] Gestão de incidente: medições críticas → alerta → resolução', async () => {

  // 1. Registar medição que viola 3 parâmetros → alerta Crítico (VL: todos fora dos limites)
  const mRes = await request(app)
    .post('/measurements')
    .set('Authorization', `Bearer ${tecnicoToken}`)
    .send({
      batchId,
      temperature: 35,   // > 28 (viola C1)
      humidity:    30,   // < 40 (viola C2)
      luminosity:  1000, // < 5000 (viola C3)
      sensorOK:    true
    });
  expect(mRes.status).toBe(201);

  // 2. Verificar alerta Crítico gerado automaticamente
  const alertsRes = await request(app)
    .get('/alerts')
    .set('Authorization', `Bearer ${responsavelToken}`);
  expect(alertsRes.status).toBe(200);
  expect(alertsRes.body.data).toHaveLength(1);
  expect(alertsRes.body.data[0].type).toBe('Crítico');
  expect(alertsRes.body.data[0].status).toBe('pendente');
  const alertId = alertsRes.body.data[0]._id;

  // 3. Responsável resolve o alerta
  const resolveRes = await request(app)
    .patch(`/alerts/${alertId}`)
    .set('Authorization', `Bearer ${responsavelToken}`)
    .send({ resolution: 'resolvido', justification: 'Plano de emergência ativado' });
  expect(resolveRes.status).toBe(200);
  expect(resolveRes.body.data.status).toBe('resolvido');

  // 4. Confirmar que o alerta não está mais pendente
  const alertsAfterRes = await request(app)
    .get('/alerts')
    .set('Authorization', `Bearer ${responsavelToken}`);
  expect(alertsAfterRes.body.data[0].status).toBe('resolvido');

  // 5. Tentativa de ignorar alerta sem justificação → 422 (VL: 0 chars < 10 mínimo)
  const mRes2 = await request(app)
    .post('/measurements')
    .set('Authorization', `Bearer ${tecnicoToken}`)
    .send({ batchId, temperature: 35, humidity: 30, luminosity: 1000, sensorOK: true });
  expect(mRes2.status).toBe(201);

  const alerts2Res = await request(app)
    .get('/alerts')
    .set('Authorization', `Bearer ${responsavelToken}`);
  const pendingAlert = alerts2Res.body.data.find(a => a.status === 'pendente');
  expect(pendingAlert).toBeTruthy();

  const ignoreWithoutJustification = await request(app)
    .patch(`/alerts/${pendingAlert._id}`)
    .set('Authorization', `Bearer ${responsavelToken}`)
    .send({ resolution: 'ignorado' });
  expect(ignoreWithoutJustification.status).toBe(422);

});
