# Arquitetura do Esperançar

## Visão de Alto Nível

```
┌─────────────────────────────────────────────────────────┐
│                    FRONTEND (React)                      │
│  pages/ + components/ + shadcn/ui + Tailwind            │
│  Roteamento: react-router-dom (App.jsx)                  │
│  Mapas: Leaflet + OpenStreetMap                          │
│  Gráficos: Recharts                                      │
└───────────────────────┬─────────────────────────────────┘
                        │ base44 SDK (REST)
                        ▼
┌─────────────────────────────────────────────────────────┐
│                  Base44 BaaS Platform                    │
│  ┌──────────┐  ┌──────────┐  ┌───────────────────────┐  │
│  │   Auth   │  │ Entities │  │   Deno Functions      │  │
│  │ (tokens) │  │  (JSON)  │  │ (serverless compute)  │  │
│  └──────────┘  └──────────┘  └───────────────────────┘  │
│  ┌──────────────────────────────────────────────────┐   │
│  │            Integrations Core                      │   │
│  │  InvokeLLM | UploadFile | SendEmail | Transcribe  │   │
│  └──────────────────────────────────────────────────┘   │
└───────────────────────┬─────────────────────────────────┘
                        │
          ┌─────────────┼─────────────┐
          ▼             ▼             ▼
   ┌──────────┐  ┌───────────┐  ┌─────────┐
   │ TSE CDN  │  │Evolution  │  │ ViaCEP  │
   │(dados)   │  │API (Whats)│  │  (CEP)  │
   └──────────┘  └───────────┘  └─────────┘
```

## Camadas

### 1. Frontend (React SPA)

- **App.jsx:** Roteador principal com AuthProvider e QueryClientProvider
- **Layout.jsx:** Sidebar + Header + conteúdo principal, aplicado via LayoutWrapper
- **pages/:** 13 páginas com rotas explícitas
- **components/:** 55+ componentes modulares organizados por domínio

### 2. SDK / Comunicação

- `api/base44Client.js`: Cliente SDK inicializado com credenciais do ambiente
- `lib/AuthContext.jsx`: Provider React para estado de autenticação
- Chamadas: `base44.entities.X.list()`, `base44.functions.invoke()`, `base44.auth.me()`

### 3. Backend (Base44)

- **Entities:** 11 schemas JSON gerenciando persistência
- **Deno Functions:** 11 funções serverless para lógica de negócio
- **Integrations Core:** InvokeLLM (Sofia IA), UploadFile, SendEmail
- **Automations:** 1 automação ativa (markOverdueMissions a cada 1h)

### 4. Integrações Externas

| Serviço | Propósito | Via |
|---|---|---|
| TSE | Dados eleitorais oficiais | Download HTTP + Deno functions |
| Evolution API | Envio de WhatsApp | REST API chamada de funções Deno |
| ViaCEP | Auto-preenchimento de endereço | REST API chamada do frontend |
| Nominatim | Geocodificação de endereços | REST API (OpenStreetMap) |
| LLM (Gemini) | Sofia IA — análises | InvokeLLM integration |

## Fluxo de Dados

### CRM → Gamificação
1. Liderança cadastra apoiador (Contact) via Portal
2. `gamificationEngine` é invocada, computa pontos
3. GamificationProfile é atualizado (nível, badges, ranking)
4. Se bônus hierárquico: mentores recebem pontos em cascata

### Missão → WhatsApp
1. Admin/Coordenador cria missão (Mission)
2. Se `whatsapp_config.send_immediately = true`, frontend chama `whatsappSend`
3. `whatsappSend` aplica rate-limiting (1.5s delay, lotes de 8, 30/h max)
4. Envio via Evolution API com retry em falha

### TSE → Inteligência Eleitoral
1. ETL externo processa dados do TSE
2. `receiveTSEBatch` recebe lotes normalizados
3. Dados armazenados em TSEVoteResult
4. Frontend consulta via `tseDataSync`

## Padrões de Código

- Export default para páginas e componentes
- Tailwind CSS com tokens semânticos do design system
- shadcn/ui para componentes base
- lucide-react exclusivamente para ícones
- Sem try/catch desnecessário (erros devem subir para correção)