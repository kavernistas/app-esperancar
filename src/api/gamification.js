// src/api/gamification.js — Gamification API (Base44 SDK)
import { base44 } from "@/api/base44Client";
import { extractOpts, buildFilter, safeList } from "@/lib/base44Api";

export async function listProfiles(params = {}, sortArg) {
  const { sort, limit } = extractOpts(params, sortArg, 50);
  const filter = buildFilter(params);
  return safeList(base44.entities.GamificationProfile.filter(filter, sort, limit));
}

export async function getProfile(id) {
  return await base44.entities.GamificationProfile.get(id);
}

export async function updateProfile(id, data) {
  return await base44.entities.GamificationProfile.update(id, data);
}

/**
 * Gamification engine — processa eventos e retorna resultado
 */
export async function run(payload) {
  const { action, leader_id, leader_name, neighborhood, city, mission_points, vote_goal } = payload;

  if (!leader_id) return { data: { points_awarded: 0 } };

  const profiles = await listProfiles({ leader_id });
  let profile = profiles?.[0];

  if (!profile) {
    profile = await base44.entities.GamificationProfile.create({
      leader_id,
      leader_name,
      neighborhood: neighborhood || "",
      city: city || "",
      total_points: 0,
      current_level: "semente",
      badges: [],
      missions_completed: 0,
      missions_pending: 0,
      supporters_registered: 0,
      leaders_converted: 0,
      visual_carros: 0,
      visual_residencias: 0,
      demands_resolved: 0,
      weekly_points: 0,
      monthly_points: 0,
    });
    return { data: { points_awarded: 0 } };
  }

  let pointsAwarded = 0;
  let badgesEarned = [];

  if (action === "mission_completed") {
    pointsAwarded = mission_points || 30;
  } else if (action === "leader_converted") {
    pointsAwarded = 50;
  } else if (action === "register_supporter") {
    pointsAwarded = 10;
  } else if (action === "visual_carro") {
    pointsAwarded = 5;
  } else if (action === "visual_residencia") {
    pointsAwarded = 5;
  }

  const newTotal = (profile.total_points || 0) + pointsAwarded;

  // Calcular nível baseado em pontos
  let newLevel = "semente";
  if (newTotal >= 1500) newLevel = "referencia_esperancar";
  else if (newTotal >= 700) newLevel = "coordenador_territorial";
  else if (newTotal >= 300) newLevel = "lideranca_local";
  else if (newTotal >= 100) newLevel = "mobilizador";

  const leveledUp = newLevel !== profile.current_level;
  const oldBadges = profile.badges || [];

  if (newTotal >= 100 && !oldBadges.includes("centena")) badgesEarned.push("centena");
  if (newTotal >= 500 && !oldBadges.includes("meio_milhar")) badgesEarned.push("meio_milhar");

  const updates = {
    total_points: newTotal,
    current_level: newLevel,
    badges: [...oldBadges, ...badgesEarned],
  };

  if (action === "mission_completed") {
    updates.missions_completed = (profile.missions_completed || 0) + 1;
    updates.missions_pending = Math.max(0, (profile.missions_pending || 0) - 1);
  } else if (action === "register_supporter") {
    updates.supporters_registered = (profile.supporters_registered || 0) + 1;
    if (vote_goal) updates.vote_goal = vote_goal;
  } else if (action === "visual_carro") {
    updates.visual_carros = (profile.visual_carros || 0) + 1;
  } else if (action === "visual_residencia") {
    updates.visual_residencias = (profile.visual_residencias || 0) + 1;
  }

  await updateProfile(profile.id, updates);

  return {
    data: {
      points_awarded: pointsAwarded,
      total_points: newTotal,
      current_level: newLevel,
      level_up: leveledUp,
      new_badges: badgesEarned,
    },
  };
}