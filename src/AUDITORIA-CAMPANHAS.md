# Auditoria — Campaign vs StrategicAction

## Situação Atual

Duas entidades com sobreposição funcional no domínio de planejamento:

| Entidade | Campos | Propósito Original |
|---|---|---|
| `Campaign` | name, type, year, position, candidate_name, party, coalition, vote_goal, budget, status, dates | Campanha eleitoral (objetivo político) |
| `StrategicAction` | title, description, type, city, neighborhood, dates, responsible, goal, expected_reach, actual_reach, status, budget, notes | Ação estratégica (execução operacional) |

## Diagnóstico

**Sobreposição:** Ambas têm `type` (enum), `status` (enum), `budget`, `dates`, `goal`/`vote_goal`.

**Diferença conceitual (pretendida):**
- `Campaign` = Objetivo político macro (ex: "Eleição Municipal 2024 — Candidato João")
- `StrategicAction` = Ação tática do dia a dia (ex: "Carreata no Bairro X")

## Recomendação: Diferenciar Claramente (Opção B)

### Campaign — Objetivo Político

Manter como entidade de alto nível que agrupa ações:

```
Campaign "Eleição 2024"
├── StrategicAction "Lançamento de candidatura"
├── StrategicAction "Carreata zona sul"
├── StrategicAction "Reunião com lideranças"
└── StrategicAction "Distribuição de material"
```

**Schema Campaign atualizado:**
- Adicionar `strategic_actions_ids: array[string]` — FK reversa
- Remover `start_date/end_date` — delegado às ações
- Adicionar `description` (falta atualmente)

### StrategicAction — Execução Operacional

Ações táticas vinculadas a uma campanha:

**Schema StrategicAction atualizado:**
- Adicionar `campaign_id: string` — FK → Campaign
- Manter `start_date/end_date` — execução concreta
- Adicionar `leader_ids: array[string]` — lideranças envolvidas

## Impacto no Frontend

| Página | Alteração |
|---|---|
| `Campaigns` | Lista campanhas; ao abrir uma, mostra ações vinculadas |
| `StrategicPlanning` | Calendário de ações; filtro por campanha |
| `Central de Inteligência` | KPIs por campanha (agregado de ações) |

## Telas Atuais

- `pages/Campaigns.jsx` — 70% funcional
- `pages/StrategicPlanning.jsx` — 70% funcional (calendário)
- `components/planning/PlanningCalendar.jsx` — componente de calendário

Ambas as páginas são acessíveis pelo menu lateral e funcionam de forma independente, sem relação entre si. Após a diferenciação, a página `StrategicPlanning` deve mostrar ações vinculadas a campanhas e permitir filtrar por `campaign_id`.