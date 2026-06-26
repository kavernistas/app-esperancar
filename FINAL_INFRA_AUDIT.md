FINAL INFRA AUDIT — ESPERANÇAR
=================================
Data: 2026-06-23
Escopo: Frontend, Nginx, Traefik, Roteamento

========================================
ETAPA 1 - FRONTEND
========================================

SERVIÇO: esperancar-frontend
  Status:        Running (1/1) — Completed
  Replicas:      1/1
  Image:         127.0.0.1:5000/esperancar-frontend:latest
  Rede:         easypanel-legal-legis
  IP:            10.0.1.144
  Porta:         80

LABELS TRAEFIK:
  traefik.enable=true
  traefik.http.routers.esperancar-frontend.entrypoints=https
  traefik.http.routers.esperancar-frontend.priority=10
  traefik.http.routers.esperancar-frontend.rule=Host(`esperancar.f5rg2q.easypanel.host`) && PathPrefix(`/`)
  traefik.http.routers.esperancar-frontend.tls=true
  traefik.http.services.esperancar-frontend.loadbalancer.server.port=80
  traefik.docker.network=easypanel-legal-legis

LOGS:
  ✅ nginx iniciou sem erros
  ✅ Configuration complete; ready for start up

TESTE INTERNO:
  curl -I http://esperancar-frontend:80 → HTTP/1.1 200 OK ✅

VEREDICT: ✅ FRONTEND SAUDÁVEL (internamente)

========================================
ETAPA 2 - NGINX
========================================

ARQUIVO: /etc/nginx/conf.d/default.conf
  ✅ Sem "worker_processes" indevido
  ✅ Sem bloco "events {}"
  ✅ Server block correto na porta 80
  ✅ root /usr/share/nginx/html
  ✅ try_files $uri $uri/ /index.html
  ✅ Cache para assets com hash
  ✅ Headers de segurança

VEREDICT: ✅ NGINX CONFIGURADO CORRETAMENTE

========================================
ETAPA 3 - TRAEFIK
========================================

CONFIG: /etc/easypanel/traefik/config/main.yaml
  Provider: file (directory=/data/config, watch=true)
  Provider: docker (exposedByDefault=false)

PROBLEMAS ENCONTRADOS:

  [CRÍTICO] Service URL errado:
    Service: legal-legis_esperancar-0
    URL atual: http://legal-legis_esperancar:3001/
    URL correto: http://esperancar-backend:3001/
    Problema: Hostname "legal-legis_esperancar" não existe no Swarm

  [CRÍTICO] Service frontend ausente:
    Nenhum service "legal-legis_esperancar-frontend-0" no config
    O frontend não é roteado pelo Traefik

  [CRÍTICO] Routers frontend ausentes:
    Nenhum router para PathPrefix(/)
    O frontend não é acessível externamente

  [CRÍTICO] Prioridade errada:
    Router /api tem priority=0
    Precisa ter priority > 100 para ser avaliado antes de /

  [CRÍTICO] EasyPanel sobrescreve config:
    Arquivo modificado em 20:11 (após correção manual às 19:46)
    EasyPanel regenera periodicamente, perdendo correções

VEREDICT: ❌ TRAEFIK QUEBRADO

========================================
ETAPA 4 - ROTEAMENTO
========================================

TESTES EXTERNOS:
  curl https://esperancar.f5rg2q.easypanel.host/ → 404 (Not Found)
  curl https://esperancar.f5rg2q.easypanel.host/api/v1/health → 502 (Bad Gateway)
  curl https://esperancar.f5rg2q.easypanel.host/api/v1/auth/login → 502

TESTE INTERNO (bypass Traefik):
  http://esperancar-frontend:80 → 200 OK ✅
  http://esperancar-backend:3001/api/v1/health → 200 OK ✅

DIAGNÓSTICO:
  - Frontend e Backend são saudáveis internamente
  - O problema está NO TRAEFIK (file provider)
  - O EasyPanel gerou o service URL com hostname errado
  - O Docker provider (labels) é ignorado porque file provider tem prioridade
  - Mesmo com labels corretas no Swarm, o file provider sobrescreve

========================================
CAUSA RAIZ ÚNICA
========================================

O EasyPanel criou o service "legal-legis_esperancar-0" no Traefik file provider
com URL "http://legal-legis_esperancar:3001/" mas o hostname "legal-legis_esperancar"
não existe no Docker Swarm. O serviço real se chama "esperancar-backend".

Como o Traefik file provider tem prioridade sobre o Docker provider, as labels
Traefik aplicadas nos serviços Swarm são ignoradas para serviços que já estão
definidos no file provider.

Além disso:
- O EasyPanel NÃO criou o service/router para o frontend
- O EasyPanel regenera o main.yaml periodicamente, impedindo correções manuais

========================================
CORREÇÃO EXATA
========================================

Opção A (RECOMENDADA — via EasyPanel):
  1. Acessar painel EasyPanel
  2. Editar o serviço "esperancar-backend"
  3. Corrigir o hostname do backend para "esperancar-backend" (nome real no Swarm)
  4. Criar o serviço "esperancar-frontend" apontando para "esperancar-frontend:80"
  5. Adicionar router para "/" com certResolver letsencrypt

Opção B (NÃO RECOMENDADA — manual):
  Editar /etc/easypanel/traefik/config/main.yaml e:
  1. Trocar "http://legal-legis_esperancar:3001/" → "http://esperancar-backend:3001/"
  2. Adicionar service "legal-legis_esperancar-frontend-0" → "http://esperancar-frontend:80/"
  3. Adicionar routers http/https para frontend (priority 10)
  4. Aumentar prioridade do router /api para 100
  ⚠️ Esta correção será sobrescrita pelo EasyPanel na próxima regeneração

Opção C (ALTERNATIVA — desativar file provider para esperancar):
  Remover os routers/serviços do esperancar do file provider e deixar
  o Docker provider (labels) gerenciar. Mas isso requer mexer na config
  do EasyPanel, o que é proibido.

========================================
DECISÃO FINAL
========================================

1. Frontend saudável? SIM (internamente)
2. Traefik saudável? NÃO (service URL errado + frontend ausente)
3. Domínio roteado? NÃO (502 e 404)
4. Causa raiz única: EasyPanel gerou Traefik config com hostname errado
5. Correção exata: Corrigir via painel EasyPanel

SISTEMA COM PENDÊNCIAS — GO LIVE BLOQUEADO

BLOQUEIO: Configuração do Traefik gerenciada pelo EasyPanel está incorreta.
A correção deve ser feita via painel EasyPanel para persistir.
