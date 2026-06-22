# EASY_PANEL_VARIABLES.md
# Variáveis de Ambiente para EasyPanel
# Copiar e colar nas configurações de cada serviço

---

## BACKEND (esperancar-backend)

### Obrigatórias

```env
NODE_ENV=production
PORT=3001
DATABASE_URL=postgresql://esperancar:ESPERAN...n
REDIS_URL=redis://default:ESPERAN...n
POSTGRES_USER=esperancar
POSTGRES_PASSWORD=ESPERAN...n
POSTGRES_DB=esperancar_db
```

### JWT

```env
JWT_ACCESS_SECRET=eyJhbG...n
```

### CORS

```env
CORS_ORIGIN=https://esperancar.f5rg2q.easypanel.host
```

### LLM (Sofia IA)

```env
LLM_PROVIDER=openai
LLM_API_KEY=sk-......n
```

### WhatsApp (Evolution API)

```env
EVOLUTION_API_URL=https://evolution.seudominio.com.br
EVOLUTION_API_KEY=SUA-CH...n
```

### Storage

```env
STORAGE_PROVIDER=local
STORAGE_LOCAL_PATH=/app/uploads
```

### TSE

```env
TSE_ETL_SHARED_SECRET=tse_et...n
```

### Rate Limiting

```env
THROTTLE_TTL=60000
THROTTLE_LIMIT=100
```

---

## FRONTEND (esperancar-frontend)

### Build Args

```env
VITE_API_MODE=BACKEND
VITE_API_BASE_URL=/api
```

---

## POSTGRESQL (esperancar-postgres)

```env
POSTGRES_USER=esperancar
POSTGRES_PASSWORD=ESPERAN...n
```

---

## REDIS (esperancar-redis)

```env
REDIS_PASSWORD=ESPERAN...n
```

---

## GERAR SECRETS

Execute na VPS para gerar os secrets:

```bash
# JWT Access Secret (64 hex chars)
openssl rand -hex 64

# JWT Refresh Secret (64 hex chars)
openssl rand -hex 64

# TSE ETL Shared Secret (32 hex chars)
openssl rand -hex 32

# PostgreSQL Password (16 chars)
openssl rand -base64 16

# Redis Password (16 chars)
openssl rand -base64 16
```

---

## CONFIGURAÇÃO DE DOMÍNIO NO EASYPANEL

### Frontend (esperancar-frontend)

1. Ir para o app `esperancar-frontend`
2. Seção **Domains**
3. **Add Domain:**
   - **Domain:** `esperancar.f5rg2q.easypanel.host`
   - **Port:** 3000
   - **HTTPS:** ✅ Enable
4. Salvar

### Proxy para API

1. Ir para o app `esperancar-frontend`
2. Seção **Proxy** (ou **Advanced** → **Nginx Config**)
3. Adicionar:

```nginx
location /api {
    proxy_pass http://esperancar-backend:3001;
    proxy_http_version 1.1;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection 'upgrade';
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
    proxy_cache_bypass $http_upgrade;
    proxy_connect_timeout 30s;
    proxy_send_timeout 60s;
    proxy_read_timeout 60s;
}

location / {
    try_files $uri $uri/ /index.html;
}
```

4. Salvar

---

## HEALTHCHECK CONFIGURAÇÃO

### Backend

- **Type:** HTTP
- **Path:** `/api/v1/health`
- **Port:** 3001
- **Interval:** 30s
- **Timeout:** 10s
- **Retries:** 5
- **Start Period:** 30s

### Frontend

- **Type:** HTTP
- **Path:** `/`
- **Port:** 3000
- **Interval:** 30s
- **Timeout:** 10s
- **Retries:** 3

---

## VOLUMES

### Backend

| Mount Path | Size | Descrição |
|------------|------|-----------|
| `/app/uploads` | 5GB | Arquivos upload |
| `/app/logs` | 2GB | Logs da aplicação |

---

## PORTAS INTERNAS

| Serviço | Porta |
|---------|-------|
| Backend | 3001 |
| Frontend | 3000 |
| PostgreSQL | 5432 |
| Redis | 6379 |

---

## URLs FINAIS

| Serviço | URL |
|---------|-----|
| Frontend | `https://esperancar.f5rg2q.easypanel.host` |
| API | `https://esperancar.f5rg2q.easypanel.host/api` |
| Swagger | `https://esperancar.f5rg2q.easypanel.host/api/docs` |
| Health | `https://esperancar.f5rg2q.easypanel.host/api/v1/health` |
