# Banco de Dados — Modelo de Entidades

## Entidades (11 schemas)

### 1. Contact (CRM)
Contatos e apoiadores. Entidade principal do CRM.

| Campo | Tipo | Descrição |
|---|---|---|
| full_name * | string | Nome completo |
| phone | string | Telefone |
| email | string | E-mail |
| cep | string | CEP (auto-fill ViaCEP) |
| city | string | Cidade |
| neighborhood | string | Bairro |
| address_street | string | Rua |
| electoral_zone | string | Zona eleitoral |
| electoral_section | string | Seção eleitoral |
| support_intent | enum | apoiador/indeciso/contrario/lideranca_potencial |
| is_leader | boolean | É liderança? |
| engagement_level | number | 0-100 |
| tags | array[string] | Etiquetas multi-select |
| segment | string | Segmento |
| vote_goal | number | Meta de votos |
| contact_authorized | boolean | LGPD consent |
| visual_no_carro / visual_na_residencia | boolean | Material visual |
| created_by_leader_id | string | FK → Leader/User |
| converted_by_leader_id | string | FK → Leader/User |
| latitude / longitude | number | Geolocalização |
| interactions | array[object] | Histórico de interações |
| notes | string | Observações |

### 2. Leader
Lideranças cadastradas. **Atenção:** redundante com Contact (is_leader=true).

| Campo | Tipo | Descrição |
|---|---|---|
| name * | string | Nome |
| phone | string | Telefone |
| email | string | E-mail |
| city | string | Cidade |
| neighborhood | string | Região de atuação |
| electoral_zone | string | Zona eleitoral |
| supporters_count | number | Apoiadores mobilizados |
| political_strength | enum | low/medium/high/very_high |
| monthly_goal | number | Meta mensal |
| conversions | number | Conversões realizadas |
| segment | string | Segmento |
| status | enum | active/inactive |

### 3. Demand
Demandas comunitárias com protocolo, histórico e evidências.

| Campo | Tipo | Descrição |
|---|---|---|
| title * | string | Título |
| type * | enum | health/education/infrastructure/... |
| protocol | string | Nº protocolo |
| description | string | Detalhamento |
| requester_name/phone/email | string | Solicitante |
| address / city / neighborhood | string | Localização |
| latitude / longitude | number | Geolocalização |
| priority | enum | low/medium/high/urgent |
| status | enum | open/in_progress/resolved/pending/cancelled |
| responsible | string | Responsável |
| due_date | date | Prazo |
| photo_url | string | Foto/anexo |
| created_by_leader_id | string | FK |
| history | array[object] | Histórico de status |

### 4. Mission
Missões atribuídas a lideranças com gamificação e WhatsApp.

| Campo | Tipo | Descrição |
|---|---|---|
| title * | string | Título |
| type | enum | register_supporters/visit_region/... |
| leader_id | string | FK → Leader |
| deadline | date | Prazo |
| points | number | Pontos ao concluir (default 30) |
| status | enum | pending/in_progress/completed/overdue |
| assignment_type | enum | individual/neighborhood_group/segment_group/all |
| checklist | array[object] | Subtarefas |
| attachments | array[string] | URLs de anexos |
| whatsapp_config | object | Config de notificação |
| recurrence | object | Recorrência |
| parent_mission_id | string | Missão pai (grupo) |

### 5. GamificationProfile
Perfil de gamificação vinculado a uma liderança.

| Campo | Tipo | Descrição |
|---|---|---|
| leader_id * | string | FK → Leader |
| total_points | number | Pontos acumulados |
| current_level | enum | semente/mobilizador/lideranca_local/coordenador_territorial/referencia_esperancar |
| badges | array[string] | Conquistas |
| missions_completed / pending / overdue | number | Estatísticas |
| supporters_registered | number | Apoiadores |
| leaders_converted | number | Conversões |
| visual_carros / visual_residencias | number | Visuais |
| demands_resolved | number | Demandas |
| vote_goal / votes_achieved | number | Metas de voto |
| weekly_points / monthly_points | number | Pontos no período |

### 6. Campaign
Campanhas eleitorais.

| Campo | Tipo | Descrição |
|---|---|---|
| name * | string | Nome |
| type | enum | municipal/state/federal |
| year | number | Ano |
| position | enum | mayor/councilor/... |
| candidate_name | string | Candidato |
| party | string | Partido |
| vote_goal | number | Meta de votos |
| status | enum | planning/active/finished |

### 7. StrategicAction
Ações estratégicas (sobrepõe com Campaign).

| Campo | Tipo | Descrição |
|---|---|---|
| title * | string | Título |
| type | enum | event/campaign/visit/meeting/... |
| start_date / end_date | date | Período |
| expected_reach / actual_reach | number | Alcance |
| status | enum | planned/in_progress/completed/cancelled |

### 8. TSEVoteResult
Resultados de votação do TSE (entidade de maior volume).

| Campo | Tipo | Descrição |
|---|---|---|
| ano * | number | Ano da eleição |
| uf * | string | UF |
| cargo * | string | Cargo |
| municipio | string | Município |
| zona / secao | string | Zona/Seção |
| numero_candidato | string | Nº do candidato |
| nome_candidato | string | Nome |
| partido | string | Partido |
| votos | number | Votos |
| local_votacao | string | Local |

### 9. TSEImportJob
Controle de jobs de importação TSE.

| Campo | Tipo | Descrição |
|---|---|---|
| ano/uf/dataset_tipo * | mixed | Identificação |
| status | enum | pendente/baixando/extraindo/importando/concluido/erro |
| progresso | number | 0-100 |
| registros_importados | number | Contagem |

### 10. TSESyncStatus
Status de sincronização por UF/ano/dataset.

### 11. TSEElectorateProfile / TSEPollingPlace / TSECandidate / ElectoralData
Entidades auxiliares para dados eleitorais e perfil do eleitorado.

## Relacionamentos

```
Contact ──created_by_leader_id──► Leader/User
Contact ──converted_by_leader_id──► Leader
Mission ──leader_id──► Leader
Mission ──parent_mission_id──► Mission (auto)
Demand ──created_by_leader_id──► Leader/User
GamificationProfile ──leader_id──► Leader
```

**Nota:** Relacionamentos são mantidos por ID (soft FK). Não há constraints de integridade referencial no banco — a aplicação é responsável pela consistência.

## Índices Naturais (filtros frequentes)

- Contact: `created_by_leader_id`, `neighborhood`, `is_leader`, `segment`
- Leader: `status`, `neighborhood`
- Demand: `created_by_leader_id`, `status`, `type`, `neighborhood`
- Mission: `leader_id`, `status`
- GamificationProfile: `leader_id`
- TSEVoteResult: `ano`, `uf`, `cargo`, `municipio