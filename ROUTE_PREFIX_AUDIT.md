# ROUTE_PREFIX_AUDIT.md
# Auditoria de Prefixo de Rotas — Duplicidade /api/api
# Data: 2026-06-22

---

## 1. PROBLEMA IDENTIFICADO

As rotas estão sendo registradas como `/api/api/v1/*` em vez de `/api/v1/*`.

## 2. CAUSA RAIZ

O prefixo `/api` está sendo aplicado **duas vezes**:

### 2.1 Primeira aplicação — Traefik (EasyPanel)
No arquivo `/etc/easypanel/traefik/config/main.yaml`, o serviço `legal-legis_esperancar-0` está configurado com:

```yaml
"legal-legis_esperancar-0": {
  "loadBalancer": {
    "passHostHeader": true,
    "servers": [
      {
        "url": "http://legal-legis_esperancar:3001/api"
      }
    ]
  }
}
```

O Traefik redireciona para `http://legal-legis_esperancar:3001/api`, adicionando o prefixo `/api`.

### 2.2 Segunda aplicação — NestJS (main.ts)
No arquivo `backend/src/main.ts`, linha 32:

```typescript
app.setGlobalPrefix('api');
```

O NestJS adiciona o prefixo `/api` novamente.

### 2.3 Resultado
```
Requisição: GET /api/v1/health
Traefik → http://legal-legis_esperancar:3001/api/v1/health
NestJS  → /api/api/v1/health (duplicado!)
```

## 3. ARQUIVOS RESPONSÁVEIS

| Arquivo | Linha | Conteúdo | Responsabilidade |
|---------|-------|----------|------------------|
| `/etc/easypanel/traefik/config/main.yaml` | — | `url: http://legal-legis_esperancar:3001/api` | Traefik adiciona `/api` |
| `backend/src/main.ts` | 32 | `app.setGlobalPrefix('api')` | NestJS adiciona `/api` |

## 4. CORREÇÃO NECESSÁRIA

### Opção A: Remover prefixo do Traefik (RECOMENDADA)
Alterar a configuração do Traefik de:
```yaml
"url": "http://legal-legis_esperancar:3001/api"
```
Para:
```yaml
"url": "http://legal-legis_esperancar:3001"
```

**Vantagem:** O NestJS controla o prefixo, permitindo versionamento (`/api/v1/*`).

### Opção B: Remover prefixo do NestJS
Alterar `main.ts` de:
```typescript
app.setGlobalPrefix('api');
```
Para:
```typescript
// Sem prefixo global
```

**Desvantagem:** Perde-se o versionamento (`/v1/*`).

## 5. IMPACTO NO FRONTEND

O frontend está configurado com:
```env
VITE_API_BASE_URL=/api
```

Com a correção (Opção A), as chamadas serão:
```
Frontend → /api/v1/health
Traefik  → http://backend:3001/api/v1/health
NestJS   → /api/v1/health ✅
```

## 6. URLs FINAIS CORRETAS

| Serviço | URL |
|---------|-----|
| Frontend | `https://esperancar.f5rg2q.easypanel.host` |
| API Health | `https://esperancar.f5rg2q.easypanel.host/api/v1/health` |
| API Docs | `https://esperancar.f5rg2q.easypanel.host/api/docs` |
| Login | `https://esperancar.f5rg2q.easypanel.host/api/v1/auth/login` |

## 7. AÇÃO NECESSÁRIA

1. Acessar o EasyPanel
2. Ir para o serviço `esperancar-backend`
3. Alterar a URL de `http://legal-legis_esperancar:3001/api` para `http://legal-legis_esperancar:3001`
4. Reiniciar o serviço

Ou editar diretamente o arquivo:
```bash
ssh root@69.62.67.78
nano /etc/easypanel/traefik/config/main.yaml
# Alterar "url": "http://legal-legis_esperancar:3001/api"
# Para     "url": "http://legal-legis_esperancar:3001"
```
