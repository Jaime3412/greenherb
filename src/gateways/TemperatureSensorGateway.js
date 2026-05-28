/**
 * TemperatureSensorGateway — Gateway para leitura automática de sensores ambientais.
 *
 * Em produção, implementações concretas desta classe comunicam com hardware IoT
 * (ex: sensores MQTT, APIs de telemetria) para obter leituras em tempo real.
 *
 * Em testes, é substituída pelo StubTemperatureSensorGateway, que devolve leituras
 * pré-configuradas sem qualquer dependência de hardware.
 *
 * Por que Stub e não Mock?
 *   A leitura de temperatura é um processo automático orientado a DADOS (entradas
 *   indiretas). O que importa nos testes é QUAL valor o sensor devolve, não quantas
 *   vezes foi consultado. O Stub fornece estados pré-definidos; o Mock verificaria
 *   interações — o que não é relevante aqui.
 */
class TemperatureSensorGateway {
  /**
   * Obtém a leitura mais recente do sensor ambiental.
   * @returns {Promise<{temperature: number, humidity: number, luminosity: number, sensorOK: boolean}>}
   */
  async getLatestReading() {
    throw new Error('TemperatureSensorGateway.getLatestReading() não implementado');
  }
}

module.exports = { TemperatureSensorGateway };
