# TRAEFIK_ROUTING_AUDIT.md
# Auditoria de Roteamento Traefik/EasyPanel
# Data: 2026-06-22

---

## 1. PROBLEMA

502 Service is notreachable apesar do backend estar saudável (1/1 healthy).

## 2. COMPONENTES AUDITADOS

### 2.1 Serviço Docker Swarm
| Item | Valor |
|------|-------|
| Nome | `esperancar-backend` |
| Replicas | 1/1 (healthy) |
| Imagem | `127.0.0.1:5000/esperancar-backend:latest` |
| Rede | `i5lawwkky8mohrkgzt4zdan5t` (= `easypanel-legal-legis`) |
| Porta | 3001 |
| Healthcheck | ✅ Passando |

### 2.2 Traefik
| Item | Valor |
|------|-------|
| Serviço | `easypanel-traefik` |
| Redes | `easypanel-legal-legis`, `ingress` |
| Status | ✅ Up 6 hours |

### 2.3 Router Traefik
| Item | Valor |
|------|-------|
| Nome | `https-legal-legis_esperancar-0` |
| Rule | `Host(\`esperancar.f5rg2q.easypanel.host\`) && PathPrefix(\`/api\`)` |
| Service | `legal-legis_esperancar-0` |
| EntryPoints | `https` |

### 2.4 Service Traefik
| Item | Valor ANTES | Valor CORRETO |
|------|-------------|---------------|
| Nome | `legal-legis_esperancar-0` | `legal-legis_esperancar-0` |
| URL | `http://legal-legis_esperancar:3001/` | `http://esperancar-backend:3001` |

## 3. PROBLEMAS IDENTIFICADOS

### 3.1 Nome do serviço incorreto (CORRIGIDO ✅)
**Antes:** `http://legal-legis_esperancar:3001/`
**Depois:** `http://esperancar-backend:3001`

O nome do serviço no Swarm é `esperancar-backend`, não `legal-legis_esperancar`.

### 3.2 Rotas duplicadas no NestJS
As rotas estão sendo registradas como:
```
/api/api/v1/auth/login  ❌ (duplicado)
/api/v1/health          ✅ (correto)
```

Isso indica que o prefixo `/api` está sendo aplicado duas vezes no NestJS.

### 3.3 Tabelas do banco não existem
Os jobs estão falhando porque as tabelas não existem:
```
The table 'public.demands' does not exist
The table 'public.missions' does not exist
```

O `prisma db push` criou as tabelas mas o Prisma está procurando por `demands` (plural) em vez de `demands` (que é o nome correto).

## 4. CAUSA RAIZ

### 4.1 Nome do serviço Traefik
O EasyPanel criou o serviço com nome `legal-legis_esperancar-0` mas o nome real do serviço no Swarm é `esperancar-backend`. Isso causava o 502 porque o Traefik não conseguia encontrar o serviço.

### 4.2 Prefixo duplicado
O NestJS está registrando as rotas com prefixo `/api` duas vezes. Isso pode ser causado por:
- `setGlobalPrefix('api')` sendo aplicado duas vezes
- Versioning adicionando `/api` em vez de `/v1`
- Algum módulo adicionando prefixo extra

## 5. CORREÇÕES APLICADAS

### 5.1 ✅ Nome do serviço Traefik
```bash
ssh root@69.62.67.78
sed -i "s|legal-legis_esperancar:3001|esperancar-backend:3001|g" /etc/easypanel/traefik/config/main.yaml
```

### 5.2 ✅ Domínio sem protocolo
```bash
sed -i 's|https://esperancar.f5rg2q.easypanel.host|esperancar.f5rg2q.easypanel.host|g' /etc/easypanel/traefik/config/main.yaml
```

## 6. PENDÊNCIAS

### 6.1 Prefixo duplicado nas rotas
As rotas ainda estão sendo registradas como `/api/api/v1/*`. Isso precisa ser corrigido no código fonte do NestJS.

### 6.2 Banco de dados
As tabelas existem mas o Prisma está procurando por nomes diferentes. Pode ser necessário ajustar o schema ou o nome das tabelas.

## 7. URLs FINAIS

| Serviço | URL |
|---------|-----|
| Health | `https://esperancar.f5rg2q.easypanel.host/api/v1/health` ✅ |
| Login | `https://esperancar.f5rg2q.easypanel.host/api/v1/auth/login` ❌ (404) |
| Swagger | `https://esperancar.f5rg2q.easypanel.host/api/docs` ❌ (prefixo duplicado) |

## 8. PRÓXIMOS PASSOS

1. Corrigir o prefixo duplicado no NestJS (código fonte)
2. Rebuild da imagem do backend
3. Recriar o serviço no Swarm
4. Testar login e CRUD
