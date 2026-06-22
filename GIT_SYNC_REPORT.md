# GIT_SYNC_REPORT.md
# Relatório de Sincronização Git ↔ VPS
# Data: 2026-06-22
# Status: DIVERGÊNCIA DETECTADA

---

## 1. RESUMO

| Aspecto | Sandbox (local) | VPS (69.62.67.78) |
|---------|-----------------|-------------------|
| Último commit | `c09b885` | `8eaa238` (desatualizado) |
| Branch | main | main |
| Arquivos de produção | Presentes | Parcialmente presentes |
| Build backend | ✅ OK | ❌ Quebrado (alterações locais) |
| .env.production | Não existe | Existe (risco) |

---

## 2. COMMITS NO SANDBOX (não na VPS)

| Hash | Mensagem | Arquivos afetados |
|------|----------|-------------------|
| `463ce4f` | Fase 0-3: Auditoria + Backend + Prisma | 89 arquivos backend |
| `1f7d0ae` | Fase 4: Auth JWT | auth module |
| `d29df74` | Fase 5: CRUD Entidades | contacts, leaders, demands, missions |
| `aebb48d` | Fase 6: TSE | tse module |
| `5c4bc8a` | Fase 7: Sofia IA | sofia module |
| `aa0fb57` | Fase 8: WhatsApp | whatsapp module |
| `7a07d6e` | Fase 9: Storage | files module |
| `aba0c69` | Fase 10: Jobs | jobs module |
| `1dc920a` | Fase 11: Adaptador Frontend | 14 arquivos API |
| `fb0e457` | Fase 12: Migração Contacts | Contacts.jsx |
| `1257e58` | Fase 13: Remoção Base44 | 95 arquivos |
| `99b245d` | Fase 14: Produção | 16 arquivos |
| `c09b885` | fix: correções TypeScript | 17 arquivos |

---

## 3. ARQUIVOS DIVERGENTES

### 3.1 Existem no sandbox, NÃO existem na VPS

```
backend/                          (diretório inteiro)
nginx/                            (diretório inteiro)
frontend/Dockerfile
scripts/                          (diretório inteiro)
docker-compose.prod.yml
docker-compose.swarm.yml
.env.production.example
EASYPANEL_DEPLOY.md
PRODUCTION_DEPLOY_REPORT.md
CHECKLIST_GO_LIVE_FINAL.md
VPS_EASYPANEL_DEPLOY.md
BACKUP_RESTORE_GUIDE.md
ENVIRONMENT_VARIABLES_PROD.md
FINAL_BASE44_AUDIT.md
E2E_VALIDATION_REPORT.md
DEPLOY_AUDIT.md
RELEASE_FINAL.md
```

### 3.2 Existem na VPS, NÃO existem no Git

```
.env.production                   (RISCO: contém secrets)
```

### 3.3 Existem em ambos, mas com conteúdo diferente

| Arquivo | Sandbox | VPS |
|---------|---------|-----|
| `backend/tsconfig.json` | strictNullChecks: false | strictNullChecks: false (alterado via sed) |
| `backend/package.json` | Com @nestjs/axios, axios | Com @nestjs/axios, axios (alterado via npm install) |
| `backend/src/app.module.ts` | CampaignModule, NotificationModule | CampaignModule, NotificationModule (alterado via sed) |
| `backend/src/modules/health/health.module.ts` | Sem HttpModule | Sem HttpModule (alterado via cat >) |
| `backend/src/modules/tse/tse.service.ts` | secao?: string | secao?: string (alterado via sed) |
| `backend/src/modules/audit/audit.service.ts` | Com métodos CRUD | Com métodos CRUD (alterado via cat >) |
| `backend/src/modules/contacts/contacts.service.ts` | Com cast as any | Com cast as any (alterado via sed) |
| `backend/src/modules/*/dto/index.ts` | Com Max import | Com Max import (alterado via sed) |

---

## 4. PROCEDIMENTO DE SINCRONIZAÇÃO

### 4.1 No sandbox (local) — Push para GitHub

```bash
cd /root/app-esperancar

# Verificar status
git status
git log --oneline -5

# Push (requer credenciais)
git push origin main

# Se falhar, configurar token:
git remote set-url origin https://<TOKEN>@github.com/kavernistas/app-esperancar.git
git push origin main
```

### 4.2 Na VPS — Pull e rebuild

```bash
ssh root@69.62.67.78
cd /opt/app-esperancar

# Descartar TODAS as alterações locais
git fetch origin
git reset --hard origin/main

# Remover .env.production (risco de segurança)
rm -f .env.production

# Verificar sincronização
git log --oneline -5
git status

# Build das imagens
docker build -t 127.0.0.1:5000/esperancar-backend:latest -f backend/Dockerfile ./backend
docker build -t 127.0.0.1:5000/esperancar-frontend:latest --build-arg VITE_API_MODE=BACKEND --build-arg VITE_API_BASE_URL=/api -f frontend/Dockerfile .

# Registrar no registry local
docker push 127.0.0.1:5000/esperancar-backend:latest
docker push 127.0.0.1:5000/esperancar-frontend:latest
```

---

## 5. RISCOS IDENTIFICADOS

| Risco | Severidade | Mitigação |
|-------|------------|-----------|
| `.env.production` com secrets na VPS | **CRÍTICO** | Remover imediatamente |
| Alterações locais na VPS sobrescrevem Git | **ALTO** | `git reset --hard origin/main` |
| Push para GitHub não realizado | **ALTO** | Executar push com token |
| Imagens Docker não rebuildadas | **MÉDIO** | Rebuild após sync |
| EasyPanel não configurado | **MÉDIO** | Configurar via painel |

---

## 6. CHECKLIST DE SINCRONIZAÇÃO

- [ ] Push do commit `c09b885` para GitHub (sandbox)
- [ ] Pull na VPS (`git reset --hard origin/main`)
- [ ] Remover `.env.production` da VPS
- [ ] Build do backend na VPS
- [ ] Build do frontend na VPS
- [ ] Registrar imagens no registry local
- [ ] Configurar EasyPanel (apps + variáveis)
- [ ] Executar migrations + seed
- [ ] Testar healthcheck
- [ ] Testar login + CRUD
- [ ] Configurar domínio + SSL
