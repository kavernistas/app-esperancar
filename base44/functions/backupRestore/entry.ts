import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

/**
 * Serviço de Backup e Restore — Exporta dados em JSON e permite reimportação
 * 
 * Ações:
 *  - backup: exporta todos os dados de uma entidade em JSON (array)
 *  - backup_all: exporta dados de todas as entidades principais
 *  - status: retorna contagem de registros por entidade
 *  - restore: restaura registros de um backup (upsert via id)
 */
Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user || user.role !== 'admin') {
      return Response.json({ error: 'Apenas administradores podem executar backup/restore' }, { status: 403 });
    }

    const body = await req.json().catch(() => ({}));
    const { action, entity, data, mode } = body;

    const ENTITIES = [
      'Contact', 'Leader', 'Demand', 'Mission', 'GamificationProfile',
      'StrategicAction', 'Campaign', 'ElectoralData', 'TSECandidate',
      'TSEVoteResult', 'TSEElectorateProfile', 'TSEPollingPlace',
      'TSEImportJob', 'TSESyncStatus', 'TSEDataSourceMap', 'AuditLog'
    ];

    switch (action) {
      case 'status': {
        const counts = {};
        for (const ent of ENTITIES) {
          try {
            const items = await base44.asServiceRole.entities[ent].list('-created_date', 1);
            counts[ent] = Array.isArray(items) ? await countAll(base44, ent) : 0;
          } catch (_) {
            counts[ent] = 'erro';
          }
        }
        return Response.json({ success: true, counts, total_entities: ENTITIES.length });
      }

      case 'backup': {
        if (!entity || !ENTITIES.includes(entity)) {
          return Response.json({ error: `Entidade inválida: ${entity}` }, { status: 400 });
        }
        const records = await fetchAll(base44, entity);
        return Response.json({
          success: true,
          entity,
          count: records.length,
          exported_at: new Date().toISOString(),
          records,
        });
      }

      case 'backup_all': {
        const backup = {};
        for (const ent of ENTITIES) {
          try {
            backup[ent] = await fetchAll(base44, ent);
          } catch (_) {
            backup[ent] = { error: 'falha ao exportar' };
          }
        }
        return Response.json({
          success: true,
          exported_at: new Date().toISOString(),
          entities: Object.keys(backup).length,
          backup,
        });
      }

      case 'restore': {
        if (!entity || !data || !Array.isArray(data)) {
          return Response.json({ error: 'Parâmetros entity e data (array) obrigatórios' }, { status: 400 });
        }
        const modeSafe = mode === 'replace' ? 'replace' : 'upsert';
        let imported = 0;
        let skipped = 0;
        let errors = 0;

        for (const record of data) {
          try {
            if (modeSafe === 'replace') {
              // Deletar existentes e recriar
              if (record.id) {
                try { await base44.asServiceRole.entities[entity].delete(record.id); } catch (_) {}
              }
              const { id, created_date, updated_date, created_by_id, ...clean } = record;
              await base44.asServiceRole.entities[entity].create(clean);
            } else {
              // Upsert: tentar atualizar, se falhar criar
              if (record.id) {
                try {
                  const { id, created_date, updated_date, created_by_id, ...clean } = record;
                  await base44.asServiceRole.entities[entity].update(record.id, clean);
                  imported++;
                  continue;
                } catch (_) {}
              }
              const { id, created_date, updated_date, created_by_id, ...clean } = record;
              await base44.asServiceRole.entities[entity].create(clean);
            }
            imported++;
          } catch (e) {
            errors++;
          }
        }

        return Response.json({ success: true, entity, imported, errors, mode: modeSafe });
      }

      default:
        return Response.json({ error: `Ação desconhecida: ${action}` }, { status: 400 });
    }
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});

async function fetchAll(base44, entity) {
  const all = [];
  let skip = 0;
  const limit = 200;
  while (true) {
    try {
      const batch = await base44.asServiceRole.entities[entity].list('-created_date', limit, skip);
      if (!batch || batch.length === 0) break;
      all.push(...batch);
      if (batch.length < limit) break;
      skip += limit;
    } catch (_) {
      break;
    }
  }
  return all;
}

async function countAll(base44, entity) {
  let count = 0;
  let skip = 0;
  const limit = 200;
  while (true) {
    try {
      const batch = await base44.asServiceRole.entities[entity].list('-created_date', limit, skip);
      if (!batch || batch.length === 0) break;
      count += batch.length;
      if (batch.length < limit) break;
      skip += limit;
    } catch (_) {
      break;
    }
  }
  return count;
}