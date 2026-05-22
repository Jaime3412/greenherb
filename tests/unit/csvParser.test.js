/**
 * csvParser.test.js — Testes de Unidade — Sprint 2
 *
 * Técnicas aplicadas:
 *   PE — Particionamento de Equivalência
 *   VL — Análise de Valores Limite
 *
 * Requisitos cobertos:
 *   RF-03 — Importação de ervas aromáticas (CSV)
 *   RN-10 — Parsing correto de ficheiro CSV para array de objetos
 */

const { parseCsvBuffer } = require('../../src/services/csvParser');

const CSV_HEADER = 'scientificName,commonName,category,growthType,description';

// ─────────────────────────────────────────────────────────────────────────────
// Inputs válidos — Particionamento de Equivalência
// ─────────────────────────────────────────────────────────────────────────────
describe('parseCsvBuffer — inputs válidos (PE)', () => {

  // TU97_S2 — PE: string CSV com uma linha válida
  test('[TU97_S2][PE] deve parsear string CSV com uma linha e devolver array com 1 objeto', () => {
    const csv = `${CSV_HEADER}\nMentha spicata,Hortelã,Culinária,Rápido,Erva aromática`;
    const rows = parseCsvBuffer(csv);
    expect(rows).toHaveLength(1);
    expect(rows[0].scientificName).toBe('Mentha spicata');
    expect(rows[0].commonName).toBe('Hortelã');
    expect(rows[0].category).toBe('Culinária');
  });

  // TU98_S2 — PE: Buffer CSV com múltiplas linhas
  test('[TU98_S2][PE] deve parsear Buffer CSV com múltiplas linhas', () => {
    const csv = [
      CSV_HEADER,
      'Mentha spicata,Hortelã,Culinária,Rápido,',
      'Salvia officinalis,Salva,Medicinal,Moderado,Erva medicinal'
    ].join('\n');
    const rows = parseCsvBuffer(Buffer.from(csv, 'utf8'));
    expect(rows).toHaveLength(2);
    expect(rows[1].commonName).toBe('Salva');
  });

  // TU99_S2 — PE: campos opcionais em branco → presentes no objeto mas vazios
  test('[TU99_S2][PE] campos opcionais em branco devem ser string vazia no objeto', () => {
    const csv = `${CSV_HEADER}\nMentha spicata,Hortelã,Culinária,,`;
    const rows = parseCsvBuffer(csv);
    expect(rows[0].growthType).toBe('');
    expect(rows[0].description).toBe('');
  });

  // TU100_S2 — VL: CSV com apenas o cabeçalho e uma linha (mínimo válido)
  test('[TU100_S2][VL] CSV com cabeçalho e uma linha (mínimo) deve devolver 1 objeto', () => {
    const csv = `${CSV_HEADER}\nRosmarinus officinalis,Alecrim,Culinária,,`;
    const rows = parseCsvBuffer(csv);
    expect(rows).toHaveLength(1);
  });

  // TU101_S2 — PE: espaços extra são removidos (trim)
  test('[TU101_S2][PE] espaços à volta dos valores devem ser removidos', () => {
    const csv = `${CSV_HEADER}\n  Mentha spicata  ,  Hortelã  ,  Culinária  ,,`;
    const rows = parseCsvBuffer(csv);
    expect(rows[0].scientificName).toBe('Mentha spicata');
    expect(rows[0].commonName).toBe('Hortelã');
  });

});

// ─────────────────────────────────────────────────────────────────────────────
// Inputs inválidos — Particionamento de Equivalência
// ─────────────────────────────────────────────────────────────────────────────
describe('parseCsvBuffer — inputs inválidos (PE)', () => {

  // TU102_S2 — PE: input null → lança erro
  test('[TU102_S2][PE] null deve lançar erro de input inválido', () => {
    expect(() => parseCsvBuffer(null)).toThrow('Input inválido');
  });

  // TU103_S2 — PE: input undefined → lança erro
  test('[TU103_S2][PE] undefined deve lançar erro de input inválido', () => {
    expect(() => parseCsvBuffer(undefined)).toThrow('Input inválido');
  });

  // TU104_S2 — PE: string vazia → lança erro de ficheiro vazio
  test('[TU104_S2][PE] string vazia deve lançar erro de ficheiro vazio', () => {
    expect(() => parseCsvBuffer('')).toThrow('Ficheiro CSV vazio');
  });

  // TU105_S2 — PE: Buffer vazio → lança erro de ficheiro vazio
  test('[TU105_S2][PE] Buffer vazio deve lançar erro de ficheiro vazio', () => {
    expect(() => parseCsvBuffer(Buffer.from(''))).toThrow('Ficheiro CSV vazio');
  });

});

// ─────────────────────────────────────────────────────────────────────────────
// PE — Caracteres Especiais no CSV (adições S3)
//
// Classes testadas:
//   Classe C — Acentos e Unicode latino
//   Classe E — Espaços extra nos campos
//   Classe F — Aspas e vírgulas dentro de campos (RFC-4180)
//   Classe G — Separador alternativo (;)
// ─────────────────────────────────────────────────────────────────────────────
describe('parseCsvBuffer — caracteres especiais (PE — adições S3)', () => {

  // TU_CSV_CS01_S3 — Classe F (RFC-4180): vírgula dentro de aspas → campo único
  test('[TU_CSV_CS01_S3][PE] campo com vírgula dentro de aspas → parseado como campo único', () => {
    const csv = `scientificName,commonName,category,growthType,description
Mentha spicata,Hortelã,Culinária,Rápido,"Erva muito usada, especialmente em saladas"`;
    const rows = parseCsvBuffer(csv);
    expect(rows).toHaveLength(1);
    expect(rows[0].description).toBe('Erva muito usada, especialmente em saladas');
  });

  // TU_CSV_CS02_S3 — Classe C: acentos nos campos → preservados com UTF-8
  test('[TU_CSV_CS02_S3][PE] campos com acentos → valores preservados corretamente', () => {
    const csv = `scientificName,commonName,category,growthType,description
Mentha aquática,Hortelã,Culinária,Rápido,Descrição com acentos`;
    const rows = parseCsvBuffer(csv);
    expect(rows[0].commonName).toBe('Hortelã');
    expect(rows[0].description).toBe('Descrição com acentos');
  });

  // TU_CSV_CS03_S3 — Classe F: aspas duplas escapadas (RFC-4180) → parseadas corretamente
  test('[TU_CSV_CS03_S3][PE] aspas duplas escapadas dentro de campo → parseadas corretamente', () => {
    const csv = `scientificName,commonName,category,growthType,description
Mentha spicata,Hortelã,Culinária,Rápido,"Conhecida como ""menta"" em alguns países"`;
    const rows = parseCsvBuffer(csv);
    expect(rows[0].description).toBe('Conhecida como "menta" em alguns países');
  });

  // TU_CSV_CS04_S3 — Classe E: espaços extra nos campos → removidos pelo trim do parser
  test('[TU_CSV_CS04_S3][PE] espaços extra nos campos → removidos pelo trim', () => {
    const csv = `scientificName,commonName,category,growthType,description
  Mentha spicata  ,  Hortelã  ,  Culinária  ,  Rápido  ,  Descrição  `;
    const rows = parseCsvBuffer(csv);
    expect(rows[0].scientificName).toBe('Mentha spicata');
    expect(rows[0].commonName).toBe('Hortelã');
  });

  // TU_CSV_CS05_S3 — Classe G: ponto e vírgula como separador → não suportado
  // O parser usa vírgula — com ; toda a linha fica num único campo
  test('[TU_CSV_CS05_S3][PE] CSV com ";" como separador → não parseado corretamente (separador não suportado)', () => {
    const csv = `scientificName;commonName;category;growthType;description
Mentha spicata;Hortelã;Culinária;Rápido;Descrição`;
    const rows = parseCsvBuffer(csv);
    // Toda a linha fica como valor único no campo scientificName
    expect(rows[0].scientificName).toBe('Mentha spicata;Hortelã;Culinária;Rápido;Descrição');
  });

});
