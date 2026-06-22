# MIGRATION REPORT — Base44 → Backend Proprio
# Projeto: Plataforma Politica Esperancar
# Data: 2026-06-22

---

## 1. VISAO GERAL DO PROJETO

- **Nome**: Plataforma Politica Esperancar (Esperancar)
- **Stack Frontend**: React 18 + Vite 6 + Tailwind CSS + Radix UI + shadcn/ui
- **Stack Backend Atual**: Base44 (BaaS) — entities, functions, auth, integrations
- **Stack Backend Alvo**: NestJS + PostgreSQL + Prisma + JWT
- **App ID Base44**: 6927a32c597892cda17b4136
- **Total arquivos fonte**: ~120 JS/JSX files
- **Total entidades Base44**: 17
- **Total functions Base44**: 14
- **Total integrations Base44 usadas**: 6 (InvokeLLM, UploadFile, SendEmail, SendSMS, GenerateImage, ExtractDataFromUploadedFile)

---

## 2. DEPENDENCIAS BASE44 ENCONTRADAS

### 2.1 Pacotes NPM
| Pacote | Versao | Uso |
|--------|--------|-----|
| @base44/sdk | ^0.8.32 | Client principal — createClient, auth, entities, functions, integrations |
| @base44/vite-plugin | ^1.0.23 | Plugin Vite — legacySDKImports, resolucao de imports @/integrations, @/entities |

### 2.2 SDK Imports no Codigo
| Arquivo | Import | Tipo |
|---------|--------|------|
| src/api/base44Client.js | createClient from '@base44/sdk' | Client principal |
| src/lib/AuthContext.jsx | createAxiosClient from '@base44/sdk/dist/utils/axios-client' | HTTP client para public settings |

### 2.3 Plugin Vite
| Arquivo | Config |
|---------|--------|
| vite.config.js | base44({ legacySDKImports: process.env.BASE44_LEGACY_SDK_IMPORTS === 'true' }) |

---

## 3. ENTIDADES BASE44 MAPEADAS (17 total)

### 3.1 Entidades e seus campos principais

| Entidade | Campos | Required | RLS Roles |
|----------|--------|----------|-----------|
| **Contact** | full_name, phone, email, cep, city, neighborhood, address_street, address_number, electoral_zone, electoral_section, voting_location, position, segment, support_intent, contact_authorized, is_leader, vote_goal, converted_by_leader_id, converted_by_leader_name, engagement_level, visual_no_carro, visual_na_residencia, tags[], notes, interactions[], created_by_leader_id, created_by_leader_name, latitude, longitude, status | full_name | admin, coordenador, lideranca |
| **Leader** | name, phone, email, city, neighborhood, electoral_zone, supporters_count, political_strength, monthly_goal, conversions, actions_completed, segment, notes, photo_url, status | name | admin, coordenador, lideranca |
| **Demand** | title, protocol, type, description, requester_name, requester_phone, requester_email, address, city, neighborhood, latitude, longitude, priority, status, responsible, due_date, closed_date, photo_url, supporter_id, supporter_name, created_by_leader_id, created_by_leader_name, history[] | title, type | admin, coordenador |
| **Mission** | title, description, type, neighborhood, city, leader_id, leader_name, deadline, priority, points, status, evidence, evidence_url, completed_date, notified_at, reminded_at, congratulated_at, parent_mission_id, is_group_mission, assignment_type, assignment_filters, total_recipients, completed_recipients, segment, checklist[] | title | admin, coordenador |
| **GamificationProfile** | leader_id, leader_name, neighborhood, city, total_points, current_level, badges[], missions_completed, missions_pending, missions_overdue, supporters_registered, leaders_converted, visual_carros, visual_residencias, demands_resolved, vote_goal, votes_achieved, weekly_points, monthly_points, last_level_up_at, last_activity_at, week_start, month_start | leader_id | admin, propio lider |
| **Campaign** | name, type, year, position, candidate_name, party, coalition, vote_goal, current_votes_estimate, budget, status, start_date, end_date | name | admin |
| **Notification** | user_id, title, message, type, link, entity_id, read | user_id, title, message | admin, coordenador, propio user |
| **StrategicAction** | title, description, type, city, neighborhood, start_date, end_date, responsible, goal, expected_reach, actual_reach, status, budget, notes | title | admin, coordenador, lideranca |
| **ElectoralData** | city, neighborhood, electoral_zone, electoral_section, voting_location, year, position, candidate_name, votes, total_voters, latitude, longitude, heat_level | city, neighborhood | admin, coordenador |
| **AuditLog** | user_id, user_name, action, entity, entity_id, entity_label, changes, ip_address, user_agent, module, severity, metadata | action, entity | admin only |
| **TSECandidate** | ano, uf, municipio, cargo, numero, nome, partido, situacao, tse_resource_id | ano, uf, numero | admin, coordenador |
| **TSEDataSourceMap** | ano, uf, dataset_tipo, fonte_url, formato, status, tamanho_estimado, observacao | ano, uf, dataset_tipo | admin, coordenador |
| **TSEElectorateProfile** | ano, uf, municipio, zona, secao, genero, faixa_etaria, escolaridade, quantidade | ano, uf | admin, coordenador |
| **TSEImportJob** | ano, uf, municipio, dataset_tipo, file_url, csv_cache_url, status, progresso, total_linhas_arquivo, linhas_processadas, registros_importados, registros_duplicados, linha_offset, velocidade, tempo_estimado, inicio, fim, ultima_atividade, erro, etapa, tamanho_arquivo_mb | ano, uf, dataset_tipo, file_url | admin, coordenador |
| **TSEPollingPlace** | ano, uf, municipio, zona, secao, local_votacao, endereco, bairro | ano, uf | admin, coordenador |
| **TSESyncStatus** | ano, uf, tipo_dataset, status, total_linhas, data_ultima_sincronizacao, fonte_url, mensagem_erro | ano, uf, tipo_dataset | admin, coordenador |
| **TSEVoteResult** | ano, turno, uf, municipio, codigo_municipio, zona, secao, cargo, numero_candidato, nome_candidato, partido, votos, local_votacao | ano, uf, cargo | admin, coordenador |
| **WhatsAppLog** | campaign_id, recipient_name, recipient_phone, recipient_type, template_name, message_content, status, sent_by_id, sent_by_name, error_message, metadata | recipient_phone | admin, coordenador, lideranca |

### 3.2 Relacionamentos entre entidades
- Contact.created_by_leader_id → Leader
- Contact.converted_by_leader_id → Leader
- Mission.leader_id → Leader
- GamificationProfile.leader_id → Leader
- Demand.supporter_id → Contact
- Demand.created_by_leader_id → Leader
- Notification.user_id → User
- WhatsAppLog.campaign_id → Campaign
- TSEImportJob.file_url → UploadFile (Base44)

---

## 4. FUNCTIONS BASE44 MAPEADAS (14 total)

| Function | Auth | Acao | Entidades afetadas |
|----------|------|------|-------------------|
| **backupRestore** | admin | backup, backup_all, status, restore | Todas as 17 entidades |
| **checkOverdueDemands** | admin, coordenador | Notifica demandas vencidas | Demand, Notification, User |
| **exportMapPDF** | admin, coordenador | Gera PDF do mapa eleitoral | ElectoralData, Contact |
| **gamificationEngine** | Sistema | Calcula pontos, niveis, badges, cascata hierarquica | GamificationProfile, Leader, Mission |
| **markOverdueMissions** | admin, coordenador | Marca missoes vencidas | Mission |
| **receiveTSEBatch** | Shared Secret | Recebe lotes ETL do servico externo | TSEVoteResult, TSEImportJob |
| **sofiaAnalysis** | admin, coordenador | Analise IA de dados TSE | InvokeLLM |
| **tseApiQuery** | admin, coordenador | Consulta API TSE local | TSESyncStatus, TSEVoteResult |
| **tseDataSync** | admin | Query, status, resolve_source, dedup | TSESyncStatus, TSEDataSourceMap, TSEVoteResult |
| **tseImport** | admin | Preview/importacao eleitores | Contact |
| **tseQueryLocal** | admin, coordenador | Consulta local TSE | TSESyncStatus, TSEVoteResult |
| **tseResolveSource** | admin | Resolve URL CDN TSE | TSEDataSourceMap |
| **weeklyMaintenance** | admin | weekly_ranking, weekly_goals, check_inactive_leaders | GamificationProfile, Leader |
| **whatsappSend** | Autenticado | Envia WhatsApp com rate-limiting | WhatsAppLog, Contact |

---

## 5. INTEGRACOES BASE44 USADAS (6 total)

| Integration | Onde e usado | Arquivos |
|-------------|-------------|----------|
| **InvokeLLM** | Sofia IA — analise politica, gamification insights, missoes recomendacoes | src/api/integrations.js, src/components/electoral/SofiaInsight.jsx, src/components/gamification/SofiaGamificationInsight.jsx, src/components/gamification/SofiaMissionRecommendation.jsx, src/components/portal/SofiaPortal.jsx, base44/functions/sofiaAnalysis/entry.ts |
| **UploadFile** | Upload de fotos/arquivos — demandas, configuracoes, evidencias | src/api/integrations.js, src/components/portal/CadastrarDemanda.jsx, src/pages/Configuracoes.jsx |
| **SendEmail** | Email de notificacoes (demandas vencidas) | src/api/integrations.js, base44/functions/checkOverdueDemands/entry.ts |
| **SendSMS** | SMS (declarado, pouco usado) | src/api/integrations.js |
| **GenerateImage** | Geracao de imagens IA | src/api/integrations.js |
| **ExtractDataFromUploadedFile** | Extracao de dados de arquivos | src/api/integrations.js |

---

## 6. AUTENTICACAO BASE44

### 6.1 Fluxo atual
1. app-params.js le VITE_BASE44_APP_ID, VITE_BASE44_BACKEND_URL, access_token
2. base44Client.js cria client com createClient({ appId, serverUrl, token, requiresAuth: false })
3. AuthContext.jsx usa createAxiosClient para public-settings e base44.auth.me() para user
4. Login/logout via base44.auth.redirectToLogin() e base44.auth.logout()
5. User profile atualizado via base44.auth.updateMe()

### 6.2 Campos do User (Base44)
- id, email, full_name, phone, role, profile (metadata)
- avatar_url, lgpd_consent, notif_email, sofia_enabled, ui_dark_mode
- whatsapp_status, metas

### 6.3 RBAC atual (AccessControl.jsx)
- **admin**: acesso total
- **coordenador**: inteligencia, contacts, leaders, demands, missions, gamification, reports, portal_lideranca
- **lideranca**: apenas portal_lideranca
- **user**: inteligencia, contacts, demands

---

## 7. ARQUIVOS AFETADOS (por categoria)

### 7.1 Core/Base44 (remover completamente)
- src/api/base44Client.js
- src/api/entities.js
- src/api/integrations.js
- src/lib/app-params.js
- src/lib/AuthContext.jsx
- src/lib/PageNotFound.jsx (parcial)
- vite.config.js (plugin base44)
- base44/ (diretorio inteiro)

### 7.2 Pages (substituir chamadas Base44)
- src/pages/Contacts.jsx — Contact.list, .create, .update, .delete
- src/pages/Leaders.jsx — Leader.list, .create, .update, .delete
- src/pages/Demands.jsx — Demand.list, .create, .update, .delete
- src/pages/MissionCenter.jsx — Mission.list, .create, .update, .delete
- src/pages/MissionDetail.jsx — Mission, GamificationProfile
- src/pages/Gamification.jsx — GamificationProfile, Leader, Mission, functions.invoke
- src/pages/Campaigns.jsx — Campaign
- src/pages/Dashboard.jsx — Contact, Demand, Leader, StrategicAction
- src/pages/Reports.jsx — Contact, Demand, ElectoralData, Leader, StrategicAction
- src/pages/ElectoralMap.jsx — Contact, Demand, ElectoralData, Leader
- src/pages/StrategicPlanning.jsx — StrategicAction
- src/pages/Configuracoes.jsx — base44.auth.me, .updateMe, .logout, UploadFile
- src/pages/SaudeSistema.jsx — AuditLog, Leader, Mission, functions.invoke
- src/pages/InteligenciaEleitoral.jsx — Contact, Demand, GamificationProfile, Leader, Mission, StrategicAction, functions.invoke
- src/pages/DiagnosticoTSE.jsx — functions.invoke
- src/pages/ElectoralConsult.jsx — functions.invoke
- src/pages/PortalLideranca.jsx — base44.auth.me, .updateMe, Contact, Demand, GamificationProfile, Mission, functions.invoke

### 7.3 Components (substituir chamadas Base44)
- src/Layout.jsx — base44.auth.me, .logout, Notification.list, .update
- src/components/contacts/ContactMissionList.jsx — Mission
- src/components/contacts/IntegracaoCRMPanel.jsx — Contact, Demand, Leader, Mission
- src/components/electoral/InteligenciaDashboard.jsx — Contact, Demand, Leader, Mission
- src/components/electoral/WhatsAppModal.jsx — Contact
- src/components/gamification/WhatsAppMissionModal.jsx — Mission
- src/components/electoral/SofiaInsight.jsx — InvokeLLM
- src/components/gamification/SofiaGamificationInsight.jsx — InvokeLLM
- src/components/gamification/SofiaMissionRecommendation.jsx — InvokeLLM
- src/components/portal/SofiaPortal.jsx — InvokeLLM
- src/components/portal/CadastrarDemanda.jsx — UploadFile
- src/components/integrations/TSEImportModal.jsx — functions.invoke
- src/components/integrations/WhatsAppModal.jsx — functions.invoke, Contact

---

## 8. RISCOS IDENTIFICADOS

### 8.1 Risco CRITICO
1. **Auth completamente acoplado ao Base44** — Todo o fluxo de login/logout/user passa pelo SDK. Migrar requer reimplementar JWT + refresh token + RBAC do zero.
2. **RLS (Row Level Security) do Base44** — As entidades tem regras RLS embutidas (user_condition, created_by_id, etc). No backend proprio, isso precisa ser implementado manualmente nos controllers/services.
3. **Functions serverless em Deno** — 14 functions rodam em Deno (Base44). Precisam ser reescritas como endpoints NestJS ou jobs.
4. **InvokeLLM abstraido** — Sofia IA usa base44.integrations.Core.InvokeLLM que e um wrapper. Precisa de adaptador configuravel.

### 8.2 Risco ALTO
5. **Sem banco de dados visivel** — O Base44 gerencia o banco internamente. Migrar requer criar schema do zero e importar dados.
6. **Sem API REST documentada** — Tudo via SDK. Nao ha endpoints HTTP para migrar diretamente.
7. **UploadFile abstraido** — Uploads vao para storage do Base44. Precisa implementar storage proprio.
8. **Notificacoes em tempo real** — Notification entity usada para notificacoes. No backend proprio, considerar WebSocket ou polling.

### 8.3 Risco MEDIO
9. **Cache do React Query** — Frontend usa @tanstack/react-query com queryKeys. A camada de API precisa manter compatibilidade.
10. **Paginacao inconsistente** — Alguns list() usam limite fixo (500, 1000). Backend proprio precisa paginacao real.
11. **Filtros via SDK** — Filtros como { status: { $ne: 'resolved' } } sao do SDK Base44. No backend, usar query params REST.
12. **ElectoralData pode ser grande** — Dados TSE podem ter milhoes de registros. Importacao via receiveTSEBatch precisa de fila robusta.

### 8.4 Risco BAIXO
13. **UI/UX nao muda** — Apenas camada de dados sera substituida.
14. **Componentes shadcn/ui** — Nao dependem do Base44, nao precisam mudar.
15. **Rotas React Router** — Nao dependem do Base44.

---

## 9. PLANO DE MIGRACAO (14 Fases)

### Fase 0 — Auditoria (ESTA FASE)
- Mapear todas dependencias Base44
- Gerar MIGRATION_REPORT.md e DEPENDENCY_MAP.md
- **Status**: Em andamento

### Fase 1 — Inventario de Dependencias
- Detalhar cada ponto de uso com arquivo/funcao/entidade/risco
- Gerar DEPENDENCY_MAP.md

### Fase 2 — Criar Backend Proprio
- Estrutura NestJS + Prisma
- Modulos: auth, users, contacts, leaders, demands, missions, campaigns, gamification, electoral, tse, notifications, audit, whatsapp, sofia, files, common, jobs

### Fase 3 — Modelagem Banco de Dados
- Schema Prisma com todas as 17 entidades + User, Role, Permission, RefreshToken, File, SystemConfig
- Migrations

### Fase 4 — Autenticacao
- JWT access + refresh token
- RBAC: admin, coordenador, lideranca, operador, user
- Auditoria de login/logout

### Fase 5 — CRUD das Entidades
- APIs REST com paginacao, filtros, ordenacao, busca, soft delete, auditoria

### Fase 6 — Modulo TSE
- Endpoints /api/tse/*
- Cache, fila de importacao, logs

### Fase 7 — Sofia IA
- Adaptadores: OpenAI, Ollama, Hermes, OpenRouter, NVIDIA
- Historico de prompts, cache, logs

### Fase 8 — WhatsApp
- Integracao Evolution API
- Dashboard de monitoramento

### Fase 9 — Storage
- Local, MinIO, Cloudflare R2, S3
- Selecionavel via ENV

### Fase 10 — Jobs e Automacoes
- BullMQ + Redis ou node-cron
- Painel administrativo

### Fase 11 — Adaptador Frontend
- src/api/client.js, src/api/auth.js, src/api/contacts.js, etc.
- Camada de compatibilidade com toggle VITE_API_MODE

### Fase 12 — Migracao Gradual
- Ordem: Auth → Contacts → Leaders → Demands → Missions → Campaigns → Notifications → Gamification → Electoral → TSE → WhatsApp → Sofia

### Fase 13 — Remocao Base44
- Apos 100% dos modulos funcionando e testados

### Fase 14 — Producao
- docker-compose.prod.yml, backup, restore, healthcheck, monitoramento, rollback

---

## 10. ESFORCO ESTIMADO

| Fase | Complexidade | Tempo Estimado |
|------|-------------|----------------|
| Fase 0-1 | Media | 1-2 dias |
| Fase 2-3 | Alta | 3-5 dias |
| Fase 4 | Alta | 2-3 dias |
| Fase 5 | Muito Alta | 5-7 dias |
| Fase 6 | Alta | 3-4 dias |
| Fase 7 | Media | 2-3 dias |
| Fase 8 | Media | 2-3 dias |
| Fase 9 | Media | 1-2 dias |
| Fase 10 | Media | 2-3 dias |
| Fase 11 | Alta | 3-4 dias |
| Fase 12 | Muito Alta | 5-7 dias |
| Fase 13 | Baixa | 1 dia |
| Fase 14 | Media | 2-3 dias |
| **TOTAL** | | **32-47 dias** |

---

## 11. PROXIMOS PASSOS

1. Validar este relatorio com a equipe
2. Criar DEPENDENCY_MAP.md detalhado
3. Iniciar Fase 2 — criar estrutura do backend NestJS
