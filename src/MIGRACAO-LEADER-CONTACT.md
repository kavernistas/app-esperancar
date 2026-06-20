# Plano de Migração — Unificação Leader / Contact

## Situação Atual

Duas entidades representam lideranças, causando duplicidade:

| Entidade | Propósito | Problema |
|---|---|---|
| `Leader` | Lideranças cadastradas | Redundante com `Contact(is_leader=true)` |
| `Contact` (is_leader=true) | Contato convertido em liderança | Mesma pessoa em duas tabelas |

## Modelo Proposto

**Única fonte da verdade: `Contact`**

Adicionar campo `tipo` (enum) para classificar:

```json
{
  "tipo": {
    "type": "string",
    "enum": ["eleitor", "apoiador", "lideranca", "coordenador"],
    "default": "eleitor"
  }
}
```

### Mapeamento de campos Leader → Contact

| Leader | Contact (novo campo ou existente) |
|---|---|
| `name` | `full_name` |
| `phone` | `phone` |
| `email` | `email` |
| `city` | `city` |
| `neighborhood` | `neighborhood` |
| `electoral_zone` | `electoral_zone` |
| `supporters_count` | `supporters_count` (adicionar ao Contact) |
| `political_strength` | `political_strength` (adicionar ao Contact) |
| `monthly_goal` | `monthly_goal` (adicionar ao Contact) |
| `conversions` | `conversions` (adicionar ao Contact) |
| `actions_completed` | `actions_completed` (adicionar ao Contact) |
| `segment` | `segment` |
| `notes` | `notes` |
| `photo_url` | `photo_url` (adicionar ao Contact) |
| `status` | `status` |

## Passos da Migração (sem perda de dados)

### Fase 1: Preparação (não destrutiva)

1. Adicionar campos ausentes ao schema `Contact`:
   - `supporters_count`, `political_strength`, `monthly_goal`, `conversions`
   - `actions_completed`, `photo_url`, `tipo`

2. Criar função backend `migrateLeadersToContacts`:
   - Para cada registro em `Leader`:
     - Buscar `Contact` com mesmo `leader_id` ou telefone
     - Se não existir: criar novo `Contact` com `tipo: "lideranca"` + dados
     - Se existir: atualizar `Contact` com campos de `Leader` + `tipo: "lideranca"` + `is_leader: true`
   - Registrar log de migração

### Fase 2: Atualizar Referências

3. Atualizar `GamificationProfile.leader_id` → apontar para `Contact.id`
4. Atualizar `Mission.leader_id` → apontar para `Contact.id`
5. Atualizar `Contact.created_by_leader_id` → apontar para `Contact.id`
6. Atualizar `Contact.converted_by_leader_id` → apontar para `Contact.id`
7. Atualizar `Demand.created_by_leader_id` → apontar para `Contact.id`

### Fase 3: Transição de Código

8. Atualizar Portal da Liderança: filtrar `Contact` por `tipo: "lideranca"`
9. Atualizar Central de Inteligência: usar `Contact` com filtro `tipo`
10. Atualizar Gamificação: `leader_id` agora referencia `Contact`
11. Atualizar Missões: `leader_id` agora referencia `Contact`

### Fase 4: Descomissionamento

12. Após 30 dias de estabilidade: arquivar entidade `Leader`
13. Remover imports e referências ao schema `Leader`

## Riscos e Mitigações

| Risco | Mitigação |
|---|---|
| Perda de dados na migração | Backup completo antes; rollback via arquivo |
| FK quebradas | Função de validação pós-migração |
| Frontend quebrando | Feature flag `USE_UNIFIED_CONTACTS` |
| GamificationProfile órfão | Mapeamento reverso Leader→Contact |