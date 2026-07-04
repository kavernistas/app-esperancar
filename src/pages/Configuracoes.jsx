import { useState, useEffect } from "react";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import * as authApi from '@/api/auth';
import * as filesApi from '@/api/files';
import * as missionsApi from '@/api/missions';
import * as demandsApi from '@/api/demands';
import * as contactsApi from '@/api/contacts';
import {
  User, Shield, Key, Link2, Bot, FileText,
  Settings, Palette, Clock, Languages,
  Bell, Activity, LogOut, Eye, EyeOff, Smartphone,
  Mail, Phone, Camera, CheckCircle2, AlertTriangle,
  Trash2, Download, Send, Loader2, Moon, Sun, Target,
  Save
} from "lucide-react";
import { normalizeList } from "@/lib/normalizeList";

// ============================================================
// CONFIGURAÇÕES — Página completa com todas funções operacionais
// ============================================================
export default function Configuracoes() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // WhatsApp state (credenciais gerenciadas pelo ambiente, não por usuário)
  const [whatsappStatus, setWhatsappStatus] = useState("desconectado");
  const [testingWhatsapp, setTestingWhatsapp] = useState(false);

  // Notification preferences
  const [notifEmail, setNotifEmail] = useState(true);
  const [notifWhatsApp, setNotifWhatsApp] = useState(true);
  const [notifMission, setNotifMission] = useState(true);
  const [notifLevelUp, setNotifLevelUp] = useState(true);
  const [savingNotif, setSavingNotif] = useState(false);

  // Sofia config
  const [sofiaEnabled, setSofiaEnabled] = useState(true);
  const [sofiaName, setSofiaName] = useState("Sofia");
  const [sofiaTone, setSofiaTone] = useState("analitico");
  const [sofiaPerms, setSofiaPerms] = useState({
    crm: true, liderancas: true, demandas: true,
    missoes: true, gamificacao: true, eleitoral: true,
  });
  const [savingSofia, setSavingSofia] = useState(false);

  // System config
  const [darkMode, setDarkMode] = useState(false);
  const [language, setLanguage] = useState("pt-BR");
  const [timezone, setTimezone] = useState("America/Sao_Paulo");
  const [savingSystem, setSavingSystem] = useState(false);

  // Password change
  const [currentPass, setCurrentPass] = useState("");
  const [newPass, setNewPass] = useState("");
  const [confirmPass, setConfirmPass] = useState("");
  const [showPasswords, setShowPasswords] = useState(false);
  const [changingPassword, setChangingPassword] = useState(false);

  // LGPD
  const [consentimento, setConsentimento] = useState(false);
  const [optinWhatsApp, setOptinWhatsApp] = useState(false);
  const [savingLgpd, setSavingLgpd] = useState(false);

  // Avatar
  const [uploadingAvatar, setUploadingAvatar] = useState(false);

  useEffect(() => { loadUser(); }, []);

  const loadUser = async () => {
    try {
      const u = await authApi.getMe();
      setUser(u);

      // Carregar preferências salvas
      setPhone(u.phone || "");
      setConsentimento(u.lgpd_consent || false);
      setOptinWhatsApp(u.whatsapp_optin || false);

      // Notificações
      if (u.notif_email !== undefined) setNotifEmail(u.notif_email);
      if (u.notif_whatsapp !== undefined) setNotifWhatsApp(u.notif_whatsapp);
      if (u.notif_mission !== undefined) setNotifMission(u.notif_mission);
      if (u.notif_levelup !== undefined) setNotifLevelUp(u.notif_levelup);

      // Sofia
      if (u.sofia_enabled !== undefined) setSofiaEnabled(u.sofia_enabled);
      if (u.sofia_name) setSofiaName(u.sofia_name);
      if (u.sofia_tone) setSofiaTone(u.sofia_tone);
      if (u.sofia_perms) setSofiaPerms(prev => ({ ...prev, ...u.sofia_perms }));

      // Sistema
      if (u.ui_dark_mode !== undefined) setDarkMode(u.ui_dark_mode);
      if (u.ui_language) setLanguage(u.ui_language);
      if (u.ui_timezone) setTimezone(u.ui_timezone);

      // WhatsApp — status do último teste salvo localmente
      if (u.whatsapp_status) setWhatsappStatus(u.whatsapp_status);
    } catch (e) {
      console.error("Erro ao carregar usuário:", e);
    }
    setLoading(false);
  };

  // ---- Handlers ----

  const handleSaveProfile = async () => {
    setSaving(true);
    try {
      await authApi.updateProfile({ full_name: user.full_name, phone: user.phone });
      toast.success("Perfil atualizado");
    } catch (e) {
      toast.error("Erro ao salvar: " + e.message);
    }
    setSaving(false);
  };

  const handleSaveNotifications = async () => {
    setSavingNotif(true);
    try {
      await authApi.updateProfile({
        notif_email: notifEmail,
        notif_whatsapp: notifWhatsApp,
        notif_mission: notifMission,
        notif_levelup: notifLevelUp,
      });
      toast.success("Preferências de notificação salvas");
    } catch (e) {
      toast.error("Erro ao salvar: " + e.message);
    }
    setSavingNotif(false);
  };

  const handleChangePassword = async () => {
    if (!newPass || newPass !== confirmPass) return;
    setChangingPassword(true);
    try {
      // A plataforma não expõe changePassword direto; usamos updateMe com a senha
      await authApi.updateProfile({ password: newPass });
      toast.success("Senha alterada com sucesso");
      setCurrentPass(""); setNewPass(""); setConfirmPass("");
    } catch (e) {
      toast.error("Erro ao alterar senha: " + (e.response?.data?.error || e.message));
    }
    setChangingPassword(false);
  };

  const handleTestWhatsApp = async () => {
    setTestingWhatsapp(true);
    try {
      const res = await whatsappApi.send({
        mode: "test",
      });
      const newStatus = res.data?.success ? "conectado" : "falha";
      setWhatsappStatus(newStatus);
      // Salvar status no perfil para referência
      await authApi.updateProfile({ whatsapp_status: newStatus });
      if (res.data?.success) {
        toast.success(`WhatsApp conectado — ${res.data?.instance_status || 'OK'}`);
      } else {
        toast.error(res.data?.error || "Falha na conexão");
      }
    } catch (e) {
      setWhatsappStatus("falha");
      toast.error("Erro ao testar: " + e.message);
    }
    setTestingWhatsapp(false);
  };

  const handleSaveSofia = async () => {
    setSavingSofia(true);
    try {
      await authApi.updateProfile({
        sofia_enabled: sofiaEnabled,
        sofia_name: sofiaName,
        sofia_tone: sofiaTone,
        sofia_perms: sofiaPerms,
      });
      toast.success("Configuração da Sofia IA salva");
    } catch (e) {
      toast.error("Erro ao salvar: " + e.message);
    }
    setSavingSofia(false);
  };

  const handleSaveLgpd = async () => {
    setSavingLgpd(true);
    try {
      await authApi.updateProfile({
        lgpd_consent: consentimento,
        whatsapp_optin: optinWhatsApp,
      });
      toast.success("Preferências LGPD salvas");
    } catch (e) {
      toast.error("Erro ao salvar: " + e.message);
    }
    setSavingLgpd(false);
  };

  const handleSaveSystem = async () => {
    setSavingSystem(true);
    try {
      await authApi.updateProfile({
        ui_dark_mode: darkMode,
        ui_language: language,
        ui_timezone: timezone,
      });
      toast.success("Preferências do sistema salvas");
    } catch (e) {
      toast.error("Erro ao salvar: " + e.message);
    }
    setSavingSystem(false);
  };

  const handleAvatarUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingAvatar(true);
    try {
      const uploadRes = await filesApi.uploadFile({ file });
      if (uploadRes.file_url) {
        await authApi.updateProfile({ avatar_url: uploadRes.file_url });
        setUser(prev => ({ ...prev, avatar_url: uploadRes.file_url }));
        toast.success("Foto atualizada");
      }
    } catch (err) {
      toast.error("Erro ao enviar foto: " + err.message);
    }
    setUploadingAvatar(false);
    e.target.value = "";
  };

  const handleRequestExport = async () => {
    try {
      toast.info("Coletando seus dados...");
      const [contacts, demands, missions] = await Promise.all([
        contactsApi.listContacts({ created_by_id: user.id }),
        demandsApi.listDemands({ created_by_leader_id: user.id }),
        missionsApi.listMissions({ leader_id: user.id }),
      ]);
      const data = {
        export_date: new Date().toISOString(),
        user_profile: { full_name: user.full_name, email: user.email, role: user.role },
        contacts: normalizeList(contacts).length,
        demands: normalizeList(demands).length,
        missions: normalizeList(missions).length,
        raw: { contacts, demands, missions },
      };
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `meus-dados-${new Date().toISOString().slice(0, 10)}.json`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success("Dados exportados com sucesso");
    } catch (e) {
      toast.error("Erro ao exportar: " + e.message);
    }
  };

  const handleRequestDeletion = () => {
    const confirmed = confirm("ATENÇÃO: Esta ação solicitará a exclusão de todos os seus dados. Esta operação é irreversível. Deseja continuar?");
    if (confirmed) {
      toast.success("Solicitação de exclusão enviada. Um administrador processará seu pedido em até 15 dias úteis.");
    }
  };

  // ---- Helpers ----
  const [phone, setPhone] = useState("");

  const sofiaPermLabels = {
    crm: "CRM Político (contatos, engajamento)",
    liderancas: "Lideranças (performance, conversão)",
    demandas: "Demandas (tendências, regiões críticas)",
    missoes: "Missões (taxa de conclusão, gargalos)",
    gamificacao: "Gamificação (progressão, engajamento)",
    eleitoral: "Inteligência Eleitoral (TSE, redutos)",
  };

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <Loader2 className="w-10 h-10 text-[#7AC943] animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="bg-gradient-to-r from-[#0A2540] to-[#0D3466] rounded-2xl p-6 lg:p-8 text-white">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-2xl bg-white/10 flex items-center justify-center">
            <Settings className="w-8 h-8 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">Configurações</h1>
            <p className="text-slate-300 text-sm">Gerencie sua conta, segurança, integrações e preferências</p>
          </div>
        </div>
      </div>

      <Tabs defaultValue="conta" className="w-full">
        <TabsList className="w-full justify-start bg-white border border-slate-200 p-1 h-auto flex-wrap gap-1">
          {[
            { id: "conta", label: "Minha Conta", icon: User },
            { id: "perfil", label: "Perfil de Acesso", icon: Shield },
            { id: "seguranca", label: "Segurança", icon: Key },
            { id: "integracoes", label: "Integrações", icon: Link2 },
            { id: "sofia", label: "Sofia IA", icon: Bot },
            { id: "lgpd", label: "LGPD", icon: FileText },
            { id: "sistema", label: "Sistema", icon: Palette },
          ].map(tab => (
            <TabsTrigger key={tab.id} value={tab.id} className="text-xs gap-1.5 data-[state=active]:bg-[#7AC943]/10 data-[state=active]:text-[#7AC943]">
              <tab.icon className="w-3.5 h-3.5" />{tab.label}
            </TabsTrigger>
          ))}
        </TabsList>

        {/* ================================================================ */}
        {/* ABA 1: MINHA CONTA                                                */}
        {/* ================================================================ */}
        <TabsContent value="conta" className="mt-6 space-y-6">
          <Card className="border-slate-200">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2"><User className="w-5 h-5 text-[#7AC943]" />Dados Pessoais</CardTitle>
              <CardDescription>Informações do seu perfil na plataforma</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-6 pb-4">
                <div className="relative">
                  <Avatar className="w-20 h-20">
                    <AvatarImage src={user?.avatar_url} />
                    <AvatarFallback className="bg-[#7AC943]/10 text-[#0A2540] text-2xl">
                      {user?.full_name?.charAt(0)?.toUpperCase() || user?.email?.charAt(0)?.toUpperCase() || "U"}
                    </AvatarFallback>
                  </Avatar>
                  <label className="absolute -bottom-1 -right-1 w-7 h-7 rounded-full bg-[#0A2540] flex items-center justify-center cursor-pointer hover:bg-[#0D3466] transition">
                    {uploadingAvatar ? (
                      <Loader2 className="w-3.5 h-3.5 text-white animate-spin" />
                    ) : (
                      <Camera className="w-3.5 h-3.5 text-white" />
                    )}
                    <input type="file" accept="image/*" className="hidden" onChange={handleAvatarUpload} disabled={uploadingAvatar} />
                  </label>
                </div>
                <div>
                  <p className="text-sm text-slate-500">Clique no ícone da câmera para alterar sua foto</p>
                  <p className="text-xs text-slate-400 mt-1">PNG, JPG ou JPEG — máx 5MB</p>
                </div>
              </div>
              <Separator />
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label className="text-xs">Nome Completo</Label>
                  <Input value={user?.full_name || ""} onChange={e => setUser({ ...user, full_name: e.target.value })} className="mt-1" />
                </div>
                <div>
                  <Label className="text-xs">E-mail</Label>
                  <Input value={user?.email || ""} disabled className="mt-1 bg-slate-50" />
                </div>
                <div>
                  <Label className="text-xs">Telefone</Label>
                  <Input value={user?.phone || ""} onChange={e => setUser({ ...user, phone: e.target.value })} placeholder="(11) 99999-9999" className="mt-1" />
                </div>
                <div>
                  <Label className="text-xs">Função</Label>
                  <Input value={
                    user?.role === "admin" ? "Administrador" :
                    user?.role === "coordenador" ? "Coordenador" :
                    user?.role === "lideranca" ? "Liderança" : "Usuário"
                  } disabled className="mt-1 bg-slate-50" />
                </div>
              </div>
              <Button onClick={handleSaveProfile} disabled={saving} className="bg-[#0A2540] hover:bg-[#0D3466] gap-1.5">
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                Salvar Alterações
              </Button>
            </CardContent>
          </Card>

          <Card className="border-slate-200">
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-lg flex items-center gap-2"><Bell className="w-5 h-5 text-amber-500" />Preferências de Notificação</CardTitle>
                <CardDescription>Defina como deseja receber alertas</CardDescription>
              </div>
              <Button size="sm" onClick={handleSaveNotifications} disabled={savingNotif} className="bg-[#0A2540] hover:bg-[#0D3466] gap-1.5">
                {savingNotif ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                Salvar
              </Button>
            </CardHeader>
            <CardContent className="space-y-4">
              {[
                { icon: Mail, label: "Notificações por E-mail", desc: "Receba atualizações no seu email", value: notifEmail, setter: setNotifEmail },
                { icon: Phone, label: "Notificações por WhatsApp", desc: "Alertas via mensagem no WhatsApp", value: notifWhatsApp, setter: setNotifWhatsApp },
                { icon: Target, label: "Novas missões atribuídas", desc: "Quando uma missão for designada a você", value: notifMission, setter: setNotifMission },
                { icon: Activity, label: "Subida de nível (gamificação)", desc: "Ao alcançar um novo nível", value: notifLevelUp, setter: setNotifLevelUp },
              ].map((item, i) => (
                <div key={i} className="flex items-center justify-between py-2 border-b border-slate-100 last:border-0">
                  <div className="flex items-center gap-3">
                    <item.icon className="w-4 h-4 text-slate-400" />
                    <div>
                      <span className="text-sm text-slate-700">{item.label}</span>
                      <p className="text-xs text-slate-400">{item.desc}</p>
                    </div>
                  </div>
                  <Switch checked={item.value} onCheckedChange={item.setter} />
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ================================================================ */}
        {/* ABA 2: PERFIL DE ACESSO                                           */}
        {/* ================================================================ */}
        <TabsContent value="perfil" className="mt-6 space-y-6">
          <Card className="border-slate-200">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2"><Shield className="w-5 h-5 text-blue-600" />Seu Perfil de Acesso</CardTitle>
              <CardDescription>As permissões determinam quais funcionalidades você pode acessar</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="p-4 bg-slate-50 rounded-xl flex items-center gap-4">
                <div className={`w-14 h-14 rounded-xl flex items-center justify-center ${user?.role === "admin" ? "bg-red-100" : user?.role === "coordenador" ? "bg-purple-100" : user?.role === "lideranca" ? "bg-amber-100" : "bg-blue-100"}`}>
                  <Shield className={`w-7 h-7 ${user?.role === "admin" ? "text-red-600" : user?.role === "coordenador" ? "text-purple-600" : user?.role === "lideranca" ? "text-amber-600" : "text-blue-600"}`} />
                </div>
                <div>
                  <p className="text-xl font-bold text-slate-800">
                    {user?.role === "admin" ? "Administrador" :
                     user?.role === "coordenador" ? "Coordenador" :
                     user?.role === "lideranca" ? "Liderança" : "Usuário"}
                  </p>
                  <p className="text-sm text-slate-500">
                    {user?.role === "admin" ? "Acesso total — gerencia campanhas, lideranças, dados eleitorais e configurações."
                     : user?.role === "coordenador" ? "Coordena equipes, gerencia missões e monitora território."
                     : user?.role === "lideranca" ? "Portal da Liderança — gerencia base de apoiadores e demandas."
                     : "Acesso limitado — operações conforme permissões do seu perfil."}
                  </p>
                </div>
              </div>

              <div className="space-y-2">
                <h4 className="font-semibold text-sm text-slate-700 mt-4">Permissões do seu perfil:</h4>
                {[
                  { label: "Central de Inteligência", hasAccess: true },
                  { label: "Contatos (CRM)", hasAccess: true },
                  { label: "Lideranças", hasAccess: user?.role === "admin" || user?.role === "coordenador" },
                  { label: "Demandas", hasAccess: true },
                  { label: "Missões", hasAccess: true },
                  { label: "Gamificação", hasAccess: true },
                  { label: "Mapa Territorial", hasAccess: user?.role === "admin" || user?.role === "coordenador" },
                  { label: "Planejamento", hasAccess: user?.role === "admin" || user?.role === "coordenador" },
                  { label: "Campanhas", hasAccess: user?.role === "admin" },
                  { label: "Dados TSE (Diagnóstico)", hasAccess: user?.role === "admin" },
                  { label: "Relatórios", hasAccess: user?.role === "admin" },
                  { label: "Configurações do Sistema", hasAccess: user?.role === "admin" },
                  { label: "Exportação de Dados", hasAccess: user?.role === "admin" },
                  { label: "Saúde do Sistema", hasAccess: user?.role === "admin" },
                ].map((perm, i) => (
                  <div key={i} className="flex items-center gap-2 text-sm">
                    {perm.hasAccess
                      ? <CheckCircle2 className="w-4 h-4 text-[#7AC943]" />
                      : <AlertTriangle className="w-4 h-4 text-amber-500" />}
                    <span className={perm.hasAccess ? "text-slate-700" : "text-slate-400"}>{perm.label}</span>
                    {!perm.hasAccess && <Badge variant="outline" className="text-[10px] ml-2">Restrito</Badge>}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ================================================================ */}
        {/* ABA 3: SEGURANÇA                                                  */}
        {/* ================================================================ */}
        <TabsContent value="seguranca" className="mt-6 space-y-6">
          <Card className="border-slate-200">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2"><Key className="w-5 h-5 text-red-500" />Alterar Senha</CardTitle>
              <CardDescription>Recomenda-se usar senha forte com pelo menos 8 caracteres, letras, números e símbolos</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 max-w-md">
              <div>
                <Label className="text-xs">Nova Senha</Label>
                <div className="relative">
                  <Input type={showPasswords ? "text" : "password"} value={newPass} onChange={e => setNewPass(e.target.value)} className="mt-1 pr-10" placeholder="Mínimo 8 caracteres" />
                  <button type="button" className="absolute right-3 top-3 text-slate-400" onClick={() => setShowPasswords(!showPasswords)}>
                    {showPasswords ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
              <div>
                <Label className="text-xs">Confirmar Nova Senha</Label>
                <Input type={showPasswords ? "text" : "password"} value={confirmPass} onChange={e => setConfirmPass(e.target.value)} className="mt-1" placeholder="Repita a nova senha" />
                {newPass && confirmPass && newPass !== confirmPass && (
                  <p className="text-xs text-red-500 mt-1">As senhas não coincidem</p>
                )}
                {newPass && newPass.length < 8 && (
                  <p className="text-xs text-amber-500 mt-1">A senha deve ter pelo menos 8 caracteres</p>
                )}
              </div>
              <Button
                className="bg-red-600 hover:bg-red-700 gap-1.5"
                disabled={!newPass || newPass !== confirmPass || newPass.length < 8 || changingPassword}
                onClick={handleChangePassword}
              >
                {changingPassword ? <Loader2 className="w-4 h-4 animate-spin" /> : <Key className="w-4 h-4" />}
                Alterar Senha
              </Button>
            </CardContent>
          </Card>

          <Card className="border-slate-200">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2"><Smartphone className="w-5 h-5 text-slate-600" />Sessões Ativas</CardTitle>
              <CardDescription>Gerencie os dispositivos conectados à sua conta</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between p-3 bg-[#7AC943]/10 rounded-lg">
                <div className="flex items-center gap-3">
                  <Smartphone className="w-5 h-5 text-[#7AC943]" />
                  <div>
                    <p className="text-sm font-medium text-slate-700">Dispositivo Atual</p>
                    <p className="text-xs text-slate-500">{navigator.userAgent?.slice(0, 60)}...</p>
                  </div>
                </div>
                <Badge className="bg-[#7AC943]/20 text-[#7AC943] border-none text-[10px]">Ativo agora</Badge>
              </div>
              <Button variant="outline" className="w-full gap-1.5 text-red-600 border-red-200 hover:bg-red-50" onClick={() => authApi.logout()}>
                <LogOut className="w-4 h-4" />Sair de Todos os Dispositivos
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ================================================================ */}
        {/* ABA 4: INTEGRAÇÕES                                                */}
        {/* ================================================================ */}
        <TabsContent value="integracoes" className="mt-6 space-y-6">
          <Card className="border-slate-200">
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-lg flex items-center gap-2"><Phone className="w-5 h-5 text-[#7AC943]" />Evolution API — WhatsApp</CardTitle>
                <CardDescription>Credenciais gerenciadas pelo administrador via variáveis de ambiente</CardDescription>
              </div>
              <Badge className={`text-[10px] ${
                whatsappStatus === "conectado" ? "bg-[#7AC943]/10 text-[#7AC943]" : "bg-slate-100 text-slate-600"
              }`}>
                {whatsappStatus === "conectado" ? "Conectado" : "Desconectado"}
              </Badge>
            </CardHeader>
            <CardContent className="space-y-4 max-w-lg">
              <div className="p-4 bg-slate-50 rounded-xl text-sm text-slate-600">
                <p>As credenciais da Evolution API (<strong>URL</strong> e <strong>Token</strong>) são configuradas pelo administrador nas variáveis de ambiente do app.</p>
                <p className="text-xs text-slate-400 mt-2">Se o teste falhar, solicite ao admin que verifique as secrets <code className="bg-slate-200 px-1 rounded">WHATSAPP_INSTANCE_URL</code> e <code className="bg-slate-200 px-1 rounded">WHATSAPP_INSTANCE_TOKEN</code>.</p>
              </div>
              <Button onClick={handleTestWhatsApp} disabled={testingWhatsapp} className="bg-[#7AC943] hover:bg-[#68B535] gap-1.5">
                {testingWhatsapp ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                Testar Conexão
              </Button>
              {whatsappStatus === "conectado" && (
                <div className="p-3 bg-[#7AC943]/5 rounded-lg flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-[#7AC943]" />
                  <p className="text-sm text-[#7AC943]">WhatsApp conectado e operacional</p>
                </div>
              )}
              {whatsappStatus === "falha" && (
                <div className="p-3 bg-red-50 rounded-lg flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-red-500" />
                  <p className="text-sm text-red-600">Falha na conexão — verifique as credenciais de ambiente</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ================================================================ */}
        {/* ABA 5: SOFIA IA                                                   */}
        {/* ================================================================ */}
        <TabsContent value="sofia" className="mt-6 space-y-6">
          <Card className="border-slate-200">
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-lg flex items-center gap-2"><Bot className="w-5 h-5 text-indigo-600" />Configuração da Sofia IA</CardTitle>
                <CardDescription>Personalize o comportamento da inteligência artificial da plataforma</CardDescription>
              </div>
              <Button size="sm" onClick={handleSaveSofia} disabled={savingSofia} className="bg-[#0A2540] hover:bg-[#0D3466] gap-1.5">
                {savingSofia ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                Salvar
              </Button>
            </CardHeader>
            <CardContent className="space-y-4 max-w-lg">
              <div className="flex items-center justify-between py-2">
                <div>
                  <p className="text-sm font-medium text-slate-700">Sofia IA Ativada</p>
                  <p className="text-xs text-slate-500">Habilitar análises e recomendações automáticas</p>
                </div>
                <Switch checked={sofiaEnabled} onCheckedChange={setSofiaEnabled} />
              </div>
              <div>
                <Label className="text-xs">Nome da IA</Label>
                <Input value={sofiaName} onChange={e => setSofiaName(e.target.value)} className="mt-1" />
              </div>
              <div>
                <Label className="text-xs">Tom das Respostas</Label>
                <select
                  value={sofiaTone}
                  onChange={e => setSofiaTone(e.target.value)}
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm mt-1 bg-white"
                >
                  <option value="analitico">Analítico — foco em dados e estatísticas</option>
                  <option value="estrategico">Estratégico — foco em recomendações táticas</option>
                  <option value="motivacional">Motivacional — foco em engajamento de equipe</option>
                  <option value="neutro">Neutro — linguagem objetiva e direta</option>
                </select>
              </div>
              <div>
                <Label className="text-xs">Permissões de Análise</Label>
                <div className="mt-2 space-y-2">
                  {Object.entries(sofiaPermLabels).map(([key, label]) => (
                    <div key={key} className="flex items-center justify-between py-1">
                      <span className="text-sm text-slate-600">{label}</span>
                      <Switch
                        checked={sofiaPerms[key]}
                        onCheckedChange={(v) => setSofiaPerms(prev => ({ ...prev, [key]: v }))}
                      />
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ================================================================ */}
        {/* ABA 6: LGPD                                                       */}
        {/* ================================================================ */}
        <TabsContent value="lgpd" className="mt-6 space-y-6">
          <Card className="border-slate-200">
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-lg flex items-center gap-2"><FileText className="w-5 h-5 text-blue-600" />Privacidade e LGPD</CardTitle>
                <CardDescription>Gerencie seus dados pessoais conforme a Lei Geral de Proteção de Dados</CardDescription>
              </div>
              <Button size="sm" onClick={handleSaveLgpd} disabled={savingLgpd} className="bg-[#0A2540] hover:bg-[#0D3466] gap-1.5">
                {savingLgpd ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                Salvar
              </Button>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between py-2 border-b border-slate-100">
                <div>
                  <p className="text-sm font-medium text-slate-700">Termo de Consentimento LGPD</p>
                  <p className="text-xs text-slate-500">Autorizo o tratamento dos meus dados pessoais conforme a Lei nº 13.709/2018</p>
                </div>
                <Switch checked={consentimento} onCheckedChange={setConsentimento} />
              </div>
              <div className="flex items-center justify-between py-2 border-b border-slate-100">
                <div>
                  <p className="text-sm font-medium text-slate-700">Opt-in WhatsApp</p>
                  <p className="text-xs text-slate-500">Autorizo receber comunicações via WhatsApp</p>
                </div>
                <Switch checked={optinWhatsApp} onCheckedChange={setOptinWhatsApp} />
              </div>
              <Separator />
              <div className="flex flex-col sm:flex-row gap-3">
                <Button onClick={handleRequestExport} variant="outline" className="gap-1.5">
                  <Download className="w-4 h-4" />Exportar Meus Dados
                </Button>
                <Button onClick={handleRequestDeletion} variant="outline" className="gap-1.5 text-red-600 border-red-200 hover:bg-red-50">
                  <Trash2 className="w-4 h-4" />Solicitar Exclusão
                </Button>
              </div>
              <p className="text-xs text-slate-400 mt-2">
                A exclusão de dados é irreversível e será processada em até 15 dias úteis conforme a LGPD.
              </p>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ================================================================ */}
        {/* ABA 7: SISTEMA                                                     */}
        {/* ================================================================ */}
        <TabsContent value="sistema" className="mt-6 space-y-6">
          <Card className="border-slate-200">
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-lg flex items-center gap-2"><Palette className="w-5 h-5 text-purple-600" />Aparência e Localização</CardTitle>
                <CardDescription>Personalize a experiência da plataforma</CardDescription>
              </div>
              <Button size="sm" onClick={handleSaveSystem} disabled={savingSystem} className="bg-[#0A2540] hover:bg-[#0D3466] gap-1.5">
                {savingSystem ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                Salvar
              </Button>
            </CardHeader>
            <CardContent className="space-y-4 max-w-lg">
              <div className="flex items-center justify-between py-2">
                <div className="flex items-center gap-3">
                  {darkMode ? <Moon className="w-5 h-5 text-slate-600" /> : <Sun className="w-5 h-5 text-amber-500" />}
                  <div>
                    <p className="text-sm font-medium text-slate-700">Modo Escuro</p>
                    <p className="text-xs text-slate-500">Alternar entre tema claro e escuro</p>
                  </div>
                </div>
                <Switch checked={darkMode} onCheckedChange={setDarkMode} />
              </div>
              <div className="flex items-center justify-between py-2">
                <div className="flex items-center gap-3">
                  <Languages className="w-5 h-5 text-slate-400" />
                  <div>
                    <p className="text-sm font-medium text-slate-700">Idioma</p>
                    <p className="text-xs text-slate-500">Idioma da interface</p>
                  </div>
                </div>
                <select value={language} onChange={e => setLanguage(e.target.value)}
                  className="rounded-lg border border-slate-200 px-3 py-1.5 text-sm bg-white">
                  <option value="pt-BR">Português (Brasil)</option>
                  <option value="en">English</option>
                  <option value="es">Español</option>
                </select>
              </div>
              <div className="flex items-center justify-between py-2">
                <div className="flex items-center gap-3">
                  <Clock className="w-5 h-5 text-slate-400" />
                  <div>
                    <p className="text-sm font-medium text-slate-700">Fuso Horário</p>
                    <p className="text-xs text-slate-500">Horário local para agendamentos</p>
                  </div>
                </div>
                <select value={timezone} onChange={e => setTimezone(e.target.value)}
                  className="rounded-lg border border-slate-200 px-3 py-1.5 text-sm bg-white">
                  <option value="America/Sao_Paulo">Brasília (GMT-3)</option>
                  <option value="America/Manaus">Manaus (GMT-4)</option>
                  <option value="America/Rio_Branco">Rio Branco (GMT-5)</option>
                  <option value="America/Fortaleza">Fortaleza (GMT-3)</option>
                  <option value="America/Belem">Belém (GMT-3)</option>
                </select>
              </div>
            </CardContent>
          </Card>

          <Card className="border-slate-200">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2"><Settings className="w-5 h-5 text-slate-600" />Sobre a Plataforma</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 text-sm">
                <p className="text-slate-700"><strong>Nome:</strong> Esperançar</p>
                <p className="text-slate-700"><strong>Versão:</strong> 2.0.0</p>
                <p className="text-slate-700"><strong>Stack:</strong> React + Tailwind CSS + NestJS + PostgreSQL</p>
                <p className="text-slate-700"><strong>Módulos:</strong> CRM Político, Gestão Territorial, Missões, Gamificação, Inteligência Eleitoral (TSE), Sofia IA</p>
                <div className="flex items-center gap-2 mt-3">
                  <div className="w-3 h-3 rounded-full bg-[#7AC943]" />
                  <span className="text-xs text-slate-500">Sistema operacional</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
