/**
 * plans.integration.test.js — Testes de Integração
 *
 * Técnicas: PE, CM
 * Requisitos: RF-04, RN-04, RN-12, RN-14
 *
 * TI-01: POST /plans com tipo válido/inválido (PE)
 * TI-02: POST /plans pontual sem/com autorização (CM)
 * TI-16: GET /plans — listagem de planos autenticada
 */

const request = require('supertest');
const app     = require('../../src/app');
const { connect, disconnect, clearDatabase } = require('../helpers/mongoMemory');
const { generateToken } = require('../../src/services/authService');
const User = require('../../src/models/User');
const Herb = require('../../src/models/Herb');

let responsavelToken, tecnicoToken, herbId;

const planBase = () => ({
  herbId,
  type:           'regular',
  minTemperature: 18, maxTemperature: 28,
  minHumidity:    40, maxHumidity:    80,
  minLuminosity:  5000, maxLuminosity: 25000,
  durationDays:   90
});

beforeAll(async () => {
  await connect();

  const responsavel = await User.create({
    name: 'Ana Responsavel', email: 'ana@test.com',
    password: 'pass123', role: 'Responsavel'
  });
  const tecnico = await User.create({
    name: 'Carlos Tecnico', email: 'carlos@test.com',
    password: 'pass123', role: 'Tecnico'
  });
  const herb = await Herb.create({
    scientificName: 'Mentha spicata', commonName: 'Hortelã', category: 'Culinária'
  });

  responsavelToken = generateToken(responsavel);
  tecnicoToken     = generateToken(tecnico);
  herbId = herb._id.toString();
});

afterAll(disconnect);
beforeEach(clearDatabase.bind(null));

// ─── TI-01: tipo de plano — Particionamento de Equivalência ──────────────────

describe('[TI-01] POST /plans — tipo de plano (PE)', () => {

  beforeEach(async () => {
    // Recriar herb e responsavel após clearDatabase
    const responsavel = await User.create({
      name: 'Ana Responsavel', email: 'ana@test.com',
      password: 'pass123', role: 'Responsavel'
    });
    const herb = await Herb.create({
      scientificName: 'Mentha spicata', commonName: 'Hortelã', category: 'Culinária'
    });
    responsavelToken = generateToken(responsavel);
    herbId = herb._id.toString();
  });

  test('[TI-01a][PE] tipo=regular → 201', async () => {
    const res = await request(app)
      .post('/plans')
      .set('Authorization', `Bearer ${responsavelToken}`)
      .send(planBase());
    expect(res.status).toBe(201);
    expect(res.body.data.type).toBe('regular');
  });

  test('[TI-01b][PE] tipo=emergencia → 201', async () => {
    const res = await request(app)
      .post('/plans')
      .set('Authorization', `Bearer ${responsavelToken}`)
      .send({ ...planBase(), type: 'emergencia' });
    expect(res.status).toBe(201);
  });

  test('[TI-01c][PE] tipo=pontual com autorização → 201', async () => {
    const res = await request(app)
      .post('/plans')
      .set('Authorization', `Bearer ${responsavelToken}`)
      .send({ ...planBase(), type: 'pontual', responsibleAuth: 'Ana Responsavel' });
    expect(res.status).toBe(201);
  });

  test('[TI-01d][PE] tipo inválido → 400', async () => {
    const res = await request(app)
      .post('/plans')
      .set('Authorization', `Bearer ${responsavelToken}`)
      .send({ ...planBase(), type: 'experimental' });
    expect(res.status).toBe(400);
  });

  test('[TI-01e][PE] Técnico não pode criar plano → 403', async () => {
    const tecnico = await User.create({
      name: 'Carlos Tecnico', email: 'carlos@test.com',
      password: 'pass123', role: 'Tecnico'
    });
    const t = generateToken(tecnico);
    const res = await request(app)
      .post('/plans')
      .set('Authorization', `Bearer ${t}`)
      .send(planBase());
    expect(res.status).toBe(403);
  });

  test('[TI-01f][PE] sem token → 401', async () => {
    const res = await request(app).post('/plans').send(planBase());
    expect(res.status).toBe(401);
  });

});

// ─── TI-02: plano pontual — Cobertura de Condições Múltiplas ─────────────────

describe('[TI-02] POST /plans pontual — autorização (CM)', () => {

  beforeEach(async () => {
    const responsavel = await User.create({
      name: 'Ana Responsavel', email: 'ana@test.com',
      password: 'pass123', role: 'Responsavel'
    });
    const herb = await Herb.create({
      scientificName: 'Mentha spicata', commonName: 'Hortelã', category: 'Culinária'
    });
    responsavelToken = generateToken(responsavel);
    herbId = herb._id.toString();
  });

  // C1=true (pontual), C2=false (sem auth) → 400
  test('[TI-02a][CM] pontual sem autorização → 400', async () => {
    const res = await request(app)
      .post('/plans')
      .set('Authorization', `Bearer ${responsavelToken}`)
      .send({ ...planBase(), type: 'pontual' });
    expect(res.status).toBe(400);
    expect(JSON.stringify(res.body)).toContain('autorização');
  });

  // C1=true (pontual), C2=true (com auth) → 201
  test('[TI-02b][CM] pontual com autorização → 201', async () => {
    const res = await request(app)
      .post('/plans')
      .set('Authorization', `Bearer ${responsavelToken}`)
      .send({ ...planBase(), type: 'pontual', responsibleAuth: 'Ana Responsavel' });
    expect(res.status).toBe(201);
  });

  // C1=false (regular), C2=false (sem auth) → 201 (auth não exigida)
  test('[TI-02c][CM] regular sem autorização → 201', async () => {
    const res = await request(app)
      .post('/plans')
      .set('Authorization', `Bearer ${responsavelToken}`)
      .send(planBase());
    expect(res.status).toBe(201);
  });

});

// ─── Contrato HTTP (headers + payload) ───────────────────────────────────────

describe('[TI-01/TI-02] POST /plans — contrato HTTP (PE + VL)', () => {
  beforeEach(async () => {
    const responsavel = await User.create({
      name: 'Ana Responsavel', email: 'ana@test.com',
      password: 'pass123', role: 'Responsavel'
    });
    const herb = await Herb.create({
      scientificName: 'Mentha spicata', commonName: 'Hortelã', category: 'Culinária'
    });
    responsavelToken = generateToken(responsavel);
    herbId = herb._id.toString();
  });

  test('[TI-01g][VL] payload válido nos limites mínimos/máximos → 201', async () => {
    const res = await request(app)
      .post('/plans')
      .set('Authorization', `Bearer ${responsavelToken}`)
      .set('Content-Type', 'application/json')
      .send({
        herbId,
        type: 'regular',
        minTemperature: 18, maxTemperature: 28,
        minHumidity: 40, maxHumidity: 80,
        minLuminosity: 5000, maxLuminosity: 25000,
        durationDays: 365
      });

    expect(res.status).toBe(201);
  });

  test('[TI-01h][PE] content-type text/plain com corpo não JSON → 400', async () => {
    const res = await request(app)
      .post('/plans')
      .set('Authorization', `Bearer ${responsavelToken}`)
      .set('Content-Type', 'text/plain')
      .send('type=regular');

    expect(res.status).toBe(400);
  });

  test('[TI-01i][PE] payload com tipos inválidos (strings numéricas) → 400', async () => {
    const res = await request(app)
      .post('/plans')
      .set('Authorization', `Bearer ${responsavelToken}`)
      .send({
        herbId,
        type: 'regular',
        minTemperature: '18',
        maxTemperature: '28',
        minHumidity: '40',
        maxHumidity: '80',
        minLuminosity: '5000',
        maxLuminosity: '25000',
        durationDays: '90'
      });

    expect(res.status).toBe(400);
  });
});

describe('[TI-16] GET /plans — listagem por autenticação (PE)', () => {
  let adminToken;

  beforeEach(async () => {
    const responsavel = await User.create({
      name: 'Ana Responsavel', email: 'ana@test.com',
      password: 'pass123', role: 'Responsavel'
    });
    const tecnico = await User.create({
      name: 'Carlos Tecnico', email: 'carlos@test.com',
      password: 'pass123', role: 'Tecnico'
    });
    const admin = await User.create({
      name: 'Rui Admin', email: 'admin@test.com',
      password: 'pass123', role: 'Administrador'
    });
    const herb = await Herb.create({
      scientificName: 'Mentha spicata', commonName: 'Hortelã', category: 'Culinária'
    });

    responsavelToken = generateToken(responsavel);
    tecnicoToken = generateToken(tecnico);
    adminToken = generateToken(admin);
    herbId = herb._id.toString();

    await request(app)
      .post('/plans')
      .set('Authorization', `Bearer ${responsavelToken}`)
      .send(planBase())
      .expect(201);
  });

  test('[TI-16a][PE] Responsável lista planos → 200', async () => {
    const res = await request(app)
      .get('/plans')
      .set('Authorization', `Bearer ${responsavelToken}`);

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.data)).toBe(true);
    expect(res.body.data.length).toBeGreaterThanOrEqual(1);
  });

  test('[TI-16b][PE] Técnico lista planos → 200', async () => {
    const res = await request(app)
      .get('/plans')
      .set('Authorization', `Bearer ${tecnicoToken}`);

    expect(res.status).toBe(200);
  });

  test('[TI-16c][PE] Administrador lista planos → 200', async () => {
    const res = await request(app)
      .get('/plans')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
  });

  test('[TI-16d][PE] sem token → 401', async () => {
    const res = await request(app).get('/plans');
    expect(res.status).toBe(401);
  });
});
