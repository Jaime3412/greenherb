/**
 * herbs.integration.test.js — Testes de Integração
 *
 * Técnicas: PE (Particionamento de Equivalência)
 * Requisito: RF-03
 *
 * TI-05: POST /herbs/import — importação CSV
 *   a) Conteúdo do CSV: linhas válidas, inválidas, parciais, apenas cabeçalho
 *   b) Controlo de acesso: Administrador, Responsável, Técnico, sem token
 *   c) Erros de linha: lineNumbers corretos em ficheiros com múltiplos erros
 */

const request = require('supertest');
const app     = require('../../src/app');
const { connect, disconnect, clearDatabase } = require('../helpers/mongoMemory');
const { generateToken } = require('../../src/services/authService');
const User = require('../../src/models/User');

const CSV_HEADER = 'scientificName,commonName,category,growthType,description';

const makeFile = (content) => Buffer.from(content, 'utf8');

let adminToken, responsavelToken, tecnicoToken;

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

  adminToken       = generateToken(admin);
  responsavelToken = generateToken(responsavel);
  tecnicoToken     = generateToken(tecnico);
});

// ─── Conteúdo do CSV — Particionamento de Equivalência ───────────────────────

describe('[TI-05] POST /herbs/import — conteúdo do CSV (PE)', () => {

  // PE: todas as linhas válidas → inserted=2, failed=0
  test('[TI-05a][PE] CSV totalmente válido → 200, inserted=2, failed=0', async () => {
    const csv = [
      CSV_HEADER,
      'Mentha spicata,Hortelã,Culinária,Rápido,Erva comum',
      'Salvia officinalis,Salva,Medicinal,Moderado,'
    ].join('\n');

    const res = await request(app)
      .post('/herbs/import')
      .set('Authorization', `Bearer ${adminToken}`)
      .attach('file', makeFile(csv), 'ervas.csv');

    expect(res.status).toBe(200);
    expect(res.body.data.inserted).toBe(2);
    expect(res.body.data.failed).toBe(0);
    expect(res.body.data.errors).toHaveLength(0);
  });

  // PE: todas as linhas inválidas → inserted=0, failed=2
  test('[TI-05b][PE] CSV totalmente inválido → 200, inserted=0, failed=2', async () => {
    const csv = [
      CSV_HEADER,
      ',Hortelã,Culinária,,',     // scientificName vazio → inválida
      'Salvia officinalis,,,,'    // commonName e category vazios → inválida
    ].join('\n');

    const res = await request(app)
      .post('/herbs/import')
      .set('Authorization', `Bearer ${adminToken}`)
      .attach('file', makeFile(csv), 'ervas.csv');

    expect(res.status).toBe(200);
    expect(res.body.data.inserted).toBe(0);
    expect(res.body.data.failed).toBe(2);
  });

  // PE: mistura válidas + inválidas (ficheiro parcial)
  test('[TI-05c][PE] CSV parcialmente válido → inserted=1, failed=1', async () => {
    const csv = [
      CSV_HEADER,
      'Mentha spicata,Hortelã,Culinária,,',
      ',SemNomeCientifico,Culinária,,'
    ].join('\n');

    const res = await request(app)
      .post('/herbs/import')
      .set('Authorization', `Bearer ${adminToken}`)
      .attach('file', makeFile(csv), 'ervas.csv');

    expect(res.status).toBe(200);
    expect(res.body.data.inserted).toBe(1);
    expect(res.body.data.failed).toBe(1);
    expect(res.body.data.errors[0].lineNumber).toBe(2);
  });

  // PE: CSV apenas com cabeçalho (sem linhas de dados) → 400
  test('[TI-05d][PE] CSV só com cabeçalho → 400 (sem linhas de dados)', async () => {
    const csv = CSV_HEADER;

    const res = await request(app)
      .post('/herbs/import')
      .set('Authorization', `Bearer ${adminToken}`)
      .attach('file', makeFile(csv), 'ervas.csv');

    expect(res.status).toBe(400);
  });

  // PE: sem ficheiro → 400
  test('[TI-05e][PE] sem ficheiro no pedido → 400', async () => {
    const res = await request(app)
      .post('/herbs/import')
      .set('Authorization', `Bearer ${adminToken}`);
    expect(res.status).toBe(400);
  });

  // PE: categoria inválida → linha contada como failed
  test('[TI-05f][PE] linha com categoria inválida → contada como failed', async () => {
    const csv = [
      CSV_HEADER,
      'Mentha spicata,Hortelã,Culinária,,',      // válida
      'Thymus vulgaris,Tomilho,CategoriaErrada,,' // categoria inválida → failed
    ].join('\n');

    const res = await request(app)
      .post('/herbs/import')
      .set('Authorization', `Bearer ${adminToken}`)
      .attach('file', makeFile(csv), 'ervas.csv');

    expect(res.status).toBe(200);
    expect(res.body.data.inserted).toBe(1);
    expect(res.body.data.failed).toBe(1);
    expect(res.body.data.errors[0].errors.some(e => e.includes('Categoria inválida'))).toBe(true);
  });

  // PE: múltiplos erros dispersos → lineNumbers corretos
  test('[TI-05g][PE] múltiplos erros → lineNumbers corretos (linhas 1, 3 e 5)', async () => {
    const csv = [
      CSV_HEADER,
      ',Hortelã,Culinária,,',               // linha 1 — inválida
      'Mentha spicata,Hortelã,Culinária,,', // linha 2 — válida
      'Thymus vulgaris,,,,'                 // linha 3 — inválida
    ].join('\n');

    const res = await request(app)
      .post('/herbs/import')
      .set('Authorization', `Bearer ${adminToken}`)
      .attach('file', makeFile(csv), 'ervas.csv');

    expect(res.status).toBe(200);
    expect(res.body.data.inserted).toBe(1);
    expect(res.body.data.failed).toBe(2);

    const lineNumbers = res.body.data.errors.map(e => e.lineNumber);
    expect(lineNumbers).toContain(1);
    expect(lineNumbers).toContain(3);
    expect(lineNumbers).not.toContain(2);
  });

});

// ─── Casos especiais de CSV ───────────────────────────────────────────────────

describe('[TI-05] POST /herbs/import — casos especiais (PE)', () => {

  // Comportamento atual: modelo não tem unique em scientificName → duplicados são inseridos
  test('[TI-05l][PE] nome científico duplicado → ambas as linhas inseridas (sem unique no modelo)', async () => {
    const csv = [
      CSV_HEADER,
      'Mentha spicata,Hortelã,Culinária,,',
      'Mentha spicata,Hortelã,Culinária,,'   // mesmo scientificName
    ].join('\n');

    const res = await request(app)
      .post('/herbs/import')
      .set('Authorization', `Bearer ${adminToken}`)
      .attach('file', makeFile(csv), 'ervas.csv');

    expect(res.status).toBe(200);
    expect(res.body.data.inserted).toBe(2);  // inseridos sem erro — modelo não bloqueia
    expect(res.body.data.failed).toBe(0);
  });

  // Comportamento atual: cabeçalhos errados → campos mapeados para chaves desconhecidas
  // → validador não encontra scientificName/commonName/category → todas as linhas falham
  test('[TI-05m][PE] cabeçalhos não reconhecidos → inserted=0, todas as linhas em failed', async () => {
    const csv = [
      'nome,nomeComum,categoria,crescimento,descricao',  // cabeçalhos errados
      'Mentha spicata,Hortelã,Culinária,Rápido,'
    ].join('\n');

    const res = await request(app)
      .post('/herbs/import')
      .set('Authorization', `Bearer ${adminToken}`)
      .attach('file', makeFile(csv), 'ervas.csv');

    expect(res.status).toBe(200);
    expect(res.body.data.inserted).toBe(0);   // nenhuma inserida
    expect(res.body.data.failed).toBe(1);      // linha rejeitada por campos em falta
  });

});

// ─── Controlo de acesso — Particionamento de Equivalência ────────────────────

describe('[TI-05] POST /herbs/import — controlo de acesso por perfil (PE)', () => {

  const csvValido = () => [
    CSV_HEADER,
    'Mentha spicata,Hortelã,Culinária,,'
  ].join('\n');

  // PE: Administrador → 200 (perfil autorizado)
  test('[TI-05h][PE] Administrador pode importar → 200', async () => {
    const res = await request(app)
      .post('/herbs/import')
      .set('Authorization', `Bearer ${adminToken}`)
      .attach('file', makeFile(csvValido()), 'ervas.csv');

    expect(res.status).toBe(200);
    expect(res.body.data.inserted).toBe(1);
  });

  // PE: Responsável → 403 (perfil não autorizado)
  test('[TI-05i][PE] Responsável não pode importar → 403', async () => {
    const res = await request(app)
      .post('/herbs/import')
      .set('Authorization', `Bearer ${responsavelToken}`)
      .attach('file', makeFile(csvValido()), 'ervas.csv');

    expect(res.status).toBe(403);
  });

  // PE: Técnico → 403 (perfil não autorizado)
  test('[TI-05j][PE] Técnico não pode importar → 403', async () => {
    const res = await request(app)
      .post('/herbs/import')
      .set('Authorization', `Bearer ${tecnicoToken}`)
      .attach('file', makeFile(csvValido()), 'ervas.csv');

    expect(res.status).toBe(403);
  });

  // PE: sem token → 401
  test('[TI-05k][PE] sem token → 401', async () => {
    const res = await request(app)
      .post('/herbs/import')
      .attach('file', makeFile(csvValido()), 'ervas.csv');

    expect(res.status).toBe(401);
  });

});
