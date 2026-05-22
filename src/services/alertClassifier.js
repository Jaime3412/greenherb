/**
 * alertClassifier.js
 * Função pura de classificação de alertas — testável por caixa-branca (MC/DC).
 *
 * Condições atómicas:
 *   C1: tempViolated  — temperatura fora do intervalo do plano
 *   C2: humViolated   — humidade fora do intervalo do plano
 *   C3: lumViolated   — luminosidade fora do intervalo do plano
 *   C4: sensorOK      — sensor funcional
 *
 * Decisão composta principal:
 *   anyViolated = C1 || C2 || C3
 *   gera alerta apenas se: anyViolated && C4
 *
 * Classificação pelo número de violações ativas:
 *   1 violação  → 'Informativo'
 *   2 violações → 'Aviso'
 *   3 violações → 'Crítico'
 */

const classifyAlert = (measurement, plan) => {
  const { temperature, humidity, luminosity, sensorOK = true } = measurement;

  const tempViolated = temperature < plan.minTemperature || temperature > plan.maxTemperature; // C1
  const humViolated  = humidity < plan.minHumidity    || humidity > plan.maxHumidity;          // C2
  const lumViolated  = luminosity < plan.minLuminosity || luminosity > plan.maxLuminosity;     // C3

  const anyViolated = tempViolated || humViolated || lumViolated;

  if (!anyViolated || !sensorOK) return null;

  const count = [tempViolated, humViolated, lumViolated].filter(Boolean).length;
  if (count === 1) return 'Informativo';
  if (count === 2) return 'Aviso';
  return 'Crítico';
};

module.exports = { classifyAlert };
