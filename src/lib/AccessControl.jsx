import React, { createContext, useContext } from "react";
import { useAuth } from "@/lib/AuthContext";

/**
 * RBAC — Controle de Acesso Baseado em Funções
 * 
 * Perfis:
 *  - admin: acesso total a tudo
 *  - coordenador: acesso à sua região/equipe
 *  - lideranca: apenas Portal da Liderança
 *  - user: acesso restrito (padrão)
 * 
 * Uso:
 *   const { canAccess, canEdit, canExport } = useAccessControl();
 *   if (!canAccess("leaders")) return <Redirect .../>;
 */

// Roles da plataforma Base44
const ROLES = {
  ADMIN: "admin",
  USER: "user",
};

// Perfis estendidos (derivados de user.metadata ou atributos)
const EXTENDED_ROLES = {
  COORDENADOR: "coordenador",
  LIDERANCA: "lideranca",
};

// Definição de permissões por módulo
const ROLE_PERMISSIONS = {
  admin: {
    // Acesso total — todos os módulos
    modules: [
      "inteligencia", "contacts", "leaders", "demands", "missions",
      "gamification", "electoral_map", "strategic_planning", "campaigns",
      "electoral_intelligence", "reports", "configuracoes", "diagnostico_tse",
      "portal_lideranca", "saude_sistema"
    ],
    canEdit: true,
    canExport: true,
    canManageUsers: true,
    canConfigure: true,
  },
  coordenador: {
    modules: [
      "inteligencia", "contacts", "leaders", "demands", "missions",
      "gamification", "reports", "portal_lideranca"
    ],
    canEdit: true,
    canExport: true,
    canManageUsers: false,
    canConfigure: false,
  },
  lideranca: {
    // Apenas Portal da Liderança
    modules: ["portal_lideranca"],
    canEdit: false,
    canExport: false,
    canManageUsers: false,
    canConfigure: false,
  },
  user: {
    modules: ["inteligencia", "contacts", "demands"],
    canEdit: false,
    canExport: false,
    canManageUsers: false,
    canConfigure: false,
  },
};

/**
 * Determina o perfil efetivo do usuário baseado em role + metadata
 */
export function getEffectiveRole(user) {
  if (!user) return "user";
  if (user.role === "admin") return "admin";

  // Verificar metadata para perfis estendidos
  const profile = user.profile || user.metadata?.profile;
  if (profile === "coordenador") return "coordenador";
  if (profile === "lideranca") return "lideranca";

  return "user";
}

/**
 * Mapeia nome de página para módulo de permissão
 */
const PAGE_TO_MODULE = {
  InteligenciaEleitoral: "inteligencia",
  Contacts: "contacts",
  Leaders: "leaders",
  Demands: "demands",
  MissionCenter: "missions",
  MissionDetail: "missions",
  Gamification: "gamification",
  ElectoralMap: "electoral_map",
  StrategicPlanning: "strategic_planning",
  Campaigns: "campaigns",
  ElectoralConsult: "electoral_intelligence",
  DiagnosticoTSE: "diagnostico_tse",
  MissionDetail: "missions",
  SaudeSistema: "saude_sistema",
  Reports: "reports",
  Configuracoes: "configuracoes",
  PortalLideranca: "portal_lideranca",
  SaudeSistema: "saude_sistema",
};

/**
 * Hook principal de controle de acesso
 */
export function useAccessControl() {
  const { user } = useAuth();
  const role = getEffectiveRole(user);
  const permissions = ROLE_PERMISSIONS[role] || ROLE_PERMISSIONS.user;

  /**
   * Verifica se o usuário pode acessar um módulo específico
   */
  const canAccess = (moduleName) => {
    if (!user) return false;
    if (role === "admin") return true;
    return permissions.modules.includes(moduleName);
  };

  /**
   * Verifica se o usuário pode acessar uma página pelo nome
   */
  const canAccessPage = (pageName) => {
    const module = PAGE_TO_MODULE[pageName];
    if (!module) return true; // páginas não mapeadas são públicas
    return canAccess(module);
  };

  const canEdit = permissions.canEdit || role === "admin";
  const canExport = permissions.canExport || role === "admin";
  const canManageUsers = permissions.canManageUsers || role === "admin";
  const canConfigure = permissions.canConfigure || role === "admin";

  return {
    role,
    isAdmin: role === "admin",
    isCoordenador: role === "coordenador",
    isLideranca: role === "lideranca",
    canAccess,
    canAccessPage,
    canEdit,
    canExport,
    canManageUsers,
    canConfigure,
  };
}

/**
 * Componente wrapper para proteger rotas
 * Redireciona para /PortalLideranca se o usuário for liderança e tentar acessar outras páginas,
 * ou para / se não tiver permissão.
 */
export function RouteGuard({ children, pageName, fallback }) {
  const { canAccessPage } = useAccessControl();
  const { user } = useAuth();

  if (!user) return <>{children}</>;

  const allowed = canAccessPage(pageName);

  if (!allowed) {
    if (fallback) return <>{fallback}</>;
    // Lideranças sempre vão para o portal
    const role = getEffectiveRole(user);
    if (role === "lideranca") {
      window.location.href = "/PortalLideranca";
      return null;
    }
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <div className="w-16 h-16 rounded-2xl bg-red-100 flex items-center justify-center mb-4">
          <svg className="w-8 h-8 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m0 0v2m0-2h2m-2 0H10m9.364-7.364A9 9 0 1112 3a9 9 0 017.364 4.636z" />
          </svg>
        </div>
        <h2 className="text-lg font-semibold text-slate-800 mb-2">Acesso Restrito</h2>
        <p className="text-sm text-slate-500 max-w-md">
          Você não tem permissão para acessar esta página. Entre em contato com um administrador se precisar de acesso.
        </p>
      </div>
    );
  }

  return <>{children}</>;
}