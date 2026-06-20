import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const today = new Date().toISOString().slice(0, 10);

    // Buscar demandas vencidas
    const demands = await base44.asServiceRole.entities.Demand.filter(
      { status: { $ne: 'resolved' } },
      '-created_date',
      500
    );

    const overdueDemands = demands.filter(d => {
      if (!d.due_date || d.status === 'cancelled') return false;
      return d.due_date < today;
    });

    if (overdueDemands.length === 0) {
      return Response.json({ processed: 0, message: 'Nenhuma demanda vencida' });
    }

    // Buscar admins e coordenadores para notificar
    const users = await base44.asServiceRole.entities.User.filter({}, '', 200);
    const admins = users.filter(u => u.role === 'admin' || u.role === 'coordenador');

    // Criar notificações
    const notifications = [];
    for (const demand of overdueDemands) {
      const daysOverdue = Math.floor((Date.now() - new Date(demand.due_date).getTime()) / 86400000);
      for (const admin of admins) {
        notifications.push({
          user_id: admin.id,
          title: `Demanda vencida: ${demand.title}`,
          message: `"${demand.title}" (Protocolo: ${demand.protocol || 'N/A'}) está ${daysOverdue} dia(s) além do prazo. Status: ${demand.status}. Tipo: ${demand.type}. Bairro: ${demand.neighborhood || 'N/A'}.`,
          type: 'demand_overdue',
          link: '/Demands',
          entity_id: demand.id,
          read: false,
        });
      }
    }

    if (notifications.length > 0) {
      await base44.asServiceRole.entities.Notification.bulkCreate(notifications);
    }

    // Enviar email de resumo para admins
    for (const admin of admins) {
      if (!admin.email) continue;
      try {
        await base44.asServiceRole.integrations.Core.SendEmail({
          to: admin.email,
          subject: `⚠️ ${overdueDemands.length} demanda(s) vencida(s) — Esperançar`,
          body: `Olá ${admin.full_name || 'Administrador'},\n\nHá ${overdueDemands.length} demanda(s) com prazo de resolução vencido na plataforma Esperançar:\n\n${overdueDemands.map(d => `• ${d.title} — ${d.due_date} (${d.neighborhood || 'N/A'}, ${d.city || 'N/A'})`).join('\n')}\n\nAcesse o módulo de Demandas para revisar.\n\nEste é um alerta automático.`,
          from_name: 'Esperançar',
        });
      } catch (_) { /* ignora falha de email */ }
    }

    return Response.json({
      processed: overdueDemands.length,
      notifications_created: notifications.length,
      admins_notified: admins.length,
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});