# DEPLOY_CHECKLIST_FINAL.md
# Checklist de Deploy — Esperancar v1.0.0
# VPS: root@69.62.67.78
# EasyPanel: esperancar.f5rg2q.easypanel.host

---

## PRÉ-REQUISITOS

- [ ] Acesso SSH à VPS (`ssh root@69.62.67.78`)
- [ ] EasyPanel instalado e rodando
- [ ] Docker Registry local ativo (`127.0.0.1:5000`)
- [ ] Domínio apontado para IP da VPS
- [ ] Token GitHub configurado (para push)

---

## PASSO 1 — Push GitHub (no sandbox)

```bash
cd /root/app-esperancar

# Verificar commits pendentes
git log --oneline -5
git status

# Push para GitHub
git push origin main

# Se falhar, usar token:
# git remote set-url origin https://<TOKEN>@github.com/kavernistas/app-esperancar.git
# git push origin main
```

**Resultado esperado:** Todos os commits até `c09b885` no GitHub.

---

## PASSO 2 — Pull na VPS

```bash
ssh root@69.62.67.78
cd /opt/app-esperancar

# Descartar alterações locais da VPS
git fetch origin
git reset --hard origin/main

# Verificar
git log --oneline -3
git status  # Deve estar clean
```

**Resultante esperado:** VPS sincronizada com GitHub.

---

## PASSO 3 — Remover .env.production (risco)

```bash
cd /opt/app-esperancar
rm -f .env.production
echo "Removido .env.production"
```

---

## PASSO 4 — Build Backend

```bash
cd /opt/app-esperancar

docker build \
  -t 127.0.0.1:5000/esperancar-backend:latest \
  -f backend/Dockerfile \
  ./backend

# Verificar
docker images | grep esperancar-backend
```

**Resultado esperado:** Imagem `127.0.0.1:5000/esperancar-backend:latest` criada.

---

## PASSO 5 — Build Frontend

```bash
cd /opt/app-esperancar

docker build \
  -t 127.0.0.1:5000/esperancar-frontend:latest \
  --build-arg VITE_API_MODE=BACKEND \
  --build-arg VITE_API_BASE_URL=/api \
  -f frontend/Dockerfile \
  .

# Verificar
docker images | grep esperancar-frontend
```

**Resultado esperado:** Imagem `127.0.0.1:5000/esperancar-frontend:latest` criada.

---

## PASSO 6 — Registrar imagens no registry

```bash
docker push 127.0.0.1:5000/esperancar-backend:latest
docker push 127.0.0.1:5000/esperancar-frontend:latest
```

---

## PASSO 7 — Configurar EasyPanel: PostgreSQL

1. Acessar painel EasyPanel
2. **Databases** → **Create Database**
3. Configurar:
   - **Name:** `esperancar-postgres`
   - **Type:** PostgreSQL
   - **Version:** 16
   - **Database:** `esperancar_db`
   - **User:** `esperancar`
   - **Password:** `Espera...n
4. Salvar

---

## PASSO 8 — Configurar EasyPanel: Redis

1. **Databases** → **Create Database**
2. Configurar:
   - **Name:** `esperancar-redis`
   - **Type:** Redis
   - **Version:** 7
   - **Password:** `Espera...n
3. Salvar

---

## PASSO 9 — Configurar EasyPanel: Backend

1. **Apps** → **Create App**
2. Configurar:
   - **Name:** `esperancar-backend`
   - **Source:** Docker Registry
   - **Image:** `127.0.0.1:5000/esperancar-backend:latest`
   - **Port:** 3001

3. **Environment Variables** (copiar de `EASY_PANEL_VARIABLES.md`)

4. **Healthcheck:**
   - Path: `/api/v1/health`
   - Port: 3001

5. **Volumes:**
   - `/app/uploads` → 5GB

6. **Deploy**

---

## PASSO 10 — Configurar EasyPanel: Frontend

1. **Apps** → **Create App**
2. Configurar:
   - **Name:** `esperancar-frontend`
   - **Source:** Docker Registry
   - **Image:** `127.0.0.1:5000/esperancar-frontend:latest`
   - **Port:** 3000

3. **Domains:**
   - `esperancar.f5rg2q.easypanel.host`
   - HTTPS: Enabled

4. **Proxy:**
   - Source: `/api`
   - Destination: `http://esperancar-backend:3001`

5. **Deploy**

---

## PASSO 11 — Executar Migrations

```bash
# Aguardar backend ficar healthy
docker ps | grep esperancar-backend

# Executar migrations
docker exec -it esperancar-backend npx prisma migrate deploy
```

**Resultado esperado:** Migrations aplicadas sem erro.

---

## PASSO 12 — Executar Seed

```bash
docker exec -it esperancar-backend npm run prisma:seed
```

**Resultado esperado:** Admin user criado (`admin@esperancar.app` / `Admin@2026`).

---

## PASSO 13 — Healthcheck

```bash
# Backend
curl http://localhost:3001/api/v1/health
# Esperado: {"status":"ok"}

# Frontend
curl -I http://localhost:3000/
# Esperado: 200 OK

# Swagger
curl http://localhost:3001/api/docs
# Esperado: HTML do Swagger
```

---

## PASSO 14 — Testes Funcionais

### 14.1 Login
```bash
curl -X POST http://localhost:3001/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@esperancar.app","password":"Admin@2026"}'
# Esperado: {"accessToken":"...","refreshToken":"..."}
```

### 14.2 CRUD Contatos
```bash
# Listar
curl -s http://localhost:3001/api/v1/contacts \
  -H "Authorization: Bearer <TOKEN>" | jq .

# Criar
curl -X POST http://localhost:3001/api/v1/contacts \
  -H "Authorization: Bearer <TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{"full_name":"Teste","phone":"11999999999"}'
```

### 14.3 Externo
```bash
# Frontend
curl -I https://esperancar.f5rg2q.easypanel.host

# API
curl https://esperancar.f5rg2q.easypanel.host/api/v1/health

# Swagger
curl https://esperancar.f5rg2q.easypanel.host/api/docs
```

---

## CHECKLIST FINAL

| # | Passo | Status |
|---|-------|--------|
| 1 | Push GitHub | [ ] |
| 2 | Pull VPS | [ ] |
| 3 | Remover .env.production | [ ] |
| 4 | Build Backend | [ ] |
| 5 | Build Frontend | [ ] |
| 6 | Registry push | [ ] |
| 7 | EasyPanel PostgreSQL | [ ] |
| 8 | EasyPanel Redis | [ ] |
| 9 | EasyPanel Backend | [ ] |
| 10 | EasyPanel Frontend | [ ] |
| 11 | Migrations | [ ] |
| 12 | Seed | [ ] |
| 13 | Healthcheck | [ ] |
| 14 | Testes Funcionais | [ ] |

---

## GO LIVE

**Todos os 14 passos concluídos?**

- [ ] Sim → **GO LIVE** ✅
- [ ] Não → Corrigir pendências antes de liberar
