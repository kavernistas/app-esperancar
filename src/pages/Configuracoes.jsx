import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import {
  User, Shield, Key, Link2, Bot, FileText,
  Settings, Palette, Globe, Clock, Languages,
  Bell, Activity, LogOut, Eye, EyeOff, Smartphone,
  Mail, Phone, MapPin, Camera, CheckCircle2, AlertTriangle,
  Trash2, Download, Send, Loader2, Moon, Sun, Target
} from "lucide-react";

// ============================================================
// CONFIGURAÇÕES — Página completa de administração do usuário
// ============================================================
export default function Configuracoes() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // WhatsApp state
  const [whatsappUrl, setWhatsappUrl] = useState("");
  const [whatsappToken, setWhatsappToken] = useState("");
  const [whatsappStatus, setWhatsappStatus] = useState("desconectado");
  const [testingWhatsapp, setTestingWhatsapp] = useState(false);

  // Notification preferences
  const [notifEmail, setNotifEmail] = useState(true);
  const [notifWhatsApp, setNotifWhatsApp] = useState(true);
  const [notifMission, setNotifMission] = useState(true);
  const [notifLevelUp, setNotifLevelUp] = useState(true);

  // Sofia config
  const [sofiaEnabled, setSofiaEnabled] = useState(true);
  const [sofiaName, setSofiaName] = useState("Sofia");
  const [sofiaTone, setSofiaTone] = useState("analitico");

  // System config
  const [darkMode, setDarkMode] = useState(false);
  const [language, setLanguage] = useState("pt-BR");
  const [timezone, setTimezone] = useState("America/Sao_Paulo");

  // Password change
  const [currentPass, setCurrentPass] = useState("");
  const [newPass, setNewPass] = useState("");
  const [confirmPass, setConfirmPass] = useState("");
  const [showPasswords, setShowPasswords] = useState(false);

  // LGPD
  const [consentimento, setConsentimento] = useState(false);
  const [optinWhatsApp, setOptinWhatsApp] = useState(false);

  useEffect(() => { loadUser(); }, []);

  const loadUser = async () => {
    try {
      const u = await base44.auth.me();
      setUser(u);
      setConsentimento(u.lgpd_consent || false);
      setOptinWhatsApp(u.whatsapp_optin || false);
    } catch (e) {
      console.error("Erro ao carregar usuário:", e);
    }
    setLoading(false);
  };

  const handleSaveProfile = async () => {
    setSaving(true);
    try {
      await base44.auth.updateMe({
        full_name: user.full_name,
        phone: user.phone,
        email: user.email,
      });
      toast.success("Perfil atualizado com sucesso");
    } catch (e) {
      toast.error("Erro ao salvar perfil: " + e.message);
    }
    setSaving(false);
  };

  const handleTestWhatsApp = async () => {
    if (!whatsappUrl || !whatsappToken) {
      toast.error("Preencha URL e Token da instância");
      return;
    }
    setTestingWhatsapp(true);
    try {
      const res = await base44.functions.invoke("whatsappSend", {
        action: "test_connection",
        instanceUrl: whatsappUrl,
        instanceToken: whatsappToken,
      });
      if (res.data?.success) {
        setWhatsappStatus("conectado");
        toast.success("Conexão WhatsApp OK");
      } else {
        setWhatsappStatus("falha");
        toast.error(res.data?.error || "Falha na conexão");
      }
    } catch (e) {
      setWhatsappStatus("falha");
      toast.error("Erro ao testar: " + e.message);
    }
    setTestingWhatsapp(false);
  };

  const handleRequestExport = async () => {
    try {
      const contacts = await base44.entities.Contact.filter({});
      const demands = await base44.entities.Demand.filter({});
      const missions = await base44.entities.Mission.filter({});
      const data = { contacts, demands, missions, user };
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
      toast.success("Solicitação de exclusão enviada. Um administrador processará seu pedido.");
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <Loader2 className="w-10 h-10 text-emerald-600 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="bg-gradient-to-r from-slate-800 to-slate-900 rounded-2xl p-6 lg:p-8 text-white">
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
            <TabsTrigger key={tab.id} value={tab.id} className="text-xs gap-1.5 data-[state=active]:bg-emerald-50 data-[state=active]:text-emerald-700">
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
              <CardTitle className="text-lg flex items-center gap-2"><User className="w-5 h-5 text-emerald-600" />Dados Pessoais</CardTitle>
              <CardDescription>Informações do seu perfil na plataforma</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-6 pb-4">
                <Avatar className="w-20 h-20">
                  <AvatarFallback className="bg-emerald-100 text-emerald-700 text-2xl">
                    {user?.full_name?.charAt(0)?.toUpperCase() || user?.email?.charAt(0)?.toUpperCase() || "U"}
                  </AvatarFallback>
                </Avatar>
                <Button variant="outline" size="sm" className="gap-1.5">
                  <Camera className="w-4 h-4" />Alterar Foto
                </Button>
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
                  <Input value={user?.role === "admin" ? "Administrador" : "Usuário"} disabled className="mt-1 bg-slate-50" />
                </div>
              </div>
              <Button onClick={handleSaveProfile} disabled={saving} className="bg-emerald-600 hover:bg-emerald-700 gap-1.5">
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                Salvar Alterações
              </Button>
            </CardContent>
          </Card>

          <Card className="border-slate-200">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2"><Bell className="w-5 h-5 text-amber-500" />Preferências de Notificação</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {[
                { icon: Mail, label: "Notificações por E-mail", value: notifEmail, setter: setNotifEmail },
                { icon: Phone, label: "Notificações por WhatsApp", value: notifWhatsApp, setter: setNotifWhatsApp },
                { icon: Target, label: "Novas missões atribuídas", value: notifMission, setter: setNotifMission },
                { icon: Activity, label: "Subida de nível (gamificação)", value: notifLevelUp, setter: setNotifLevelUp },
              ].map((item, i) => (
                <div key={i} className="flex items-center justify-between py-2 border-b border-slate-100 last:border-0">
                  <div className="flex items-center gap-3">
                    <item.icon className="w-4 h-4 text-slate-400" />
                    <span className="text-sm text-slate-700">{item.label}</span>
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
                <div className={`w-14 h-14 rounded-xl flex items-center justify-center ${user?.role === "admin" ? "bg-red-100" : "bg-blue-100"}`}>
                  <Shield className={`w-7 h-7 ${user?.role === "admin" ? "text-red-600" : "text-blue-600"}`} />
                </div>
                <div>
                  <p className="text-xl font-bold text-slate-800">{user?.role === "admin" ? "Administrador" : "Usuário"}</p>
                  <p className="text-sm text-slate-500">
                    {user?.role === "admin"
                      ? "Acesso total — gerencia campanhas, lideranças, dados eleitorais e configurações."
                      : "Acesso limitado — operações conforme permissões do seu perfil."}
                  </p>
                </div>
              </div>

              <div className="space-y-2">
                <h4 className="font-semibold text-sm text-slate-700 mt-4">Permissões do seu perfil:</h4>
                {[
                  { label: "Central de Inteligência", hasAccess: true },
                  { label: "Contatos (CRM)", hasAccess: true },
                  { label: "Lideranças", hasAccess: user?.role === "admin" },
                  { label: "Demandas", hasAccess: true },
                  { label: "Missões", hasAccess: true },
                  { label: "Gamificação", hasAccess: true },
                  { label: "Mapa Territorial", hasAccess: user?.role === "admin" },
                  { label: "Planejamento", hasAccess: user?.role === "admin" },
                  { label: "Campanhas", hasAccess: user?.role === "admin" },
                  { label: "Inteligência Eleitoral", hasAccess: user?.role === "admin" },
                  { label: "Relatórios", hasAccess: user?.role === "admin" },
                  { label: "Configurações do Sistema", hasAccess: user?.role === "admin" },
                  { label: "Exportação de Dados", hasAccess: user?.role === "admin" },
                ].map((perm, i) => (
                  <div key={i} className="flex items-center gap-2 text-sm">
                    {perm.hasAccess
                      ? <CheckCircle2 className="w-4 h-4 text-emerald-500" />
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
              <CardDescription>Recomenda-se usar senha forte com letras, números e símbolos</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 max-w-md">
              <div>
                <Label className="text-xs">Senha Atual</Label>
                <div className="relative">
                  <Input type={showPasswords ? "text" : "password"} value={currentPass} onChange={e => setCurrentPass(e.target.value)} className="mt-1 pr-10" />
                  <button className="absolute right-3 top-3 text-slate-400" onClick={() => setShowPasswords(!showPasswords)}>
                    {showPasswords ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
              <div>
                <Label className="text-xs">Nova Senha</Label>
                <Input type={showPasswords ? "text" : "password"} value={newPass} onChange={e => setNewPass(e.target.value)} className="mt-1" />
              </div>
              <div>
                <Label className="text-xs">Confirmar Nova Senha</Label>
                <Input type={showPasswords ? "text" : "password"} value={confirmPass} onChange={e => setConfirmPass(e.target.value)} className="mt-1" />
                {newPass && confirmPass && newPass !== confirmPass && (
                  <p className="text-xs text-red-500 mt-1">As senhas não coincidem</p>
                )}
              </div>
              <Button className="bg-red-600 hover:bg-red-700 gap-1.5" disabled={!newPass || newPass !== confirmPass}>
                <Key className="w-4 h-4" />Alterar Senha
              </Button>
            </CardContent>
          </Card>

          <Card className="border-slate-200">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2"><Smartphone className="w-5 h-5 text-slate-600" />Sessões Ativas</CardTitle>
              <CardDescription>Dispositivos conectados à sua conta</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between p-3 bg-emerald-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <Smartphone className="w-5 h-5 text-emerald-600" />
                  <div>
                    <p className="text-sm font-medium text-slate-700">Dispositivo Atual</p>
                    <p className="text-xs text-slate-500">{navigator.userAgent?.slice(0, 60)}...</p>
                  </div>
                </div>
                <Badge className="bg-emerald-100 text-emerald-700 border-none text-[10px]">Ativo agora</Badge>
              </div>
              <Button variant="outline" className="w-full gap-1.5 text-red-600 border-red-200 hover:bg-red-50" onClick={() => base44.auth.logout()}>
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
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-lg flex items-center gap-2"><Phone className="w-5 h-5 text-emerald-600" />Evolution API — WhatsApp</CardTitle>
                  <CardDescription>Conecte sua instância Evolution API para enviar mensagens</CardDescription>
                </div>
                <Badge className={`text-[10px] ${
                  whatsappStatus === "conectado" ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-600"
                }`}>
                  {whatsappStatus === "conectado" ? "Conectado" : "Desconectado"}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-4 max-w-lg">
              <div>
                <Label className="text-xs">URL da Instância</Label>
                <Input
                  value={whatsappUrl}
                  onChange={e => setWhatsappUrl(e.target.value)}
                  placeholder="https://evo-api.exemplo.com"
                  className="mt-1"
                />
              </div>
              <div>
                <Label className="text-xs">Token da Instância</Label>
                <Input
                  type="password"
                  value={whatsappToken}
                  onChange={e => setWhatsappToken(e.target.value)}
                  placeholder="••••••••••••••••"
                  className="mt-1"
                />
              </div>
              <div className="flex gap-3">
                <Button onClick={handleTestWhatsApp} disabled={testingWhatsapp} className="bg-emerald-600 hover:bg-emerald-700 gap-1.5">
                  {testingWhatsapp ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                  Testar Conexão
                </Button>
                <Button variant="outline" className="gap-1.5">
                  <Download className="w-4 h-4" />Logs de Envio
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ================================================================ */}
        {/* ABA 5: SOFIA IA                                                   */}
        {/* ================================================================ */}
        <TabsContent value="sofia" className="mt-6 space-y-6">
          <Card className="border-slate-200">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2"><Bot className="w-5 h-5 text-indigo-600" />Configuração da Sofia IA</CardTitle>
              <CardDescription>Personalize o comportamento da inteligência artificial da plataforma</CardDescription>
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
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm mt-1"
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
                  {[
                    { label: "CRM Político (contatos, engajamento)", checked: true },
                    { label: "Lideranças (performance, conversão)", checked: true },
                    { label: "Demandas (tendências, regiões críticas)", checked: true },
                    { label: "Missões (taxa de conclusão, gargalos)", checked: true },
                    { label: "Gamificação (progressão, engajamento)", checked: true },
                    { label: "Inteligência Eleitoral (TSE, redutos)", checked: true },
                  ].map((item, i) => (
                    <div key={i} className="flex items-center gap-2">
                      <Switch defaultChecked={item.checked} />
                      <span className="text-sm text-slate-600">{item.label}</span>
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
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2"><FileText className="w-5 h-5 text-blue-600" />Privacidade e LGPD</CardTitle>
              <CardDescription>Gerencie seus dados pessoais conforme a Lei Geral de Proteção de Dados</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between py-2 border-b border-slate-100">
                <div>
                  <p className="text-sm font-medium text-slate-700">Termo de Consentimento</p>
                  <p className="text-xs text-slate-500">Autorizo o tratamento dos meus dados conforme a LGPD</p>
                </div>
                <Switch checked={consentimento} onCheckedChange={setConsentimento} />
              </div>
              <div className="flex items-center justify-between py-2 border-b border-slate-100">
                <div>
                  <p className="text-sm font-medium text-slate-700">Opt-in WhatsApp</p>
                  <p className="text-xs text-slate-500">Autorizo receber mensagens via WhatsApp</p>
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
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2"><Palette className="w-5 h-5 text-purple-600" />Aparência e Localização</CardTitle>
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
                  className="rounded-lg border border-slate-200 px-3 py-1.5 text-sm">
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
                  className="rounded-lg border border-slate-200 px-3 py-1.5 text-sm">
                  <option value="America/Sao_Paulo">Brasília (GMT-3)</option>
                  <option value="America/Manaus">Manaus (GMT-4)</option>
                  <option value="America/Rio_Branco">Rio Branco (GMT-5)</option>
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
                <p className="text-slate-700"><strong>Versão:</strong> 1.0.0</p>
                <p className="text-slate-700"><strong>Stack:</strong> React + Tailwind + Base44 BaaS</p>
                <p className="text-slate-700"><strong>Módulos:</strong> CRM Político, Gestão Territorial, Missões, Gamificação, Inteligência Eleitoral, Sofia IA</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}