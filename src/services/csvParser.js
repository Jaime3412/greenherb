const { parse } = require('csv-parse/sync');

/**
 * Parseia um Buffer ou string CSV para um array de objetos.
 * A primeira linha é tratada como cabeçalho (nomes das colunas).
 * Colunas esperadas: scientificName, commonName, category, growthType, description
 *
 * @param {Buffer|string} input
 * @returns {object[]}
 * @throws {Error} se o input for nulo/vazio ou o CSV estiver malformado
 */
const parseCsvBuffer = (input) => {
  if (input === null || input === undefined || (typeof input !== 'string' && !Buffer.isBuffer(input))) {
    throw new Error('Input inválido: esperado Buffer ou string');
  }

  const content = Buffer.isBuffer(input) ? input.toString('utf8') : input;

  if (content.trim() === '') {
    throw new Error('Ficheiro CSV vazio');
  }

  return parse(content, {
    columns: true,
    skip_empty_lines: true,
    trim: true
  });
};

module.exports = { parseCsvBuffer };
