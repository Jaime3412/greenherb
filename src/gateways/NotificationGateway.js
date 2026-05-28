/**
 * NotificationGateway — Gateway para envio de notificações de alertas.
 *
 * Em produção, implementações concretas desta classe enviam notificações
 * por email, SMS, push ou integração com sistemas externos (ex: Slack, PagerDuty).
 *
 * Em testes, é substituída pelo MockNotificationGateway, que regista todas as
 * chamadas e expõe métodos de verificação.
 *
 * Por que Mock e não Stub?
 *   O envio de notificações é um efeito lateral observável. O que importa verificar
 *   nos testes é SE e COM QUE PARÂMETROS a notificação foi enviada quando um alerta
 *   é gerado. O Mock regista interações e permite afirmar sobre elas; o Stub apenas
 *   devolveria um valor estático sem verificação de comportamento.
 */
class NotificationGateway {
  /**
   * Envia uma notificação sobre um alerta gerado.
   * @param {{ alertType: string, batchId: string, alertId: string, message: string }} notification
   * @returns {Promise<void>}
   */
  async sendNotification(notification) {
    throw new Error('NotificationGateway.sendNotification() não implementado');
  }
}

module.exports = { NotificationGateway };
