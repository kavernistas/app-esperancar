# Esperançar — Plataforma de Inteligência Territorial e CRM Político

**Versão:** 1.0.0  
**Stack:** React 18 + Tailwind CSS + Base44 BaaS + Deno Functions  
**Última atualização:** Junho 2026

---

## Visão Geral

Esperançar é uma plataforma integrada de CRM político, gestão territorial, mobilização de lideranças, gamificação e inteligência eleitoral. Construída sobre a plataforma Base44 (backend-as-a-service), permite que campanhas políticas gerenciem contatos, lideranças, demandas comunitárias, missões de campo e dados eleitorais do TSE em um único ecossistema.

## Módulos Principais

| Módulo | Status | Descrição |
|---|---|---|
| **Central de Inteligência** | 95% | Dashboard unificado com KPIs, engajamento, territórios |
| **CRM Político** | 90% | Contatos, segmentação, tags, interações, exportação |
| **Lideranças** | 85% | Cadastro, performance, conversão, região |
| **Portal da Liderança** | 90% | App mobile-first para lideranças em campo |
| **Demandas** | 85% | Protocolo, tipos, status, histórico, fotos |
| **Missões** | 90% | Individuais, grupo, bairro, segmento, WhatsApp |
| **Gamificação** | 88% | 5 níveis, badges, ranking, pontos, metas |
| **WhatsApp** | 85% | Evolution API, anti-ban, em massa, templates |
| **Mapa Territorial** | 80% | Leaflet, georreferenciamento, CEP auto-fill |
| **Inteligência Eleitoral** | 82% | TSE, consultas, comparativos, mapas de voto |
| **Sofia IA** | 75% | Análise estratégica, redutos, recomendações |
| **Campanhas** | 70% | Gestão de campanhas eleitorais |
| **Planejamento** | 70% | Calendário, ações estratégicas |
| **Relatórios** | 65% | PDF, CSV, exportação de dados |
| **Configurações** | 95% | Conta, segurança, integrações, LGPD, 7 abas |
| **Saúde do Sistema** | 90% | Monitoramento, integrações, automações, alertas |
| **RBAC** | 95% | 4 perfis, proteção de rotas, sidebar, componentes |
| **Automações** | 90% | 4 ativas: missões vencidas, ranking, inativos, demandas |

## Tecnologias

- **Frontend:** React 18, Tailwind CSS, shadcn/ui, Recharts, Leaflet, react-router-dom
- **Backend:** Base44 BaaS (auth, banco, funções serverless Deno)
- **Integrações:** Evolution API (WhatsApp), TSE (dados oficiais), ViaCEP
- **IA:** Sofia IA via InvokeLLM (Gemini)
- **Mapas:** Leaflet + OpenStreetMap + Nominatim

## Estrutura de Diretórios

```
src/
├── pages/           # 14 páginas (rotas)
├── components/      # 55+ componentes React
│   ├── portal/      # Portal da Liderança (8 componentes)
│   ├── electoral/   # Inteligência Eleitoral (14 componentes)
│   ├── gamification/ # Gamificação e missões (10 componentes)
│   ├── dashboard/   # Gráficos e KPIs (5 componentes)
│   ├── contacts/    # Contatos e CRM (4 componentes)
│   ├── demands/     # Demandas (3 componentes)
│   ├── leaders/     # Lideranças (2 componentes)
│   ├── integrations/ # WhatsApp, TSE (2 componentes)
│   ├── planning/    # Planejamento (1 componente)
│   └── ui/          # shadcn/ui base (40+ componentes)
├── functions/       # 12 funções Deno (backend)
├── entities/        # 11 schemas de entidades
├── agents/          # Configs de agentes IA
├── api/             # Cliente Base44 SDK
├── lib/             # AuthContext, AccessControl (RBAC), utilitários
└── utils/           # Funções auxiliares
```

## Como Executar

O projeto é hospedado na plataforma Base44. Para desenvolvimento local:

```bash
npm install
npm run dev
```

## Deploy

Push para o repositório conectado ao Base44 aciona deploy automático. A plataforma gerencia:
- Autenticação (login, senha, tokens)
- Banco de dados (entidades, queries)
- Funções serverless (Deno)
- Hospedagem e CDN
- SSL/TLS

Não requer VPS própria.