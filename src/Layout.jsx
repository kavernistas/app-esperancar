import { useState, useEffect } from "react";
import { Link, useNavigate, Navigate } from "react-router-dom";
import { createPageUrl } from "./lib/utils";
import { useAuth } from "@/lib/AuthContext";
import * as notificationsApi from "@/api/notifications";
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
  ExternalLink,
  Gauge,
  Wallet,
  Crosshair
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useAccessControl } from "@/lib/AccessControl";
import { normalizeList } from "@/lib/normalizeList";
export default function Layout({ children, currentPageName }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [notifOpen, setNotifOpen] = useState(false);
  const { canAccessPage, isLideranca } = useAccessControl();
  const { user, logout, isLoading } = useAuth();

  // Redirecionar para login se não estiver autenticado
  if (!isLoading && !user) {
    return <Navigate to="/login" replace />;
  }

  // Mostrar loading enquanto carrega
  if (isLoading) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-[#F7F8FA]">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 border-4 border-slate-200 border-t-[#7AC943] rounded-full animate-spin"></div>
          <p className="text-sm text-slate-500 font-medium">Carregando...</p>
        </div>
      </div>
    );
  }

  // Carregar notificacoes
  useEffect(() => {
    if (!user?.id) return;
    const loadNotifications = async () => {
      try {
        const notifs = await notificationsApi.listNotifications();
        setNotifications(notifs?.data || notifs || []);
      } catch (_) {}
    };
    loadNotifications();
  }, [user?.id, notifOpen]);

  const unreadCount = normalizeList(notifications).filter(n => !n.read).length;

  const handleMarkAsRead = async (notif) => {
    try {
      await notificationsApi.markAsRead(notif.id);
      setNotifications(prev => prev.map(n => n.id === notif.id ? { ...n, read: true } : n));
    } catch (_) {}
  };

  const handleMarkAllRead = async () => {
    const unread = normalizeList(notifications).filter(n => !n.read);
    if (unread.length === 0) return;
    try {
      await notificationsApi.markAllRead();
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
    { name: "War Room", page: "WarRoom", icon: Gauge },
    { name: "Central de Inteligência", page: "InteligenciaEleitoral", icon: LayoutDashboard },
    { name: "Contatos", page: "Contacts", icon: Users },
    { name: "Lideranças", page: "Leaders", icon: UserCheck },
    { name: "Demandas", page: "Demands", icon: ClipboardList },
    { name: "Missões", page: "MissionCenter", icon: Target },
    { name: "Gamificação", page: "Gamification", icon: Gamepad2 },
    { name: "Mapa Territorial", page: "ElectoralMap", icon: Map },
    { name: "Planejamento", page: "StrategicPlanning", icon: Target },
    { name: "OKRs", page: "OKRs", icon: Crosshair },
    { name: "Campanhas", page: "Campaigns", icon: FileText },
    { name: "Financeiro", page: "Financeiro", icon: Wallet },
    { name: "Portal da Liderança", page: "PortalLideranca", icon: UserCheck },
    { name: "Relatórios", page: "Reports", icon: BarChart3 },
    { name: "Saúde do Sistema", page: "SaudeSistema", icon: Activity },
    { name: "Configurações", page: "Configuracoes", icon: Settings },
  ];

  // Filtrar navegação por perfil (RBAC)
  const navigation = allNavigation.filter(item => canAccessPage(item.page));

  // Redirecionar lideranças para o portal
  useEffect(() => {
    if (isLideranca && currentPageName && currentPageName !== "PortalLideranca" && currentPageName !== "Configuracoes") {
      window.location.href = "/PortalLideranca";
    }
  }, [isLideranca, currentPageName]);

  const handleLogout = () => {
    logout();
  };

  return (
    <div className="min-h-screen bg-[#F7F8FA]">
      <style>{`
        :root {
          --navy: #0A2540;
          --navy-light: #0D3466;
          --navy-ghost: rgba(10, 37, 64, 0.04);
          --navy-hover: rgba(10, 37, 64, 0.06);
          --lime: #7AC943;
          --lime-soft: rgba(122, 201, 67, 0.08);
          --lime-glow: rgba(122, 201, 67, 0.15);
          --yellow: #FDB913;
          --sidebar-w: 264px;
        }
        .sidebar {
          background: linear-gradient(180deg, #0A2540 0%, #0D3466 50%, #0A2540 100%);
        }
        .nav-row {
          position: relative;
          border-radius: 12px;
          transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
        }
        .nav-row:hover { background: rgba(255, 255, 255, 0.06); }
        .nav-row-active {
          background: linear-gradient(90deg, rgba(122, 201, 67, 0.10) 0%, rgba(122, 201, 67, 0.02) 100%);
        }
        .nav-row-active::before {
          content: '';
          position: absolute;
          left: 0;
          top: 8px;
          bottom: 8px;
          width: 3px;
          background: #7AC943;
          border-radius: 0 3px 3px 0;
        }
        .header-glass {
          backdrop-filter: blur(16px) saturate(180%);
          background: rgba(255, 255, 255, 0.85);
          border-bottom: 1px solid rgba(10, 37, 64, 0.06);
        }
        .search-field {
          background: rgba(10, 37, 64, 0.03);
          border: 1px solid transparent;
          border-radius: 12px;
          transition: all 0.2s ease;
        }
        .search-field:focus-within {
          background: #fff;
          border-color: rgba(122, 201, 67, 0.4);
          box-shadow: 0 0 0 3px rgba(122, 201, 67, 0.08);
        }
        .notif-badge {
          animation: pulse-dot 2s infinite;
        }
        @keyframes pulse-dot {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.15); }
        }
        .user-avatar-ring {
          box-shadow: 0 0 0 2px rgba(122, 201, 67, 0.15);
        }
        .mobile-menu-btn:active { transform: scale(0.92); }
        @media (max-width: 1023px) {
          .sidebar-overlay { animation: fadeIn 0.15s ease-out; }
        }
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
      `}</style>

      {/* Mobile sidebar backdrop */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-[#0A2540]/60 backdrop-blur-sm z-40 lg:hidden sidebar-overlay"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed top-0 left-0 z-50 h-full sidebar transition-transform duration-300 ease-out lg:translate-x-0 ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
        style={{ width: 'var(--sidebar-w)' }}
      >
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="flex items-center justify-between px-5 py-5 border-b border-white/[0.07]">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-white/95 p-1 flex items-center justify-center shadow-sm">
                <div className="w-8 h-8 rounded-lg bg-[#7AC943] flex items-center justify-center text-white font-bold text-sm">E</div>
              </div>
              <div>
                <h1 className="text-[15px] font-bold text-white tracking-tight leading-tight">Esperançar</h1>
                <p className="text-[10px] font-semibold text-[#7AC943] tracking-widest uppercase">Plataforma Política</p>
              </div>
            </div>
            <button
              className="lg:hidden text-white/70 hover:text-white transition-colors"
              onClick={() => setSidebarOpen(false)}
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
            {navigation.map((item) => {
              const isActive = currentPageName === item.page;
              return (
                <Link
                  key={item.page}
                  to={createPageUrl(item.page)}
                  className={`nav-row flex items-center gap-3 px-3 py-2.5 text-[13px] font-medium ${
                    isActive
                      ? "nav-row-active text-white"
                      : "text-slate-400"
                  }`}
                  onClick={() => setSidebarOpen(false)}
                >
                  <item.icon className={`w-[18px] h-[18px] flex-shrink-0 ${isActive ? "text-[#7AC943]" : "text-slate-500"}`} />
                  <span className="truncate">{item.name}</span>
                </Link>
              );
            })}
          </nav>

          {/* User section */}
          {user && (
            <div className="px-3 py-3 border-t border-white/[0.07]">
              <div className="flex items-center gap-3 px-3 py-2.5 rounded-xl bg-white/[0.04]">
                <Avatar className="w-9 h-9 user-avatar-ring">
                  <AvatarFallback className="bg-gradient-to-br from-[#7AC943] to-[#5DA830] text-white text-xs font-bold">
                    {user.full_name?.charAt(0) || user.email?.charAt(0)?.toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <p className="text-[13px] font-medium text-white truncate leading-tight">
                    {user.full_name || "Usuário"}
                  </p>
                  <p className="text-[11px] text-slate-500 truncate">{user.email}</p>
                </div>
              </div>
            </div>
          )}
        </div>
      </aside>

      {/* Main content */}
      <div className="lg:pl-[264px]">
        {/* Header */}
        <header className="sticky top-0 z-30 header-glass">
          <div className="flex items-center justify-between h-[60px] px-4 lg:px-6">
            <div className="flex items-center gap-3">
              <button
                className="lg:hidden p-2 -ml-1 rounded-xl hover:bg-[#0A2540]/5 active:scale-95 transition-all mobile-menu-btn"
                onClick={() => setSidebarOpen(true)}
              >
                <Menu className="w-5 h-5 text-[#0A2540]/70" />
              </button>
              
              <div className="hidden md:flex items-center gap-2 search-field px-3.5 py-2 w-72">
                <Search className="w-[15px] h-[15px] text-slate-400 flex-shrink-0" />
                <input
                  type="text"
                  placeholder="Buscar contatos, demandas..."
                  className="bg-transparent border-none outline-none text-[13px] flex-1 text-[#0A2540] placeholder:text-slate-400"
                />
              </div>
            </div>

            <div className="flex items-center gap-1.5">
              {/* Notifications Bell */}
              <DropdownMenu open={notifOpen} onOpenChange={setNotifOpen}>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="relative rounded-xl hover:bg-[#0A2540]/5">
                    <Bell className="w-[18px] h-[18px] text-slate-500" />
                    {unreadCount > 0 && (
                      <span className="notif-badge absolute top-1 right-1.5 min-w-[17px] h-[17px] flex items-center justify-center bg-red-500 text-white text-[10px] font-bold rounded-full px-1 leading-none">
                        {unreadCount > 9 ? '9+' : unreadCount}
                      </span>
                    )}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-[360px] max-h-[440px] overflow-y-auto rounded-2xl border-slate-200/80 shadow-xl shadow-slate-200/20">
                  <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100">
                    <p className="font-semibold text-[14px] text-[#0A2540]">Notificações</p>
                    {unreadCount > 0 && (
                      <button onClick={handleMarkAllRead} className="text-[12px] font-medium text-[#7AC943] hover:text-[#5DA830] transition-colors flex items-center gap-1.5">
                        <CheckCheck className="w-3.5 h-3.5" /> Marcar todas lidas
                      </button>
                    )}
                  </div>
                  {normalizeList(notifications).length === 0 ? (
                    <div className="px-4 py-10 text-center">
                      <div className="w-12 h-12 rounded-2xl bg-slate-100 flex items-center justify-center mx-auto mb-3">
                        <Bell className="w-5 h-5 text-slate-300" />
                      </div>
                      <p className="text-[13px] text-slate-400 font-medium">Nenhuma notificação</p>
                      <p className="text-[11px] text-slate-400 mt-1">Você será notificado aqui sobre demandas, missões e alertas.</p>
                    </div>
                  ) : (
                    normalizeList(notifications).map((n) => (
                      <div
                        key={n.id}
                        className={`flex gap-3 px-4 py-3 border-b border-slate-50 cursor-pointer transition-colors ${
                          !n.read ? 'bg-[#7AC943]/[0.04] hover:bg-[#7AC943]/[0.08]' : 'hover:bg-slate-50'
                        }`}
                        onClick={() => {
                          handleMarkAsRead(n);
                          if (n.link) window.location.href = n.link;
                        }}
                      >
                        <div className="flex-shrink-0 mt-0.5">
                          <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${
                            n.type === 'demand_overdue' ? 'bg-red-50' :
                            n.type === 'mission_overdue' ? 'bg-amber-50' :
                            n.type === 'mission_assigned' ? 'bg-blue-50' :
                            n.type === 'level_up' ? 'bg-[#7AC943]/10' :
                            'bg-slate-100'
                          }`}>
                            {getNotifIcon(n.type)}
                          </div>
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2">
                            <p className="text-[13px] font-medium text-[#0A2540] truncate">{n.title}</p>
                            {!n.read && <span className="w-2 h-2 rounded-full bg-[#7AC943] flex-shrink-0 mt-1" />}
                          </div>
                          <p className="text-[12px] text-slate-500 line-clamp-2 mt-0.5 leading-relaxed">{n.message}</p>
                          <span className="inline-flex items-center gap-1 mt-1.5 text-[11px] text-slate-400">
                            <Clock className="w-3 h-3" />{timeAgo(n.created_at)}
                          </span>
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
                    <Button variant="ghost" className="flex items-center gap-2 px-2 py-1.5 rounded-xl hover:bg-[#0A2540]/5">
                      <Avatar className="w-8 h-8">
                        <AvatarFallback className="bg-gradient-to-br from-[#0A2540] to-[#0D3466] text-white text-xs font-bold">
                          {user.full_name?.charAt(0) || user.email?.charAt(0)?.toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-60 rounded-2xl border-slate-200/80 shadow-xl shadow-slate-200/20">
                    <div className="px-4 py-3 border-b border-slate-100">
                      <p className="font-semibold text-[13px] text-[#0A2540]">{user.full_name || "Usuário"}</p>
                      <p className="text-[11px] text-slate-500 mt-0.5">{user.email}</p>
                    </div>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem asChild className="text-[13px]">
                      <Link to={createPageUrl("Configuracoes")}>
                        <Settings className="w-4 h-4 mr-2.5 text-slate-400" />
                        Configurações
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={handleLogout} className="text-red-500 text-[13px]">
                      <LogOut className="w-4 h-4 mr-2.5" />
                      Sair
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="p-5 lg:p-7">
          {children}
        </main>
      </div>
    </div>
  );
}