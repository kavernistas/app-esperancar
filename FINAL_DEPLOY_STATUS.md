# FINAL_DEPLOY_STATUS.md
# Relatório Final de Deploy — Esperancar v1.0.0
# Data: 2026-06-22

---

## 1. RESUMO

| Item | Status |
|------|--------|
| Backend build | ✅ OK |
| Frontend build | ✅ OK |
| Push GitHub | ✅ OK |
| VPS sincronizada | ✅ OK |
| PostgreSQL | ✅ Rodando |
| Redis | ✅ Rodando |
| Backend service | ❌ 0/1 (P1000 - senha incorreta) |
| Rotas | ❌ Prefixo duplicado (/api/api/v1/*) |

## 2. PROBLEMAS IDENTIFICADOS

### 2.1 Senha do PostgreSQL incorreta no service
**Causa:** O arquivo de criação do serviço foi escrito com senha errada.
**Senha real:** `***`
**Senha no service:** `***` (errada)

### 2.2 Prefixo de rotas duplicado
**Causa:** Os controllers tinham `@Controller('api/v1/xxx')` + `setGlobalPrefix('api')` + versioning.
**Correção aplicada:** Removido `/api/v1` dos decorators (commit `944952a`).
**Status:** Corrigido no código, mas a imagem antiga ainda está no registry.

### 2.3 Build local não gera dist/main.js
**Causa:** O tsconfig gera em `dist/src/` em vez de `dist/`.
**Correção:** Dockerfile atualizado para copiar de `/app/dist/src` para `./dist`.

## 3. AÇÕES NECESSÁRIAS

### 3.1 Recriar serviço com senha correta
```bash
ssh root@69.62.67.78
docker service rm esperancar-backend
docker service create --name esperancar-backend \
  --network easypanel-legal-legis \
  -e NODE_ENV=production \
  -e PORT=3001 \
  -e "DATABASE_URL=postgresql://esperancar:***@esperancar-postgres:5432/esperancar_db?schema=public" \
  -e "REDIS_URL=redis://esperancar-redis:6379" \
  -e "JWT_ACCESS_SECRET=*** \
  -e "JWT_REFRESH_SECRET=*** \
  -e "CORS_ORIGIN=https://esperancar.f5rg2q.easypanel.host" \
  -e "LLM_PROVIDER=openai" \
  -e "LLM_API_KEY=*** \
  -e "STORAGE_PROVIDER=local" \
  -e "TSE_ETL_SHARED_SECRET=*** \
  --restart-condition on-failure \
  --limit-memory 512M \
  127.0.0.1:5000/esperancar-backend:latest
```

### 3.2 Rebuild do backend com código corrigido
```bash
cd /opt/app-esperancar
git pull origin main
docker build -t 127.0.0.1:5000/esperancar-backend:latest -f backend/Dockerfile ./backend
docker push 127.0.0.1:5000/esperancar-backend:latest
```

### 3.3 Recriar serviço com imagem nova
```bash
docker service rm esperancar-backend
docker service create --name esperancar-backend \
  --network easypanel-legal-legis \
  -e NODE_ENV=production \
  -e PORT=3001 \
  -e "DATABASE_URL=postgresql://esperancar:***@esperancar-postgres:5432/esperancar_db?schema=public" \
  ... (mesmas envs acima)
  127.0.0.1:5000/esperancar-backend:latest
```

## 4. COMMITS REALIZADOS

| Hash | Mensagem |
|------|----------|
| `944952a` | fix: corrigir prefixo de rotas duplicado |
| `6922904` | docs: TRAEFIK_ROUTING_AUDIT |
| `82f8c9a` | docs: ROUTES_FINAL_REPORT |

## 5. URLs FINAIS (após correção)

| Serviço | URL |
|---------|-----|
| Frontend | `https://esperancar.f5rg2q.easypanel.host` |
| API Health | `https://esperancar.f5rg2q.easypanel.host/api/v1/health` |
| API Login | `https://esperancar.f5rg2q.easypanel.host/api/v1/auth/login` |
| Swagger | `https://esperancar.f5rg2q.easypanel.host/docs` |

## 6. CREDENCIAIS

| Item | Valor |
|------|-------|
| POSTGRES_USER | `esperancar` |
| POSTGRES_PASSWORD | `***` |
| POSTGRES_DB | `esperancar_db` |
| JWT_ACCESS_SECRET | `eyJhbG...5c` |
| JWT_REFRESH_SECRET | `eyJhbG...5c` |
| TSE_ETL_SHARED_SECRET | `tse-et...26` |
| LLM_API_KEY | `***` |
