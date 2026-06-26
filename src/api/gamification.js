// src/api/gamification.js
import api from './client';

export async function listProfiles(params = {}) { return api.get('/gamification', params); }
export async function getProfile(id) { return api.get(`/gamification/${id}`); }
export async function updateProfile(id, data) { return api.patch(`/gamification/${id}`, data); }

/**
 * Gamification engine — processa eventos e retorna resultado
 * Ações suportadas: mission_completed, leader_converted
 */
export async function run(payload) {
  const { action, leader_id, leader_name, neighborhood, city, mission_points, converted_leader_id, converted_leader_name, vote_goal } = payload;

  if (leader_id) {
    const profiles = await listProfiles({ leader_id });
    const profile = profiles?.[0] || {
      id: null,
      leader_id,
      leader_name,
      neighborhood,
      city,
      total_points: 0,
      current_level: 'semente',
      badges: [],
    };

    if (!profile.id) {
      // Criar perfil se não existir
      await api.post('/gamification', {
        leader_id,
        leader_name,
        neighborhood: neighborhood || '',
        city: city || '',
        total_points: 0,
        current_level: 'semente',
        badges: [],
        missions_completed: 0,
        missions_pending: 0,
      });
      return { data: { points_awarded: 0 } };
    }

    let pointsAwarded = 0;
    let badgesEarned = [];

    if (action === 'mission_completed') {
      pointsAwarded = mission_points || 30;
    } else if (action === 'leader_converted') {
      pointsAwarded = 50;
      if (converted_leader_name) {
        await updateProfile(profile.id, {
          leaders_converted: (profile.leaders_converted || 0) + 1,
        });
      }
    }

    const newTotal = (profile.total_points || 0) + pointsAwarded;

    // Calcular nível baseado em pontos
    let newLevel = 'semente';
    if (newTotal >= 1000) newLevel = 'referencia_esperancar';
    else if (newTotal >= 500) newLevel = 'coordenador_territorial';
    else if (newTotal >= 250) newLevel = 'lideranca_local';
    else if (newTotal >= 100) newLevel = 'mobilizador';

    const leveledUp = newLevel !== profile.current_level;
    const oldBadges = profile.badges || [];

    // Badges
    if (newTotal >= 100 && !oldBadges.includes('centena')) badgesEarned.push('centena');
    if (newTotal >= 500 && !oldBadges.includes('meio_milhar')) badgesEarned.push('meio_milhar');

    await updateProfile(profile.id, {
      total_points: newTotal,
      current_level: newLevel,
      badges: [...oldBadges, ...badgesEarned],
      missions_completed: action === 'mission_completed' ? (profile.missions_completed || 0) + 1 : profile.missions_completed,
      missions_pending: action === 'mission_completed' ? Math.max(0, (profile.missions_pending || 0) - 1) : profile.missions_pending,
    });

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

  return { data: { points_awarded: 0 } };
}
