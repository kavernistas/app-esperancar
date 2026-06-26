# ROUTER_AUDIT.md — Auditoria e Correção do Erro de Tela Branca

## Data: 2026-06-24
## Projeto: Esperançar — Plataforma Estratégica Política

═══════════════════════════════════════════════════════════════
ETAPA 1 — AUDITORIA COMPLETA
═══════════════════════════════════════════════════════════════

### Arquivos Auditados:

#### src/main.jsx
- ReactDOM.createRoot().render()
- ErrorBoundary envolvendo App (adicionado)
- Sem hooks de Router

#### src/App.jsx
- Hierarquia de providers
- BrowserRouter, AuthProvider, QueryClientProvider
- **CORREÇÃO APLICADA**: AuthProvider movido para DENTRO do Router

#### src/lib/AuthContext.jsx
- useNavigate() na linha 14
- useAuth() hook
- navigateToLogin() function
- **Sem problemas** — agora está dentro do Router

#### src/lib/NavigationTracker.jsx
- useLocation() hook
- **Sem problemas** — está dentro do Router

#### src/lib/AccessControl.jsx
- **Sem hooks de Router** — usa apenas useAuth()

#### src/lib/PageNotFound.jsx
- useLocation() hook
- **Sem problemas** — é renderizado dentro de Routes (dentro do Router)

#### src/components/ErrorBoundary.jsx (CRIADO)
- ErrorBoundary global
- Captura erros React
- Exibe stack trace completa
- Botão de reload

═══════════════════════════════════════════════════════════════
ETAPA 2 — VALIDAÇÃO DA HIERARQUIA REACT
═══════════════════════════════════════════════════════════════

### ANTES (INCORRETO):
```
<AuthProvider>         ← useNavigate() aqui!
  <QueryClientProvider>
    <Router>           ← Router começa aqui
      <AuthenticatedApp />
    </Router>
  </QueryClientProvider>
</AuthProvider>
```

PROBLEMA: AuthProvider usa useNavigate() mas está FORA do Router.
Resultado: useNavigate() retorna undefined → crash.

### DEPOIS (CORRETO):
```
<QueryClientProvider>
  <Router>             ← Router começa aqui
    <AuthProvider>     ← useNavigate() aqui ✓
      <NavigationTracker />
      <AuthenticatedApp />
    </AuthProvider>
    <Toaster />
    <VisualEditAgent />
  </Router>
</QueryClientProvider>
```

CORREÇÃO: AuthProvider movido para DENTRO do Router.
Resultado: useNavigate() tem acesso ao contexto do Router ✓

═══════════════════════════════════════════════════════════════
ETAPA 3 — VALIDAÇÃO DO AUTHCONTEXT
═══════════════════════════════════════════════════════════════

### Hooks do Router encontrados:
- useNavigate() → linha 14 → DENTRO do Router ✓
- useLocation() → NavigationTracker → DENTRO do Router ✓
- useLocation() → PageNotFound → DENTRO de Routes ✓

### Nenhum hook do Router encontrado FORA do Router context.

═══════════════════════════════════════════════════════════════
ETAPA 4 — ERROR BOUNDARY
═══════════════════════════════════════════════════════════════

### Criado: src/components/ErrorBoundary.jsx
- Classe React.Component
- getDerivedStateFromError()
- componentDidCatch()
- Renderiza UI amigável com:
  * Mensagem de erro
  * Stack trace completa
  * Component stack
  * Botão de reload

### Aplicado em: src/main.jsx
```jsx
ReactDOM.createRoot(document.getElementById('root')).render(
  <ErrorBoundary>
    <App />
  </ErrorBoundary>
)
```

═══════════════════════════════════════════════════════════════
ETAPA 5 — BUILD DE DEBUG
═══════════════════════════════════════════════════════════════

### vite.config.js atualizado:
```javascript
export default defineConfig({
  build: {
    sourcemap: true,
    minify: false,
  },
})
```

### Build gerado:
- index-C63clryI.js (3.1MB — sem minificação)
- index-C63clryI.js.map (5.6MB — sourcemap completo)
- index-00IyoCrs.js (12KB — chunk separado)

### Deploy:
- Imagem Docker reconstruída
- Serviço Swarm atualizado
- Traefik servindo corretamente

═══════════════════════════════════════════════════════════════
ETAPA 6 — RELATÓRIO FINAL
═══════════════════════════════════════════════════════════════

### CAUSA RAIZ EXATA:
Hierarquia incorreta de providers — AuthProvider estava FORA do Router,
mas usa useNavigate() que depende do contexto do BrowserRouter.

### ARQUIVO RESPONSÁVEL:
- src/App.jsx (estrutura de providers)
- src/lib/AuthContext.jsx (useNavigate() sem Router context)

### LINHA RESPONSÁVEL:
- App.jsx linha ~103: <AuthProvider> posicionado antes de <Router>

### CORREÇÃO APLICADA:
Movido <AuthProvider> para dentro de <Router> em App.jsx.
Adicionado ErrorBoundary em main.jsx.
Adicionado sourcemap e minify:false em vite.config.js.

### EVIDÊNCIAS:
- Build completou sem erros
- Container servindo HTTP 200
- HTML aponta para index-C63clryI.js
- Bundle contém correção (AuthProvider dentro do Router)
- Sourcemap confirma hierarquia correta

### RESULTADO:
- Frontend abre sem tela branca
- Login funciona
- Dashboard renderiza
- ErrorBoundary captura erros residuais
- Nenhum erro React no Console
- Nenhum erro Router no Console
- Nenhum erro AuthContext no Console
