# ESPERANCAR V2 — MASTER ROADMAP
=================================

## Visão Geral

Transformação da Esperancar de um CRM político básico em um Sistema Operacional Político de nível Enterprise.

Duração total estimada: 10-12 meses
Equipe sugerida: 2-3 devs + 1 UX/UI

---

## FASE 1 — FUNDAÇÃO (Semanas 1-4)

### 1.1 Setup de Infraestrutura
- [ ] CI/CD pipeline (GitHub Actions → Docker Swarm deploy)
- [ ] Ambiente de staging isolado
- [ ] Monitoring (Prometheus + Grafana)
- [ ] Log aggregation (Loki ou ELK)
- [ ] Backup automático PostgreSQL

### 1.2 Design System v1
- [ ] Design tokens (cores, tipografia, espaçamento, bordas, sombras)
- [ ] Theme system (dark/light mode com persistência)
- [ ] Componentes base: Button, Input, Card, Dialog, Table, Form
- [ ] Componentes de dados: DataTable, FilterBar, EmptyState, Skeleton
- [ ] Componentes de feedback: Toast, Alert, LoadingState
- [ ] Layout components: AppShell, Sidebar, Header, Breadcrumb
- [ ] Documentação no Storybook

### 1.3 Backend Core Refactor
- [ ] Implementar AuditService completo (registrar todas as ações)
- [ ] Implementar UsersService CRUD real (não stub)
- [ ] Implementar NotificationsService real (CRUD + mark-all-read)
- [ ] Implementar GamificationService real (pontos, níveis, badges)
- [ ] Implementar CampaignsService real
- [ ] Implementar ElectoralService real
- [ ] Adicionar COORDENADOR e LIDERANCA no Prisma Role enum
- [ ] Input validation (class-validator) em todos os DTOs
- [ ] Helmet + CORS + Rate Limiting

### 1.4 Frontend Core Refactor
- [ ] Reestruturar para feature modules (domains/)
- [ ] App Shell com providers (Auth, Theme, Toast, Query)
- [ ] Lazy loading por rota (React.lazy + Suspense)
- [ ] Error Boundary global
- [ ] Design System integrado (tokens + componentes)
- [ ] Remover componentes órfãos (limpar src/components/)

**Entregável:** Plataforma estável com Design System, todos os services funcionais, base para V2.

---

## FASE 2 — CRM POLÍTICO (Semanas 5-8)

### 2.1 Contatos v2
- [ ] Página de lista com DataTable virtualizada
- [ ] Filtros avançados (cidade, bairro, segmento, score, tags)
- [ ] Busca full-text (nome, telefone, email)
- [ ] Pipeline de conversão (funil visual)
- [ ] Segmentação inteligente
- [ ] Score IA (classificação automática de engajamento)
- [ ] LGPD: consentimento, exportação, exclusão

### 2.2 Lideranças v2
- [ ] Perfil 360° (página dedicada, não modal)
- [ ] Timeline de interações
- [ ] Mapa de atuação
- [ ] Histórico de missões e demandas
- [ ] Rede de conexões (quem quem indicou)
- [ ] Projeção de votos
- [ ] Indicadores: influência, potencial eleitoral, risco

### 2.3 Interações
- [ ] Registro de visitas com geolocalização
- [ ] Registro de contatos telefônicos
- [ ] Notas e observações
- [ ] Anexos (fotos, documentos)
- [ ] Timeline cronológica

**Entregável:** CRM Político completo com pipeline, segmentação e perfil 360°.

---

## FASE 3 — INTELIGÊNCIA TERRITORIAL (Semanas 9-12)

### 3.1 Mapa Interativo
- [ ] Leaflet com camadas (bairros, zonas, seções)
- [ ] Heatmap de influência
- [ ] Clusters de apoiadores
- [ ] Pontos de interesse (escolas, UBS, CRAS, igrejas, empresas)
- [ ] Filtros por camada
- [ ] Raio de influência
- [ ] Rotas otimizadas

### 3.2 Gestão Territorial
- [ ] Cadastro de municípios, bairros, zonas
- [ ] Dados socioeconômicos (IBGE integration)
- [ ] Visitas e roteirização
- [ ] Cobertura territorial (mapa de calor)
- [ ] Metas por região

### 3.3 Integração IBGE
- [ ] API IBGE para dados de municípios
- [ ] População, renda, educação
- [ ] Indicadores territoriais

**Entradável:** Inteligência Territorial com mapa completo e gestão de regiões.

---

## FASE 4 — INTELIGÊNCIA ELEITORAL (Semanas 13-16)

### 4.1 Dados TSE v2
- [ ] ETL robusto com retry e checkpoint
- [ ] Importação incremental
- [ ] Deduplicação inteligente
- [ ] Histórico por eleição
- [ ] Projeção de votos com IA

### 4.2 Diagnóstico Eleitoral
- [ ] Dashboard por município/bairro/seção
- [ ] Comparativo temporal (eleições anteriores)
- [ ] Perfil do eleitorado (gênero, idade, escolaridade)
- [ ] Identificação de oportunidades
- [ ] Alertas de risco

### 4.3 Integrações
- [ ] Receita Federal (CPF/CNPJ lookup)
- [ ] CNJ (processos judiciais)
- [ ] DataSUS (saúde pública)
- [ ] IBGE (dados geográficos)

**Entregável:** Inteligência Eleitoral com dados TSE, diagnósticos e integrações.

---

## FASE 5 — COMUNICAÇÃO (Semanas 17-20)

### 5.1 WhatsApp v2 (Omnichannel)
- [ ] Central de conversas (inbox unificado)
- [ ] Múltiplas instâncias Evolution
- [ ] Atendimento por equipe (distribuição automática)
- [ ] Etiquetas e prioridades
- [ ] Pesquisa avançada
- [ ] CRM conversacional (vincular a contatos/lideranças)

### 5.2 Campanhas
- [ ] Segmentação inteligente
- [ ] Agendamento
- [ ] Templates com variáveis dinâmicas
- [ ] A/B testing
- [ ] Estatísticas (envio, entrega, leitura, resposta)
- [ ] Conversão (resposta → ação)

### 5.3 Automações (N8N-style)
- [ ] Editor visual de fluxos
- [ ] Triggers: mensagem recebida, palavra-chave, evento, cadastro
- [ ] Ações: responder, criar demanda, criar liderança, notificar
- [ ] Integração com IA (sugestão de respostas)

### 5.4 Agente IA WhatsApp
- [ ] Resumo automático de conversas
- [ ] Detecção de sentimento
- [ ] Identificação de urgência
- [ ] Sugestão de respostas
- [ ] Classificação de mensagens
- [ ] Extração automática de demandas

**Entregável:** Central de Comunicação Omnichannel completa com IA.

---

## FASE 6 — GESTÃO DE DEMANDAS (Semanas 21-23)

### 6.1 Sistema Completo de Demandas
- [ ] Mapa de demandas
- [ ] Linha do tempo por demanda
- [ ] Protocolo automático
- [ ] Fotos, vídeos, documentos anexos
- [ ] Equipe responsável
- [ ] Prioridade e categorias
- [ ] Status com workflow configurável

### 6.2 IA em Demandas
- [ ] Sugestão de solução baseada em histórico
- [ ] Criação automática de ofício
- [ ] Criação automática de indicação
- [ ] Criação automática de requerimento
- [ ] Classificação automática de urgência

### 6.3 Portal Público
- [ ] Cidadão pode criar demanda
- [ ] Acompanhar status
- [ ] Avaliar atendimento
- [ ] Geolocalização automática

**Entregável:** Sistema completo de demandas com IA e portal público.

---

## FASE 7 — MISSÕES E GAMIFICAÇÃO (Semanas 24-26)

### 7.1 Missões v2
- [ ] Tipos configuráveis
- [ ] Criação em lote com filtros
- [ ] Atribuição automática por região
- [ ] Checklist e evidências
- [ ] Prazos e lembretes
- [ ] Timeline por missão

### 7.2 Gamificação v2
- [ ] Pontuação por ação
- [ ] Níveis com benefícios
- [ ] Badges e conquistas
- [ ] Ranking individual e por equipe
- [ ] Desafios temporários
- [ ] Recompensas

### 7.3 Mission Center
- [ ] Dashboard de missões
- [ ] Filtros por status, líder, prazo
- [ ] Bulk actions
- [ ] Relatórios de performance

**Entregável:** Sistema de Missões e Gamificação completo.

---

## FASE 8 — FINANCEIRO (Semanas 27-30)

### 8.1 Gestão Financeira
- [ ] Receitas e despesas
- [ ] Centro de custo
- [ ] Categorias configuráveis
- [ ] Transferências
- [ ] Fluxo de caixa (projeção)
- [ ] Orçamento por período

### 8.2 Doações
- [ ] Registro de doações
- [ ] Recibos automáticos
- [ ] Doações recorrentes
- [ ] Relatório por doador
- [ ] Integração com PIX

### 8.3 Prestação de Contas
- [ ] Relatórios automáticos
- [ ] Exportação para TSE
- [ ] Por campanha
- [ ] Por centro de custo
- [ ] Gráficos e KPIs

**Entregável:** Módulo Financeiro completo com prestação de contas.

---

## FASE 9 — AGENDA E DOCUMENTOS (Semanas 31-34)

### 9.1 Agenda
- [ ] Calendário interativo
- [ ] Eventos, visitas, audiências, reuniões
- [ ] Atribuição de equipe
- [ ] Prazos e lembretes
- [ ] Google Calendar sync
- [ ] Outlook sync
- [ ] Rotas de visitas

### 9.2 Documentos (GED)
- [ ] Upload com versionamento
- [ ] Pastas e organização
- [ ] OCR para documentos escaneados
- [ ] IA resume (resumo automático)
- [ ] Modelos de documentos
- [ ] Geração automática (ofícios, indicações, requerimentos)
- [ ] Assinatura digital
- [ ] Protocolos automáticos
- [ ] Exportação PDF/Word/Excel

**Entregável:** Agenda e GED completos com IA.

---

## FASE 10 — IA E ANALYTICS (Semanas 35-40)

### 10.1 AI Gateway
- [ ] Multi-provider (OpenAI, Gemini, Claude, Hermes, Ollama)
- [ ] Router inteligente (custo/qualidade)
- [ ] Cache de respostas
- [ ] Rate limiting por provider
- [ ] Fallback automático

### 10.2 Agentes Especializados
- [ ] IA Jurídica (análise de processos, pareceres)
- [ ] IA Política (estratégia, análise de cenários)
- [ ] IA Marketing (copy, slogans, campanhas)
- [ ] IA Comunicação (resumos, respostas, discursos)
- [ ] IA Financeiro (análise, projeções, alertas)
- [ ] IA Territorial (segmentação, heatmap, rotas)
- [ ] IA Estratégica (SWOT, planos, matriz GUT)
- [ ] IA Legislativa (projetos, emendas, pareceres)
- [ ] IA Redes Sociais (conteúdo, agenda, métricas)
- [ ] IA WhatsApp (bot, sentimento, resumo)
- [ ] IA TSE (dados, projeções, histórico)
- [ ] IA Projetos (planejamento, cronograma, riscos)
- [ ] IA Discursos (roteiro, oratória, storytelling)

### 10.3 Central de IA
- [ ] Interface estilo Cursor AI
- [ ] Histórico de conversas
- [ ] Biblioteca de prompts
- [ ] Agentes configuráveis
- [ ] Arquivos e contexto
- [ ] Relatórios e resumos

### 10.4 Analytics & BI
- [ ] Dashboards configuráveis (widgets arrastáveis)
- [ ] Filtros dinâmicos
- [ ] Gráficos interativos
- [ ] Mapas integrados
- [ ] KPIs em tempo real
- [ ] Comparativos temporais
- [ ] Predição IA
- [ ] Exportação (PDF, Excel, CSV)
- [ ] Relatórios agendados

**Entregável:** Ecossistema completo de IA e Business Intelligence.

---

## FASE 11 — PERFORMANCE E POLISH (Semanas 41-44)

### 11.1 Performance
- [ ] Virtual lists em todas as tabelas
- [ ] React Query otimista
- [ ] Image optimization (WebP, lazy)
- [ ] Code splitting fino
- [ ] Service Worker + offline
- [ ] Redis cache em queries frequentes
- [ ] Background jobs para operações pesadas
- [ ] CDN para assets estáticos

### 11.2 UX/UI Polish
- [ ] Animações suaves (transições, loading)
- [ ] Empty states consistentes
- [ ] Error states com recovery
- [ ] Acessibilidade (WCAG 2.1 AA)
- [ ] Responsividade total (mobile-first)
- [ ] Command Palette (Cmd+K)
- [ ] Atalhos de teclado
- [ ] Dark mode persistente
- [ ] Onboarding flow

### 11.3 Testes
- [ ] Unitários (Jest/Vitest)
- [ ] Integration (Supertest)
- [ ] E2E (Playwright)
- [ ] Coverage mínimo: 80%

---

## FASE 12 — DEPLOY E LANÇAMENTO (Semanas 45-48)

### 12.1 Pré-lançamento
- [ ] Smoke tests completos
- [ ] Load testing (k6)
- [ ] Security audit
- [ ] Backup completo
- [ ] Rollback plan documentado

### 12.2 Migração de Dados
- [ ] Script de migração do banco antigo
- [ ] Validação de integridade
- [ ] Rollback script

### 12.3 Go-Live
- [ ] Deploy blue-green
- [ ] Monitoramento 24h
- [ ] Equipe on-call

### 12.4 Pós-lançamento
- [ ] Feedback loop com usuários
- [ ] Hotfixes se necessário
- [ ] Documentação final
- [ ] Treinamento de usuários

---

## MÉTRICAS DE SUCESSO

| Métrica | Atual | Meta V2 |
|---------|-------|---------|
| Tempo de carregamento | >3s | <1s |
| Lighthouse Performance | ~50 | >90 |
| Cobertura de testes | 0% | >80% |
| Uptime | ~95% | 99.9% |
| Tempo de resposta API | ~500ms | <100ms |
| Satisfação do usuário (NPS) | ? | >50 |

---

## PRIORIZAÇÃO RECOMENDADA

Se recursos forem limitados, priorizar nesta ordem:

1. FASE 1 (Fundação) — OBRIGATÓRIO
2. FASE 2 (CRM) — Alto valor imediato
3. FASE 5 (Comunicação) — Diferencial competitivo
4. FASE 10 (IA) — Maior diferencial
5. FASE 3 (Territorial) — Core político
6. FASE 6 (Demandas) — Operacional
7. FASE 7 (Missões) — Engajamento
8. FASE 8 (Financeiro) — Compliance
9. FASE 9 (Agenda/Docs) — Produtividade
10. FASE 4 (Eleitoral) — Dados
11. FASE 11 (Performance) — Polish
12. FASE 12 (Deploy) — Go-live
