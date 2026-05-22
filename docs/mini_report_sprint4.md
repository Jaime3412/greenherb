# Mini Report — Sprint 4 (Integração API GREENHERB)

## 1) Objetivo do Sprint 4

Implementar e consolidar testes de integração para os endpoints da API, cobrindo:

- Autenticação/autorização por perfil e por token JWT.
- Payload JSON (válido e inválido).
- `Content-Type` e comportamento de contrato HTTP.
- Método HTTP correto vs método não suportado.
- Códigos HTTP esperados por cenário.
- Atualização da matriz de rastreabilidade com cobertura bidirecional.

## 2) Novos testes criados (desde o início do trabalho neste Sprint 4)

Total de novos casos de teste adicionados: **56**

### 2.1 Ficheiros de testes criados do zero

- `tests/integration/auth.integration.test.js` — **13 testes**
  - TI-07a..TI-07d (`POST /auth/register`)
  - TI-08a..TI-08c (`POST /auth/login`)
  - TI-09a..TI-09c (`POST /auth/refresh`, incluindo token expirado)
  - TI-10a..TI-10c (`GET /auth/me`, incluindo token expirado)

- `tests/integration/batches.integration.test.js` — **11 testes**
  - TI-11a..TI-11e (`POST /batches`)
  - TI-12a..TI-12b (`GET /batches/:id`)
  - TI-13a..TI-13d (`PATCH /batches/:id`)

- `tests/integration/audit.integration.test.js` — **4 testes**
  - TI-14a..TI-14d (`GET /audit`)

- `tests/integration/httpMethods.integration.test.js` — **4 testes**
  - TI-18a..TI-18d (método HTTP inválido em endpoints críticos)

### 2.2 Ficheiros de testes existentes reforçados

- `tests/integration/plans.integration.test.js` — **+7 testes**
  - TI-01g..TI-01i (contrato HTTP/payload em `POST /plans`)
  - TI-16a..TI-16d (`GET /plans`)

- `tests/integration/measurements.integration.test.js` — **+4 testes**
  - TI-03s..TI-03v (auth/payload/content-type em `POST /measurements`)

- `tests/integration/alerts.integration.test.js` — **+9 testes**
  - TI-04g..TI-04k (auth/payload/content-type em `PATCH /alerts/:id`)
  - TI-17a..TI-17d (`GET /alerts`)

- `tests/integration/users.integration.test.js` — **+4 testes**
  - TI-15a..TI-15d (`GET /users`)

## 3) Ficheiros criados e alterados (desde que comecei)

### 3.1 Ficheiros criados

- `tests/integration/auth.integration.test.js`
- `tests/integration/batches.integration.test.js`
- `tests/integration/audit.integration.test.js`
- `tests/integration/httpMethods.integration.test.js`
- `docs/matriz_rastreabilidade_sprint4.md` (versão final completa)
- `docs/mini_report_sprint4.md`

### 3.2 Ficheiros alterados

- `src/services/batchService.js`: validação explícita de `planId` obrigatório (`VALIDATION_ERROR`).
- `src/controllers/batchController.js`: mapeamento de `VALIDATION_ERROR` para `400`.
- `src/services/measurementService.js`: validação explícita de `batchId` obrigatório (`VALIDATION_ERROR`).
- `src/controllers/measurementController.js`: mapeamento de `VALIDATION_ERROR` para `400`.
- `tests/integration/plans.integration.test.js`
- `tests/integration/measurements.integration.test.js`
- `tests/integration/alerts.integration.test.js`
- `tests/integration/users.integration.test.js`
- `tests/integration/batches.integration.test.js` (ajuste de expectativas para `400` em payload obrigatório em falta)

## 4) Resultado final do Sprint

- Matriz final pronta para apresentação: `docs/matriz_rastreabilidade_sprint4.md`
- Execução da integração:
  - `9` suites
  - `107` testes
  - `100%` a passar

## 5) Como defender oralmente (guião curto)

1. O Sprint 4 focou contrato de integração dos endpoints: segurança, payload, headers e códigos HTTP.
2. Nos endpoints críticos pedidos pelo docente:
   - `POST /plans`: PE + CM + VL, incluindo autorização no plano pontual.
   - `POST /measurements`: VL nos limites ambientais + criação/classificação de alertas.
   - `PATCH /alerts/:id`: VL de justificação `[10,500]` + autenticação + payload.
3. Foi garantida rastreabilidade bidirecional:
   - cada TI aponta para RF/RN;
   - cada RF/RN aponta para TIs concretos.
4. Foram incluídos cenários de método HTTP inválido para evidenciar robustez do contrato REST.

## 6) Comandos de execução

```powershell
cd "c:\Users\sergi\Ambiente de Trabalho\greenherb_final"
npm.cmd install
npm.cmd run test:integration
```
