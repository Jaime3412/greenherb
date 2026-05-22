/**
 * auth.integration.test.js — Testes de Integração
 *
 * Técnicas: PE (Particionamento de Equivalência)
 * Requisitos: RF-02
 *
 * TI-07: POST /auth/register — autenticação, payload e content-type
 * TI-08: POST /auth/login    — autenticação, payload e credenciais
 * TI-09: POST /auth/refresh  — renovação de token com/sem header Authorization
 * TI-10: GET  /auth/me       — utilizador autenticado
 */

const request = require('supertest');
const jwt = require('jsonwebtoken');
const app = require('../../src/app');
const { connect, disconnect, clearDatabase } = require('../helpers/mongoMemory');
const { generateToken } = require('../../src/services/authService');
const User = require('../../src/models/User');

beforeAll(connect);
afterAll(disconnect);
beforeEach(clearDatabase);

const registerPayload = () => ({
  name: 'Joao Tester',
  email: `joao_${Date.now()}@test.com`,
  password: 'pass123',
  role: 'Tecnico'
});

describe('[TI-07] POST /auth/register — payload e content-type (PE)', () => {
  test('[TI-07a][PE] payload válido + application/json → 201', async () => {
    const res = await request(app)
      .post('/auth/register')
      .set('Content-Type', 'application/json')
      .send(registerPayload());

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.user.email).toContain('@test.com');
    expect(res.body.data.token).toBeTruthy();
  });

  test('[TI-07b][PE] email duplicado → 409', async () => {
    const payload = registerPayload();
    await User.create(payload);

    const res = await request(app)
      .post('/auth/register')
      .send(payload);

    expect(res.status).toBe(409);
  });

  test('[TI-07c][PE] payload inválido (sem role) → 400', async () => {
    const payload = registerPayload();
    delete payload.role;

    const res = await request(app)
      .post('/auth/register')
      .send(payload);

    expect(res.status).toBe(400);
  });

  test('[TI-07d][PE] content-type text/plain com corpo não JSON → 400', async () => {
    const res = await request(app)
      .post('/auth/register')
      .set('Content-Type', 'text/plain')
      .send('name=Ana');

    expect(res.status).toBe(400);
  });
});

describe('[TI-08] POST /auth/login — credenciais e payload (PE)', () => {
  beforeEach(async () => {
    await User.create({
      name: 'Ana Login',
      email: 'ana.login@test.com',
      password: 'pass123',
      role: 'Responsavel'
    });
  });

  test('[TI-08a][PE] credenciais válidas → 200', async () => {
    const res = await request(app)
      .post('/auth/login')
      .set('Content-Type', 'application/json')
      .send({ email: 'ana.login@test.com', password: 'pass123' });

    expect(res.status).toBe(200);
    expect(res.body.data.user.role).toBe('Responsavel');
    expect(res.body.data.token).toBeTruthy();
  });

  test('[TI-08b][PE] password errada → 401', async () => {
    const res = await request(app)
      .post('/auth/login')
      .send({ email: 'ana.login@test.com', password: 'errada' });

    expect(res.status).toBe(401);
  });

  test('[TI-08c][PE] payload inválido (sem password) → 400', async () => {
    const res = await request(app)
      .post('/auth/login')
      .send({ email: 'ana.login@test.com' });

    expect(res.status).toBe(400);
  });
});

describe('[TI-09] POST /auth/refresh e [TI-10] GET /auth/me — Authorization header (PE)', () => {
  let token;

  beforeEach(async () => {
    const user = await User.create({
      name: 'Marta Token',
      email: 'marta.token@test.com',
      password: 'pass123',
      role: 'Administrador'
    });
    token = generateToken(user);
  });

  test('[TI-09a][PE] refresh com token válido → 200', async () => {
    const res = await request(app)
      .post('/auth/refresh')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.data.token).toBeTruthy();
  });

  test('[TI-09b][PE] refresh sem token → 401', async () => {
    const res = await request(app).post('/auth/refresh');
    expect(res.status).toBe(401);
  });

  test('[TI-09c][PE] refresh com token expirado → 401', async () => {
    const expiredToken = jwt.sign(
      { id: '665f5a501122334455667788', role: 'Administrador' },
      process.env.JWT_SECRET,
      { expiresIn: -10 }
    );

    const res = await request(app)
      .post('/auth/refresh')
      .set('Authorization', `Bearer ${expiredToken}`);

    expect(res.status).toBe(401);
  });

  test('[TI-10a][PE] me com token válido → 200', async () => {
    const res = await request(app)
      .get('/auth/me')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.data.user.email).toBe('marta.token@test.com');
  });

  test('[TI-10b][PE] me com token inválido → 401', async () => {
    const res = await request(app)
      .get('/auth/me')
      .set('Authorization', 'Bearer token-invalido');

    expect(res.status).toBe(401);
  });

  test('[TI-10c][PE] me com token expirado → 401', async () => {
    const expiredToken = jwt.sign(
      { id: '665f5a501122334455667788', role: 'Administrador' },
      process.env.JWT_SECRET,
      { expiresIn: -10 }
    );

    const res = await request(app)
      .get('/auth/me')
      .set('Authorization', `Bearer ${expiredToken}`);

    expect(res.status).toBe(401);
  });
});
