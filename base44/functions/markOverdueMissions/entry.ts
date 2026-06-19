import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const missions = await base44.asServiceRole.entities.Mission.filter(
      { status: { $in: ["pending", "in_progress"] } },
      "deadline",
      500
    );

    const now = new Date();
    now.setHours(0, 0, 0, 0);
    let updated = 0;

    for (const m of missions) {
      if (m.deadline && new Date(m.deadline) < now) {
        await base44.asServiceRole.entities.Mission.update(m.id, { status: "overdue" });
        updated++;
      }
    }

    return Response.json({ success: true, updated, total_checked: missions.length });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});