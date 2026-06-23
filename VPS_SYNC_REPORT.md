# VPS_SYNC_REPORT.md
# Relatório de Sincronização VPS — FASE 2
# Data: 2026-06-22
# Status: ⚠️ PARCIAL — Deploy em andamento

---

## 1. SINCRONIZAÇÃO GIT

| Aspecto | Status |
|---------|--------|
| Push sandbox → GitHub | ✅ OK (commit 8278237) |
| Pull VPS ← GitHub | ✅ OK (commit 7703ccd → 8278237) |
| VPS sincronizada | ✅ OK |

## 2. SERVIÇOS CRIADOS NA VPS

| Serviço | Status | Replicas |
|---------|--------|----------|
| esperancar-postgres | ✅ Running | 1/1 |
| esperancar-redis | ✅ Running | 1/1 |
| esperancar-backend | ⚠️ Failing | 0/1 |

## 3. PROBLEMAS ENCONTRADOS

### 3.1 Prisma Engine — libssl.so.1.1
**Erro:** `Error loading shared library libssl.so.1.1: No such file or directory`
**Causa:** Alpine Linux não tem libssl.so.1.1 por padrão
**Correção:** Adicionado `openssl3 libstdc++` no Dockerfile (commit 8278237)

### 3.2 PostgreSQL — Authentication Failed (P1000)
**Erro:** `PrismaClientInitializationError: errorCode: P1000`
**Causa:** Senha do PostgreSQL incorreta ou banco não existe
**Correção:** Recriado serviço do PostgreSQL com senha correta

### 3.3 Database name mismatch
**Erro:** `database "esperancar_db" does not exist`
**Causa:** POSTGRES_DB não foi definido no serviço do PostgreSQL
**Correção:** Adicionado POSTGRES_DB=esperancar_db

## 4. AÇÕES NECESSÁRIAS (PRÓXIMOS PASSOS)

1. Pull do novo commit na VPS
2. Rebuild do backend com Dockerfile corrigido
3. Recriar serviço do backend
4. Executar migrations + seed
5. Verificar healthcheck

## 5. COMANDOS PARA CONTINUAR

```bash
# Na VPS
cd /opt/app-esperancar
git pull origin main

# Rebuild backend
docker build -t 127.0.0.1:5000/esperancar-backend:latest -f backend/Dockerfile ./backend

# Recriar serviço
docker service rm esperancar-backend
docker service create --name esperancar-backend --network easypanel-legal-legis \
  -e NODE_ENV=production -e PORT=3001 \
  -e DATABASE_URL=postgresql://esperancar:***@esperancar-postgres:5432/esperancar_db?schema=public \
  -e REDIS_URL=redis://esperancar-redis:6379 \
  -e JWT_ACCESS_SECRET=*** \
  -e CORS_ORIGIN=https://esperancar.f5rg2q.easypanel.host \
  127.0.0.1:5000/esperancar-backend:latest

# Migrations
docker exec -it $(docker ps -q -f name=esperancar-backend) npx prisma migrate deploy

# Seed
docker exec -it $(docker ps -q -f name=esperancar-backend) npm run prisma:seed
```
