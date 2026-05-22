/**
 * herbValidator.js
 * Valida os dados de uma erva aromática antes de persistir.
 * Também valida cada linha de um CSV importado.
 */

const VALID_CATEGORIES = ['Medicinal', 'Culinária', 'Ornamental', 'Aromática'];
const VALID_GROWTH_TYPES = ['Rápido', 'Moderado', 'Lento'];

/**
 * Valida os dados de uma erva aromática individual.
 * @param {object} data
 * @returns {{ isValid: boolean, errors: string[] }}
 */
const validateHerb = (data) => {
  const errors = [];

  // Nome científico: obrigatório, 2–150 chars
  if (!data.scientificName || data.scientificName.trim() === '') {
    errors.push('Nome científico é obrigatório');
  } else if (data.scientificName.trim().length < 2) {
    errors.push('Nome científico deve ter pelo menos 2 caracteres');
  } else if (data.scientificName.trim().length > 150) {
    errors.push('Nome científico não pode exceder 150 caracteres');
  }

  // Nome comum: obrigatório, 2–100 chars
  if (!data.commonName || data.commonName.trim() === '') {
    errors.push('Nome comum é obrigatório');
  } else if (data.commonName.trim().length < 2) {
    errors.push('Nome comum deve ter pelo menos 2 caracteres');
  } else if (data.commonName.trim().length > 100) {
    errors.push('Nome comum não pode exceder 100 caracteres');
  }

  // Categoria: obrigatória, valor de enumeração válido
  if (!data.category || data.category.trim() === '') {
    errors.push('Categoria é obrigatória');
  } else if (!VALID_CATEGORIES.includes(data.category)) {
    errors.push(`Categoria inválida. Valores aceites: ${VALID_CATEGORIES.join(', ')}`);
  }

  // Tipo de crescimento: opcional mas, se presente, deve ser válido
  if (data.growthType !== undefined && data.growthType !== null && data.growthType !== '') {
    if (!VALID_GROWTH_TYPES.includes(data.growthType)) {
      errors.push(`Tipo de crescimento inválido. Valores aceites: ${VALID_GROWTH_TYPES.join(', ')}`);
    }
  }

  // Descrição: opcional, máx. 500 chars
  if (data.description && data.description.length > 500) {
    errors.push('Descrição não pode exceder 500 caracteres');
  }

  return { isValid: errors.length === 0, errors };
};

/**
 * Valida uma linha proveniente de CSV de importação.
 * Espera os campos: scientificName, commonName, category, growthType, description
 * @param {object} row
 * @param {number} lineNumber
 * @returns {{ isValid: boolean, errors: string[], lineNumber: number }}
 */
const validateHerbCsvRow = (row, lineNumber) => {
  const result = validateHerb(row);
  return { ...result, lineNumber };
};

module.exports = { validateHerb, validateHerbCsvRow, VALID_CATEGORIES, VALID_GROWTH_TYPES };
