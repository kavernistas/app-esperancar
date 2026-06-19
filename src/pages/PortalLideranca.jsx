import React, { useState, useEffect, useCallback } from "react";
import { base44 } from "@/api/base44Client";
import DashboardLideranca from "@/components/portal/DashboardLideranca";
import CadastrarApoiador from "@/components/portal/CadastrarApoiador";
import MinhaBase from "@/components/portal/MinhaBase";
import CadastrarDemanda from "@/components/portal/CadastrarDemanda";
import MinhasDemandas from "@/components/portal/MinhasDemandas";
import MinhasMissoes from "@/components/portal/MinhasMissoes";
import GamificacaoPainel from "@/components/portal/GamificacaoPainel";
import MetasPainel from "@/components/portal/MetasPainel";
import SofiaPortal from "@/components/portal/SofiaPortal";
import PainelCoordenador from "@/components/portal/PainelCoordenador";
import LevelBadge from "@/components/gamification/LevelBadge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  Home, UserPlus, Users, ClipboardList, Target, Trophy,
  Sparkles, BarChart3, Send, Plus, MessageCircle, X
} from "lucide-react";

export default function PortalLideranca() {
  const [user, setUser] = useState(null);
  const [tab, setTab] = useState("painel");
  const [contacts, setContacts] = useState([]);
  const [demands, setDemands] = useState([]);
  const [missions, setMissions] = useState([]);
  const [gamification, setGamification] = useState(null);
  const [ranking, setRanking] = useState({});
  const [metas, setMetas] = useState([]);
  const [loading, setLoading] = useState(true);

  // Interaction sheet
  const [interactionOpen, setInteractionOpen] = useState(false);
  const [selectedContact, setSelectedContact] = useState(null);
  const [interactionText, setInteractionText] = useState("");

  // Comment dialog
  const [commentOpen, setCommentOpen] = useState(false);
  const [commentDemand, setCommentDemand] = useState(null);
  const [commentText, setCommentText] = useState("");

  // Edit contact
  const [editOpen, setEditOpen] = useState(false);

  // WhatsApp modal
  const [whatsappOpen, setWhatsappOpen] = useState(false);
  const [whatsappTarget, setWhatsappTarget] = useState(null);
  const [whatsappMsg, setWhatsappMsg] = useState("");

  // Quick action FAB menu
  const [fabOpen, setFabOpen] = useState(false);

  // More menu sheet
  const [moreOpen, setMoreOpen] = useState(false);

  const isCoordinator = user?.role === "admin" || user?.role === "coordenador";
  const leaderId = user?.id;

  const loadData = useCallback(async () => {
    if (!leaderId) return;
    setLoading(true);
    try {
      const [cs, ds, ms, gs, allG] = await Promise.all([
        base44.entities.Contact.filter({ created_by_leader_id: leaderId }, "-created_date"),
        base44.entities.Demand.filter({ created_by_leader_id: leaderId }, "-created_date"),
        base44.entities.Mission.filter({ leader_id: leaderId }, "-created_date"),
        base44.entities.GamificationProfile.filter({ leader_id: leaderId }),
        base44.entities.GamificationProfile.list("-total_points", 50),
      ]);

      setContacts(cs || []);
      setDemands(ds || []);
      setMissions(ms || []);

      const profile = gs?.[0];
      if (profile) {
        const allProfiles = allG || [];
        const rankIdx = allProfiles.findIndex(p => p.leader_id === leaderId);
        const bairroProfiles = allProfiles.filter(p => p.neighborhood === profile.neighborhood);
        const bairroIdx = bairroProfiles.findIndex(p => p.leader_id === leaderId);

        const levelConfigs = {
          semente: { min: 0, max: 99, next: "mobilizador", nextLabel: "Mobilizador", nextMin: 100 },
          mobilizador: { min: 100, max: 299, next: "lideranca_local", nextLabel: "Liderança Local", nextMin: 300 },
          lideranca_local: { min: 300, max: 699, next: "coordenador_territorial", nextLabel: "Coordenador Territorial", nextMin: 700 },
          coordenador_territorial: { min: 700, max: 1499, next: "referencia_esperancar", nextLabel: "Referência Esperançar", nextMin: 1500 },
          referencia_esperancar: { min: 1500, max: 999999, next: null, nextLabel: null, nextMin: null },
        };
        const curr = levelConfigs[profile.current_level] || levelConfigs.semente;
        const progressPercent = curr.next ? Math.min(100, Math.round(((profile.total_points - curr.min) / (curr.nextMin - curr.min)) * 100)) : 100;

        const levelLabels = {
          semente: "Semente", mobilizador: "Mobilizador", lideranca_local: "Liderança Local",
          coordenador_territorial: "Coordenador Territorial", referencia_esperancar: "Referência Esperançar",
        };

        setGamification({
          ...profile,
          level_label: levelLabels[profile.current_level] || "Semente",
          next_level: curr.nextLabel,
          progress_percent: progressPercent,
        });
        setRanking({ geral: rankIdx >= 0 ? rankIdx + 1 : null, bairro: bairroIdx >= 0 ? bairroIdx + 1 : null });
      }

      const me = await base44.auth.me();
      setMetas(me?.metas || []);
    } catch (e) {
      console.error("Erro ao carregar dados do portal:", e);
    }
    setLoading(false);
  }, [leaderId]);

  useEffect(() => {
    base44.auth.me().then(u => { setUser(u); if (u) loadData(); }).catch(() => {});
  }, [loadData]);

  // Handlers
  const handleSaveSupporter = async (data) => { await base44.entities.Contact.create(data); loadData(); };
  const handleSaveDemand = async (data) => { await base44.entities.Demand.create(data); loadData(); };
  const handleEditContact = (contact) => { setSelectedContact(contact); setEditOpen(true); };
  const handleSaveEdit = async (data) => {
    if (selectedContact) { await base44.entities.Contact.update(selectedContact.id, data); loadData(); setEditOpen(false); }
  };
  const handleAddInteraction = (contact) => { setSelectedContact(contact); setInteractionText(""); setInteractionOpen(true); };
  const handleSaveInteraction = async () => {
    if (!selectedContact || !interactionText.trim()) return;
    const entry = { date: new Date().toISOString(), type: "interaction", description: interactionText };
    await base44.entities.Contact.update(selectedContact.id, { interactions: [...(selectedContact.interactions || []), entry] });
    setInteractionOpen(false); loadData();
  };
  const handleConvertLeader = async (contact) => {
    await base44.entities.Contact.update(contact.id, { is_leader: true, support_intent: "lideranca_potencial" });
    loadData();
  };
  const handleDemandComment = (demand) => { setCommentDemand(demand); setCommentText(""); setCommentOpen(true); };
  const handleSaveComment = async () => {
    if (!commentDemand || !commentText.trim()) return;
    const entry = { date: new Date().toISOString(), action: "comment", user: user?.full_name || "Liderança", new_value: commentText };
    await base44.entities.Demand.update(commentDemand.id, { history: [...(commentDemand.history || []), entry] });
    setCommentOpen(false); loadData();
  };
  const handleAcceptMission = async (mission) => { await base44.entities.Mission.update(mission.id, { status: "in_progress" }); loadData(); };
  const handleStartMission = async (mission) => { await base44.entities.Mission.update(mission.id, { status: "in_progress" }); loadData(); };
  const handleCompleteMission = async (mission) => {
    await base44.entities.Mission.update(mission.id, { status: "completed", evidence: mission.evidence, checklist: mission.checklist, completed_date: new Date().toISOString() });
    try {
      const res = await base44.functions.invoke("gamificationEngine", { action: "mission_completed", leader_id: user?.id, leader_name: user?.full_name, neighborhood: mission.neighborhood, city: mission.city, mission_points: mission.points || 30 });
      if (res.data?.level_up) {
        import("react-hot-toast").then(({ toast }) => { toast.success(`🎉 Você subiu para ${res.data.current_level}!`, { duration: 5000 }); });
      }
    } catch (e) { /* ignore */ }
    loadData();
  };
  const handleSendWhatsApp = (contact) => { setWhatsappTarget(contact); setWhatsappMsg(`Olá ${contact.full_name}, tudo bem?`); setWhatsappOpen(true); };
  const handleSendWhatsAppMsg = () => {
    if (!whatsappTarget?.phone || !whatsappMsg.trim()) return;
    const phone = whatsappTarget.phone.replace(/\D/g, "");
    window.open(`https://wa.me/55${phone}?text=${encodeURIComponent(whatsappMsg)}`, "_blank");
    setWhatsappOpen(false);
  };
  const handleSaveMeta = async (meta) => {
    const newMetas = [...metas, meta]; setMetas(newMetas);
    try { await base44.auth.updateMe({ metas: newMetas }); } catch (e) { /* ignore */ }
  };
  const handleDeleteMeta = async (index) => {
    const newMetas = metas.filter((_, i) => i !== index); setMetas(newMetas);
    try { await base44.auth.updateMe({ metas: newMetas }); } catch (e) { /* ignore */ }
  };

  // Stats
  const stats = {
    supporters: contacts.length,
    openDemands: demands.filter(d => d.status === "open").length,
    resolvedDemands: demands.filter(d => d.status === "resolved").length,
    pendingMissions: missions.filter(m => m.status === "pending").length,
    completedMissions: missions.filter(m => m.status === "completed").length,
    points: gamification?.total_points || 0,
    weeklyPoints: gamification?.weekly_points || 0,
    neighborhood: gamification?.neighborhood,
  };

  // Coordinator team data
  const [equipe, setEquipe] = useState([]);
  const [equipeLoaded, setEquipeLoaded] = useState(false);
  useEffect(() => {
    if (!isCoordinator || !user?.neighborhood || equipeLoaded) return;
    (async () => {
      try {
        const profiles = await base44.entities.GamificationProfile.filter({ neighborhood: user.neighborhood });
        setEquipe(profiles.map(p => ({
          name: p.leader_name, neighborhood: p.neighborhood, supporters: p.supporters_registered || 0,
          openDemands: 0, pendingMissions: p.missions_pending || 0, points: p.total_points || 0, rank: 0,
          lastActivityDays: p.last_activity_at ? Math.round((Date.now() - new Date(p.last_activity_at).getTime()) / (1000 * 60 * 60 * 24)) : 999,
        })));
      } catch (e) { /* ignore */ }
      setEquipeLoaded(true);
    })();
  }, [isCoordinator, user?.neighborhood, equipeLoaded]);

  if (loading) {
    return <div className="flex items-center justify-center py-20"><div className="w-8 h-8 border-4 border-slate-200 border-t-indigo-600 rounded-full animate-spin" /></div>;
  }

  // Bottom navigation items (primary 5)
  const bottomNav = [
    { id: "painel", label: "Painel", icon: Home },
    { id: "base", label: "Base", icon: Users },
    { id: "missoes", label: "Missões", icon: Target },
    { id: "gamificacao", label: "Pontuação", icon: Trophy },
  ];

  const extraItems = [
    { id: "demandas", label: "Minhas Demandas", icon: ClipboardList },
    { id: "metas", label: "Metas", icon: BarChart3 },
    { id: "sofia", label: "Sofia IA", icon: Sparkles },
    ...(isCoordinator ? [{ id: "equipe", label: "Equipe", icon: Users }] : []),
  ];

  const renderContent = () => {
    switch (tab) {
      case "painel": return <DashboardLideranca stats={stats} gamification={gamification} />;
      case "cadastrar": return <CadastrarApoiador onSave={handleSaveSupporter} user={user} />;
      case "base": return <MinhaBase contacts={contacts} onEdit={handleEditContact} onAddInteraction={handleAddInteraction} onSendWhatsApp={handleSendWhatsApp} onConvertLeader={handleConvertLeader} />;
      case "demanda": return <CadastrarDemanda onSave={handleSaveDemand} user={user} contacts={contacts} />;
      case "demandas": return <MinhasDemandas demands={demands} onComment={handleDemandComment} />;
      case "missoes": return <MinhasMissoes missions={missions} onAccept={handleAcceptMission} onStart={handleStartMission} onComplete={handleCompleteMission} />;
      case "gamificacao": return <GamificacaoPainel profile={gamification} ranking={ranking} />;
      case "metas": return <MetasPainel metas={metas} onSave={handleSaveMeta} onDelete={handleDeleteMeta} />;
      case "sofia": return <SofiaPortal user={user} stats={stats} />;
      case "equipe": return isCoordinator ? <PainelCoordenador equipe={equipe} /> : null;
      default: return <DashboardLideranca stats={stats} gamification={gamification} />;
    }
  };

  const pageTitle = {
    painel: "Meu Painel", cadastrar: "Cadastrar Apoiador", base: "Minha Base",
    demanda: "Cadastrar Demanda", demandas: "Minhas Demandas", missoes: "Minhas Missões",
    gamificacao: "Minha Pontuação", metas: "Metas", sofia: "Sofia IA", equipe: "Equipe",
  }[tab] || "Portal";

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* ===== HEADER ===== */}
      <div className="bg-gradient-to-r from-indigo-700 via-indigo-600 to-purple-600 text-white relative overflow-hidden">
        <div className="absolute top-0 right-0 w-40 h-40 bg-white/5 rounded-full blur-3xl" />
        <div className="relative px-4 pt-4 pb-3">
          {/* Top row: Name + Level */}
          <div className="flex items-center justify-between mb-2">
            <div>
              <p className="text-lg font-bold leading-tight">{user?.full_name || "Liderança"}</p>
              <p className="text-indigo-200 text-xs">{stats.neighborhood || "Sua região"}</p>
            </div>
            {gamification && (
              <div className="flex items-center gap-2">
                <LevelBadge level={gamification.current_level} size="md" />
                <div className="text-right">
                  <p className="text-xs text-indigo-200">{gamification.level_label}</p>
                  <p className="text-sm font-bold">{gamification.total_points || 0} pts</p>
                </div>
              </div>
            )}
          </div>

          {/* Mini stats row */}
          <div className="grid grid-cols-4 gap-2 mt-1">
            {[
              { label: "Apoiadores", value: stats.supporters },
              { label: "Demandas", value: stats.openDemands },
              { label: "Missões", value: stats.pendingMissions },
              { label: "Semana", value: `${stats.weeklyPoints}P` },
            ].map((s, i) => (
              <div key={i} className="bg-white/10 rounded-lg px-2 py-1.5 text-center">
                <p className="text-lg font-bold leading-none">{s.value}</p>
                <p className="text-[9px] text-indigo-200 leading-tight mt-0.5">{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ===== PAGE TITLE + EXTRA MENU ===== */}
      <div className="bg-white border-b border-slate-100 px-4 py-2 flex items-center justify-between">
        <h2 className="text-sm font-semibold text-slate-700">{pageTitle}</h2>
        <button
          onClick={() => setMoreOpen(true)}
          className="flex items-center gap-1 text-xs text-indigo-600 font-medium hover:text-indigo-700"
        >
          <BarChart3 className="w-3.5 h-3.5" />
          Mais opções
        </button>
      </div>

      {/* ===== CONTENT ===== */}
      <div className="flex-1 px-3 py-3 pb-20 max-w-2xl mx-auto w-full">
        {renderContent()}
      </div>

      {/* ===== FLOATING ACTION BUTTON ===== */}
      <div className="fixed bottom-20 right-4 z-40 flex flex-col items-end gap-2">
        {fabOpen && (
          <div className="flex flex-col gap-2 mb-2 animate-in slide-in-from-bottom-2 fade-in duration-200">
            <Button
              size="sm"
              onClick={() => { setTab("cadastrar"); setFabOpen(false); }}
              className="bg-blue-600 hover:bg-blue-700 shadow-lg rounded-full px-4 gap-2 h-10"
            >
              <UserPlus className="w-4 h-4" /> Apoiador
            </Button>
            <Button
              size="sm"
              onClick={() => { setTab("demanda"); setFabOpen(false); }}
              className="bg-amber-600 hover:bg-amber-700 shadow-lg rounded-full px-4 gap-2 h-10"
            >
              <ClipboardList className="w-4 h-4" /> Demanda
            </Button>
          </div>
        )}
        <Button
          size="icon"
          onClick={() => setFabOpen(!fabOpen)}
          className={`h-12 w-12 rounded-full shadow-xl transition-all duration-200 ${
            fabOpen ? "bg-slate-600 hover:bg-slate-700 rotate-45" : "bg-indigo-600 hover:bg-indigo-700"
          }`}
        >
          {fabOpen ? <X className="w-5 h-5" /> : <Plus className="w-5 h-5" />}
        </Button>
      </div>

      {/* ===== BOTTOM NAVIGATION ===== */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 z-40 safe-area-bottom">
        <div className="flex items-center justify-around h-16 px-1">
          {bottomNav.map(item => (
            <button
              key={item.id}
              onClick={() => { setTab(item.id); setFabOpen(false); }}
              className={`flex flex-col items-center justify-center gap-0.5 flex-1 h-full transition-colors ${
                tab === item.id ? "text-indigo-600" : "text-slate-400 hover:text-slate-600"
              }`}
            >
              <item.icon className={`w-5 h-5 ${tab === item.id ? "text-indigo-600" : ""}`} />
              <span className="text-[10px] font-medium">{item.label}</span>
              {tab === item.id && <div className="w-6 h-0.5 bg-indigo-600 rounded-full mt-0.5" />}
            </button>
          ))}
        </div>
      </nav>

      {/* ===== MORE OPTIONS SHEET ===== */}
      <Sheet open={moreOpen} onOpenChange={setMoreOpen}>
        <SheetContent side="bottom" className="h-auto max-h-[50vh] rounded-t-xl">
          <SheetHeader>
            <SheetTitle className="text-sm">Mais opções</SheetTitle>
          </SheetHeader>
          <div className="grid grid-cols-2 gap-2 mt-4">
            {extraItems.map(item => (
              <button
                key={item.id}
                onClick={() => { setTab(item.id); setMoreOpen(false); }}
                className={`flex items-center gap-2.5 p-3 rounded-xl text-sm font-medium transition-colors ${
                  tab === item.id
                    ? "bg-indigo-50 text-indigo-700"
                    : "bg-slate-50 text-slate-600 hover:bg-slate-100"
                }`}
              >
                <item.icon className="w-4 h-4" />
                {item.label}
              </button>
            ))}
          </div>
        </SheetContent>
      </Sheet>

      {/* ===== MODALS ===== */}
      <Sheet open={interactionOpen} onOpenChange={setInteractionOpen}>
        <SheetContent side="bottom" className="h-auto max-h-[60vh] rounded-t-xl">
          <SheetHeader><SheetTitle>Nova Interação - {selectedContact?.full_name}</SheetTitle></SheetHeader>
          <div className="space-y-3 mt-3">
            <Textarea value={interactionText} onChange={e => setInteractionText(e.target.value)} placeholder="Descreva a interação..." rows={3} />
            <Button onClick={handleSaveInteraction} className="w-full bg-blue-600">Salvar</Button>
          </div>
        </SheetContent>
      </Sheet>

      <Sheet open={editOpen} onOpenChange={setEditOpen}>
        <SheetContent side="bottom" className="h-auto max-h-[80vh] rounded-t-xl overflow-y-auto">
          <SheetHeader><SheetTitle>Editar {selectedContact?.full_name}</SheetTitle></SheetHeader>
          <EditContactForm contact={selectedContact} onSave={handleSaveEdit} onCancel={() => setEditOpen(false)} />
        </SheetContent>
      </Sheet>

      <Dialog open={commentOpen} onOpenChange={setCommentOpen}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader><DialogTitle className="text-sm">Comentar Demanda</DialogTitle></DialogHeader>
          <Textarea value={commentText} onChange={e => setCommentText(e.target.value)} placeholder="Seu comentário..." rows={3} />
          <Button onClick={handleSaveComment} className="bg-blue-600">Enviar</Button>
        </DialogContent>
      </Dialog>

      <Dialog open={whatsappOpen} onOpenChange={setWhatsappOpen}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader><DialogTitle className="text-sm">WhatsApp - {whatsappTarget?.full_name}</DialogTitle></DialogHeader>
          <Textarea value={whatsappMsg} onChange={e => setWhatsappMsg(e.target.value)} placeholder="Mensagem..." rows={3} />
          <Button onClick={handleSendWhatsAppMsg} className="bg-green-600 hover:bg-green-700"><Send className="w-4 h-4 mr-1" /> Enviar</Button>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// Inline edit form
function EditContactForm({ contact, onSave, onCancel }) {
  const [form, setForm] = useState(contact || {});
  useEffect(() => { setForm(contact || {}); }, [contact]);
  const handleChange = (f, v) => setForm(p => ({ ...p, [f]: v }));
  return (
    <div className="space-y-2 mt-3">
      <div><Label className="text-xs">Nome</Label><Input value={form.full_name || ""} onChange={e => handleChange("full_name", e.target.value)} className="h-8 text-sm" /></div>
      <div><Label className="text-xs">Telefone</Label><Input value={form.phone || ""} onChange={e => handleChange("phone", e.target.value)} className="h-8 text-sm" /></div>
      <div><Label className="text-xs">Bairro</Label><Input value={form.neighborhood || ""} onChange={e => handleChange("neighborhood", e.target.value)} className="h-8 text-sm" /></div>
      <div><Label className="text-xs">Observações</Label><Textarea value={form.notes || ""} onChange={e => handleChange("notes", e.target.value)} rows={2} /></div>
      <div className="flex gap-2 pt-2">
        <Button variant="outline" onClick={onCancel} className="flex-1">Cancelar</Button>
        <Button onClick={() => onSave(form)} className="flex-1 bg-blue-600">Salvar</Button>
      </div>
    </div>
  );
}