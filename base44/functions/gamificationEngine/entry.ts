import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

const LEVELS = [
  { name: 'semente', label: 'Semente', min: 0, max: 99 },
  { name: 'mobilizador', label: 'Mobilizador', min: 100, max: 299 },
  { name: 'lideranca_local', label: 'Liderança Local', min: 300, max: 699 },
  { name: 'coordenador_territorial', label: 'Coordenador Territorial', min: 700, max: 1499 },
  { name: 'referencia_esperancar', label: 'Referência Esperançar', min: 1500, max: Infinity },
];

const POINT_RULES = {
  register_supporter: 10,
  meeting_attendance: 15,
  demand_resolved: 20,
  neighborhood_report: 25,
  mission_completed: 30,
  new_leader: 50,
  leader_converted: 60,
  visual_carro: 5,
  visual_residencia: 5,
  weekly_goal_bonus: 100,
};

const BADGE_RULES = [
  { id: 'primeira_missao', label: 'Primeira Missão', check: (p) => p.missions_completed >= 1 },
  { id: 'dez_apoiadores', label: '10 Apoiadores', check: (p) => p.supporters_registered >= 10 },
  { id: 'lider_do_bairro', label: 'Líder do Bairro', check: (p) => p.total_points >= 500 },
  { id: 'mobilizador_semana', label: 'Mobilizador da Semana', check: (p) => p.weekly_points >= 100 },
  { id: 'resolutivo', label: 'Resolutivo', check: (p) => p.demands_resolved >= 5 },
  { id: 'campeao_demandas', label: 'Campeão de Demandas', check: (p) => p.demands_resolved >= 20 },
  { id: 'expansor_base', label: 'Expansor de Base', check: (p) => p.supporters_registered >= 50 },
  { id: 'guardiao_territorio', label: 'Guardião do Território', check: (p) => p.missions_completed >= 30 },
  { id: 'formador_liderancas', label: 'Formador de Lideranças', check: (p) => (p.leaders_converted || 0) >= 3 },
  { id: 'visual_total', label: 'Visualize', check: (p) => ((p.visual_carros || 0) + (p.visual_residencias || 0)) >= 10 },
];

function getLevel(points) {
  for (let i = LEVELS.length - 1; i >= 0; i--) {
    if (points >= LEVELS[i].min) return LEVELS[i];
  }
  return LEVELS[0];
}

function getNextLevel(points) {
  for (const level of LEVELS) {
    if (points < level.min) return level;
  }
  return null;
}

function evaluateBadges(profile) {
  return BADGE_RULES
    .filter(b => b.check(profile) && !(profile.badges || []).includes(b.id))
    .map(b => b.id);
}

function getWeekStart() {
  const now = new Date();
  const day = now.getDay();
  const diff = now.getDate() - day + (day === 0 ? -6 : 1);
  const monday = new Date(now.setDate(diff));
  return monday.toISOString().split('T')[0];
}

function getMonthStart() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`;
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Não autorizado' }, { status: 401 });

    const body = await req.json();
    const { action, leader_id, leader_name, neighborhood, city, mission_points, converted_leader_id, converted_leader_name, visual_type } = body;

    if (!action || !leader_id) {
      return Response.json({ error: 'action e leader_id são obrigatórios' }, { status: 400 });
    }

    // mission_points has priority over the default rule value for mission_completed
    const pointsToAdd = (action === 'mission_completed' && mission_points) ? mission_points : (POINT_RULES[action] || mission_points || 0);
    const weekStart = getWeekStart();
    const monthStart = getMonthStart();

    // Buscar ou criar perfil
    let profiles = await base44.entities.GamificationProfile.filter({ leader_id });
    let profile = profiles[0];
    let isNew = false;

    if (!profile) {
      profile = await base44.entities.GamificationProfile.create({
        leader_id,
        leader_name: leader_name || '',
        neighborhood: neighborhood || '',
        city: city || '',
        total_points: 0,
        current_level: 'semente',
        badges: [],
        missions_completed: 0,
        missions_pending: 0,
        missions_overdue: 0,
        supporters_registered: 0,
        leaders_converted: 0,
        visual_carros: 0,
        visual_residencias: 0,
        demands_resolved: 0,
        weekly_points: 0,
        monthly_points: 0,
        week_start: weekStart,
        month_start: monthStart,
      });
      isNew = true;
    }

    // Resetar semanal/mensal se necessário
    let weeklyPoints = profile.weekly_points || 0;
    let monthlyPoints = profile.monthly_points || 0;
    if (profile.week_start !== weekStart) {
      weeklyPoints = 0;
    }
    if (profile.month_start !== monthStart) {
      monthlyPoints = 0;
    }

    // Atualizar contadores
    const updates = {
      total_points: (profile.total_points || 0) + pointsToAdd,
      weekly_points: weeklyPoints + pointsToAdd,
      monthly_points: monthlyPoints + pointsToAdd,
      last_activity_at: new Date().toISOString(),
      week_start: weekStart,
      month_start: monthStart,
    };

    if (action === 'mission_completed') {
      updates.missions_completed = (profile.missions_completed || 0) + 1;
    }
    if (action === 'register_supporter') {
      updates.supporters_registered = (profile.supporters_registered || 0) + 1;
    }
    if (action === 'demand_resolved') {
      updates.demands_resolved = (profile.demands_resolved || 0) + 1;
    }
    if (action === 'leader_converted') {
      updates.leaders_converted = (profile.leaders_converted || 0) + 1;
    }
    if (action === 'visual_carro') {
      updates.visual_carros = (profile.visual_carros || 0) + 1;
    }
    if (action === 'visual_residencia') {
      updates.visual_residencias = (profile.visual_residencias || 0) + 1;
    }

    // Verificar nível
    const currentLevel = getLevel(updates.total_points);
    updates.current_level = currentLevel.name;
    if (currentLevel.name !== profile.current_level) {
      updates.last_level_up_at = new Date().toISOString();
    }

    // Atualizar perfil
    const updated = await base44.entities.GamificationProfile.update(profile.id, updates);

    // Verificar badges
    const newBadges = evaluateBadges(updated);
    if (newBadges.length > 0) {
      const allBadges = [...(updated.badges || []), ...newBadges];
      await base44.entities.GamificationProfile.update(profile.id, { badges: allBadges });
    }

    const nextLevel = getNextLevel(updates.total_points);
    const levelUp = currentLevel.name !== profile.current_level;

    return Response.json({
      success: true,
      profile_id: updated.id,
      points_awarded: pointsToAdd,
      points_added: pointsToAdd,
      total_points: updates.total_points,
      current_level: currentLevel.label,
      level_up: levelUp,
      new_badges: newBadges.map(id => BADGE_RULES.find(b => b.id === id)?.label || id),
      next_level: nextLevel ? nextLevel.label : null,
      points_to_next: nextLevel ? nextLevel.min - updates.total_points : 0,
      progress_percent: nextLevel
        ? Math.round(((updates.total_points - currentLevel.min) / (nextLevel.min - currentLevel.min)) * 100)
        : 100,
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});