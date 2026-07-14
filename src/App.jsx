import './App.css'
import { useEffect } from 'react'
import { Toaster } from "@/components/ui/toaster"
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClientInstance } from '@/lib/query-client'
import VisualEditAgent from '@/lib/VisualEditAgent'
import NavigationTracker from '@/lib/NavigationTracker'
import { pagesConfig } from './pages.config'
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import PageNotFound from './lib/PageNotFound';
import MissionDetail from './pages/MissionDetail';
import DiagnosticoTSE from './pages/DiagnosticoTSE';
import InteligenciaEleitoral from './pages/InteligenciaEleitoral';
import PortalLideranca from './pages/PortalLideranca';
import Configuracoes from './pages/Configuracoes';
import SaudeSistema from './pages/SaudeSistema';
import Financeiro from './pages/Financeiro';
import OKRs from './pages/OKRs';
import PesquisaCampo from './pages/PesquisaCampo';
import { RouteGuard } from '@/lib/AccessControl';
import { AuthProvider, useAuth } from '@/lib/AuthContext';
import { base44 } from '@/api/base44Client';
import UserNotRegisteredError from '@/components/UserNotRegisteredError';

const { Pages, Layout } = pagesConfig;

const LayoutWrapper = ({ children, currentPageName }) => Layout ?
  <Layout currentPageName={currentPageName}>{children}</Layout>
  : <>{children}</>;

const LoginRedirect = () => {
  useEffect(() => {
    base44.auth.redirectToLogin(window.location.pathname);
  }, []);
  return (
    <div className="fixed inset-0 flex items-center justify-center bg-[#F7F8FA]">
      <div className="flex flex-col items-center gap-4">
        <div className="w-10 h-10 border-4 border-slate-200 border-t-[#7AC943] rounded-full animate-spin"></div>
        <p className="text-sm text-slate-500 font-medium">Redirecionando para login...</p>
      </div>
    </div>
  );
};

const AuthenticatedApp = () => {
  const { isLoading, isAuthenticated, authError, navigateToLogin } = useAuth();

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

  if (authError) {
    if (authError.type === 'user_not_registered') {
      return <UserNotRegisteredError />;
    }
  }

  if (!isAuthenticated) {
    return <LoginRedirect />;
  }

  return (
    <Routes>
      {/* Central de Inteligência as the main unified page */}
      <Route path="/" element={
        <LayoutWrapper currentPageName="InteligenciaEleitoral">
          <RouteGuard pageName="InteligenciaEleitoral"><InteligenciaEleitoral /></RouteGuard>
        </LayoutWrapper>
      } />
      {Object.entries(Pages).map(([path, Page]) => (
        <Route
          key={path}
          path={`/${path}`}
          element={
            <LayoutWrapper currentPageName={path}>
              <RouteGuard pageName={path}><Page /></RouteGuard>
            </LayoutWrapper>
          }
        />
      ))}
      <Route path="/mission/:id" element={
        <LayoutWrapper currentPageName="MissionCenter">
          <RouteGuard pageName="MissionCenter"><MissionDetail /></RouteGuard>
        </LayoutWrapper>
      } />
      <Route path="/InteligenciaEleitoral" element={
        <LayoutWrapper currentPageName="InteligenciaEleitoral">
          <RouteGuard pageName="InteligenciaEleitoral"><InteligenciaEleitoral /></RouteGuard>
        </LayoutWrapper>
      } />
      <Route path="/DiagnosticoTSE" element={
        <LayoutWrapper currentPageName="InteligenciaEleitoral">
          <RouteGuard pageName="DiagnosticoTSE"><DiagnosticoTSE /></RouteGuard>
        </LayoutWrapper>
      } />
      <Route path="/PortalLideranca" element={
        <LayoutWrapper currentPageName="PortalLideranca">
          <RouteGuard pageName="PortalLideranca"><PortalLideranca /></RouteGuard>
        </LayoutWrapper>
      } />
      <Route path="/Configuracoes" element={
        <LayoutWrapper currentPageName="Configuracoes">
          <RouteGuard pageName="Configuracoes"><Configuracoes /></RouteGuard>
        </LayoutWrapper>
      } />
      <Route path="/SaudeSistema" element={
        <LayoutWrapper currentPageName="SaudeSistema">
          <RouteGuard pageName="SaudeSistema"><SaudeSistema /></RouteGuard>
        </LayoutWrapper>
      } />
      <Route path="/Financeiro" element={
        <LayoutWrapper currentPageName="Financeiro">
          <RouteGuard pageName="Financeiro"><Financeiro /></RouteGuard>
        </LayoutWrapper>
      } />
      <Route path="/PesquisaCampo" element={
        <LayoutWrapper currentPageName="PesquisaCampo">
          <RouteGuard pageName="PesquisaCampo"><PesquisaCampo /></RouteGuard>
        </LayoutWrapper>
      } />
      <Route path="/OKRs" element={
        <LayoutWrapper currentPageName="OKRs">
          <RouteGuard pageName="OKRs"><OKRs /></RouteGuard>
        </LayoutWrapper>
      } />
      <Route path="*" element={<PageNotFound />} />
    </Routes>
  );
};


function App() {

  return (
    <QueryClientProvider client={queryClientInstance}>
      <Router>
        <AuthProvider>
          <NavigationTracker />
          <AuthenticatedApp />
        </AuthProvider>
        <Toaster />
        <VisualEditAgent />
      </Router>
    </QueryClientProvider>
  )
}

export default App