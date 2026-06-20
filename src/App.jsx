import './App.css'
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
import { RouteGuard } from '@/lib/AccessControl';
import { AuthProvider, useAuth } from '@/lib/AuthContext';
import UserNotRegisteredError from '@/components/UserNotRegisteredError';

const { Pages, Layout } = pagesConfig;

const LayoutWrapper = ({ children, currentPageName }) => Layout ?
  <Layout currentPageName={currentPageName}>{children}</Layout>
  : <>{children}</>;

const AuthenticatedApp = () => {
  const { isLoadingAuth, isLoadingPublicSettings, authError, isAuthenticated, navigateToLogin } = useAuth();

  if (isLoadingPublicSettings || isLoadingAuth) {
    return (
      <div className="fixed inset-0 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-slate-200 border-t-slate-800 rounded-full animate-spin"></div>
      </div>
    );
  }

  if (authError) {
    if (authError.type === 'user_not_registered') {
      return <UserNotRegisteredError />;
    } else if (authError.type === 'auth_required') {
      navigateToLogin();
      return null;
    }
  }

  return (
    <Routes>
      {/* Central de Inteligência as the main unified page */}
      <Route path="/" element={
        <LayoutWrapper currentPageName="InteligenciaEleitoral">
          <InteligenciaEleitoral />
        </LayoutWrapper>
      } />
      {Object.entries(Pages).map(([path, Page]) => (
        <Route
          key={path}
          path={`/${path}`}
          element={
            <LayoutWrapper currentPageName={path}>
              <Page />
            </LayoutWrapper>
          }
        />
      ))}
      <Route path="/mission/:id" element={
        <LayoutWrapper currentPageName="MissionCenter">
          <MissionDetail />
        </LayoutWrapper>
      } />
      <Route path="/InteligenciaEleitoral" element={
        <LayoutWrapper currentPageName="InteligenciaEleitoral">
          <RouteGuard pageName="InteligenciaEleitoral"><InteligenciaEleitoral /></RouteGuard>
        </LayoutWrapper>
      } />
      <Route path="/DiagnosticoTSE" element={
        <LayoutWrapper currentPageName="InteligenciaEleitoral">
          <DiagnosticoTSE />
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
      <Route path="*" element={<PageNotFound />} />
    </Routes>
  );
};


function App() {

  return (
    <AuthProvider>
      <QueryClientProvider client={queryClientInstance}>
        <Router>
          <NavigationTracker />
          <AuthenticatedApp />
        </Router>
        <Toaster />
        <VisualEditAgent />
      </QueryClientProvider>
    </AuthProvider>
  )
}

export default App