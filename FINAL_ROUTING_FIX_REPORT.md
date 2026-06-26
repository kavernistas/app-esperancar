FINAL ROUTING FIX REPORT — ESPERANÇAR
=========================================
Data: 2026-06-24
Objetivo: Remover configuração órfã do EasyPanel

========================================
DIAGNÓSTICO
========================================

PROBLEMA:
  O domínio https://esperancar.f5rg2q.easypanel.host retorna:
    - / (frontend) → 404 Not Found
    - /api/* → 502 Bad Gateway

CAUSA RAIZ:
  O EasyPanel possui um projeto órfão "esperancar" em:
    /etc/easypanel/projects/legal-legis/esperancar/
  
  O diretório está VAZIO (sem Dockerfile, sem docker-compose.yml).
  Mas o EasyPanel gera automaticamente config no Traefik file provider
  para qualquer diretório em /etc/easypanel/projects/legal-legis/
  
  O EasyPanel regenera /etc/easypanel/traefik/config/main.yaml
  a cada ~30 segundos, sobrescrevendo qualquer correção manual.

ENTRADAS ÓRFÃS NO main.yaml:
  Routers:
    - http-legal-legis_esperancar-0
      rule: Host(`legal-legis-esperancar.f5rg2q.easypanel.host`) && PathPrefix(`/`)
      service: legal-legis_esperancar-0
      priority: 0
    
    - https-legal-legis_esperancar-0
      rule: Host(`legal-legis-esperancar.f5rg2q.easypanel.host`) && PathPrefix(`/`)
      service: legal-legis_esperancar-0
      priority: 0
      tls: certResolver: letsencrypt

  Service:
    - legal-legis_esperancar-0
      url: http://legal-legis_esperancar:80/  ← HOSTNAME INEXISTENTE

PROBLEMAS:
  1. Domínio errado: "legal-legis-esperancar.f5rg2q.easypanel.host"
     Deveria ser: "esperancar.f5rg2q.easypanel.host"
  
  2. Hostname errado: "legal-legis_esperancar:80"
     Deveria ser: "esperancar-backend:3001"
  
  3. Prioridade 0: O router /api compete com routers de menor prioridade
  
  4. EasyPanel regenera: Correções manuais são sobrescritas

========================================
TENTATIVAS DE CORREÇÃO
========================================

1. ❌ docker service update --label-add (Swarm labels)
   Ignoradas porque file provider tem prioridade sobre Docker provider

2. ❌ Edição manual de /etc/easypanel/traefik/config/main.yaml
   Sobrescrita pelo EasyPanel em ~30 segundos

3. ❌ Remover diretório /etc/easypanel/projects/legal-legis/esperancar
   EasyPanel recria o diretório automaticamente

4. ❌ docker cp de arquivo corrigido para o container
   EasyPanel regenera após o copy

========================================
CORREÇÃO NECESSÁRIA (VIA EASYPANEL)
========================================

O EasyPanel precisa ser acessado via painel web para:
1. Remover o projeto "esperancar" do EasyPanel
   - Ou renomear para o domínio correto
   - Ou configurar corretamente o domínio e URL

2. Alternativa: Acessar o EasyPanel e recriar o projeto "esperancar"
   com as configurações corretas:
   - Domínio: esperancar.f5rg2q.easypanel.host
   - Backend: esperancar-backend:3001
   - Frontend: esperancar-frontend:80

3. Ou simplesmente remover o projeto "esperancar" do EasyPanel
   para que ele pare de gerar config órfã, e deixar os serviços Swarm
   (que têm labels Traefik corretos) funcionarem via Docker provider.

========================================
ESTADO ATUAL DOS SERVIÇOS SWARM
========================================

  esperancar-backend  → 1/1 Running, healthy
    Labels Traefik: ✅ Corretas (mas ignoradas pelo file provider)
    IP: 10.0.1.148
    Porta: 3001

  esperancar-frontend → 1/1 Running, healthy
    Labels Traefik: ✅ Corretas (mas ignoradas pelo file provider)
    IP: 10.0.1.144
    Porta: 80

  esperancar-postgres → 1/1 Running, healthy
  esperancar-redis    → 1/1 Running, healthy

  Internamente:
    http://esperancar-backend:3001/api/v1/health → 200 OK ✅
    http://esperancar-frontend:80 → 200 OK ✅

  Externamente (via Traefik):
    https://esperancar.f5rg2q.easypanel.host/api/v1/health → 502 ❌
    https://esperancar.f5rg2q.easypanel.host/ → 404 ❌

========================================
AÇÕES PENDENTES
========================================

AÇÃO REQUERIDA: Acessar o painel EasyPanel e:
  1. Localizar o projeto "legal-legis/esperancar"
  2. Remover OU corrigir as configurações:
     - Domínio: esperancar.f5rg2q.easypanel.host
     - Backend URL: http://esperancar-backend:3001
     - Frontend URL: http://esperancar-frontend:80
  3. Após correção, o EasyPanel regenerará o main.yaml automaticamente

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

Causa técnica: Projeto órfão "esperancar" no EasyPanel gera configuração
incorrema no Traefik file provider (domínio e hostname errados). O EasyPanel
regenera a configuração automaticamente, impedindo correções manuais via
arquivo de configuração.

A correção requer acesso ao painel EasyPanel para remover ou reconfigurar
o projeto "esperancar".
