# ESPERANCAR V2 — DOCUMENTO DE ARQUITETURA
==========================================

## 1. Visão Geral

A Esperancar V2 é um Sistema Operacional Político de nível Enterprise.
Não é um CRM. É um ecossistema modular que unifica:

- CRM Político
- Inteligência Territorial
- Inteligência Eleitoral
- Gestão de Campanhas
- Gestão de Mandato
- Comunicação Omnichannel
- Inteligência Artificial
- Business Intelligence
- Gestão Financeira
- Gestão Documental
- Agenda e Eventos
- Integrações Externas

## 2. Princípios Arquiteturais

1. Domain-Driven Design — Cada módulo é um bounded context
2. Modularidade — Módulos independentes, comunicando-se via contratos
3. Separação de Camadas — Presentation → Application → Domain → Infrastructure
4. Single Source of Truth — Um modelo de dados por entidade
5. API-First — Todas as funcionalidades expostas via API
6. Event-Driven — Assincronia para operações pesadas
7. Zero Downtime — Deploy sem indisponibilidade
8. Observabilidade — Logs, métricas, traces em tudo
9. Segurança por Padrão — Autenticação, autorização, auditoria em todas as camadas
10. Mobile-First — UX responsiva, PWA, notificações push

## 3. Arquitetura de Camadas

```
┌─────────────────────────────────────────────────────────────┐
│                    PRESENTATION LAYER                        │
├─────────────────────────────────────────────────────────────┤
│  App Shell → Feature Modules → Pages → Components → UI Lib  │
│  React + Vite + Tailwind + shadcn/ui + Design System Tokens  │
├─────────────────────────────────────────────────────────────┤
│                    APPLICATION LAYER                         │
├─────────────────────────────────────────────────────────────┤
│  Hooks → Services → API Client → React Query Cache          │
├─────────────────────────────────────────────────────────────┤
│                      API GATEWAY                             │
├─────────────────────────────────────────────────────────────┤
│  Traefik (Rate Limit, SSL, Load Balance)                     │
├─────────────────────────────────────────────────────────────┤
│                    BACKEND LAYER                             │
├─────────────────────────────────────────────────────────────┤
│  Controllers → Application Services → Domain Services       │
├─────────────────────────────────────────────────────────────┤
│                    DOMAIN LAYER                              │
├─────────────────────────────────────────────────────────────┤
│  Entities → Value Objects → Domain Events → Repository I/F  │
├─────────────────────────────────────────────────────────────┤
│                 INFRASTRUCTURE LAYER                         │
├─────────────────────────────────────────────────────────────┤
│  Prisma → PostgreSQL │ Redis │ S3/MinIO │ Evolution API      │
└─────────────────────────────────────────────────────────────┘
```

## 4. Domínios (Bounded Contexts)

### 4.1 CORE Domain

Responsabilidades:
- Identity & Authentication (JWT, OAuth2, 2FA)
- Organizations (multi-tenant)
- Users & Profiles
- Permissions (RBAC + ABAC)
- System Config
- Health Check

Entidades:
- Organization
- User
- Role
- Permission
- ModulePermission
- SystemConfig
- Session

### 4.2 CRM POLÍTICO Domain

Responsabilidades:
- Gestão de Contatos (apoiadores, eleitores)
- Gestão de Lideranças
- Pipeline de Conversão
- Segmentação
- Score IA
- LGPD

Entidades:
- Contact
- Leader
- Segment
- Pipeline
- PipelineStage
- ContactInteraction
- ConsentRecord (LGPD)

### 4.3 INTELIGÊNCIA TERRITORIAL Domain

Responsabilidades:
- Mapas interativos
- Geolocalização
- Bairros, Zonas, Seções
- Pontos de interesse
- Rotas e visitas
- Heatmap de influência

Entidades:
- Municipality
- Neighborhood
- Zone
- Section
- PointOfInterest (escolas, UBS, CRAS, igrejas, etc.)
- Route
- Visit
- TerritorialData

### 4.4 INTELIGÊNCIA ELEITORAL Domain

Responsabilidades:
- Dados TSE (candidatos, votos, eleitorado)
- Importação ETL
- Diagnósticos
- Projeções
- Histórico eleitoral

Entidades:
- Election
- Candidate
- VoteResult
- ElectorateProfile
- PollingPlace
- DataSource
- ImportJob
- SyncStatus

### 4.5 COMUNICAÇÃO Domain

Responsabilidades:
- WhatsApp (Evolution API)
- Email
- SMS
- Notificações Push
- Templates
- Campanhas de broadcast
- Chatbot IA

Entidades:
- Message
- Conversation
- Contact
- Template
- Campaign
- Instance
- ChatFlow
- Notification

### 4.6 FINANCEIRO Domain

Responsabilidades:
- Receitas e despesas
- Centro de custo
- Fluxo de caixa
- Doações
- Prestação de contas
- Campanhas financeiras

Entities:
- Transaction
- Category
- CostCenter
- Budget
- Donation
- FinancialReport

### 4.7 AGENDA Domain

Responsabilidades:
- Eventos e compromissos
- Visitas
- Audiências
- Prazos
- Lembretes
- Google Calendar / Outlook sync

Entities:
- Event
- Attendee
- Reminder
- Calendar
- Task

### 4.8 DOCUMENTOS Domain (GED)

Responsabilidades:
- Upload e armazenamento
- Versionamento
- OCR
- IA resume
- Modelos
- Assinatura digital
- Protocolos

Entities:
- Document
- Folder
- Version
- Template
- Signature
- Protocol

### 4.9 IA Domain

Responsabilidades:
- AI Gateway (multi-provider)
- Agentes especializados
- Memória contextual
- Prompts e histórico
- Análise de sentimento
- Resumos automáticos
- Sugestões inteligentes

Entities:
- Agent
- Conversation
- Message
- Prompt
- Provider
- AIModel
- Embedding

### 4.10 ANALYTICS Domain

Responsabilidades:
- Dashboards configuráveis
- KPIs
- Gráficos
- Relatórios
- Predição IA
- Exportação

Entities:
- Dashboard
- Widget
- Report
- Metric
- DataExport

### 4.11 INTEGRAÇÕES Domain

Responsabilidades:
- Conectores externos
- Webhooks
- N8N workflows
- Google APIs
- TSE/IBGE/CNJ/DataSUS
- Receita Federal

Entities:
- Integration
- Webhook
- APIKey
- SyncLog
- ExternalData

## 5. Arquitetura de IA (AI Gateway)

```
┌──────────────────────────────────────────────┐
│                AI GATEWAY                     │
├──────────────────────────────────────────────┤
│  Router → Context Manager → Memory Manager   │
├──────────────────────────────────────────────┤
│              PROVIDERS                        │
│  OpenAI │ Gemini │ Claude │ Hermes │ Ollama   │
├──────────────────────────────────────────────┤
│               AGENTS                          │
│  ├── IA Jurídica (análise, pareceres)        │
│  ├── IA Política (estratégia, discurso)      │
│  ├── IA Marketing (copy, campanhas)          │
│  ├── IA Comunicação (resumos, respostas)     │
│  ├── IA Financeiro (análise, projeções)      │
│  ├── IA Territorial (mapas, segmentação)     │
│  ├── IA Estratégica (SWOT, planos)           │
│  ├── IA Legislativa (projetos, emendas)      │
│  ├── IA Redes Sociais (conteúdo, agenda)      │
│  ├── IA WhatsApp (bot, sentimento)           │
│  ├── IA TSE (dados, projeções)               │
│  ├── IA Projetos (planejamento, GUT)         │
│  └── IA Discursos (roteiro, oratória)        │
├──────────────────────────────────────────────┤
│              TOOLS                            │
│  Web Search │ Code Exec │ File Read │ API    │
└──────────────────────────────────────────────┘
```

Cada agente possui:
- System Prompt especializado
- Memória contextual (curto e longo prazo)
- Tools (funções que pode executar)
- Guardrails (limites de segurança)
- Logging de todas as interações

## 6. Modelagem de Dados (Proposta V2)

### 6.1 Core Tables

```sql
-- Multi-tenant
organizations (
  id, name, slug, plan, status, settings, created_at, updated_at
)

-- Usuários
users (
  id, org_id, email, password_hash, full_name, phone, avatar_url,
  role, profile, status, last_login_at, two_factor_enabled,
  preferences (jsonb), created_at, updated_at, deleted_at
)

-- Permissões granulares
roles (
  id, org_id, name, description, is_system, created_at
)

permissions (
  id, module, action, description
)

role_permissions (
  role_id, permission_id, created_at
)

user_roles (
  user_id, role_id, created_at
)

-- Configuração do sistema
system_configs (
  id, key, value (jsonb), description, updated_at
)

-- Sessões
sessions (
  id, user_id, token_hash, ip_address, user_agent,
  expires_at, created_at, revoked_at
)
```

### 6.2 CRM Político

```sql
contacts (
  id, org_id, full_name, phone, email, cep, city, neighborhood,
  address_street, address_number, electoral_zone, electoral_section,
  voting_location, position, segment, support_intent,
  contact_authorized, is_leader, vote_goal, engagement_level,
  tags, notes, interactions (jsonb), latitude, longitude,
  score_ai, pipeline_stage, created_by, created_at, updated_at, deleted_at
)

leaders (
  id, org_id, contact_id, name, phone, email, city, neighborhood,
  electoral_zone, supporters_count, political_strength, monthly_goal,
  conversions, actions_completed, segment, notes, photo_url,
  latitude, longitude, status, score_ai, created_at, updated_at, deleted_at
)

pipeline_stages (
  id, org_id, name, position, color, created_at
)

contact_interactions (
  id, contact_id, type, description, date, created_by, created_at
)

consent_records (
  id, contact_id, type, granted, ip_address, expires_at, created_at
)
```

### 6.3 Territorial

```sql
municipalities (
  id, ibge_code, name, uf, population, area, coordinates
)

neighborhoods (
  id, municipality_id, name, ibge_code, population, area,
  coordinates, socio_economic_data (jsonb)
)

zones (
  id, municipality_id, name, code, description, boundaries (jsonb)
)

sections (
  id, zone_id, name, code, polling_location_id, boundaries (jsonb)
)

points_of_interest (
  id, name, type, address, city, neighborhood,
  latitude, longitude, metadata (jsonb)
)

visits (
  id, leader_id, contact_id, date, address, latitude, longitude,
  notes, type, status, created_at
)

routes (
  id, name, leader_id, date, waypoints (jsonb), distance_km, duration_min
)
```

### 6.4 Eleitoral

```sql
elections (
  id, year, type, position, uf, municipality, status
)

candidates (
  id, election_id, name, number, party, coalition, situation,
  tse_resource_id, votes, created_at
)

vote_results (
  id, election_id, candidate_id, zone_id, section_id,
  votes, total_voters, turnout_percent
)

electorate_profiles (
  id, year, uf, municipality, zone, section,
  gender, age_group, education, quantity
)

import_jobs (
  id, year, uf, dataset_type, file_url, status,
  progress, total_lines, processed_lines, errors (jsonb),
  started_at, finished_at, created_at
)
```

### 6.5 Comunicação

```sql
conversations (
  id, org_id, contact_id, instance_id, status,
  last_message_at, assigned_to, tags, created_at, updated_at
)

messages (
  id, conversation_id, type, direction, content,
  media_url, status, sent_at, delivered_at, read_at, created_at
)

templates (
  id, org_id, name, category, content (jsonb),
  variables (jsonb), created_at, updated_at
)

campaigns (
  id, org_id, name, type, template_id, segment (jsonb),
  scheduled_at, sent_at, status, stats (jsonb), created_at
)

instances (
  id, org_id, name, type, status, qr_code, connected_at, created_at
)

notifications (
  id, user_id, type, title, message, link, entity_id,
  read, created_at
)
```

### 6.6 Financeiro

```sql
transactions (
  id, org_id, type, category_id, amount, date, description,
  cost_center_id, campaign_id, donor_id, recurring,
  attachments, created_by, created_at, updated_at
)

categories (
  id, org_id, name, type, parent_id, color, created_at
)

cost_centers (
  id, org_id, name, description, budget, created_at
)

budgets (
  id, org_id, cost_center_id, period, amount, spent, created_at
)

donations (
  id, org_id, contact_id, amount, date, method, recurring,
  receipt_url, created_at
)
```

### 6.7 IA

```sql
ai_agents (
  id, org_id, name, type, system_prompt, model, provider,
  temperature, max_tokens, tools (jsonb), status, created_at
)

ai_conversations (
  id, org_id, agent_id, user_id, title, context (jsonb),
  created_at, updated_at
)

ai_messages (
  id, conversation_id, role, content, tokens_used,
  model, provider, metadata (jsonb), created_at
)

ai_memory (
  id, org_id, entity_type, entity_id, content, embedding,
  metadata (jsonb), expires_at, created_at
)
```

## 7. Frontend Architecture

### 7.1 Estrutura de Pastas

```
src/
├── app/                    # App shell, providers, layouts
│   ├── providers/
│   ├── layouts/
│   └── routes/
├── domains/                # Feature modules por domínio
│   ├── core/
│   │   ├── auth/
│   │   ├── users/
│   │   └── permissions/
│   ├── crm/
│   │   ├── contacts/
│   │   ├── leaders/
│   │   └── pipeline/
│   ├── territorial/
│   ├── electoral/
│   ├── communication/
│   ├── financial/
│   ├── agenda/
│   ├── documents/
│   ├── ai/
│   └── analytics/
├── shared/                 # Código compartilhado
│   ├── components/         # UI components (Design System)
│   ├── hooks/
│   ├── services/           # API clients
│   ├── utils/
│   └── types/
└── styles/                 # Design tokens, themes
```

### 7.2 Padrão por Feature Module

```
domains/crm/contacts/
├── index.ts                # Public API
├── pages/
│   ├── ContactsPage.tsx
│   ├── ContactDetailPage.tsx
│   └── ContactFormPage.tsx
├── components/
│   ├── ContactCard.tsx
│   ├── ContactList.tsx
│   ├── ContactFilters.tsx
│   └── ContactPipeline.tsx
├── hooks/
│   ├── useContacts.ts
│   ├── useContact.ts
│   └── useContactMutations.ts
├── services/
│   └── contactsApi.ts
├── types/
│   └── contact.types.ts
└── utils/
    └── contact.helpers.ts
```

### 7.3 Design System

```
shared/components/
├── ui/                     # Base components (shadcn)
│   ├── button.tsx
│   ├── input.tsx
│   ├── card.tsx
│   ├── dialog.tsx
│   ├── table.tsx
│   └── ...
├── layout/
│   ├── AppShell.tsx
│   ├── Sidebar.tsx
│   ├── Header.tsx
│   └── Breadcrumb.tsx
├── data/
│   ├── DataTable.tsx
│   ├── DataCard.tsx
│   ├── FilterBar.tsx
│   └── EmptyState.tsx
├── feedback/
│   ├── Toast.tsx
│   ├── Alert.tsx
│   ├── Skeleton.tsx
│   └── LoadingState.tsx
└── form/
    ├── FormField.tsx
    ├── FormSelect.tsx
    ├── FormTextarea.tsx
    └── FormDate.tsx
```

### 7.4 Performance Strategy

- React.lazy + Suspense por rota
- Virtual lists para dados grandes (react-virtuoso)
- React Query com stale-time e cache otimista
- useMemo/useCallback em listas e formulários
- Code splitting por feature module
- Image lazy loading + WebP
- Service Worker para cache offline
- Compressão Brotli no nginx
- Redis cache no backend (queries frequentes)

## 8. Segurança

### 8.1 Autenticação
- JWT com access token (15min) e refresh token (7d)
- Refresh token rotation
- 2FA opcional (TOTP)
- Session management (listar/revogar sessões)
- Login attempt logging + rate limit

### 8.2 Autorização
- RBAC com 4 roles: admin, coordenador, lideranca, user
- ABAC para permissões granulares (ex: editar apenas sua região)
- Module-based permissions
- API-level guards

### 8.3 Proteção
- Helmet (security headers)
- CORS configurado explicitamente
- Rate limiting (global + per-endpoint)
- Input validation (class-validator em todos os DTOs)
- SQL injection protection (Prisma parameterized queries)
- XSS protection (React escape + CSP headers)
- CSRF tokens para mutations
- File upload validation (mime, size, virus scan)

### 8.4 Auditoria
- Log de todas as ações CRUD
- Log de autenticação (login, logout, refresh, fail)
- Log de mudanças de permissão
- Log de acesso a dados sensíveis
- Retenção configurável

### 8.5 LGPD
- Consentimento explícito por contato
- Right to be forgotten (hard delete + anonymize)
- Exportação de dados (portabilidade)
- Privacy dashboard para o titular
- Data retention policies

## 9. Observabilidade

### 9.1 Logs
- Structured logging (JSON)
- Correlation ID por request
- Log levels: debug, info, warn, error, critical
- Centralização via Redis → Logstash/Filebeat

### 9.2 Métricas
- Request duration (p50, p95, p99)
- Error rate por endpoint
- Active users
- Job execution stats
- Cache hit/miss rate

### 9.3 Health Checks
- /health — basic connectivity
- /health/database — DB connection
- /health/redis — cache connection
- /health/dependencies — external services

## 10. Deploy Strategy

- Blue-green deployment via Docker Swarm
- Rolling updates com health check
- Rollback automático em caso de falha
- Zero downtime
- Database migrations antes do deploy
- Smoke tests pós-deploy
