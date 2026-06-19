import React, { useState, useEffect, useCallback } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { MessageCircle, Send, Home, UserPlus, ClipboardList, Target, Trophy, Sparkles, Users, BarChart3 } from "lucide-react";

export default function PortalLideranca() {
  const [user, setUser] = useState(null);
  const [tab, setTab] = useState("dashboard");
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

        const nextLevels = {
          semente: { name: "mobilizador", label: "Mobilizador", min: 100 },
          mobilizador: { name: "lideranca_local", label: "Liderança Local", min: 300 },
          lideranca_local: { name: "coordenador_territorial", label: "Coordenador Territorial", min: 700 },
          coordenador_territorial: { name: "referencia_esperancar", label: "Referência Esperançar", min: 1500 },
          referencia_esperancar: null,
        };
        const levelConfigs = {
          semente: { min: 0, max: 99 },
          mobilizador: { min: 100, max: 299 },
          lideranca_local: { min: 300, max: 699 },
          coordenador_territorial: { min: 700, max: 1499 },
          referencia_esperancar: { min: 1500, max: 999999 },
        };
        const curr = levelConfigs[profile.current_level] || { min: 0, max: 99 };
        const next = nextLevels[profile.current_level];
        const progressPercent = next ? Math.min(100, Math.round(((profile.total_points - curr.min) / (next.min - curr.min)) * 100)) : 100;

        setGamification({
          ...profile,
          level_label: profile.current_level === "semente" ? "Semente" :
            profile.current_level === "mobilizador" ? "Mobilizador" :
            profile.current_level === "lideranca_local" ? "Liderança Local" :
            profile.current_level === "coordenador_territorial" ? "Coordenador Territorial" : "Referência Esperançar",
          next_level: next?.label || null,
          progress_percent: progressPercent,
        });
        setRanking({ geral: rankIdx >= 0 ? rankIdx + 1 : null, bairro: bairroIdx >= 0 ? bairroIdx + 1 : null });
      }

      // Load metas from user metadata or entity
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
  const handleSaveSupporter = async (data) => {
    await base44.entities.Contact.create(data);
    loadData();
  };

  const handleSaveDemand = async (data) => {
    await base44.entities.Demand.create(data);
    loadData();
  };

  const handleEditContact = async (contact) => {
    setSelectedContact(contact);
    setEditOpen(true);
  };

  const handleSaveEdit = async (data) => {
    if (selectedContact) {
      await base44.entities.Contact.update(selectedContact.id, data);
      loadData();
      setEditOpen(false);
    }
  };

  const handleAddInteraction = (contact) => {
    setSelectedContact(contact);
    setInteractionText("");
    setInteractionOpen(true);
  };

  const handleSaveInteraction = async () => {
    if (!selectedContact || !interactionText.trim()) return;
    const entry = { date: new Date().toISOString(), type: "interaction", description: interactionText };
    await base44.entities.Contact.update(selectedContact.id, {
      interactions: [...(selectedContact.interactions || []), entry],
    });
    setInteractionOpen(false);
    loadData();
  };

  const handleConvertLeader = async (contact) => {
    await base44.entities.Contact.update(contact.id, { is_leader: true, support_intent: "lideranca_potencial" });
    loadData();
  };

  const handleDemandComment = (demand) => {
    setCommentDemand(demand);
    setCommentText("");
    setCommentOpen(true);
  };

  const handleSaveComment = async () => {
    if (!commentDemand || !commentText.trim()) return;
    const entry = { date: new Date().toISOString(), action: "comment", user: user?.full_name || "Liderança", new_value: commentText };
    await base44.entities.Demand.update(commentDemand.id, {
      history: [...(commentDemand.history || []), entry],
    });
    setCommentOpen(false);
    loadData();
  };

  const handleAcceptMission = async (mission) => {
    await base44.entities.Mission.update(mission.id, { status: "in_progress" });
    loadData();
  };

  const handleStartMission = async (mission) => {
    await base44.entities.Mission.update(mission.id, { status: "in_progress" });
    loadData();
  };

  const handleCompleteMission = async (mission) => {
    await base44.entities.Mission.update(mission.id, {
      status: "completed",
      evidence: mission.evidence,
      checklist: mission.checklist,
      completed_date: new Date().toISOString(),
    });
    // Trigger gamification
    try {
      const res = await base44.functions.invoke("gamificationEngine", {
        action: "mission_completed",
        leader_id: user?.id,
        leader_name: user?.full_name,
        neighborhood: mission.neighborhood,
        city: mission.city,
        mission_points: mission.points || 30,
      });
      if (res.data?.level_up) {
        import("react-hot-toast").then(({ toast }) => {
          toast.success(`🎉 Você subiu para ${res.data.current_level}!`, { duration: 5000 });
        });
      }
    } catch (e) { /* ignore */ }
    loadData();
  };

  const handleSendWhatsApp = (contact) => {
    setWhatsappTarget(contact);
    setWhatsappMsg(`Olá ${contact.full_name}, tudo bem?`);
    setWhatsappOpen(true);
  };

  const handleSendWhatsAppMsg = () => {
    if (!whatsappTarget?.phone || !whatsappMsg.trim()) return;
    const phone = whatsappTarget.phone.replace(/\D/g, "");
    const url = `https://wa.me/55${phone}?text=${encodeURIComponent(whatsappMsg)}`;
    window.open(url, "_blank");
    setWhatsappOpen(false);
  };

  const handleSaveMeta = async (meta) => {
    const newMetas = [...metas, meta];
    setMetas(newMetas);
    try {
      await base44.auth.updateMe({ metas: newMetas });
    } catch (e) { /* ignore */ }
  };

  const handleDeleteMeta = async (index) => {
    const newMetas = metas.filter((_, i) => i !== index);
    setMetas(newMetas);
    try {
      await base44.auth.updateMe({ metas: newMetas });
    } catch (e) { /* ignore */ }
  };

  // Stats
  const stats = {
    supporters: contacts.length,
    openDemands: demands.filter(d => d.status === "open").length,
    resolvedDemands: demands.filter(d => d.status === "resolved").length,
    pendingMissions: missions.filter(m => m.status === "pending").length,
    completedMissions: missions.filter(m => m.status === "completed").length,
    points: gamification?.total_points || 0,
    weeklyProgress: `${gamification?.weekly_points || 0}`,
    weeklyGoal: "100",
    neighborhood: gamification?.neighborhood,
    weeklyPoints: gamification?.weekly_points || 0,
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
          name: p.leader_name,
          neighborhood: p.neighborhood,
          supporters: p.supporters_registered || 0,
          openDemands: 0,
          pendingMissions: p.missions_pending || 0,
          points: p.total_points || 0,
          rank: 0,
          lastActivityDays: p.last_activity_at ? Math.round((Date.now() - new Date(p.last_activity_at).getTime()) / (1000 * 60 * 60 * 24)) : 999,
        })));
      } catch (e) { /* ignore */ }
      setEquipeLoaded(true);
    })();
  }, [isCoordinator, user?.neighborhood, equipeLoaded]);

  if (loading) {
    return <div className="flex items-center justify-center py-20"><div className="w-8 h-8 border-4 border-slate-200 border-t-indigo-600 rounded-full animate-spin" /></div>;
  }

  // Simplified tabs for leadership role
  const tabs = [
    { id: "dashboard", label: "Meu Painel", icon: Home },
    { id: "cadastrar", label: "Cadastrar Apoiador", icon: UserPlus },
    { id: "base", label: "Minha Base", icon: Users },
    { id: "demanda", label: "Cadastrar Demanda", icon: ClipboardList },
    { id: "demandas", label: "Minhas Demandas", icon: ClipboardList },
    { id: "missoes", label: "Minhas Missões", icon: Target },
    { id: "gamificacao", label: "Minha Pontuação", icon: Trophy },
    { id: "metas", label: "Metas", icon: BarChart3 },
    { id: "sofia", label: "Sofia IA", icon: Sparkles },
    ...(isCoordinator ? [{ id: "equipe", label: "Equipe", icon: Users }] : []),
  ];

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-4 py-4">
        <h1 className="text-lg font-bold">Portal da Liderança</h1>
        <p className="text-sm text-indigo-100">{user?.full_name || "Liderança"}</p>
      </div>

      {/* Tab navigation - horizontal scroll on mobile */}
      <div className="bg-white border-b border-slate-200 overflow-x-auto">
        <div className="flex px-2 py-1 gap-0.5 min-w-max">
          {tabs.map(t => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`flex items-center gap-1 px-3 py-2 text-xs font-medium rounded-md whitespace-nowrap transition-colors ${
                tab === t.id ? "bg-indigo-100 text-indigo-700" : "text-slate-600 hover:bg-slate-100"
              }`}
            >
              <t.icon className="w-3.5 h-3.5" />
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="p-3 max-w-2xl mx-auto">
        {tab === "dashboard" && <DashboardLideranca stats={stats} gamification={gamification} />}
        {tab === "cadastrar" && <CadastrarApoiador onSave={handleSaveSupporter} user={user} />}
        {tab === "base" && (
          <MinhaBase
            contacts={contacts}
            onEdit={handleEditContact}
            onAddInteraction={handleAddInteraction}
            onSendWhatsApp={handleSendWhatsApp}
            onConvertLeader={handleConvertLeader}
          />
        )}
        {tab === "demanda" && <CadastrarDemanda onSave={handleSaveDemand} user={user} contacts={contacts} />}
        {tab === "demandas" && <MinhasDemandas demands={demands} onComment={handleDemandComment} />}
        {tab === "missoes" && (
          <MinhasMissoes
            missions={missions}
            onAccept={handleAcceptMission}
            onStart={handleStartMission}
            onComplete={handleCompleteMission}
          />
        )}
        {tab === "gamificacao" && <GamificacaoPainel profile={gamification} ranking={ranking} />}
        {tab === "metas" && <MetasPainel metas={metas} onSave={handleSaveMeta} onDelete={handleDeleteMeta} />}
        {tab === "sofia" && <SofiaPortal user={user} stats={stats} />}
        {tab === "equipe" && isCoordinator && <PainelCoordenador equipe={equipe} />}
      </div>

      {/* Interaction Sheet */}
      <Sheet open={interactionOpen} onOpenChange={setInteractionOpen}>
        <SheetContent side="bottom" className="h-auto max-h-[60vh] rounded-t-xl">
          <SheetHeader>
            <SheetTitle>Nova Interação - {selectedContact?.full_name}</SheetTitle>
          </SheetHeader>
          <div className="space-y-3 mt-3">
            <Textarea
              value={interactionText}
              onChange={e => setInteractionText(e.target.value)}
              placeholder="Descreva a interação..."
              rows={3}
            />
            <Button onClick={handleSaveInteraction} className="w-full bg-blue-600">Salvar</Button>
          </div>
        </SheetContent>
      </Sheet>

      {/* Edit Contact Sheet */}
      <Sheet open={editOpen} onOpenChange={setEditOpen}>
        <SheetContent side="bottom" className="h-auto max-h-[80vh] rounded-t-xl overflow-y-auto">
          <SheetHeader>
            <SheetTitle>Editar {selectedContact?.full_name}</SheetTitle>
          </SheetHeader>
          <EditContactForm contact={selectedContact} onSave={handleSaveEdit} onCancel={() => setEditOpen(false)} />
        </SheetContent>
      </Sheet>

      {/* Comment Dialog */}
      <Dialog open={commentOpen} onOpenChange={setCommentOpen}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-sm">Comentar Demanda</DialogTitle>
          </DialogHeader>
          <Textarea value={commentText} onChange={e => setCommentText(e.target.value)} placeholder="Seu comentário..." rows={3} />
          <Button onClick={handleSaveComment} className="bg-blue-600">Enviar</Button>
        </DialogContent>
      </Dialog>

      {/* WhatsApp Dialog */}
      <Dialog open={whatsappOpen} onOpenChange={setWhatsappOpen}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-sm">WhatsApp - {whatsappTarget?.full_name}</DialogTitle>
          </DialogHeader>
          <Textarea value={whatsappMsg} onChange={e => setWhatsappMsg(e.target.value)} placeholder="Mensagem..." rows={3} />
          <Button onClick={handleSendWhatsAppMsg} className="bg-green-600 hover:bg-green-700">
            <Send className="w-4 h-4 mr-1" /> Enviar
          </Button>
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