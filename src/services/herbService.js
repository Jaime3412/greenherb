/**
 * herbService.js
 * Lógica de negócio para o catálogo de ervas aromáticas.
 * Processa importação CSV linha a linha e devolve relatório agregado.
 */

const Herb = require('../models/Herb');
const { validateHerbCsvRow } = require('../validators/herbValidator');

/**
 * Processa um array de linhas CSV já parseadas.
 * @param {object[]} rows — linhas já convertidas para objetos
 * @returns {{ inserted: number, failed: number, errors: object[] }}
 */
const importHerbsFromRows = async (rows) => {
  if (!rows || rows.length === 0) {
    throw new Error('Ficheiro CSV vazio ou sem linhas válidas');
  }

  let inserted = 0;
  const failedRows = [];

  for (let i = 0; i < rows.length; i++) {
    const validation = validateHerbCsvRow(rows[i], i + 1);
    if (!validation.isValid) {
      failedRows.push({ lineNumber: i + 1, errors: validation.errors });
      continue;
    }
    const row = {
      scientificName: rows[i].scientificName,
      commonName:     rows[i].commonName,
      category:       rows[i].category,
      growthType:     rows[i].growthType || null,
      description:    rows[i].description || ''
    };
    await Herb.create(row);
    inserted++;
  }

  return {
    inserted,
    failed: failedRows.length,
    errors: failedRows
  };
};

module.exports = { importHerbsFromRows };
