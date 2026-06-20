# Plano de Backup e Recuperação — Esperançar

## Serviço de Backup

**Função:** `backupRestore`
**Acesso:** Apenas administradores

### Comandos

```js
// Status de todas as entidades (contagem de registros)
await base44.functions.invoke("backupRestore", { action: "status" });

// Backup de uma entidade específica
await base44.functions.invoke("backupRestore", { action: "backup", entity: "Contact" });

// Backup completo (todas as entidades)
await base44.functions.invoke("backupRestore", { action: "backup_all" });

// Restore (upsert — mantém existentes, adiciona novos)
await base44.functions.invoke("backupRestore", { 
  action: "restore", 
  entity: "Contact", 
  data: [...], 
  mode: "upsert" 
});

// Restore (replace — recria todos)
await base44.functions.invoke("backupRestore", { 
  action: "restore", 
  entity: "Contact", 
  data: [...], 
  mode: "replace" 
});
```

## Política de Backup

| Frequência | Tipo | Retenção |
|---|---|---|
| Diário | Incremental (entidades alteradas) | 7 dias |
| Semanal | Completo (backup_all) | 4 semanas |
| Mensal | Completo + export CSV | 12 meses |

## Procedimento de Restore

1. Identificar entidade afetada
2. Executar `backupRestore` com `action: "status"` para verificar contagem atual
3. Restaurar com `action: "restore"` modo `upsert` (seguro, não apaga dados novos)
4. Se corrupção total: usar modo `replace`
5. Verificar contagem pós-restore com `action: "status"`

## Automação Recomendada

Criar automação semanal (domingo 02:00 BRT) que execute:

```json
{
  "automation_type": "scheduled",
  "name": "Backup Semanal Completo",
  "function_name": "backupRestore",
  "function_args": { "action": "backup_all" },
  "schedule_type": "simple",
  "repeat_interval": 1,
  "repeat_unit": "weeks",
  "repeat_on_days": [0],
  "start_time": "02:00"
}
```

⚠️ **Nota:** O backup_all pode ser pesado para bases com > 50k registros. Para bases grandes, fazer backups por entidade em horários escalonados.

## Dados Externos

| Fonte | Backup |
|---|---|
| TSE (16.200 registros) | Reimportável via functions/tseImport.js |
| Configurações do Base44 | Gerenciado pela plataforma |
| Automações | Configurações exportáveis via list_automations |