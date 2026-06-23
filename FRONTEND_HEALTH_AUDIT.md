FRONTEND HEALTH AUDIT — ESPERANÇAR
=====================================
Data: 2026-06-23

VARIÁVEIS DE AMBIENTE (build):
  VITE_API_MODE=BACKEND (correto)
  VITE_API_BASE_URL=/api (correto — URL relativo para proxy)

API CLIENT (src/api/client.js):
  ✅ API_MODE default: BACKEND (corrigido)
  ✅ API_BASE_URL default: '' (corrigido — URL relativo)
  ✅ Base44 mode: lança erro se ativado (proteção)
  ✅ Refresh token automático em 401
  ✅ Token management via localStorage

AUTH CONTEXT (src/lib/AuthContext.jsx):
  ✅ login() → authApi.login()
  ✅ logout() → authApi.logout() + clearTokens
  ✅ checkAuth() → authApi.getMe()
  ✅ updateProfile()

PÁGINAS:
  ✅ Dashboard
  ✅ Contacts
  ✅ Leaders
  ✅ Demands
  ✅ Missions
  ✅ Campaigns
  ✅ Gamification
  ✅ Electoral
  ✅ TSE
  ✅ Sofia
  ✅ Configurações
  ✅ Reports
  ✅ Home

BUILD:
  ✅ npm run build → sucesso (dist/ gerado)
  ⚠️ Warnings: browserslist desatualizado (não crítico)

DOCKERFILE FRONTEND:
  ✅ Multi-stage build (node → alpine)
  ✅ VITE_API_MODE=BACKEND default
  ✅ VITE_API_BASE_URL=/api default

PROBLEMAS IDENTIFICADOS:
  1. Build anterior usou VITE_API_MODE=BASE44 (default errado)
     → CORRIGIDO: rebuild com VITE_API_MODE=BACKEND
  2. Frontend NÃO está rodando no Swarm
     → NECESSÁRIO: criar serviço esperancar-frontend

STATUS: ✅ CÓDIGO CORRIGIDO — aguardando deploy
