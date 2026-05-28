/**
 * StubTemperatureSensorGateway — Duplo de teste (STUB) para TemperatureSensorGateway.
 *
 * ─── Justificação da escolha: STUB ────────────────────────────────────────────
 *
 * A medição de temperatura é um processo automático: a aplicação consulta periodicamente
 * o gateway de sensores para obter leituras ambientais sem intervenção humana.
 * O gateway é uma fonte de ENTRADAS INDIRETAS — o que importa nos testes é controlar
 * os valores devolvidos (temperatura, humidade, luminosidade), não verificar o número
 * de vezes que foi consultado.
 *
 * O STUB é o duplo mais adequado porque:
 *   • Fornece respostas pré-configuradas (estado fixo) sem lógica de verificação.
 *   • Permite simular diferentes condições ambientais (normal, crítico, sensor avariado).
 *   • Não depende de hardware IoT real nem de ligações de rede.
 *   • Contrasta com o Mock (que verifica interações): aqui interessa o QUÊ, não o COMO.
 *
 * ─── Utilização ───────────────────────────────────────────────────────────────
 *
 *   // Leitura única
 *   const stub = new StubTemperatureSensorGateway({ temperature: 35, humidity: 90, luminosity: 1000 });
 *
 *   // Sequência de leituras (avança a cada chamada a getLatestReading)
 *   const stub = new StubTemperatureSensorGateway([
 *     { temperature: 23, humidity: 60, luminosity: 15000 },  // 1.ª chamada
 *     { temperature: 35, humidity: 90, luminosity: 1000  },  // 2.ª chamada
 *   ]);
 *
 *   // Leitura com sensor avariado
 *   const stub = new StubTemperatureSensorGateway({ temperature: 23, humidity: 60, luminosity: 15000, sensorOK: false });
 */
class StubTemperatureSensorGateway {
  /**
   * @param {object|object[]} readings - Uma leitura ou array de leituras sequenciais.
   *   Cada leitura: { temperature, humidity, luminosity, sensorOK? }
   *   Se sensorOK for omitido, assume true.
   */
  constructor(readings) {
    this._readings = Array.isArray(readings) ? readings : [readings];
    this._index = 0;
  }

  /**
   * Devolve a próxima leitura pré-configurada.
   * Quando esgotadas, repete sempre a última leitura.
   * @returns {Promise<{temperature: number, humidity: number, luminosity: number, sensorOK: boolean}>}
   */
  async getLatestReading() {
    const idx = Math.min(this._index, this._readings.length - 1);
    this._index++;
    const reading = this._readings[idx];
    return { sensorOK: true, ...reading };
  }

  /** Substitui as leituras por uma única leitura e reinicia o índice. */
  setReading(reading) {
    this._readings = [reading];
    this._index = 0;
  }

  /** Reinicia o índice (próxima chamada devolve a primeira leitura). */
  reset() {
    this._index = 0;
  }

  /** Devolve o número de chamadas já efetuadas a getLatestReading(). */
  getCallCount() {
    return this._index;
  }
}

module.exports = { StubTemperatureSensorGateway };
