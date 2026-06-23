ROUTE/PROXY AUDIT — ESPERANÇAR
=================================
Data: 2026-06-23

ARQUITETURA DE PRODUÇÃO:
  Traefik (easypanel-traefik) → Portas 80/443
  Backend (esperancar-backend) → Porta 3001 (rede interna)

TRAFEK ROUTERS (relevantes para esperancar.f5rg2q.easypanel.host):
  Router: http-legal-legis_esperancar-0
    Rule: Host(esperancar.f5rg2q.easypanel.host) && PathPrefix(/api)
    Service: legal-legis_esperancar-0
    Entrypoint: http

  Router: https-legal-legis_esperancar-0
    Rule: Host(esperancar.f5rg2q.easypanel.host) && PathPrefix(/api)
    Service: legal-legis_esperancar-0
    Entrypoint: https

SERVIÇO TRAEFIK:
  Name: legal-legis_esperancar-0
  URL:  http://legal-legis_esperancar:3001/
  Status: 502 Bad Gateway

**PROBLEMA RAIZ:**
  O Traefik file provider criou o serviço "legal-legis_esperancar-0"
  apontando para hostname "legal-legis_esperancar:3001".
  Mas o serviço real no Docker Swarm se chama "esperancar-backend".
  O hostname "legal-legis_esperancar" não existe no Swarm.
  
  Resultado: 502 Bad Gateway (Traefik não consegue conectar).

TESTE EXTERNO:
  curl https://esperancar.f5rg2q.easypanel.host/api/health → 502
  curl https://esperancar.f5rg2q.easypanel.host/api/auth/login → "Service is not reachable"

ROTAS ESPERADAS (após correção):
  /api/health           → 200 {status:"ok"}
  /api/v1/auth/login    → 200 {accessToken, refreshToken, user}
  /api/v1/auth/refresh  → 200
  /api/v1/contacts      → 200 (com auth)
  /api/v1/leaders       → 200 (com auth)
  /api/v1/demands       → 200 (com auth)
  /api/v1/missions      → 200 (com auth)

FRONTEND:
  ❌ Serviço esperancar-frontend NÃO existe no Swarm
  ❌ Nenhum router para "/" (raiz) no domínio esperancar
  ❌ Frontend não é servido

STATUS: ❌ CRÍTICO — API inacessível externamente, frontend não deployado
