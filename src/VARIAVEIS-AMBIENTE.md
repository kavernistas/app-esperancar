# Variáveis de Ambiente — Esperançar

## Frontend (Vite)

Arquivo `.env` na raiz do projeto:

```env
VITE_BASE44_APP_ID=seu_app_id
VITE_BASE44_BACKEND_URL=https://api.base44.com
```

Estas variáveis são injetadas pelo Vite em tempo de build e acessadas via `import.meta.env`.

**Nunca** comitar o arquivo `.env` no repositório. Use `.env.example` como template.

## Backend (Deno Functions)

As funções Deno acessam variáveis de ambiente via `Deno.env.get("NOME")`.

### Variáveis pré-populadas (automáticas)
- `BASE44_APP_ID` — ID do app, injetado automaticamente

### Variáveis configuráveis (Dashboard → Code → Functions → Environment)

| Variável | Descrição | Obrigatória |
|---|---|---|
| `OPENAI_API_KEY` | Chave API OpenAI (se usar modelos OpenAI) | Não |
| `WHATSAPP_DEFAULT_URL` | URL padrão da instância Evolution API | Não |
| `WHATSAPP_DEFAULT_TOKEN` | Token padrão da instância | Não |

**Nota:** As credenciais do WhatsApp são preferencialmente fornecidas pelo usuário via frontend (não armazenadas em variáveis de ambiente), permitindo que cada campanha use sua própria instância.

## SDK (Cliente)

O cliente Base44 (`api/base44Client.js`) lê parâmetros da URL e localStorage:

```javascript
const appParams = {
  appId: getAppParamValue("app_id", { defaultValue: import.meta.env.VITE_BASE44_APP_ID }),
  serverUrl: getAppParamValue("server_url", { defaultValue: import.meta.env.VITE_BASE44_BACKEND_URL }),
  token: getAppParamValue("access_token", { removeFromUrl: true }),
  functionsVersion: getAppParamValue("functions_version"),
};
```

- `app_id` e `server_url`: defaults do `.env`, injetados pela plataforma na URL de preview
- `access_token`: fornecido pela plataforma após login, removido da URL automaticamente

## Plataforma Base44

A plataforma gerencia:
- Banco de dados (PostgreSQL)
- Autenticação (JWT)
- Hospedagem (CDN)
- SSL/TLS
- Funções serverless (Deno Deploy)

**Não requer** configuração de VPS, Docker, Nginx, PostgreSQL ou Redis — tudo é gerenciado pela Base44.