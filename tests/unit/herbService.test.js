/**
 * herbService.test.js — Testes de Unidade — Sprint 2
 *
 * Técnicas aplicadas:
 *   PE — Particionamento de Equivalência
 *
 * Requisitos cobertos:
 *   RF-03 — Importação CSV de ervas aromáticas
 *   RN-10 — Agregação de resultados: linhas válidas, inválidas e parcialmente válidas
 */

jest.mock('../../src/models/Herb');
const Herb = require('../../src/models/Herb');
const { importHerbsFromRows } = require('../../src/services/herbService');

const validRow = () => ({
  scientificName: 'Mentha spicata',
  commonName: 'Hortelã',
  category: 'Culinária',
  growthType: 'Rápido',
  description: 'Erva aromática.'
});

beforeEach(() => jest.clearAllMocks());

describe('importHerbsFromRows', () => {

  // TU91_S2 — PE: todas as linhas válidas → inserted = n, failed = 0
  test('[TU91_S2][PE] todas as linhas válidas: inserted=N, failed=0', async () => {
    Herb.create.mockResolvedValue({});
    const rows = [validRow(), { ...validRow(), commonName: 'Salva', scientificName: 'Salvia officinalis' }];
    const result = await importHerbsFromRows(rows);
    expect(result.inserted).toBe(2);
    expect(result.failed).toBe(0);
    expect(result.errors).toHaveLength(0);
  });

  // TU92_S2 — PE: todas as linhas inválidas → inserted = 0, failed = n
  test('[TU92_S2][PE] todas as linhas inválidas: inserted=0, failed=N', async () => {
    const rows = [
      { scientificName: '', commonName: '', category: '' },
      { scientificName: '', commonName: '', category: 'Invalida' }
    ];
    const result = await importHerbsFromRows(rows);
    expect(result.inserted).toBe(0);
    expect(result.failed).toBe(2);
    expect(result.errors.length).toBe(2);
    expect(Herb.create).not.toHaveBeenCalled();
  });

  // TU93_S2 — PE: mistura de linhas válidas e inválidas (ficheiro parcialmente válido)
  test('[TU93_S2][PE] mistura de linhas válidas e inválidas: contagens corretas', async () => {
    Herb.create.mockResolvedValue({});
    const rows = [
      validRow(),                                           // válida → linha 1
      { scientificName: '', commonName: '', category: '' }, // inválida → linha 2
      { ...validRow(), commonName: 'Alecrim', scientificName: 'Rosmarinus officinalis' } // válida → linha 3
    ];
    const result = await importHerbsFromRows(rows);
    expect(result.inserted).toBe(2);
    expect(result.failed).toBe(1);
    expect(result.errors[0].lineNumber).toBe(2);
  });

  // TU94_S2 — PE: ficheiro vazio (array vazio) → lança erro
  test('[TU94_S2][PE] ficheiro CSV vazio lança erro', async () => {
    await expect(importHerbsFromRows([])).rejects.toThrow('Ficheiro CSV vazio ou sem linhas válidas');
    expect(Herb.create).not.toHaveBeenCalled();
  });

  // TU95_S2 — PE: rows=null → lança erro
  test('[TU95_S2][PE] rows=null lança erro', async () => {
    await expect(importHerbsFromRows(null)).rejects.toThrow('Ficheiro CSV vazio ou sem linhas válidas');
  });

  // TU96_S2 — PE: erros de lineNumber corretos em ficheiro misto
  test('[TU96_S2][PE] lineNumbers nos erros correspondem à posição real da linha no CSV', async () => {
    Herb.create.mockResolvedValue({});
    const rows = [
      { scientificName: '', commonName: 'Erva', category: 'Culinária' }, // inválida → linha 1
      validRow(),                                                          // válida → linha 2
      { scientificName: 'Thymus vulgaris', commonName: '', category: 'Culinária' } // inválida → linha 3
    ];
    const result = await importHerbsFromRows(rows);
    expect(result.inserted).toBe(1);
    expect(result.failed).toBe(2);
    const lineNumbers = result.errors.map(e => e.lineNumber);
    expect(lineNumbers).toContain(1);
    expect(lineNumbers).toContain(3);
  });

});
