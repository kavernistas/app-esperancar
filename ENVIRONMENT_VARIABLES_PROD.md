# ENVIRONMENT_VARIABLES_PROD.md
# Variáveis de Ambiente — Produção

---

## OBRIGATÓRIAS

| Variável | Descrição | Exemplo | Segredo |
|----------|-----------|---------|---------|
| `DATABASE_URL` | Conexão PostgreSQL | `postgresql://user:***@postgres:5432/esperancar_db` | ✅ |
| `JWT_ACCESS_SECRET` | Secret do access token JWT | `openssl rand -hex 64` | ✅ |
| `JWT_REFRESH_SECRET` | Secret do refresh token JWT | `openssl rand -hex 64` | ✅ |
| `POSTGRES_PASSWORD` | Senha do PostgreSQL | Senha forte | ✅ |
| `POSTGRES_USER` | Usuário do PostgreSQL | `esperancar` | ❌ |
| `POSTGRES_DB` | Nome do banco | `esperancar_db` | ❌ |

---

## OPCIONAIS (com defaults)

| Variável | Default | Descrição |
|----------|---------|-----------|
| `NODE_ENV` | `production` | Ambiente Node.js |
| `PORT` | `3001` | Porta do backend |
| `CORS_ORIGIN` | `*` | Origens permitidas (restringir em prod) |
| `JWT_ACCESS_EXPIRATION` | `15m` | Validade do access token |
| `JWT_REFRESH_EXPIRATION` | `7d` | Validade do refresh token |
| `LOG_LEVEL` | `info` | Nível de log |
| `THROTTLE_TTL` | `60000` | TTL do rate limiter (ms) |
| `THROTTLE_LIMIT` | `100` | Limite de requisições por TTL |

---

## LLM (SOFIA IA)

| Variável | Default | Descrição |
|----------|---------|-----------|
| `LLM_PROVIDER` | `openai` | Provider: openai, ollama, openrouter, nvidia, hermes |
| `LLM_API_KEY` | — | API key do provider | ✅ |
| `LLM_MODEL` | `gpt-4o-mini` | Modelo a usar |
| `LLM_BASE_URL` | — | URL base customizada (Ollama, etc) |

---

## WHATSAPP (EVOLUTION API)

| Variável | Default | Descrição |
|----------|---------|-----------|
| `EVOLUTION_API_URL` | — | URL da Evolution API | ❌ |
| `EVOLUTION_API_KEY` | — | API key da Evolution | ✅ |
| `EVOLUTION_INSTANCE` | `esperancar` | Nome da instância |

---

## STORAGE

| Variável | Default | Descrição |
|----------|---------|-----------|
| `STORAGE_PROVIDER` | `local` | local, minio, s3, r2 |
| `STORAGE_LOCAL_PATH` | `./uploads` | Caminho local |

### MinIO
| Variável | Descrição |
|----------|-----------|
| `MINIO_ENDPOINT` | Host do MinIO |
| `MINIO_PORT` | Porta (9000) |
| `MINIO_ACCESS_KEY` | Access key | ✅ |
| `MINIO_SECRET_KEY` | Secret key | ✅ |
| `MINIO_BUCKET` | Nome do bucket |

### S3 / R2
| Variável | Descrição |
|----------|-----------|
| `S3_ENDPOINT` | URL do S3/R2 |
| `S3_ACCESS_KEY` | Access key | ✅ |
| `S3_SECRET_KEY` | Secret key | ✅ |
| `S3_BUCKET` | Nome do bucket |
| `S3_REGION` | Região (us-east-1) |

---

## TSE

| Variável | Default | Descrição |
|----------|---------|-----------|
| `TSE_ETL_SHARED_SECRET` | — | Segredo para receber lotes ETL | ✅ |

---

## FRONTEND (build time)

| Variável | Default | Descrição |
|----------|---------|-----------|
| `VITE_API_MODE` | `BACKEND` | BASE44 ou BACKEND |
| `VITE_API_BASE_URL` | `/api` | URL da API (relativa em prod) |

---

## REDIS

| Variável | Default | Descrição |
|----------|---------|-----------|
| `REDIS_URL` | `redis://redis:6379` | URL do Redis |

---

## NGINX

| Variável | Default | Descrição |
|----------|---------|-----------|
| `NGINX_PORT` | `80` | Porta HTTP |
| `NGINX_SSL_PORT` | `443` | Porta HTTPS |

---

## BACKUP

| Variável | Default | Descrição |
|----------|---------|-----------|
| `BACKUP_RETENTION_DAYS` | `30` | Dias de retenção |
| `BACKUP_SCHEDULE` | `0 3 * * *` | Cron schedule |
| `BACKUP_DIR` | `./backups` | Diretório de backups |

---

## GERAR SECRETS

```bash
# JWT secrets
openssl rand -hex 64  # JWT_ACCESS_SECRET
openssl rand -hex 64  # JWT_REFRESH_SECRET

# TSE ETL secret
openssl rand -hex 32  # TSE_ETL_SHARED_SECRET

# Postgres password
openssl rand -base64 24  # POSTGRES_PASSWORD
```

---

## EXEMPLO .env.production

```env
# Banco
DATABASE_URL=postgresql://esperancar:MinhaSenhaForte@postgres:5432/esperancar_db
POSTGRES_USER=esperancar
POSTGRES_PASSWORD=MinhaSenhaForte
POSTGRES_DB=esperancar_db

# Redis
REDIS_URL=redis://redis:6379

# JWT
JWT_ACCESS_SECRET=abc123...64hex
JWT_REFRESH_SECRET=def456...64hex
JWT_ACCESS_EXPIRATION=15m
JWT_REFRESH_EXPIRATION=7d

# CORS
CORS_ORIGIN=https://app.esperancar.com.br

# LLM
LLM_PROVIDER=openai
LLM_API_KEY=sk-...
LLM_MODEL=gpt-4o-mini

# WhatsApp
EVOLUTION_API_URL=https://evolution.seudominio.com.br
EVOLUTION_API_KEY=evolution_key_here
EVOLUTION_INSTANCE=esperancar

# Storage
STORAGE_PROVIDER=local

# TSE
TSE_ETL_SHARED_SECRET=ghi789...32hex

# Frontend
VITE_API_MODE=BACKEND
VITE_API_BASE_URL=/api
```
