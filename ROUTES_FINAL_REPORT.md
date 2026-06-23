# ROUTES_FINAL_REPORT.md
# Relatório Final de Rotas — Esperancar v1.0.0
# Data: 2026-06-22

---

## 1. PROBLEMA IDENTIFICADO

As rotas de negócio estão registradas com prefixo duplicado:
```
/api/v1/api/v1/auth/login  ❌ (duplicado)
/api/v1/health             ✅ (correto)
```

## 2. CAUSA RAIZ

O prefixo `/api` está sendo aplicado **duas vezes**:

1. **NestJS** (`main.ts` linha 32): `app.setGlobalPrefix('api')` → adiciona `/api`
2. **Traefik** (EasyPanel): O serviço `legal-legis_esperancar-0` está configurado com `url: http://legal-legis_esperancar:3001/api` → adiciona `/api`

Resultado: `/api` (Traefik) + `/api` (NestJS) + `/v1/` (versioning) + `/auth/login` (controller) = `/api/api/v1/auth/login`

## 3. ROTAS REGISTRADAS (Swagger)

### 3.1 Health (CORRETO - sem duplicidade)
```
GET  /api/v1/health          ✅ 200 OK
GET  /api/v1/health/ready    ✅ 200 OK
GET  /api/v1/health/live     ✅ 200 OK
```

### 3.2 Auth (DUPLICADO)
```
POST /api/v1/api/v1/auth/login     ❌ 500 (duplicado)
POST /api/v1/api/v1/auth/refresh   ❌ (duplicado)
POST /api/v1/api/v1/auth/logout    ❌ (duplicado)
GET  /api/v1/api/v1/auth/me        ❌ (duplicado)
```

### 3.3 Controllers Ativos (TODOS DUPLICADOS)
```
/api/v1/api/v1/users
/api/v1/api/v1/contacts
/api/v1/api/v1/leaders
/api/v1/api/v1/demands
/api/v1/api/v1/missions
/api/v1/api/v1/campaigns
/api/v1/api/v1/gamification
/api/v1/api/v1/electoral-data
/api/v1/api/v1/tse/*
/api/v1/api/v1/audit-logs
/api/v1/api/v1/notifications
/api/v1/api/v1/whatsapp/*
/api/v1/api/v1/sofia/*
/api/v1/api/v1/files/*
/api/v1/api/v1/jobs/*
```

## 4. CORREÇÃO NECESSÁRIA

### Arquivo: `/etc/easypanel/traefik/config/main.yaml`

**Antes:**
```yaml
"legal-legis_esperancar-0": {
  "loadBalancer": {
    "servers": [
      {
        "url": "http://legal-legis_esperancar:3001/api"
      }
    ]
  }
}
```

**Depois:**
```yaml
"legal-legis_esperancar-0": {
  "loadBalancer": {
    "servers": [
      {
        "url": "http://legal-legis_esperancar:3001"
      }
    ]
  }
}
```

## 5. URLs FINAIS CORRETAS (após correção)

| Serviço | URL Interna | URL Externa |
|---------|-------------|-------------|
| Health | `http://localhost:3001/api/v1/health` | `https://esperancar.f5rg2q.easypanel.host/api/v1/health` |
| Login | `http://localhost:3001/api/v1/auth/login` | `https://esperancar.f5rg2q.easypanel.host/api/v1/auth/login` |
| Swagger | `http://localhost:3001/api/docs` | `https://esperancar.f5rg2q.easypanel.host/api/docs` |
| API Base | `http://localhost:3001/api/v1` | `https://esperancar.f5rg2q.easypanel.host/api/v1` |

## 6. TESTES EXECUTADOS

| Rota | Status | Resultado |
|------|--------|-----------|
| `/api/v1/health` | ✅ 200 | `{"status":"ok"}` |
| `/api/v1/auth/login` | ❌ 404 | Rota não encontrada (prefixo errado) |
| `/api/v1/api/v1/auth/login` | ❌ 500 | Rota existe mas com erro interno |

## 7. AÇÃO NECESSÁRIA

1. Acessar o EasyPanel
2. Ir para o serviço `esperancar-backend`
3. Alterar a URL de `http://legal-legis_esperancar:3001/api` para `http://legal-legis_esperancar:3001`
4. Reiniciar o serviço

Ou editar diretamente:
```bash
ssh root@69.62.67.78
nano /etc/easypanel/traefik/config/main.yaml
# Alterar: "url": "http://legal-legis_esperancar:3001/api"
# Para:     "url": "http://legal-legis_esperancar:3001"
```

## 8. IMPACTO NO FRONTEND

O frontend está configurado com:
```env
VITE_API_BASE_URL=/api
```

Após a correção, as chamadas serão:
```
Frontend → /api/v1/auth/login
Traefik  → http://backend:3001/api/v1/auth/login
NestJS   → /api/v1/auth/login ✅
```

## 9. RESUMO

| Item | Valor |
|------|-------|
| Prefixo global NestJS | `/api` |
| Versionamento | `/v1` |
| Prefixo Traefik (atual - errado) | `/api` |
| Prefixo Traefik (correto) | (nenhum) |
| URL final correta | `/api/v1/*` |
| URL atual errada | `/api/api/v1/*` |
