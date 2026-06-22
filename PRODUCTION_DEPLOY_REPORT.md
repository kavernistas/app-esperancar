# PRODUCTION DEPLOY REPORT
## Plataforma Politica Esperancar

**Versao:** 1.0.0
**Data:** 2026-06-22
**Automação:** Hermes Agent (OWL)
**Stack:** React 18 + Vite | NestJS | PostgreSQL 16 | Redis 7 | Nginx 1.25 | Docker Compose 3.9

---

## 1. Visao Geral da Arquitetura

A Plataforma Esperancar e uma aplicacao web full-stack containerizada com Docker Compose.
O trafego entra via Nginx (reverse proxy), que serve o frontend (SPA React) e repassa
requisicoes de API para o backend (NestJS). O backend se conecta ao PostgreSQL (dados)
e Redis (cache/sessoes). Toda comunicacao entre containers ocorre em redes Docker isoladas.

### Componentes

| Servico    | Imagem Base          | Papel                          | Rede            |
|------------|----------------------|--------------------------------|-----------------|
| nginx      | nginx:1.25-alpine    | Reverse proxy, static files    | frontend_net    |
| frontend   | node:20-alpine       | Build React SPA (Vite)         | frontend_net    |
| backend    | node:20-alpine       | API REST (NestJS)              | backend_net     |
| postgres   | postgres:16-alpine   | Banco de dados relacional      | backend_net     |
| redis      | redis:7-alpine       | Cache, sessoes, rate limiting  | backend_net     |

---

## 2. Diagrama de Servicos

```
                                    ┌─────────────────────────────────────────────┐
                                    │              HOST (Producao)                │
                                    │                                             │
  Usuarios                          │  ┌───────────────────────────────────────┐  │
     │                              │  │         frontend_net (bridge)         │  │
     │                              │  │                                       │  │
     ▼                              │  │  ┌─────────┐       ┌─────────────┐   │  │
 ┌───────┐  HTTP/HTTPS             │  │  │  NGINX  │──────▶│  FRONTEND   │   │  │
 │       │  :80 / :443             │  │  │  :80    │       │  (dist/)    │   │  │
 │ Users │──────────────────────────▶  │  │  :443   │       └─────────────┘   │  │
 │       │                          │  │  └────┬────┘                         │  │
 └───────┘                          │  │       │ /api/*                       │  │
                                    │  │       ▼                              │  │
                                    │  │  ┌────────────────────────────────┐  │  │
                                    │  │  │       backend_net (bridge)     │  │  │
                                    │  │  │                                │  │  │
                                    │  │  │  ┌──────────┐  ┌───────────┐  │  │  │
                                    │  │  │  │ BACKEND  │─▶│ POSTGRES  │  │  │  │
                                    │  │  │  │  :3001   │  │   :5432   │  │  │  │
                                    │  │  │  └────┬─────┘  └───────────┘  │  │  │
                                    │  │  │       │                        │  │  │
                                    │  │  │       ▼                        │  │  │
                                    │  │  │  ┌──────────┐                 │  │  │
                                    │  │  │  │  REDIS   │                 │  │  │
                                    │  │  │  │  :6379   │                 │  │  │
                                    │  │  │  └──────────┘                 │  │  │
                                    │  │  └────────────────────────────────┘  │  │
                                    │  └───────────────────────────────────────┘  │
                                    └─────────────────────────────────────────────┘

  Legenda:
  ────▶  Fluxo de requisicao (HTTP/TCP)
  │      Comunicacao interna entre containers
  :80    Porta exposta no host
```

### Fluxo de Requisicao

1. **Usuario** acessa `http://app.esperancar.com.br`
2. **Nginx** (porta 80/443) recebe a requisicao
3. Se caminho comeca com `/api/` -> **proxy** para `backend:3001`
4. Qualquer outro caminho -> serve **frontend** (SPA React com fallback para index.html)
5. **Backend** processa, consulta **PostgreSQL** e/ou **Redis**, retorna JSON
6. **Nginx** retorna resposta ao usuario

---

## 3. Portas

### Portas Expostas no Host

| Porta | Servico | Protocolo | Exposicao | Descricao                    |
|-------|---------|-----------|-----------|------------------------------|
| 80    | nginx   | TCP       | Publica   | HTTP (redirect para HTTPS)   |
| 443   | nginx   | TCP       | Publica   | HTTPS (SSL/TLS)              |

### Portas Internas (entre containers)

| Porta | Servico  | Protocolo | Rede         | Descricao              |
|-------|----------|-----------|--------------|------------------------|
| 3001  | backend  | TCP       | backend_net  | API NestJS             |
| 5432  | postgres | TCP       | backend_net  | PostgreSQL             |
| 6379  | redis    | TCP       | backend_net  | Redis                  |

### Portas Nao Expostas (apenas internas)

As portas 3001, 5432 e 6379 **NAO** sao publicadas no host. A comunicacao entre
nginx e backend ocorre via rede `frontend_net` -> `backend_net` (o nginx tem acesso
as duas redes).

---

## 4. Volumes Persistentes

| Volume Docker          | Mount no Container       | Descricao                          | Tamanho Estimado |
|------------------------|--------------------------|------------------------------------|------------------|
| `postgres_data`        | `/var/lib/postgresql/data` | Dados do PostgreSQL (tabelas, WAL) | 1-10 GB          |
| `redis_data`           | `/data`                    | Snapshot RDB do Redis              | 100-500 MB       |
| `backend_uploads`      | `/app/uploads`             | Arquivos enviados pelos usuarios   | 1-50 GB          |
| `backend_logs`         | `/app/logs`                | Logs da aplicacao NestJS           | 100 MB - 1 GB    |
| `frontend_dist`        | `/var/www/frontend`        | Build estatico do React (Vite)     | 5-50 MB          |
| `nginx_logs`           | `/var/log/nginx`           | Access e error logs do Nginx       | 100 MB - 5 GB    |

### Comando para listar volumes

```bash
docker volume ls --filter name=esperancar
```

### Comando para inspecionar uso de disco

```bash
docker system df -v | grep -E "(esperancar|postgres_data|redis_data|backend_uploads|backend_logs|frontend_dist|nginx_logs)"
```

---

## 5. Networks

### Redes Docker

| Nome           | Driver  | Descricao                                      | Subnet Sugerida   |
|----------------|---------|------------------------------------------------|-------------------|
| `frontend_net` | bridge  | Comunicacao Nginx <-> Frontend                 | 172.20.0.0/24     |
| `backend_net`  | bridge  | Comunicacao Backend <-> PostgreSQL <-> Redis   | 172.20.1.0/24     |

### Topologia de Redes por Container

```
nginx      -> frontend_net, backend_net  (dual-homed, faz ponte)
frontend   -> frontend_net               (apenas recebe do nginx)
backend    -> backend_net                (comunica com postgres e redis)
postgres   -> backend_net                (apenas recebe do backend)
redis      -> backend_net                (apenas recebe do backend)
```

### Isolamento de Rede

- O PostgreSQL e o Redis **NAO** sao acessiveis diretamente pelo host nem pela rede frontend.
- Apenas o backend tem acesso a ambos (postgres + redis).
- O Nginx atua como unico ponto de entrada publico e tem visao das duas redes.

### Comando para inspecionar redes

```bash
docker network inspect esperancar_frontend_net
docker network inspect esperancar_backend_net
```

---

## 6. Healthchecks

### Configuracao por Servico

#### Nginx
```dockerfile
HEALTHCHECK --interval=30s --timeout=10s --retries=3 \
  CMD curl -f http://localhost:80/health || exit 1
```
- **Endpoint:** `GET /health` (configurado no nginx.conf)
- **Resposta esperada:** `{"status":"ok","timestamp":"..."}` (HTTP 200)
- **Intervalo:** 30 segundos
- **Timeout:** 10 segundos
- **Retries:** 3 (90s para marcar unhealthy)

#### Backend (NestJS)
```dockerfile
HEALTHCHECK --interval=30s --timeout=10s --start-period=30s --retries=5 \
  CMD curl -f http://localhost:3001/api/v1/health || exit 1
```
- **Endpoint:** `GET /api/v1/health` (deve ser implementado no NestJS)
- **Intervalo:** 30 segundos
- **Timeout:** 10 segundos
- **Start Period:** 30 segundos (tempo para startup do Node.js + Prisma)
- **Retries:** 5 (150s para marcar unhealthy)

#### PostgreSQL
```yaml
healthcheck:
  test: ["CMD-SHELL", "pg_isready -U ${POSTGRES_USER} -d ${POSTGRES_DB}"]
  interval: 30s
  timeout: 10s
  retries: 5
  start_period: 40s
```
- **Verifica:** Conexao ativa com `pg_isready`
- **Start Period:** 40s (tempo para inicializacao do banco)

#### Redis
```yaml
healthcheck:
  test: ["CMD", "redis-cli", "ping"]
  interval: 30s
  timeout: 10s
  retries: 3
```
- **Verifica:** `PING` -> `PONG`

### Comando para verificar status

```bash
docker compose ps
# ou individual:
docker inspect --format='{{.State.Health.Status}}' esperancar-backend-1
docker inspect --format='{{.State.Health.Status}}' esperancar-postgres-1
docker inspect --format='{{.State.Health.Status}}' esperancar-redis-1
docker inspect --format='{{.State.Health.Status}}' esperancar-nginx-1
```

---

## 7. Restart Policies

| Servico  | Policy        | Descricao                                        |
|----------|---------------|--------------------------------------------------|
| nginx    | `unless-stopped` | Reinicia sempre, exceto se parado manualmente |
| backend  | `unless-stopped` | Reinicia sempre, exceto se parado manualmente |
| postgres | `unless-stopped` | Reinicia sempre, exceto se parado manualmente |
| redis    | `unless-stopped` | Reinicia sempre, exceto se parado manualmente |
| frontend | `no`              | Nao reinicia (build one-shot, serve via volume) |

### Comando para verificar restart count

```bash
docker inspect --format='{{.RestartCount}} {{.Name}}' \
  esperancar-nginx-1 esperancar-backend-1 esperancar-postgres-1 esperancar-redis-1
```

---

## 8. Resource Limits

### Limites Recomendados por Servico

```yaml
services:
  nginx:
    deploy:
      resources:
        limits:
          cpus: "0.50"
          memory: 256M
        reservations:
          cpus: "0.25"
          memory: 128M

  backend:
    deploy:
      resources:
        limits:
          cpus: "1.00"
          memory: 512M
        reservations:
          cpus: "0.50"
          memory: 256M

  postgres:
    deploy:
      resources:
        limits:
          cpus: "2.00"
          memory: 1G
        reservations:
          cpus: "1.00"
          memory: 512M

  redis:
    deploy:
      resources:
        limits:
          cpus: "0.50"
          memory: 256M
        reservations:
          cpus: "0.25"
          memory: 128M
```

### Notas sobre Recursos

- **PostgreSQL** e o servico mais critico em recursos. Ajustar `shared_buffers`,
  `effective_cache_size` e `work_mem` conforme RAM disponivel.
- **Backend** pode precisar de mais CPU em picos de requisicoes. Monitorar e ajustar.
- **Redis** opera bem com pouca memoria para cache/sessoes. Configurar `maxmemory` no redis.conf.
- **Nginx** e leve. Os limites acima sao conservadores.

### Comando para monitorar uso em tempo real

```bash
docker stats esperancar-nginx-1 esperancar-backend-1 esperancar-postgres-1 esperancar-redis-1
```

---

## 9. Variaveis de Ambiente

### Backend (.env)

| Variavel                | Obrigatoria | Exemplo                          | Descricao                          |
|-------------------------|-------------|----------------------------------|------------------------------------|
| `NODE_ENV`              | Sim         | `production`                     | Ambiente de execucao               |
| `PORT`                  | Sim         | `3001`                           | Porta do servidor NestJS           |
| `DATABASE_URL`          | Sim         | `postgresql://user:pass@host:5432/db` | URL de conexao PostgreSQL    |
| `POSTGRES_USER`         | Sim         | `esperancar_user`                | Usuario do banco                   |
| `POSTGRES_PASSWORD`     | Sim         | `********`                       | Senha do banco (SECRETA)           |
| `POSTGRES_DB`           | Sim         | `esperancar_db`                  | Nome do banco                      |
| `POSTGRES_HOST`         | Sim         | `postgres`                       | Host do banco (nome do servico)    |
| `POSTGRES_PORT`         | Sim         | `5432`                           | Porta do banco                     |
| `REDIS_HOST`            | Sim         | `redis`                          | Host Redis (nome do servico)       |
| `REDIS_PORT`            | Sim         | `6379`                           | Porta Redis                        |
| `REDIS_PASSWORD`        | Nao         | `********`                       | Senha Redis (recomendado)          |
| `JWT_SECRET`            | Sim         | `********`                       | Chave secreta JWT (SECRETA)        |
| `JWT_EXPIRATION`        | Nao         | `7d`                             | Expiracao do token JWT             |
| `CORS_ORIGIN`           | Nao         | `https://app.esperancar.com.br`  | Origem permitida para CORS         |
| `UPLOAD_DIR`            | Nao         | `/app/uploads`                   | Diretorio de uploads               |
| `LOG_LEVEL`             | Nao         | `info`                           | Nivel de log (debug/info/warn/error) |
| `API_PREFIX`            | Nao         | `api/v1`                         | Prefixo da API                     |

### Frontend (Build-time ARGs)

| Variavel            | Obrigatoria | Exemplo        | Descricao                    |
|---------------------|-------------|----------------|------------------------------|
| `VITE_API_MODE`     | Sim         | `BACKEND`      | Modo da API (BACKEND/MOCK)   |
| `VITE_API_BASE_URL` | Sim         | `/api`         | URL base da API              |

### Nginx

| Variavel         | Obrigatoria | Exemplo              | Descricao                    |
|------------------|-------------|----------------------|------------------------------|
| `NGINX_HOST`     | Nao         | `app.esperancar.com.br` | Hostname do servidor      |
| `NGINX_PORT`     | Nao         | `80`                 | Porta do servidor            |

### PostgreSQL

| Variavel            | Obrigatoria | Exemplo            | Descricao                  |
|---------------------|-------------|--------------------|----------------------------|
| `POSTGRES_USER`     | Sim         | `esperancar_user`  | Usuario administrador      |
| `POSTGRES_PASSWORD` | Sim         | `********`         | Senha (SECRETA)            |
| `POSTGRES_DB`       | Sim         | `esperancar_db`    | Banco de dados inicial     |

### Redis

| Variavel         | Obrigatoria | Exemplo  | Descricao              |
|------------------|-------------|----------|------------------------|
| `REDIS_PASSWORD` | Nao         | `********` | Senha de autenticacao |

### Gestao de Segredos

**IMPORTANTE:** Nunca commitar arquivos `.env` com valores reais no repositorio.

```bash
# Gerar JWT_SECRET seguro
openssl rand -hex 32

# Gerar senha PostgreSQL segura
openssl rand -base64 24

# Gerar senha Redis segura
openssl rand -hex 16
```

Em producao, considerar usar:
- Docker Secrets (com Swarm)
- HashiCorp Vault
- AWS Secrets Manager / Parameter Store
- Arquivo `.env` com permissoes restritas (`chmod 600`)

---

## 10. Procedimento de Deploy

### Pre-requisitos

```bash
# Verificar versoes minimas
docker --version          # >= 20.10
docker compose version    # >= 2.0
```

### 10.1. Deploy Inicial (Primeira vez)

```bash
# 1. Clonar o repositorio
git clone <repo-url> /root/app-esperancar
cd /root/app-esperancar

# 2. Criar arquivo .env a partir do exemplo
cp backend/.env.example backend/.env
# Editar com valores de producao
nano backend/.env

# 3. Criar diretorios de upload e logs
mkdir -p backend/uploads backend/logs

# 4. Build de todas as imagens
docker compose build --no-cache

# 5. Subir servicos em ordem de dependencia
docker compose up -d postgres redis
# Aguardar healthy
docker compose ps

# 6. Rodar migracoes do banco
docker compose exec backend npx prisma migrate deploy

# 7. Subir backend
docker compose up -d backend
# Aguardar healthy
docker compose ps

# 8. Build do frontend
docker compose build frontend

# 9. Subir nginx
docker compose up -d nginx

# 10. Verificar todos os servicos
docker compose ps
docker compose logs --tail=50
```

### 10.2. Deploy de Atualizacoes (Rolling Update)

```bash
# 1. Puxar ultimas alteracoes
git pull origin main

# 2. Build das imagens atualizadas
docker compose build backend frontend

# 3. Parar e recriar backend (zero-downtime com nginx retry)
docker compose up -d --no-deps backend

# 4. Aguardar healthcheck passar
docker compose ps backend
# Repetir ate Status: healthy

# 5. Build e atualizar frontend
docker compose build frontend
docker compose up -d --no-deps nginx

# 6. Verificar tudo
docker compose ps
curl -f http://localhost/health
curl -f http://localhost/api/v1/health

# 7. Limpar imagens antigas
docker image prune -f
```

### 10.3. Deploy com Migracoes de Banco

```bash
# 1. Backup antes de migrar (ver secao 14)
./scripts/backup.sh

# 2. Build e deploy
git pull origin main
docker compose build backend
docker compose up -d --no-deps backend

# 3. Aguardar backend healthy
docker compose ps backend

# 4. Executar migracoes
docker compose exec backend npx prisma migrate deploy

# 5. Verificar
docker compose logs backend --tail=30
```

### 10.4. Checklist Pos-Deploy

```bash
# Todos os containers rodando
docker compose ps
# Esperado: 5/5 running, todos healthy

# Health check do nginx
curl -f http://localhost/health
# Esperado: {"status":"ok",...}

# Health check do backend
curl -f http://localhost/api/v1/health
# Esperado: 200 OK

# Frontend carregando
curl -f -o /dev/null -w "%{http_code}" http://localhost/
# Esperado: 200

# API respondendo
curl -f http://localhost/api/v1/
# Esperado: JSON valido

# Logs sem erros criticos
docker compose logs --since=5m | grep -iE "(error|fatal|crash)" || echo "Sem erros"
```

---

## 11. Procedimento de Rollback

### 11.1. Rollback Rapido (Reverter para versao anterior)

```bash
# 1. Identificar versao anterior
git log --oneline -10

# 2. Reverter codigo
git revert HEAD
# OU para um commit especifico:
git checkout <commit-hash>

# 3. Rebuild e redeploy
docker compose build backend frontend
docker compose up -d --no-deps backend nginx

# 4. Verificar
docker compose ps
curl -f http://localhost/health
curl -f http://localhost/api/v1/health
```

### 11.2. Rollback de Imagem Docker (tag-based)

```bash
# Se usar tags versionadas no registry:
docker compose pull backend:1.0.0
docker compose up -d --no-deps backend
```

### 11.3. Rollback de Migracao de Banco

```bash
# 1. Ver status das migracoes
docker compose exec backend npx prisma migrate status

# 2. Reverter ultima migracao
docker compose exec backend npx prisma migrate resolve --rolled-back "<migration_name>"

# 3. Restaurar backup se necessario (ver secao 14)
./scripts/restore.sh /path/to/backup.sql.gz
```

### 11.4. Rollback de Emergencia (tudo parado)

```bash
# Parar tudo
docker compose down

# Reverter codigo
git checkout <stable-tag>

# Rebuild completo
docker compose build --no-cache

# Subir tudo
docker compose up -d

# Verificar
docker compose ps
```

### 11.5. Rollback Checklist

```bash
# Verificar que rollback foi bem sucedido
docker compose ps                    # Todos running + healthy
curl -f http://localhost/health      # Nginx OK
curl -f http://localhost/api/v1/health  # Backend OK
docker compose logs --since=2m | grep -iE "(error|fatal)" || echo "Limpo"
```

---

## 12. Monitoramento e Logs

### 12.1. Logs em Tempo Real

```bash
# Todos os servicos
docker compose logs -f

# Servico especifico
docker compose logs -f backend
docker compose logs -f nginx
docker compose logs -f postgres

# Ultimas N linhas
docker compose logs --tail=100 backend

# Com timestamp
docker compose logs -f --timestamps backend

# Desde um tempo especifico
docker compose logs --since=1h backend
docker compose logs --since="2026-06-22T10:00:00" backend
```

### 12.2. Logs no Sistema de Arquivos

| Arquivo                          | Localizacao                          | Rotacao        |
|----------------------------------|--------------------------------------|----------------|
| Nginx access log                 | `nginx_logs:/var/log/nginx/access.log` | Configurar logrotate |
| Nginx error log                  | `nginx_logs:/var/log/nginx/error.log`  | Configurar logrotate |
| Backend app logs                 | `backend_logs:/app/logs/`              | Configurar no app |
| PostgreSQL logs                  | `postgres_data:/var/log/postgresql/`   | WAL rotation   |

### 123. Metricas de Container

```bash
# Uso de recursos em tempo real
docker stats

# Uso de disco
docker system df -v

# Inspect de um container
docker inspect esperancar-backend-1 | jq '.[0].State'
docker inspect esperancar-backend-1 | jq '.[0].HostConfig.Resources'
```

### 12.4. Health Check Endpoints

| Endpoint                          | Container | Descricao                    |
|-----------------------------------|-----------|------------------------------|
| `GET http://localhost/health`     | nginx     | Health do proxy              |
| `GET http://localhost/api/v1/health` | backend | Health da API + dependencias |

### 12.5. Alertas Recomendados

Configurar alertas para:
- Container status != `healthy` por > 2 minutos
- Restart count > 3 em 1 hora
- Uso de CPU > 80% por > 5 minutos
- Uso de memoria > 85% por > 5 minutos
- Disco > 80% em qualquer volume
- HTTP 5xx rate > 1% no nginx
- Response time > 2s (p95)

### 12.6. Integracao com Ferramentas de Monitoramento

```yaml
# Exemplo: docker-compose.monitoring.yml (overlay)
# Prometheus + Grafana + cAdvisor + Loki

# cAdvisor para metricas de container
# Prometheus para coleta de metricas
# Grafana para dashboards
# Loki + Promtail para agregacao de logs
# Alertmanager para notificacoes
```

---

## 13. Seguranca

### 13.1. Headers de Seguranca (Nginx)

Os seguintes headers estao configurados no `nginx.conf`:

| Header                          | Valor                                      | Protecao                    |
|---------------------------------|--------------------------------------------|-----------------------------|
| `X-Frame-Options`               | `SAMEORIGIN`                               | Clickjacking                |
| `X-Content-Type-Options`        | `nosniff`                                  | MIME sniffing               |
| `X-XSS-Protection`              | `1; mode=block`                            | XSS (legacy browsers)       |
| `Referrer-Policy`               | `strict-origin-when-cross-origin`          | Vazamento de referrer       |
| `Permissions-Policy`            | `camera=(), microphone=(), geolocation=()` | Restricao de APIs do browser |
| `server_tokens`                 | `off`                                      | Ocultar versao do nginx     |

### 13.2. SSL/TLS (Producao)

O bloco HTTPS esta comentado no `nginx.conf`. Para ativar:

```nginx
# Descomentar o server block HTTPS (linhas 182-198)
# Configurar certificados:
#   ssl_certificate     /etc/nginx/ssl/fullchain.pem;
#   ssl_certificate_key /etc/nginx/ssl/privkey.pem;
```

**Recomendacao:** Usar Let's Encrypt com certbot:

```bash
# Instalar certbot
apt install certbot python3-certbot-nginx

# Obter certificado
certbot certonly --standalone -d app.esperancar.com.br

# Montar certificados como volumes no nginx
# /etc/letsencrypt/live/app.esperancar.com.br/fullchain.pem
# /etc/letsencrypt/live/app.esperancar.com.br/privkey.pem
```

**Configuracoes SSL recomendadas:**
- Protocolos: TLSv1.2, TLSv1.3
- HSTS: `max-age=31536000; includeSubDomains`
- Ciphers: ECDHE com AES-GCM
- OCSP Stapling: habilitar

### 13.3. Rate Limiting

Configurado no `nginx.conf`:

| Zone  | Rate        | Burst | Aplicacao          |
|-------|-------------|-------|--------------------|
| `api` | 30 req/s    | 20    | Todas as rotas /api |
| `login` | 5 req/min | 3     | POST /api/v1/auth/login |

### 13.4. CORS

Configurar no backend NestJS:

```typescript
// main.ts
app.enableCors({
  origin: process.env.CORS_ORIGIN || 'https://app.esperancar.com.br',
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  credentials: true,
  maxAge: 86400,
});
```

### 13.5. Protecao de Arquivos Sensiveis

O nginx bloqueia acesso a:
- Arquivos ocultos (`.git`, `.env`, etc.)
- Arquivos de backup (`*~`)

```nginx
location ~ /\. { deny all; }
location ~ ~$  { deny all; }
```

### 13.6. Isolamento de Rede

- PostgreSQL e Redis acessiveis **APENAS** via `backend_net`
- Nenhuma porta de banco exposta ao host
- Frontend nao tem acesso direto ao backend (apenas via nginx)

### 13.7. Usuario Nao-Root

O backend roda como usuario `appuser` (UID 1001) dentro do container:

```dockerfile
RUN addgroup -g 1001 -S appgroup && \
    adduser -S appuser -u 1001 -G appgroup
USER appuser
```

### 13.8. Segredos

- **Nunca** commitar `.env` com valores reais
- Usar `chmod 600` nos arquivos `.env`
- Rotacionar senhas periodicamente
- Usar segredos do Docker/Swarm ou vault em producao

### 13.9. Auditoria de Seguranca

```bash
# Scan de vulnerabilidades nas imagens
docker scout cves esperancar-backend:latest
docker scout cves esperancar-nginx:latest

# Alternativa com Trivy
trivy image esperancar-backend:latest
trivy image esperancar-nginx:latest

# Verificar portas abertas no host
ss -tlnp | grep -E "(80|443|3001|5432|6379)"
# Esperado: apenas 80 e 443
```

---

## 14. Backup e Restore

### 14.1. Backup do PostgreSQL

#### Backup Manual

```bash
# Backup completo (custom format, compactado)
docker compose exec postgres pg_dump \
  -U esperancar_user \
  -d esperancar_db \
  -Fc \
  -f /tmp/backup_$(date +%Y%m%d_%H%M%S).dump

# Copiar do container para o host
docker cp esperancar-postgres-1:/tmp/backup_YYYYMMDD_HHMMSS.dump \
  /root/backups/postgres/

# Backup em SQL puro (alternativa)
docker compose exec postgres pg_dump \
  -U esperancar_user \
  -d esperancar_db \
  | gzip > /root/backups/postgres/backup_$(date +%Y%m%d_%H%M%S).sql.gz
```

#### Script de Backup Automatizado

```bash
#!/bin/bash
# scripts/backup.sh
set -euo pipefail

BACKUP_DIR="/root/backups"
DATE=$(date +%Y%m%d_%H%M%S)
RETENTION_DAYS=30

mkdir -p "$BACKUP_DIR"/{postgres,redis,uploads}

echo "[$(date)] Iniciando backup..."

# PostgreSQL
echo "[$(date)] Backup PostgreSQL..."
docker compose exec -T postgres pg_dump \
  -U "${POSTGRES_USER:-esperancar_user}" \
  -d "${POSTGRES_DB:-esperancar_db}" \
  -Fc | gzip > "$BACKUP_DIR/postgres/backup_${DATE}.dump.gz"

# Redis (BGSAVE)
echo "[$(date)] Backup Redis..."
docker compose exec redis redis-cli BGSAVE
docker cp esperancar-redis-1:/data/dump.rdb \
  "$BACKUP_DIR/redis/dump_${DATE}.rdb"

# Uploads
echo "[$(date)] Backup Uploads..."
tar czf "$BACKUP_DIR/uploads/uploads_${DATE}.tar.gz" \
  -C /root/app-esperancar backend/uploads/

# Limpar backups antigos
echo "[$(date)] Limpando backups com mais de ${RETENTION_DAYS} dias..."
find "$BACKUP_DIR" -name "*.gz" -mtime +${RETENTION_DAYS} -delete
find "$BACKUP_DIR" -name "*.rdb" -mtime +${RETENTION_DAYS} -delete

echo "[$(date)] Backup completo!"
```

#### Cron para Backup Automatizado

```bash
# Editar crontab
crontab -e

# Backup diario as 3:00 AM
0 3 * * * cd /root/app-esperancar && bash scripts/backup.sh >> /var/log/esperancar-backup.log 2>&1
```

### 14.2. Restore do PostgreSQL

#### Restore a partir de dump custom format

```bash
# Copiar backup para o container
docker cp /root/backups/postgres/backup_YYYYMMDD_HHMMSS.dump.gz \
  esperancar-postgres-1:/tmp/

# Decomprimir
docker compose exec postgres gzip -d /tmp/backup_YYYYMMDD_HHMMSS.dump.gz

# Restore (banco existente)
docker compose exec postgres pg_restore \
  -U esperancar_user \
  -d esperancar_db \
  --clean \
  --if-exists \
  --no-owner \
  /tmp/backup_YYYYMMDD_HHMMSS.dump

# Restore (criar banco do zero)
docker compose exec postgres psql -U esperancar_user -c "DROP DATABASE IF EXISTS esperancar_db;"
docker compose exec postgres psql -U esperancar_user -c "CREATE DATABASE esperancar_db;"
docker compose exec postgres pg_restore \
  -U esperancar_user \
  -d esperancar_db \
  /tmp/backup_YYYYMMDD_HHMMSS.dump
```

#### Restore a partir de SQL puro

```bash
docker compose exec -T postgres psql \
  -U esperancar_user \
  -d esperancar_db < /root/backups/postgres/backup_YYYYMMDD_HHMMSS.sql.gz
```

### 14.3. Restore do Redis

```bash
# Parar o Redis
docker compose stop redis

# Substituir o dump
docker cp /root/backups/redis/dump_YYYYMMDD_HHMMSS.rdb \
  esperancar-redis-1:/data/dump.rdb

# Reiniciar
docker compose up -d redis

# Verificar
docker compose exec redis redis-cli ping
```

### 14.4. Restore de Uploads

```bash
# Extrair backup de uploads
tar xzf /root/backups/uploads/uploads_YYYYMMDD_HHMMSS.tar.gz \
  -C /root/app-esperancar/

# Verificar permissois
chown -R 1001:1001 /root/app-esperancar/backend/uploads/
```

### 14.5. Procedimento Completo de Disaster Recovery

```bash
# 1. Parar todos os servicos
docker compose down

# 2. Recriar volumes (se necessario)
docker volume rm esperancar_postgres_data
docker volume rm esperancar_redis_data

# 3. Subir apenas banco e cache
docker compose up -d postgres redis

# 4. Aguardar healthy
docker compose ps

# 5. Restore PostgreSQL
docker compose exec postgres pg_restore \
  -U esperancar_user -d esperancar_db \
  --clean --if-exists \
  /tmp/backup_YYYYMMDD_HHMMSS.dump

# 6. Restore Redis
docker compose stop redis
docker cp /root/backups/redis/dump_YYYYMMDD.rdb \
  esperancar-redis-1:/data/dump.rdb
docker compose up -d redis

# 7. Restore uploads
tar xzf /root/backups/uploads/uploads_YYYYMMDD.tar.gz -C /root/app-esperancar/

# 8. Subir aplicacao
docker compose up -d backend nginx

# 9. Verificar
docker compose ps
curl -f http://localhost/health
curl -f http://localhost/api/v1/health
```

### 14.6. Testes de Backup

**IMPORTANTE:** Testar restore periodicamente (minimo mensal).

```bash
# Criar ambiente de teste
docker compose -f docker-compose.yml -f docker-compose.test.yml up -d

# Fazer restore no ambiente de teste
# Verificar integridade dos dados
# Destruir ambiente de teste
docker compose -f docker-compose.yml -f docker-compose.test.yml down -v
```

---

## Apendice A: Comandos Uteis

```bash
# Status geral
docker compose ps
docker compose top

# Logs
docker compose logs -f --tail=100

# Shell em container
docker compose exec backend sh
docker compose exec postgres psql -U esperancar_user -d esperancar_db
docker compose exec redis redis-cli

# Recriar container especifico
docker compose up -d --force-recreate backend

# Limpar recursos nao utilizados
docker system prune -f
docker volume prune -f
docker image prune -f

# Ver uso de disco
docker system df
du -sh /var/lib/docker/volumes/esperancar_*
```

## Apendice B: Estrutura de Diretorios

```
/root/app-esperancar/
├── backend/
│   ├── Dockerfile
│   ├── .env                    # NAO commitar
│   ├── .env.example            # Template
│   ├── src/
│   ├── prisma/
│   ├── uploads/                # Volume: backend_uploads
│   └── logs/                   # Volume: backend_logs
├── frontend/
│   ├── Dockerfile
│   ├── src/
│   └── dist/                   # Build output -> Volume: frontend_dist
├── nginx/
│   ├── Dockerfile
│   ├── nginx.conf
│   └── ssl/                    # Certificados SSL
├── scripts/
│   ├── backup.sh
│   └── restore.sh
├── docker-compose.yml
├── PRODUCTION_DEPLOY_REPORT.md # Este arquivo
└── README.md
```

## Apendice C: Contato e Escalacao

| Papel          | Responsabilidade              | Contato        |
|----------------|-------------------------------|----------------|
| DevOps/SRE     | Infraestrutura, deploy, TBD   | TBD            |
| Backend Dev    | API, banco de dados           | TBD            |
| Frontend Dev   | UI, assets estaticos          | TBD            |
| Security       | Vulnerabilidades, auditoria   | TBD            |

---

**Documento gerado automaticamente em 2026-06-22.**
**Ultima revisao: 2026-06-22.**
**Proxima revisao recomendada: 2026-09-22 (trimestral).**
