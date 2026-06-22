# EASYPANEL_DEPLOY.md
# Guia de Deploy — EasyPanel na VPS
# Plataforma Politica Esperancar v1.0.0
# VPS: root@69.62.67.78

---

## 1. PRÉ-REQUISITOS

### 1.1 VPS
```
IP: 69.62.67.78
SSH: ssh root@69.62.67.78
Senha: /iGRb9n/nZ&F99i
```

### 1.2 EasyPanel instalado
```bash
# Verificar se EasyPanel está instalado
docker ps | grep easypanel

# Se não estiver, instalar:
curl -sSL https://get.easypanel.io | sh
```

### 1.3 Domínio
```
Domínio principal: appjuridico.f5rg2q.easypanel.host (existente)
Novo domínio sugerido: app.esperancar.com.br
```

---

## 2. ESTRUTURA DE SERVIÇOS NO EASYPANEL

O EasyPanel gerencia containers via interface web. Vamos criar **3 serviços**:

| Serviço | Tipo | Porta | Descrição |
|---------|------|-------|-----------|
| **esperancar-frontend** | App (Static) | 3000 | React build |
| **esperancar-backend** | App (Node.js) | 3001 | NestJS API |
| **esperancar-postgres** | Database | 5432 | PostgreSQL 16 |
| **esperancar-redis** | Database | 6379 | Redis 7 |

---

## 3. ORDEM DE DEPLOY

### Passo 1: Criar banco PostgreSQL

1. Acessar EasyPanel → **Databases** → **Create Database**
2. Configurar:
   - **Name:** `esperancar-postgres`
   - **Type:** PostgreSQL
   - **Version:** 16
   - **Database:** `esperancar_db`
   - **User:** `esperancar`
   - **Password:** `Gerar senha forte`
3. Salvar senha em local seguro

### Passo 2: Criar banco Redis

1. EasyPanel → **Databases** → **Create Database**
2. Configurar:
   - **Name:** `esperancar-redis`
   - **Type:** Redis
   - **Version:** 7
   - **Password:** `Gerar senha forte`
3. Salvar senha

### Passo 3: Criar serviço Backend

1. EasyPanel → **Apps** → **Create App**
2. Configurar:
   - **Name:** `esperancar-backend`
   - **Source:** GitHub
   - **Repository:** `kavernistas/app-esperancar`
   - **Branch:** `main`
   - **Build Pack:** Node.js
   - **Dockerfile Path:** `backend/Dockerfile`

3. **Configurar variáveis de ambiente** (seção Environment):

```env
NODE_ENV=production
PORT=3001

# Database (usar IP interno do EasyPanel)
DATABASE_URL=postgresql://esperancar:SENHA_DO_BANCO@esperancar-postgres:5432/esperancar_db?schema=public

# Redis
REDIS_URL=redis://default:SENHA_DO_REDIS@esperancar-redis:6379

# JWT — GERAR NOVOS SECRETS
JWT_ACCESS_SECRET=GERAR_COM_openssl_rand_-hex_64
JWT_REFRESH_SECRET=GERAR_COM_openssl_rand_-hex_64
JWT_ACCESS_EXPIRATION=15m
JWT_REFRESH_EXPIRATION=7d

# CORS
CORS_ORIGIN=https://app.esperancar.com.br

# LLM (Sofia IA)
LLM_PROVIDER=openai
LLM_API_KEY=sk-...sua-chave
LLM_MODEL=gpt-4o-mini
LLM_BASE_URL=

# WhatsApp (Evolution API)
EVOLUTION_API_URL=https://evolution.seudominio.com.br
EVOLUTION_API_KEY=sua-chave-evolution
EVOLUTION_INSTANCE=esperancar

# Storage
STORAGE_PROVIDER=local
STORAGE_LOCAL_PATH=/app/uploads

# TSE
TSE_ETL_SHARED_SECRET=GERAR_COM_openssl_rand_-hex_32
```

4. **Configurar Healthcheck:**
   - **Path:** `/api/v1/health`
   - **Port:** 3001
   - **Interval:** 30s
   - **Timeout:** 10s
   - **Retries:** 5

5. **Configurar Volume:**
   - **Mount Path:** `/app/uploads`
   - **Size:** 5GB

6. **Deploy**

### Passo 4: Executar Migrations e Seed

Após o backend subir:

```bash
# Acessar container do backend
docker exec -it esperancar-backend sh

# Executar migrations
npx prisma migrate deploy

# Executar seed (cria admin user)
npm run prisma:seed

# Sair
exit
```

### Passo 5: Criar serviço Frontend

1. EasyPanel → **Apps** → **Create App**
2. Configurar:
   - **Name:** `esperancar-frontend`
   - **Source:** GitHub
   - **Repository:** `kavernistas/app-esperancar`
   - **Branch:** `main`
   - **Build Pack:** Static (ou Node.js com Dockerfile)
   - **Dockerfile Path:** `frontend/Dockerfile`

3. **Configurar variáveis de build:**

```env
VITE_API_MODE=BACKEND
VITE_API_BASE_URL=/api
```

4. **Configurar proxy reverso** (se EasyPanel suportar):
   - **Source Path:** `/`
   - **Destination:** `esperancar-frontend:3000`

### Passo 6: Configurar Proxy Reverso (Nginx)

No EasyPanel, configurar o domínio principal para rotear:

```
/app.esperancar.com.br/* → esperancar-frontend:3000
/app.esperancar.com.br/api/* → esperancar-backend:3001
```

---

## 4. VARIÁVEIS DE AMBIENTE COMPLETAS

### 4.1 Backend (esperancar-backend)

```env
# =============================================
# OBRIGATÓRIAS
# =============================================
NODE_ENV=production
PORT=3001

# Database
DATABASE_URL=postgresql://esperancar:***@esperancar-postgres:5432/esperancar_db?schema=public

# Redis
REDIS_URL=redis://default:***@esperancar-redis:6379

# JWT
JWT_ACCESS_SECRET=...n
# =============================================
# CORS
# =============================================
CORS_ORIGIN=https://app.esperancar.com.br

# =============================================
# LLM — SOFIA IA
# =============================================
LLM_PROVIDER=openai
LLM_API_KEY=sk-......n
# =============================================
# WHATSAPP — EVOLUTION API
# =============================================
EVOLUTION_API_URL=https://evolution.seudominio.com.br
EVOLUTION_API_KEY=ALTERE...n
# =============================================
# STORAGE
# =============================================
STORAGE_PROVIDER=local
STORAGE_LOCAL_PATH=/app/uploads

# =============================================
# TSE
# =============================================
TSE_ETL_SHARED_SECRET=ALTERE...n
# =============================================
# RATE LIMITING
# =============================================
THROTTLE_TTL=60000
THROTTLE_LIMIT=100
```

### 4.2 Frontend (esperancar-frontend)

```env
VITE_API_MODE=BACKEND
VITE_API_BASE_URL=/api
```

### 4.3 PostgreSQL (esperancar-postgres)

```env
POSTGRES_USER=esperancar
POSTGRES_PASSWORD=ALTERE...n
POSTGRES_DB=esperancar_db
```

### 4.4 Redis (esperancar-redis)

```env
REDIS_PASSWORD=ALTERE...n
```

---

## 5. PORTAS UTILIZADAS

| Serviço | Porta Interna | Porta Externa | Protocolo |
|---------|--------------|---------------|-----------|
| Frontend | 3000 | 80/443 | HTTP/HTTPS |
| Backend | 3001 | 80/443 (via /api) | HTTP |
| PostgreSQL | 5432 | 5432 (interno) | TCP |
| Redis | 6379 | 6379 (interno) | TCP |

---

## 6. VOLUMES PERSISTENTES

| Volume | Serviço | Mount | Tamanho |
|--------|---------|-------|---------|
| `postgres_data` | esperancar-postgres | `/var/lib/postgresql/data` | 10GB |
| `redis_data` | esperancar-redis | `/data` | 1GB |
| `backend_uploads` | esperancar-backend | `/app/uploads` | 5GB |
| `backend_logs` | esperancar-backend | `/app/logs` | 2GB |

---

## 7. HEALTHCHECKS

### 7.1 Backend
```bash
# Endpoint
GET /api/v1/health

# Resposta esperada
{"status":"ok","timestamp":"2026-06-22T..."}

# Configuração no EasyPanel
Path: /api/v1/health
Port: 3001
Interval: 30s
Timeout: 10s
Retries: 5
```

### 7.2 PostgreSQL
```bash
# Comando
pg_isready -U esperancar -d esperancar_db

# Configuração no EasyPanel
Type: TCP
Port: 5432
Interval: 15s
Timeout: 5s
Retries: 5
```

### 7.3 Redis
```bash
# Comando
redis-cli -a SENHA ping

# Configuração no EasyPanel
Type: TCP
Port: 6379
Interval: 15s
Timeout: 5s
Retries: 3
```

---

## 8. CONFIGURAÇÃO DE DOMÍNIO

### 8.1 DNS
```
Tipo: A
Nome: app.esperancar.com.br
Valor: 69.62.67.78
TTL: 300
```

### 8.2 EasyPanel — Adicionar Domínio

1. Ir para o serviço `esperancar-frontend`
2. Seção **Domains** → **Add Domain**
3. **Domain:** `app.esperancar.com.br`
4. **Port:** 3000
5. **HTTPS:** Enable (Let's Encrypt)
6. Salvar

### 8.3 Configurar Proxy para API

1. Ir para o serviço `esperancar-frontend`
2. Seção **Proxy** → **Add Proxy**
3. **Source Path:** `/api`
4. **Destination:** `http://esperancar-backend:3001`
5. Salvar

---

## 9. SSL/HTTPS

### 9.1 Via EasyPanel (automático)

1. Ao adicionar domínio com HTTPS habilitado, EasyPanel solicita certificado Let's Encrypt automaticamente
2. Renovação automática a cada 90 dias

### 9.2 Manual (se necessário)

```bash
# Acessar VPS
ssh root@69.62.67.78

# Instalar certbot
apt install certbot -y

# Obter certificado
certbot certonly --standalone -d app.esperancar.com.br

# Copiar para EasyPanel (se necessário)
cp /etc/letsencrypt/live/app.esperancar.com.br/fullchain.pem /opt/easypanel/ssl/
cp /etc/letsencrypt/live/app.esperancar.com.br/privkey.pem /opt/easypanel/ssl/
```

---

## 10. CHECKLIST PÓS-DEPLOY

### 10.1 Verificar serviços
```bash
# Listar containers
docker ps

# Ver logs do backend
docker logs esperancar-backend --tail 50

# Ver logs do frontend
docker logs esperancar-frontend --tail 50

# Ver logs do postgres
docker logs esperancar-postgres --tail 20
```

### 10.2 Testar health
```bash
# Backend
curl https://app.esperancar.com.br/api/v1/health

# Frontend
curl -I https://app.esperancar.com.br/

# Swagger
curl https://app.esperancar.com.br/api/docs
```

### 10.3 Testar login
```bash
curl -X POST https://app.esperancar.com.br/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@esperancar.app","password":"Admin@2026"}'
```

### 10.4 Verificar CRUD
```bash
# Obter token
TOKEN=$(curl -s -X POST https://app.esperancar.com.br/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@esperancar.app","password":"Admin@2026"}' | jq -r '.data.accessToken')

# Listar contatos
curl -s https://app.esperancar.com.br/api/v1/contacts \
  -H "Authorization: Bearer $TOKEN" | jq .

# Criar contato
curl -X POST https://app.esperancar.com.br/api/v1/contacts \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"full_name":"Teste Deploy","phone":"11999999999"}'
```

---

## 11. BACKUP E RESTORE

### 11.1 Backup automático (cron na VPS)

```bash
# Editar crontab
crontab -e

# Backup diário às 3h
0 3 * * * docker exec esperancar-postgres pg_dump -U esperancar esperancar_db | gzip > /opt/backups/esperancar_$(date +\%Y\%m\%d_\%H\%M\%S).sql.gz

# Manter apenas últimos 30 dias
0 4 * * * find /opt/backups -name "esperancar_*.sql.gz" -mtime +30 -delete
```

### 11.2 Restore

```bash
# Restaurar banco
gunzip < /opt/backups/esperancar_20260622_030000.sql.gz | \
  docker exec -i esperancar-postgres psql -U esperancar -d esperancar_db
```

---

## 12. TROUBLESHOOTING

### Container não sobe
```bash
docker logs esperancar-backend
docker logs esperancar-frontend
docker compose -f /opt/easypanel/docker-compose.yml ps
```

### Banco não conecta
```bash
docker exec -it esperancar-postgres pg_isready -U esperancar
docker exec esperancar-backend npx prisma migrate status
```

### Migration falha
```bash
docker exec -it esperancar-backend npx prisma migrate resolve --applied <migration_name>
docker exec -it esperancar-backend npx prisma migrate deploy
```

### Disco cheio
```bash
docker system prune -a
docker volume prune
```

---

## 13. CONTATOS

- **VPS:** root@69.62.67.78
- **Senha SSH:** /iGRb9n/nZ&F99i
- **Admin:** admin@esperancar.app / Admin@2026
- **Domínio:** app.esperancar.com.br (a configurar)
- **API:** https://app.esperancar.com.br/api
- **Swagger:** https://app.esperancar.com.br/api/docs
