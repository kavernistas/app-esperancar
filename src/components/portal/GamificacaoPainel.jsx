import { Card, CardContent } from "@/components/ui/card";
import { Trophy, TrendingUp, Award, Target, Users, Car, Home, UserCheck } from "lucide-react";
import LevelBadge from "@/components/gamification/LevelBadge";

export default function GamificacaoPainel({ profile, ranking }) {
  if (!profile) return <p className="text-center text-slate-400 py-8 text-sm">Perfil de gamificação não encontrado.</p>;

  const levelLabel = {
    semente: "Semente", mobilizador: "Mobilizador", lideranca_local: "Liderança Local",
    coordenador_territorial: "Coordenador Territorial", referencia_esperancar: "Referência Esperançar",
  }[profile.current_level] || "Semente";

  const levels = [
    { name: "semente", label: "Semente", min: 0, max: 99 },
    { name: "mobilizador", label: "Mobilizador", min: 100, max: 299 },
    { name: "lideranca_local", label: "Liderança Local", min: 300, max: 699 },
    { name: "coordenador_territorial", label: "Coordenador Territorial", min: 700, max: 1499 },
    { name: "referencia_esperancar", label: "Referência Esperançar", min: 1500, max: 999999 },
  ];

  const currentLevel = levels.find(l => l.name === profile.current_level) || levels[0];
  const nextLevelIdx = levels.findIndex(l => l.name === profile.current_level) + 1;
  const nextLevel = nextLevelIdx < levels.length ? levels[nextLevelIdx] : null;
  const progressPercent = nextLevel
    ? Math.min(100, Math.round(((profile.total_points - currentLevel.min) / (nextLevel.min - currentLevel.min)) * 100))
    : 100;

  return (
    <div className="space-y-3">
      {/* Pontuação + Nível */}
      <Card className="border-slate-200 bg-gradient-to-r from-indigo-50 to-purple-50">
        <CardContent className="p-4">
          <div className="flex items-center justify-between mb-3">
            <div>
              <p className="text-xs text-slate-500">Pontuação Total</p>
              <p className="text-2xl font-bold text-indigo-700">{profile.total_points || 0}</p>
            </div>
            <LevelBadge level={profile.current_level} size="lg" />
          </div>
          {nextLevel && (
            <div>
              <div className="flex justify-between text-[10px] text-slate-500 mb-1">
                <span>Progresso para {nextLevel.label}</span>
                <span>{profile.total_points} / {nextLevel.min} pts</span>
              </div>
              <div className="w-full h-3 bg-slate-200 rounded-full overflow-hidden">
                <div className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full transition-all" style={{ width: `${progressPercent}%` }} />
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 gap-2">
        <Card className="border-slate-200">
          <CardContent className="p-3 text-center">
            <Trophy className="w-5 h-5 text-amber-500 mx-auto mb-1" />
            <p className="text-lg font-bold text-slate-800">{profile.missions_completed || 0}</p>
            <p className="text-[10px] text-slate-500">Missões</p>
          </CardContent>
        </Card>
        <Card className="border-slate-200">
          <CardContent className="p-3 text-center">
            <Users className="w-5 h-5 text-blue-500 mx-auto mb-1" />
            <p className="text-lg font-bold text-slate-800">{profile.supporters_registered || 0}</p>
            <p className="text-[10px] text-slate-500">Apoiadores</p>
          </CardContent>
        </Card>
        <Card className="border-slate-200">
          <CardContent className="p-3 text-center">
            <Target className="w-5 h-5 text-emerald-500 mx-auto mb-1" />
            <p className="text-lg font-bold text-slate-800">{profile.demands_resolved || 0}</p>
            <p className="text-[10px] text-slate-500">Demandas Resolvidas</p>
          </CardContent>
        </Card>
        <Card className="border-slate-200">
          <CardContent className="p-3 text-center">
            <TrendingUp className="w-5 h-5 text-purple-500 mx-auto mb-1" />
            <p className="text-lg font-bold text-slate-800">{profile.weekly_points || 0}</p>
            <p className="text-[10px] text-slate-500">Pontos/Semana</p>
          </CardContent>
        </Card>
        <Card className="border-slate-200">
          <CardContent className="p-3 text-center">
            <UserCheck className="w-5 h-5 text-green-500 mx-auto mb-1" />
            <p className="text-lg font-bold text-slate-800">{profile.leaders_converted || 0}</p>
            <p className="text-[10px] text-slate-500">Lideranças Convertidas</p>
          </CardContent>
        </Card>
        <Card className="border-slate-200">
          <CardContent className="p-3 text-center">
            <Car className="w-5 h-5 text-blue-500 mx-auto mb-1" />
            <p className="text-lg font-bold text-slate-800">{profile.visual_carros || 0}</p>
            <p className="text-[10px] text-slate-500">Visuais Carro</p>
          </CardContent>
        </Card>
        <Card className="border-slate-200">
          <CardContent className="p-3 text-center">
            <Home className="w-5 h-5 text-orange-500 mx-auto mb-1" />
            <p className="text-lg font-bold text-slate-800">{profile.visual_residencias || 0}</p>
            <p className="text-[10px] text-slate-500">Visuais Residência</p>
          </CardContent>
        </Card>
        {(profile.vote_goal > 0 || profile.votes_achieved > 0) && (
          <Card className="border-slate-200 col-span-2">
            <CardContent className="p-3">
              <p className="text-xs font-semibold text-slate-600 mb-2 flex items-center gap-1">
                <Target className="w-4 h-4 text-indigo-500" /> Meta de Votos
              </p>
              <div className="flex items-center justify-between mb-2">
                <span className="text-lg font-bold text-indigo-700">{profile.votes_achieved || 0}</span>
                <span className="text-xs text-slate-400">de</span>
                <span className="text-lg font-bold text-slate-700">{profile.vote_goal || 0}</span>
              </div>
              <div className="w-full h-3 bg-slate-200 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full transition-all"
                  style={{ width: `${profile.vote_goal > 0 ? Math.min(100, Math.round(((profile.votes_achieved || 0) / profile.vote_goal) * 100)) : 0}%` }}
                />
              </div>
              <p className="text-[10px] text-slate-400 mt-1 text-center">
                {profile.vote_goal > 0 ? `${Math.round(((profile.votes_achieved || 0) / profile.vote_goal) * 100)}% da meta` : "Defina uma meta de votos"}
              </p>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Badges */}
      {profile.badges?.length > 0 && (
        <Card className="border-slate-200">
          <CardContent className="p-3">
            <p className="text-xs font-semibold text-slate-600 mb-2 flex items-center gap-1">
              <Award className="w-4 h-4 text-amber-500" /> Conquistas
            </p>
            <div className="flex flex-wrap gap-1.5">
              {profile.badges.map((b, i) => (
                <span key={i} className="text-[10px] px-2 py-0.5 rounded bg-amber-100 text-amber-700 font-medium">{b}</span>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Rankings */}
      <Card className="border-slate-200">
        <CardContent className="p-3">
          <p className="text-xs font-semibold text-slate-600 mb-2 flex items-center gap-1">
            <Trophy className="w-4 h-4 text-yellow-500" /> Rankings
          </p>
          <div className="space-y-2 text-xs">
            <div className="flex justify-between">
              <span className="text-slate-500">Geral:</span>
              <span className="font-bold text-slate-800">#{ranking?.geral || "-"}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">{profile.neighborhood || "Bairro"}:</span>
              <span className="font-bold text-slate-800">#{ranking?.bairro || "-"}</span>
            </div>
            {profile.segment && (
              <div className="flex justify-between">
                <span className="text-slate-500">Segmento:</span>
                <span className="font-bold text-slate-800">#{ranking?.segmento || "-"}</span>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Metas */}
      <Card className="border-slate-200">
        <CardContent className="p-3">
          <p className="text-xs font-semibold text-slate-600 mb-2">Metas</p>
          <div className="space-y-2">
            <div>
              <div className="flex justify-between text-[10px] text-slate-500 mb-0.5">
                <span>Semanal</span><span>{profile.weekly_points || 0} / 100</span>
              </div>
              <div className="w-full h-1.5 bg-slate-200 rounded-full overflow-hidden">
                <div className="h-full bg-blue-500 rounded-full" style={{ width: `${Math.min(100, ((profile.weekly_points || 0) / 100) * 100)}%` }} />
              </div>
            </div>
            <div>
              <div className="flex justify-between text-[10px] text-slate-500 mb-0.5">
                <span>Mensal</span><span>{profile.monthly_points || 0} / 400</span>
              </div>
              <div className="w-full h-1.5 bg-slate-200 rounded-full overflow-hidden">
                <div className="h-full bg-purple-500 rounded-full" style={{ width: `${Math.min(100, ((profile.monthly_points || 0) / 400) * 100)}%` }} />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}