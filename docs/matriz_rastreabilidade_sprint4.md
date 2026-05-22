# Matriz de Rastreabilidade — Sprint 4 (Versão Final)

## 1) Cobertura por Endpoint (Completa no âmbito implementado)

| Endpoint | Casos de Teste (Integração) |
|---|---|
| `POST /auth/register` | TI-07a..TI-07d |
| `POST /auth/login` | TI-08a..TI-08c |
| `POST /auth/refresh` | TI-09a..TI-09c |
| `GET /auth/me` | TI-10a..TI-10c |
| `POST /users` | TI-06a..TI-06e |
| `GET /users` | TI-15a..TI-15d |
| `POST /herbs/import` | TI-05a..TI-05m |
| `POST /plans` | TI-01a..TI-01i, TI-02a..TI-02c |
| `GET /plans` | TI-16a..TI-16d |
| `POST /batches` | TI-11a..TI-11e |
| `GET /batches/:id` | TI-12a..TI-12b |
| `PATCH /batches/:id` | TI-13a..TI-13d |
| `POST /measurements` | TI-03a..TI-03v |
| `GET /alerts` | TI-17a..TI-17d |
| `PATCH /alerts/:id` | TI-04a..TI-04k |
| `GET /audit` | TI-14a..TI-14d |

## 2) Matriz Principal (Caso de Teste → Requisito)

| ID do Caso de Teste | Requisito / Regra de Negócio | Endpoint(s) Exercitado(s) | Nível de Teste | Técnica Aplicada | Resultado Esperado | Pré-condições |
|---|---|---|---|---|---|---|
| TI-01 | RF-04 (criação de planos) | `POST /plans` | Integração | PE + VL | `201` para tipo válido e limites válidos; `400` tipo/payload inválido; `401/403` sem token/perfil não autorizado | JWT válido (Responsável para sucesso), herb existente |
| TI-02 | RN-04 (plano pontual exige autorização) | `POST /plans` | Integração | CM | `400` pontual sem `responsibleAuth`; `201` pontual com autorização | Responsável autenticado, herb existente |
| TI-03 | RF-07 + RN-02 (registo de medições + geração/classificação de alerta) | `POST /measurements` | Integração | VL + CM + PE | `201` para medição válida; alerta correto por limites; `400` payload inválido; `401` sem token; `404` lote inexistente | Técnico autenticado, lote ativo associado a plano com limites definidos |
| TI-04 | RN-05 (ignorar alerta com justificação obrigatória) | `PATCH /alerts/:id` | Integração | VL + PE | `200` resolvido/ignorado válido; `422` justificação fora de `[10,500]` ou resolução inválida; `401/403` sem token/perfil não autorizado | Alerta pendente existente, tokens por perfil |
| TI-05 | RF-03 (importação de ervas por CSV) | `POST /herbs/import` | Integração | PE | `200` com agregação correta (`inserted/failed/errors`), `400` sem ficheiro/sem linhas, `401/403` por acesso indevido | Admin autenticado, ficheiros CSV de teste (válido/inválido/misto) |
| TI-06 | RF-01 (gestão de utilizadores — criação) | `POST /users` | Integração | PE | `201` apenas para Administrador; `403` Técnico/Responsável; `401` sem token; `409` email duplicado | Utilizadores dos três perfis e tokens válidos |
| TI-07 | RF-02 (registo/autenticação) | `POST /auth/register` | Integração | PE | `201` payload válido; `400` payload/content-type inválido; `409` duplicado | Base de dados limpa/inicializada |
| TI-08 | RF-02 (login) | `POST /auth/login` | Integração | PE | `200` credenciais válidas; `400` payload inválido; `401` credenciais inválidas | Utilizador existente na BD |
| TI-09 | RF-02 (renovação de token) | `POST /auth/refresh` | Integração | PE | `200` token válido; `401` sem token ou token expirado | Utilizador ativo + JWT válido e token expirado preparado |
| TI-10 | RF-02 (obter utilizador autenticado) | `GET /auth/me` | Integração | PE | `200` token válido; `401` token inválido ou expirado | JWT válido/inválido/expirado preparado |
| TI-11 | RF-05 (criação de lote) | `POST /batches` | Integração | PE | `201` payload válido; `400` sem `planId`/payload inválido; `401` sem token; `404` plano inexistente | Plano existente, utilizador autenticado |
| TI-12 | RF-05 (consulta de lote) | `GET /batches/:id` | Integração | PE | `200` para lote existente; `404` para inexistente | Lote previamente criado, token válido |
| TI-13 | RN-06 (transição de estado do lote) | `PATCH /batches/:id` | Integração | PE | `200` fecho válido; `400` estado inválido; `403/401` acesso indevido | Lote ativo, perfis e tokens válidos |
| TI-14 | RN-09 (auditoria) | `GET /audit` | Integração | PE | `200` Administrador; `403` Técnico/Responsável; `401` sem token | Tokens por perfil, registo de auditoria existente |
| TI-15 | RF-01 (gestão de utilizadores — listagem) | `GET /users` | Integração | PE | `200` para Administrador; `403` Técnico/Responsável; `401` sem token | Utilizadores existentes e tokens por perfil |
| TI-16 | RF-04 (listagem de planos) | `GET /plans` | Integração | PE | `200` para utilizador autenticado; `401` sem token | Pelo menos um plano existente |
| TI-17 | RN-02 / monitorização (consulta de alertas) | `GET /alerts` | Integração | PE | `200` para utilizador autenticado; `401` sem token | Pelo menos um alerta existente |
| TI-18 | Premissas API REST (método HTTP correto) | `PUT /plans`, `DELETE /measurements`, `POST /alerts/:id`, `GET /auth/login` | Integração | PE | `404` para método não suportado nesses recursos | App em execução com rotas padrão |

## 3) Rastreabilidade Bidirecional (Requisito → Casos de Teste)

| Requisito / Regra | Casos de Teste de Integração |
|---|---|
| RF-01 (utilizadores) | TI-06, TI-15 |
| RF-02 (autenticação/JWT) | TI-07, TI-08, TI-09, TI-10 |
| RF-03 (importação CSV) | TI-05 |
| RF-04 (planos de cultivo) | TI-01, TI-02, TI-16 |
| RF-05 (lotes) | TI-11, TI-12 |
| RF-07 (medições ambientais) | TI-03 |
| RN-02 (alertas a partir de medições) | TI-03, TI-17 |
| RN-04 (plano pontual com autorização) | TI-02 |
| RN-05 (ignorar alerta com justificação) | TI-04 |
| RN-06 (transição de estado de lote) | TI-13 |
| RN-09 (auditoria) | TI-14 |
| Premissas de contrato HTTP/método | TI-18 |

## 4) Evidência de Execução (Sprint 4)

- Comando executado: `npm.cmd run test:integration`
- Resultado: `9/9` suites a passar, `105/105` testes a passar.
