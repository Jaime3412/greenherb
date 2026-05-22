/**
 * planValidator.js
 * Valida os dados de criação de planos de cultivo:
 *   - Regular, Emergência e Pontual
 *
 * Intervalos aceitáveis (conforme enunciado):
 *   Temperatura (°C)       : [18, 28]
 *   Humidade relativa (%)  : [40, 80]
 *   Luminosidade (lux)     : [5000, 25000]
 *   Duração do ciclo (dias): [1, 365]
 */

const VALID_PLAN_TYPES = ['regular', 'emergencia', 'pontual'];

const LIMITS = {
  temperature: { min: 18, max: 28 },
  humidity:    { min: 40, max: 80 },
  luminosity:  { min: 5000, max: 25000 },
  duration:    { min: 1, max: 365 }
};

/**
 * Valida os dados de criação de um plano de cultivo.
 *
 * Decisão composta chave (plano pontual):
 *   isPontual  (C1) — tipo === 'pontual'
 *   hasAuth    (C2) — autorização do Responsável Técnico presente e não vazia
 *   Result: se C1 && !C2 → rejeita com erro de autorização
 *
 * @param {object} data
 * @returns {{ isValid: boolean, errors: string[] }}
 */
const validatePlan = (data) => {
  const errors = [];

  // ── Tipo de plano ─────────────────────────────────────────────────────────
  if (!data.type || data.type.trim() === '') {
    errors.push('Tipo de plano é obrigatório');
  } else if (!VALID_PLAN_TYPES.includes(data.type.toLowerCase())) {
    errors.push(`Tipo de plano inválido. Valores aceites: ${VALID_PLAN_TYPES.join(', ')}`);
  }

  // ── Temperatura ───────────────────────────────────────────────────────────
  if (data.minTemperature === undefined || data.minTemperature === null) {
    errors.push('Temperatura mínima é obrigatória');
  } else if (
    typeof data.minTemperature !== 'number' ||
    data.minTemperature < LIMITS.temperature.min ||
    data.minTemperature > LIMITS.temperature.max
  ) {
    errors.push(`Temperatura mínima deve estar entre ${LIMITS.temperature.min} e ${LIMITS.temperature.max} °C`);
  }

  if (data.maxTemperature === undefined || data.maxTemperature === null) {
    errors.push('Temperatura máxima é obrigatória');
  } else if (
    typeof data.maxTemperature !== 'number' ||
    data.maxTemperature < LIMITS.temperature.min ||
    data.maxTemperature > LIMITS.temperature.max
  ) {
    errors.push(`Temperatura máxima deve estar entre ${LIMITS.temperature.min} e ${LIMITS.temperature.max} °C`);
  }

  if (
    typeof data.minTemperature === 'number' &&
    typeof data.maxTemperature === 'number' &&
    data.minTemperature >= data.maxTemperature
  ) {
    errors.push('Temperatura mínima deve ser inferior à temperatura máxima');
  }

  // ── Humidade ──────────────────────────────────────────────────────────────
  if (data.minHumidity === undefined || data.minHumidity === null) {
    errors.push('Humidade mínima é obrigatória');
  } else if (
    typeof data.minHumidity !== 'number' ||
    data.minHumidity < LIMITS.humidity.min ||
    data.minHumidity > LIMITS.humidity.max
  ) {
    errors.push(`Humidade mínima deve estar entre ${LIMITS.humidity.min} e ${LIMITS.humidity.max} %`);
  }

  if (data.maxHumidity === undefined || data.maxHumidity === null) {
    errors.push('Humidade máxima é obrigatória');
  } else if (
    typeof data.maxHumidity !== 'number' ||
    data.maxHumidity < LIMITS.humidity.min ||
    data.maxHumidity > LIMITS.humidity.max
  ) {
    errors.push(`Humidade máxima deve estar entre ${LIMITS.humidity.min} e ${LIMITS.humidity.max} %`);
  }

  if (
    typeof data.minHumidity === 'number' &&
    typeof data.maxHumidity === 'number' &&
    data.minHumidity >= data.maxHumidity
  ) {
    errors.push('Humidade mínima deve ser inferior à humidade máxima');
  }

  // ── Luminosidade ──────────────────────────────────────────────────────────
  if (data.minLuminosity === undefined || data.minLuminosity === null) {
    errors.push('Luminosidade mínima é obrigatória');
  } else if (
    typeof data.minLuminosity !== 'number' ||
    data.minLuminosity < LIMITS.luminosity.min ||
    data.minLuminosity > LIMITS.luminosity.max
  ) {
    errors.push(`Luminosidade mínima deve estar entre ${LIMITS.luminosity.min} e ${LIMITS.luminosity.max} lux`);
  }

  if (data.maxLuminosity === undefined || data.maxLuminosity === null) {
    errors.push('Luminosidade máxima é obrigatória');
  } else if (
    typeof data.maxLuminosity !== 'number' ||
    data.maxLuminosity < LIMITS.luminosity.min ||
    data.maxLuminosity > LIMITS.luminosity.max
  ) {
    errors.push(`Luminosidade máxima deve estar entre ${LIMITS.luminosity.min} e ${LIMITS.luminosity.max} lux`);
  }

  if (
    typeof data.minLuminosity === 'number' &&
    typeof data.maxLuminosity === 'number' &&
    data.minLuminosity >= data.maxLuminosity
  ) {
    errors.push('Luminosidade mínima deve ser inferior à luminosidade máxima');
  }

  // ── Duração do ciclo ──────────────────────────────────────────────────────
  if (data.durationDays === undefined || data.durationDays === null) {
    errors.push('Duração do ciclo é obrigatória');
  } else if (
    !Number.isInteger(data.durationDays) ||
    data.durationDays < LIMITS.duration.min ||
    data.durationDays > LIMITS.duration.max
  ) {
    errors.push(`Duração do ciclo deve ser um inteiro entre ${LIMITS.duration.min} e ${LIMITS.duration.max} dias`);
  }

  // ── Autorização para plano pontual ────────────────────────────────────────
  // Decisão composta: C1 (isPontual) && C2 (!hasAuth) → erro
  const isPontual = data.type && data.type.toLowerCase() === 'pontual';  // C1
  const hasAuth   = data.responsibleAuth && data.responsibleAuth.trim() !== '';  // C2

  if (isPontual && !hasAuth) {
    errors.push('Plano pontual requer autorização explícita do Responsável Técnico');
  }

  return { isValid: errors.length === 0, errors };
};

module.exports = { validatePlan, VALID_PLAN_TYPES, LIMITS };
