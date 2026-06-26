JWT FIX + GO LIVE REPORT — ESPERANÇAR
=========================================
Data: 2026-06-24

========================================
ERRO ORIGINAL
========================================

"JwtStrategy requires a secret or key"

INVESTIGACAO:
  O backend já possui JWT_ACCESS_SECRET e JWT_REFRESH_SECRET configurados
  como variáveis de ambiente no serviço Swarm. O erro NÃO está ocorrendo
  atualmente. O container está saudável e a API responde corretamente
  internamente.

========================================
VARIÁVEIS DE AMBIENTE (VERIFICADAS)
========================================

  JWT_ACCESS_SECRET     → Configurado (secret, exibido como ***)
  JWT_REFRESH_SECRET    → Configurado (secret, exibido como ***)
  DATABASE_URL          → postgresql://esperancar:***@esperancar-postgres:5432/esperancar_db
  REDIS_URL             → redis://esperancar-redis:6379
  CORS_ORIGIN           → https://esperancar.f5rg2q.easypanel.host
  NODE_ENV              → production
  PORT                  → 3001

Nenhuma variável ausente. O JWT não é o problema atual.

========================================
STATUS DO BACKEND
========================================

  Container:    Running 14+ minutes (estável)
  Healthcheck:  healthy
  API interna:  200 OK
    {"success":true,"data":{"status":"ok","info":{"database":{"status":"up"}}}}

  Logs: Sem erros. Todos os 22 módulos inicializados.
  Rotas: 50+ mapeadas corretamente.

========================================
STATUS DA API EXTERNA
========================================

  /api/v1/health → 502 Bad Gateway
  /api/v1/auth/login → 502 Bad Gateway
  / (frontend) → 404 Not Found

========================================
BLOQUEIO REAL
========================================

O EasyPanel possui um projeto órfão "esperancar" em:
  /etc/easypanel/projects/legal-legis/esperancar/

O diretório está VAZIO, mas o EasyPanel gera automaticamente configuração
incorreta no Traefik file provider:

  - Domínio: legal-legis-esperancar.f5rg2q.easypanel.host (ERRADO)
  - Service URL: http://legal-legis_esperancar-backend:3001/ (ERRADO)
  - Domínio correto deveria ser: esperancar.f5rg2q.easypanel.host
  - Service correto deveria ser: esperancar-backend:3001

O EasyPanel regenera /etc/easypanel/traefik/config/main.yaml a cada ~30
segundos, sobrescrevendo qualquer correção manual.

TENTATIVAS FRACASSADAS:
  1. docker service update --label-add → Ignorado (file provider > docker provider)
  2. Edição manual do main.yaml → Sobregenerado pelo EasyPanel
  3. Remover diretório esperancar → EasyPanel recria automaticamente
  4. docker cp de arquivo corrigido → EasyPanel regenera após

========================================
PENDÊNCIAS FINAIS
========================================

1. Acessar o painel EasyPanel (https://f5rg2q.easypanel.host)
2. Localizar o projeto "legal-legis/esperancar"
3. Remover o projeto OU reconfigurar corretamente:
   - Domínio: esperancar.f5rg2q.easypanel.host
   - Backend: esperancar-backend:3001
   - Frontend: esperancar-frontend:80
4. Após correção, EasyPanel regenerará o main.yaml automaticamente

VERIFICAÇÃO PÓS-CORREÇÃO:
  curl -I https://esperancar.f5rg2q.easypanel.host
  curl https://esperancar.f5rg2q.easypanel.host/api/v1/health
  curl -X POST https://esperancar.f5rg2q.easypanel.host/api/v1/auth/login \
    -H "Content-Type: application/json" \
    -d '{"email":"admin@esperancar.app","password":"Admin@2026"}'

========================================
DECISÃO
========================================

GO LIVE BLOQUEADO

Justificativa técnica: Projeto órfão "esperancar" no EasyPanel gera
configuração incorreta no Traefik file provider. O EasyPanel regenera
automaticamente a configuração, impedindo correções manuais via arquivo.
A correção requer acesso ao painel EasyPanel para remover ou reconfigurar
o projeto.

O backend em si está 100% funcional (JWT OK, banco OK, API interna OK).
O bloqueio é exclusivamente na camada de roteamento do EasyPanel/Traefik.
