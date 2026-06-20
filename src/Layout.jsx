import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { createPageUrl } from "./utils";
import { base44 } from "@/api/base44Client";
import {
  LayoutDashboard,
  Users,
  UserCheck,
  ClipboardList,
  Map,
  Target,
  BarChart3,
  FileText,
  Settings,
  Menu,
  X,
  ChevronDown,
  LogOut,
  Bell,
  Search,
  Gamepad2,
  Activity,
  AlertTriangle,
  CheckCheck,
  Clock,
  ExternalLink
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useAccessControl, getEffectiveRole } from "@/lib/AccessControl";


export default function Layout({ children, currentPageName }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [user, setUser] = useState(null);
  const [notifications, setNotifications] = useState([]);
  const [notifOpen, setNotifOpen] = useState(false);
  const { canAccessPage, isLideranca } = useAccessControl();

  useEffect(() => {
    const loadUser = async () => {
      try {
        const userData = await base44.auth.me();
        setUser(userData);
      } catch (e) {
        console.log("User not logged in");
      }
    };
    loadUser();
  }, []);

  // Carregar notificações
  useEffect(() => {
    if (!user?.id) return;
    const loadNotifications = async () => {
      try {
        const notifs = await base44.entities.Notification.filter(
          { user_id: user.id },
          '-created_date',
          30
        );
        setNotifications(notifs);
      } catch (_) {}
    };
    loadNotifications();
  }, [user?.id, notifOpen]);

  const unreadCount = notifications.filter(n => !n.read).length;

  const handleMarkAsRead = async (notif) => {
    try {
      await base44.entities.Notification.update(notif.id, { read: true });
      setNotifications(prev => prev.map(n => n.id === notif.id ? { ...n, read: true } : n));
    } catch (_) {}
  };

  const handleMarkAllRead = async () => {
    const unread = notifications.filter(n => !n.read);
    if (unread.length === 0) return;
    try {
      await Promise.all(unread.map(n => base44.entities.Notification.update(n.id, { read: true })));
      setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    } catch (_) {}
  };

  const getNotifIcon = (type) => {
    switch (type) {
      case 'demand_overdue': return <AlertTriangle className="w-4 h-4 text-red-500" />;
      case 'mission_overdue': return <AlertTriangle className="w-4 h-4 text-amber-500" />;
      case 'mission_assigned': return <Target className="w-4 h-4 text-blue-500" />;
      case 'level_up': return <Activity className="w-4 h-4 text-[#7AC943]" />;
      default: return <Bell className="w-4 h-4 text-slate-400" />;
    }
  };

  const timeAgo = (dateStr) => {
    if (!dateStr) return '';
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 60) return `${mins}m`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours}h`;
    return `${Math.floor(hours / 24)}d`;
  };

  const allNavigation = [
    { name: "Central de Inteligência", page: "InteligenciaEleitoral", icon: LayoutDashboard },
    { name: "Contatos", page: "Contacts", icon: Users },
    { name: "Lideranças", page: "Leaders", icon: UserCheck },
    { name: "Demandas", page: "Demands", icon: ClipboardList },
    { name: "Missões", page: "MissionCenter", icon: Target },
    { name: "Gamificação", page: "Gamification", icon: Gamepad2 },
    { name: "Mapa Territorial", page: "ElectoralMap", icon: Map },
    { name: "Planejamento", page: "StrategicPlanning", icon: Target },
    { name: "Campanhas", page: "Campaigns", icon: FileText },
    { name: "Portal da Liderança", page: "PortalLideranca", icon: UserCheck },
    { name: "Relatórios", page: "Reports", icon: BarChart3 },
    { name: "Saúde do Sistema", page: "SaudeSistema", icon: Activity },
    { name: "Configurações", page: "Configuracoes", icon: Settings },
  ];

  // Filtrar navegação por perfil (RBAC)
  const navigation = allNavigation.filter(item => canAccessPage(item.page));

  // Redirecionar lideranças para o portal se tentarem acessar outra página
  useEffect(() => {
    if (isLideranca && currentPageName && currentPageName !== "PortalLideranca" && currentPageName !== "Configuracoes") {
      window.location.href = "/PortalLideranca";
    }
  }, [isLideranca, currentPageName]);

  const handleLogout = () => {
    base44.auth.logout();
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <style>{`
        .sidebar-gradient {
          background: linear-gradient(180deg, #0A2540 0%, #0D3466 100%);
        }
        .nav-item-active {
          background: linear-gradient(90deg, rgba(122, 201, 67, 0.18) 0%, transparent 100%);
          border-left: 3px solid #7AC943;
        }
        .header-blur {
          backdrop-filter: blur(12px);
          background: rgba(255, 255, 255, 0.8);
        }
      `}</style>

      {/* Mobile sidebar backdrop */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed top-0 left-0 z-50 h-full w-72 sidebar-gradient transform transition-transform duration-300 ease-in-out lg:translate-x-0 ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="flex items-center justify-between p-6 border-b border-white/10">
            <div className="flex items-center gap-3">
              <img
                src="https://media.base44.com/images/public/6927a32c597892cda17b4136/9f3f423e6_ChatGPTImage19dejunde202620_51_17.png"
                alt="Esperançar"
                className="w-10 h-10 rounded-lg object-contain bg-white p-0.5"
              />
              <div>
                <h1 className="text-lg font-bold text-white">Esperançar</h1>
                <p className="text-xs text-[#7AC943]">PLATAFORMA ESTRATÉGICA POLÍTICA</p>
              </div>
            </div>
            <button
              className="lg:hidden text-white"
              onClick={() => setSidebarOpen(false)}
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Navigation */}
          <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
            {navigation.map((item) => {
              const isActive = currentPageName === item.page;
              return (
                <Link
                  key={item.page}
                  to={createPageUrl(item.page)}
                  className={`flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all duration-200 ${
                    isActive
                      ? "nav-item-active text-white"
                      : "text-slate-400 hover:text-white hover:bg-white/5"
                  }`}
                  onClick={() => setSidebarOpen(false)}
                >
                  <item.icon className={`w-5 h-5 ${isActive ? "text-[#7AC943]" : ""}`} />
                  {item.name}
                </Link>
              );
            })}
          </nav>

          {/* User section */}
          {user && (
            <div className="p-4 border-t border-white/10">
              <div className="flex items-center gap-3 px-4 py-3">
                <Avatar className="w-9 h-9">
                  <AvatarFallback className="bg-blue-500 text-white text-sm">
                    {user.full_name?.charAt(0) || user.email?.charAt(0)?.toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-white truncate">
                    {user.full_name || "Usuário"}
                  </p>
                  <p className="text-xs text-slate-400 truncate">{user.email}</p>
                </div>
              </div>
            </div>
          )}
        </div>
      </aside>

      {/* Main content */}
      <div className="lg:pl-72">
        {/* Header */}
        <header className="sticky top-0 z-30 header-blur border-b border-slate-200">
          <div className="flex items-center justify-between px-4 lg:px-8 h-16">
            <div className="flex items-center gap-4">
              <button
                className="lg:hidden p-2 rounded-lg hover:bg-slate-100"
                onClick={() => setSidebarOpen(true)}
              >
                <Menu className="w-5 h-5 text-slate-600" />
              </button>
              
              <div className="hidden md:flex items-center gap-2 bg-slate-100 rounded-lg px-3 py-2 w-80">
                <Search className="w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  placeholder="Buscar contatos, demandas..."
                  className="bg-transparent border-none outline-none text-sm flex-1 text-slate-600 placeholder:text-slate-400"
                />
              </div>
            </div>

            <div className="flex items-center gap-3">
              {/* Notifications Bell */}
              <DropdownMenu open={notifOpen} onOpenChange={setNotifOpen}>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="relative">
                    <Bell className="w-5 h-5 text-slate-600" />
                    {unreadCount > 0 && (
                      <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] flex items-center justify-center bg-red-500 text-white text-[10px] font-bold rounded-full px-1">
                        {unreadCount > 9 ? '9+' : unreadCount}
                      </span>
                    )}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-80 max-h-[420px] overflow-y-auto">
                  <div className="flex items-center justify-between px-3 py-2 border-b">
                    <p className="font-semibold text-sm text-slate-700">Notificações</p>
                    {unreadCount > 0 && (
                      <button onClick={handleMarkAllRead} className="text-xs text-[#7AC943] hover:underline flex items-center gap-1">
                        <CheckCheck className="w-3.5 h-3.5" /> Marcar todas lidas
                      </button>
                    )}
                  </div>
                  {notifications.length === 0 ? (
                    <div className="px-3 py-8 text-center">
                      <Bell className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                      <p className="text-sm text-slate-400">Nenhuma notificação</p>
                    </div>
                  ) : (
                    notifications.map((n) => (
                      <div
                        key={n.id}
                        className={`flex gap-3 px-3 py-3 border-b border-slate-50 cursor-pointer hover:bg-slate-50 transition ${!n.read ? 'bg-blue-50/50' : ''}`}
                        onClick={() => {
                          handleMarkAsRead(n);
                          if (n.link) window.location.href = n.link;
                        }}
                      >
                        <div className="flex-shrink-0 mt-0.5">
                          {getNotifIcon(n.type)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-slate-700 truncate">{n.title}</p>
                          <p className="text-xs text-slate-500 line-clamp-2 mt-0.5">{n.message}</p>
                          <div className="flex items-center gap-2 mt-1">
                            <span className="text-[10px] text-slate-400 flex items-center gap-1">
                              <Clock className="w-3 h-3" />{timeAgo(n.created_date)}
                            </span>
                            {!n.read && <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />}
                          </div>
                        </div>
                        {n.link && (
                          <ExternalLink className="w-3 h-3 text-slate-300 flex-shrink-0 mt-1" />
                        )}
                      </div>
                    ))
                  )}
                </DropdownMenuContent>
              </DropdownMenu>

              {user && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="flex items-center gap-2">
                      <Avatar className="w-8 h-8">
                        <AvatarFallback className="bg-blue-500 text-white text-xs">
                          {user.full_name?.charAt(0) || user.email?.charAt(0)?.toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <ChevronDown className="w-4 h-4 text-slate-400" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-56">
                    <div className="px-3 py-2">
                      <p className="font-medium text-sm">{user.full_name || "Usuário"}</p>
                      <p className="text-xs text-slate-500">{user.email}</p>
                    </div>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem asChild>
                      <Link to={createPageUrl("Configuracoes")}>
                        <Settings className="w-4 h-4 mr-2" />
                        Configurações
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={handleLogout} className="text-red-600">
                      <LogOut className="w-4 h-4 mr-2" />
                      Sair
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="p-4 lg:p-8">
          {children}
        </main>
      </div>
    </div>
  );
}