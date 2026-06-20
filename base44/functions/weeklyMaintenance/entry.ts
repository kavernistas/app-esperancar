import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user || user.role !== 'admin') {
      return Response.json({ error: 'Apenas administradores' }, { status: 403 });
    }

    const { action } = await req.json().catch(() => ({}));

    switch (action) {
      case 'weekly_ranking': {
        // Resetar pontos semanais e gerar ranking
        const profiles = await base44.asServiceRole.entities.GamificationProfile.filter({});
        const updates = profiles.map(p => 
          base44.asServiceRole.entities.GamificationProfile.update(p.id, {
            weekly_points: 0,
            week_start: new Date().toISOString().slice(0, 10),
          })
        );
        await Promise.all(updates);
        return Response.json({ success: true, message: `Ranking semanal resetado para ${profiles.length} perfis` });
      }

      case 'weekly_goals': {
        // Resetar metas semanais
        const leaders = await base44.asServiceRole.entities.Leader.filter({ status: 'active' });
        const updates = leaders.map(l =>
          base44.asServiceRole.entities.Leader.update(l.id, {
            actions_completed: 0,
          })
        );
        await Promise.all(updates);
        return Response.json({ success: true, message: `Metas resetadas para ${leaders.length} lideranças` });
      }

      case 'check_inactive_leaders': {
        // Marcar lideranças inativas (sem atividade nos últimos 30 dias)
        const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
        const profiles = await base44.asServiceRole.entities.GamificationProfile.filter({});
        const inactiveProfiles = profiles.filter(p => {
          const lastActivity = p.last_activity_at ? new Date(p.last_activity_at) : new Date(0);
          return lastActivity < new Date(thirtyDaysAgo);
        });

        // Marcar as lideranças associadas como inativas
        const leaderIds = inactiveProfiles.map(p => p.leader_id).filter(Boolean);
        for (const id of leaderIds) {
          try {
            await base44.asServiceRole.entities.Leader.update(id, { status: 'inactive' });
          } catch (e) {
            console.error(`Erro ao atualizar líder ${id}:`, e.message);
          }
        }
        return Response.json({ success: true, inactive_leaders: leaderIds.length });
      }

      case 'check_stale_demands': {
        // Alertar sobre demandas sem atualização há 15 dias
        const fifteenDaysAgo = new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString();
        const demands = await base44.asServiceRole.entities.Demand.filter({
          status: 'open',
        });
        const stale = demands.filter(d => {
          const updated = d.updated_date ? new Date(d.updated_date) : new Date(d.created_date);
          return updated < new Date(fifteenDaysAgo);
        });

        // Atualizar prioridade para alta se estagnada
        for (const d of stale) {
          try {
            if (d.priority !== 'urgent') {
              await base44.asServiceRole.entities.Demand.update(d.id, {
                priority: 'high',
                history: [...(d.history || []), {
                  date: new Date().toISOString(),
                  action: 'priority_escalated',
                  user: 'Sistema',
                  new_value: 'Marcada como alta prioridade por inatividade',
                }],
              });
            }
          } catch (e) {
            console.error(`Erro ao atualizar demanda ${d.id}:`, e.message);
          }
        }
        return Response.json({ success: true, stale_demands: stale.length });
      }

      default:
        return Response.json({ error: `Ação desconhecida: ${action}` }, { status: 400 });
    }
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});