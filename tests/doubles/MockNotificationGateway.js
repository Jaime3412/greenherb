/**
 * MockNotificationGateway — Duplo de teste (MOCK) para NotificationGateway.
 *
 * ─── Justificação da escolha: MOCK ────────────────────────────────────────────
 *
 * O gateway de notificações é responsável por um efeito lateral observável: enviar
 * alertas (email, SMS, push) quando condições ambientais são violadas.
 * Nos testes, interessa verificar SE e COM QUE PARÂMETROS a notificação foi enviada
 * — ou seja, verificar a INTERAÇÃO entre o serviço e o gateway.
 *
 * O MOCK é o duplo mais adequado porque:
 *   • Regista todas as chamadas a sendNotification() com os seus argumentos.
 *   • Expõe métodos de verificação (wasNotificationSent, getLastNotification, etc.)
 *     para afirmar sobre o comportamento observado.
 *   • Permite simular falhas do gateway (simulateFailure) para testar resiliência.
 *   • Contrasta com o Stub (que apenas devolve valores): aqui o foco é no COMPORTAMENTO,
 *     não nas entradas indiretas.
 *
 * ─── Utilização ───────────────────────────────────────────────────────────────
 *
 *   const mock = new MockNotificationGateway();
 *   await recordMeasurement(data, userId, mock);
 *
 *   // Verificações de comportamento
 *   expect(mock.wasNotificationSent()).toBe(true);
 *   expect(mock.getNotificationCount()).toBe(1);
 *   expect(mock.getLastNotification().alertType).toBe('Crítico');
 *   expect(mock.wasNotificationSentWith({ alertType: 'Crítico' })).toBe(true);
 *
 *   // Simular falha do gateway
 *   mock.simulateFailure();
 *   await expect(recordMeasurement(data, userId, mock)).rejects.toThrow();
 */
class MockNotificationGateway {
  constructor() {
    this._notifications = [];
    this._shouldFail = false;
  }

  /**
   * Regista a notificação (ou lança erro se configurado para falhar).
   * @param {{ alertType: string, batchId: string, alertId: string, message: string }} notification
   */
  async sendNotification(notification) {
    if (this._shouldFail) {
      throw new Error('Falha simulada no gateway de notificações');
    }
    this._notifications.push({ ...notification, sentAt: new Date() });
  }

  // ─── Métodos de verificação (assertions) ────────────────────────────────────

  /** Verdadeiro se pelo menos uma notificação foi enviada. */
  wasNotificationSent() {
    return this._notifications.length > 0;
  }

  /** Número total de notificações enviadas. */
  getNotificationCount() {
    return this._notifications.length;
  }

  /** Última notificação enviada, ou null se nenhuma. */
  getLastNotification() {
    return this._notifications.length > 0
      ? this._notifications[this._notifications.length - 1]
      : null;
  }

  /** Cópia de todas as notificações enviadas. */
  getNotifications() {
    return [...this._notifications];
  }

  /**
   * Verdadeiro se alguma notificação enviada contém todas as propriedades esperadas.
   * @param {object} expectedProps - Subconjunto de propriedades a verificar.
   * @example mock.wasNotificationSentWith({ alertType: 'Crítico', batchId: 'b1' })
   */
  wasNotificationSentWith(expectedProps) {
    return this._notifications.some(n =>
      Object.keys(expectedProps).every(k => n[k] === expectedProps[k])
    );
  }

  // ─── Métodos de configuração ─────────────────────────────────────────────────

  /** Configura o mock para lançar erro na próxima chamada a sendNotification(). */
  simulateFailure() {
    this._shouldFail = true;
  }

  /** Repõe o estado inicial (limpa notificações e desativa modo de falha). */
  reset() {
    this._notifications = [];
    this._shouldFail = false;
  }
}

module.exports = { MockNotificationGateway };
