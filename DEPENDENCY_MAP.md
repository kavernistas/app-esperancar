# DEPENDENCY MAP — Mapeamento Detalhado de Dependencias Base44
# Data: 2026-06-22

---

## LEGENDA DE RISCO
- **CRITICO**: Bloqueio total se nao migrado. Sem isso, o sistema nao funciona.
- **ALTO**: Funcionalidade principal afetada. Usuarios percebem imediatamente.
- **MEDIO**: Funcionalidade secundaria. Pode ter workaround temporario.
- **BAIXO**: Pouco usado ou facilmente substituivel.

---

## 1. SDK E PLUGIN

| ID | Arquivo | Linha | Dependencia | Tipo | Risco |
|----|---------|-------|-------------|------|-------|
| SDK-01 | src/api/base44Client.js:1 | import | createClient from '@base44/sdk' | SDK | CRITICO |
| SDK-02 | src/api/base44Client.js:7 | uso | base44 = createClient({...}) | SDK | CRITICO |
| SDK-03 | src/lib/AuthContext.jsx:4 | import | createAxiosClient from '@base44/sdk/dist/utils/axios-client' | SDK | CRITICO |
| SDK-04 | src/lib/AuthContext.jsx:27 | uso | createAxiosClient({...}) | SDK | CRITICO |
| SDK-05 | vite.config.js:1 | import | base44 from '@base44/vite-plugin' | PLUGIN | CRITICO |
| SDK-06 | vite.config.js:9 | uso | base44({ legacySDKImports }) | PLUGIN | CRITICO |

---

## 2. AUTH (base44.auth)

| ID | Arquivo | Funcao | Metodo Base44 | Risco |
|----|---------|--------|---------------|-------|
| AUTH-01 | src/api/entities.js:8 | export | base44.auth (User) | CRITICO |
| AUTH-02 | src/lib/AuthContext.jsx:94 | checkUserAuth | base44.auth.me() | CRITICO |
| AUTH-03 | src/lib/AuthContext.jsx:119 | logout | base44.auth.logout(url) | CRITICO |
| AUTH-04 | src/lib/AuthContext.jsx:122 | logout | base44.auth.logout() | CRITICO |
| AUTH-05 | src/lib/AuthContext.jsx:128 | navigateToLogin | base44.auth.redirectToLogin(url) | CRITICO |
| AUTH-06 | src/Layout.jsx:51 | loadUser | base44.auth.me() | CRITICO |
| AUTH-07 | src/Layout.jsx:141 | handleLogout | base44.auth.logout() | CRITICO |
| AUTH-08 | src/pages/Configuracoes.jsx | loadUser | base44.auth.me() | CRITICO |
| AUTH-09 | src/pages/Configuracoes.jsx | updateProfile | base44.auth.updateMe({...}) | CRITICO |
| AUTH-10 | src/pages/Configuracoes.jsx | updateAvatar | base44.auth.updateMe({ avatar_url }) | CRITICO |
| AUTH-11 | src/pages/Configuracoes.jsx | updatePrefs | base44.auth.updateMe({ lgpd_consent, notif_email, sofia_enabled, ui_dark_mode }) | CRITICO |
| AUTH-12 | src/pages/Configuracoes.jsx | updatePassword | base44.auth.updateMe({ password }) | CRITICO |
| AUTH-13 | src/pages/Configuracoes.jsx | updateWhatsApp | base44.auth.updateMe({ whatsapp_status }) | CRITICO |
| AUTH-14 | src/pages/Configuracoes.jsx | logout | base44.auth.logout("/") | CRITICO |
| AUTH-15 | src/pages/PortalLideranca.jsx | loadUser | base44.auth.me() | CRITICO |
| AUTH-16 | src/pages/PortalLideranca.jsx | updateMetas | base44.auth.updateMe({ metas }) | CRITICO |
| AUTH-17 | src/lib/PageNotFound.jsx | checkAuth | base44.auth.me() | MEDIO |

---

## 3. ENTITIES — CONTACT

| ID | Arquivo | Operacao | Metodo | Risco |
|----|---------|----------|--------|-------|
| CONTACT-01 | src/pages/Contacts.jsx:61 | list | base44.entities.Contact.list("-created_date", 500) | ALTO |
| CONTACT-02 | src/pages/Contacts.jsx:65 | create | base44.entities.Contact.create(data) | ALTO |
| CONTACT-03 | src/pages/Contacts.jsx:74 | update | base44.entities.Contact.update(id, data) | ALTO |
| CONTACT-04 | src/pages/Contacts.jsx:83 | delete | base44.entities.Contact.delete(id) | ALTO |
| CONTACT-05 | src/pages/Dashboard.jsx | list | base44.entities.Contact.list(...) | ALTO |
| CONTACT-06 | src/pages/Reports.jsx | list | base44.entities.Contact.list(...) | ALTO |
| CONTACT-07 | src/pages/ElectoralMap.jsx | list | base44.entities.Contact.list(...) | ALTO |
| CONTACT-08 | src/pages/InteligenciaEleitoral.jsx | list | base44.entities.Contact.list(...) | ALTO |
| CONTACT-09 | src/pages/PortalLideranca.jsx | list | base44.entities.Contact.list(...) | ALTO |
| CONTACT-10 | src/pages/Configuracoes.jsx | list | base44.entities.Contact.filter(...) | MEDIO |
| CONTACT-11 | src/components/electoral/IntegracaoCRMPanel.jsx | list | base44.entities.Contact.list(...) | ALTO |
| CONTACT-12 | src/components/electoral/InteligenciaDashboard.jsx | list | base44.entities.Contact.list(...) | ALTO |
| CONTACT-13 | src/components/integrations/WhatsAppModal.jsx | list | base44.entities.Contact.list(...) | ALTO |

---

## 4. ENTITIES — LEADER

| ID | Arquivo | Operacao | Metodo | Risco |
|----|---------|----------|--------|-------|
| LEADER-01 | src/pages/Leaders.jsx | list | base44.entities.Leader.list(...) | ALTO |
| LEADER-02 | src/pages/Leaders.jsx | create | base44.entities.Leader.create(data) | ALTO |
| LEADER-03 | src/pages/Leaders.jsx | update | base44.entities.Leader.update(id, data) | ALTO |
| LEADER-04 | src/pages/Leaders.jsx | delete | base44.entities.Leader.delete(id) | ALTO |
| LEADER-05 | src/pages/Dashboard.jsx | list | base44.entities.Leader.list(...) | ALTO |
| LEADER-06 | src/pages/Gamification.jsx | list | base44.entities.Leader.list(...) | ALTO |
| LEADER-07 | src/pages/Reports.jsx | list | base44.entities.Leader.list(...) | ALTO |
| LEADER-08 | src/pages/ElectoralMap.jsx | list | base44.entities.Leader.list(...) | ALTO |
| LEADER-09 | src/pages/InteligenciaEleitoral.jsx | list | base44.entities.Leader.list(...) | ALTO |
| LEADER-10 | src/pages/SaudeSistema.jsx | list | base44.entities.Leader.list(...) | MEDIO |
| LEADER-11 | src/components/electoral/IntegracaoCRMPanel.jsx | list | base44.entities.Leader.list(...) | ALTO |
| LEADER-12 | src/components/electoral/InteligenciaDashboard.jsx | list | base44.entities.Leader.list(...) | ALTO |

---

## 5. ENTITIES — DEMAND

| ID | Arquivo | Operacao | Metodo | Risco |
|----|---------|----------|--------|-------|
| DEMAND-01 | src/pages/Demands.jsx | list | base44.entities.Demand.list(...) | ALTO |
| DEMAND-02 | src/pages/Demands.jsx | create | base44.entities.Demand.create(data) | ALTO |
| DEMAND-03 | src/pages/Demands.jsx | update | base44.entities.Demand.update(id, data) | ALTO |
| DEMAND-04 | src/pages/Demands.jsx | delete | base44.entities.Demand.delete(id) | ALTO |
| DEMAND-05 | src/pages/Dashboard.jsx | list | base44.entities.Demand.list(...) | ALTO |
| DEMAND-06 | src/pages/Reports.jsx | list | base44.entities.Demand.list(...) | ALTO |
| DEMAND-07 | src/pages/ElectoralMap.jsx | list | base44.entities.Demand.list(...) | ALTO |
| DEMAND-08 | src/pages/InteligenciaEleitoral.jsx | list | base44.entities.Demand.list(...) | ALTO |
| DEMAND-09 | src/pages/PortalLideranca.jsx | list | base44.entities.Demand.list(...) | ALTO |
| DEMAND-10 | src/pages/Configuracoes.jsx | list | base44.entities.Demand.filter(...) | MEDIO |
| DEMAND-11 | src/components/electoral/IntegracaoCRMPanel.jsx | list | base44.entities.Demand.list(...) | ALTO |
| DEMAND-12 | src/components/electoral/InteligenciaDashboard.jsx | list | base44.entities.Demand.list(...) | ALTO |

---

## 6. ENTITIES — MISSION

| ID | Arquivo | Operacao | Metodo | Risco |
|----|---------|----------|--------|-------|
| MISSION-01 | src/pages/MissionCenter.jsx | list | base44.entities.Mission.list(...) | ALTO |
| MISSION-02 | src/pages/MissionCenter.jsx | create | base44.entities.Mission.create(data) | ALTO |
| MISSION-03 | src/pages/MissionCenter.jsx | update | base44.entities.Mission.update(id, data) | ALTO |
| MISSION-04 | src/pages/MissionCenter.jsx | delete | base44.entities.Mission.delete(id) | ALTO |
| MISSION-05 | src/pages/MissionDetail.jsx | list | base44.entities.Mission.list(...) | ALTO |
| MISSION-06 | src/pages/Gamification.jsx | list | base44.entities.Mission.list(...) | ALTO |
| MISSION-07 | src/pages/InteligenciaEleitoral.jsx | list | base44.entities.Mission.list(...) | ALTO |
| MISSION-08 | src/pages/PortalLideranca.jsx | list | base44.entities.Mission.list(...) | ALTO |
| MISSION-09 | src/pages/SaudeSistema.jsx | list | base44.entities.Mission.list(...) | MEDIO |
| MISSION-10 | src/pages/Configuracoes.jsx | list | base44.entities.Mission.filter(...) | MEDIO |
| MISSION-11 | src/components/contacts/ContactMissionList.jsx | list | base44.entities.Mission.filter(...) | ALTO |
| MISSION-12 | src/components/electoral/IntegracaoCRMPanel.jsx | list | base44.entities.Mission.list(...) | ALTO |
| MISSION-13 | src/components/electoral/InteligenciaDashboard.jsx | list | base44.entities.Mission.list(...) | ALTO |
| MISSION-14 | src/components/gamification/WhatsAppMissionModal.jsx | list | base44.entities.Mission.filter(...) | ALTO |

---

## 7. ENTITIES — GAMIFICATION PROFILE

| ID | Arquivo | Operacao | Metodo | Risco |
|----|---------|----------|--------|-------|
| GAM-01 | src/pages/Gamification.jsx | list | base44.entities.GamificationProfile.list(...) | ALTO |
| GAM-02 | src/pages/MissionDetail.jsx | list | base44.entities.GamificationProfile.filter(...) | ALTO |
| GAM-03 | src/pages/InteligenciaEleitoral.jsx | list | base44.entities.GamificationProfile.list(...) | ALTO |
| GAM-04 | src/pages/PortalLideranca.jsx | list | base44.entities.GamificationProfile.filter(...) | ALTO |
| GAM-05 | src/pages/CRMDashboard.jsx | list | base44.entities.GamificationProfile.list(...) | ALTO |

---

## 8. ENTITIES — OUTRAS

| ID | Entidade | Arquivo | Operacao | Risco |
|----|----------|---------|----------|-------|
| OTHER-01 | Campaign | src/pages/Campaigns.jsx | list, create, update, delete | ALTO |
| OTHER-02 | StrategicAction | src/pages/StrategicPlanning.jsx | list, create, update, delete | ALTO |
| OTHER-03 | StrategicAction | src/pages/Dashboard.jsx | list | ALTO |
| OTHER-04 | StrategicAction | src/pages/Reports.jsx | list | ALTO |
| OTHER-05 | StrategicAction | src/pages/InteligenciaEleitoral.jsx | list | ALTO |
| OTHER-06 | Notification | src/Layout.jsx:65 | filter({ user_id }) | ALTO |
| OTHER-07 | Notification | src/Layout.jsx:80 | update(id, { read: true }) | ALTO |
| OTHER-08 | ElectoralData | src/pages/ElectoralMap.jsx | list | ALTO |
| OTHER-09 | ElectoralData | src/pages/Reports.jsx | list | ALTO |
| OTHER-10 | AuditLog | src/pages/SaudeSistema.jsx | list | MEDIO |

---

## 9. FUNCTIONS (base44.functions.invoke)

| ID | Arquivo | Function | Proposito | Risco |
|----|---------|----------|-----------|-------|
| FUNC-01 | src/pages/Gamification.jsx | gamificationEngine | Calcula pontos/niveis | ALTO |
| FUNC-02 | src/pages/SaudeSistema.jsx | weeklyMaintenance | Manutencao semanal | MEDIO |
| FUNC-03 | src/pages/SaudeSistema.jsx | checkOverdueDemands | Verifica demandas vencidas | MEDIO |
| FUNC-04 | src/pages/SaudeSistema.jsx | markOverdueMissions | Marca missoes vencidas | MEDIO |
| FUNC-05 | src/pages/SaudeSistema.jsx | backupRestore | Backup/restore | ALTO |
| FUNC-06 | src/pages/DiagnosticoTSE.jsx | tseDataSync, tseQueryLocal | Diagnostico TSE | ALTO |
| FUNC-07 | src/pages/ElectoralConsult.jsx | tseApiQuery, tseQueryLocal | Consulta eleitoral | ALTO |
| FUNC-08 | src/pages/InteligenciaEleitoral.jsx | sofiaAnalysis | Analise IA | ALTO |
| FUNC-09 | src/pages/PortalLideranca.jsx | gamificationEngine | Gamificacao lideranca | ALTO |
| FUNC-10 | src/pages/Configuracoes.jsx | exportMapPDF | Exportar PDF | MEDIO |
| FUNC-11 | src/components/electoral/SofiaInsight.jsx | sofiaAnalysis | Insight IA | ALTO |
| FUNC-12 | src/components/electoral/ComparativoPanel.jsx | sofiaAnalysis | Comparativo IA | MEDIO |
| FUNC-13 | src/components/electoral/HistoricalEvolution.jsx | sofiaAnalysis | Evolucao IA | MEDIO |
| FUNC-14 | src/components/electoral/MapaVotos.jsx | exportMapPDF | Mapa PDF | MEDIO |
| FUNC-15 | src/components/electoral/ExportActions.jsx | exportMapPDF | Exportar PDF | MEDIO |
| FUNC-16 | src/components/electoral/InteligenciaDashboard.jsx | sofiaAnalysis | Dashboard IA | ALTO |
| FUNC-17 | src/components/gamification/WhatsAppMissionModal.jsx | whatsappSend | WhatsApp missoes | ALTO |
| FUNC-18 | src/components/integrations/TSEImportModal.jsx | tseImport, tseDataSync | Importacao TSE | ALTO |
| FUNC-19 | src/components/integrations/WhatsAppModal.jsx | whatsappSend | Envio WhatsApp | ALTO |
| FUNC-20 | src/components/portal/SofiaPortal.jsx | sofiaAnalysis | Sofia portal | ALTO |
| FUNC-21 | src/components/gamification/SofiaGamificationInsight.jsx | sofiaAnalysis | Insight gamificacao | MEDIO |
| FUNC-22 | src/components/gamification/SofiaMissionRecommendation.jsx | sofiaAnalysis | Recomendacao missoes | MEDIO |

---

## 10. INTEGRATIONS

| ID | Integration | Arquivo | Uso | Risco |
|----|-------------|---------|-----|-------|
| INT-01 | InvokeLLM | src/api/integrations.js:8 | Exportado como constante | ALTO |
| INT-02 | InvokeLLM | src/components/electoral/SofiaInsight.jsx | Analise politica | ALTO |
| INT-03 | InvokeLLM | src/components/gamification/SofiaGamificationInsight.jsx | Insight gamificacao | MEDIO |
| INT-04 | InvokeLLM | src/components/gamification/SofiaMissionRecommendation.jsx | Recomendacao missoes | MEDIO |
| INT-05 | InvokeLLM | src/components/portal/SofiaPortal.jsx | Portal IA | ALTO |
| INT-06 | UploadFile | src/api/integrations.js:14 | Exportado como constante | ALTO |
| INT-07 | UploadFile | src/components/portal/CadastrarDemanda.jsx | Upload demanda | ALTO |
| INT-08 | UploadFile | src/pages/Configuracoes.jsx | Upload avatar | MEDIO |
| INT-09 | SendEmail | src/api/integrations.js:10 | Exportado (pouco usado) | BAIXO |
| INT-10 | SendSMS | src/api/integrations.js:12 | Exportado (pouco usado) | BAIXO |
| INT-11 | GenerateImage | src/api/integrations.js:16 | Exportado (pouco usado) | BAIXO |
| INT-12 | ExtractDataFromUploadedFile | src/api/integrations.js:18 | Exportado (pouco usado) | BAIXO |

---

## 11. RESUMO POR ARQUIVO

| Arquivo | Dependencias Base44 | Qtd | Risco Max |
|---------|---------------------|-----|-----------|
| src/api/base44Client.js | SDK createClient | 1 | CRITICO |
| src/api/entities.js | base44.entities, base44.auth | 2 | CRITICO |
| src/api/integrations.js | base44.integrations.Core (x6) | 6 | ALTO |
| src/lib/app-params.js | VITE_BASE44_* env vars | 2 | CRITICO |
| src/lib/AuthContext.jsx | SDK axios, base44.auth (x4) | 5 | CRITICO |
| src/lib/AccessControl.jsx | user.role, user.profile | 1 | ALTO |
| src/Layout.jsx | base44.auth (x2), Notification (x2) | 4 | CRITICO |
| src/pages/Contacts.jsx | Contact (x4) | 4 | ALTO |
| src/pages/Leaders.jsx | Leader (x4) | 4 | ALTO |
| src/pages/Demands.jsx | Demand (x4) | 4 | ALTO |
| src/pages/MissionCenter.jsx | Mission (x4) | 4 | ALTO |
| src/pages/MissionDetail.jsx | Mission, GamificationProfile | 2 | ALTO |
| src/pages/Gamification.jsx | GamificationProfile, Leader, Mission, functions | 4 | ALTO |
| src/pages/Campaigns.jsx | Campaign (x4) | 4 | ALTO |
| src/pages/Dashboard.jsx | Contact, Demand, Leader, StrategicAction | 4 | ALTO |
| src/pages/Reports.jsx | Contact, Demand, ElectoralData, Leader, StrategicAction | 5 | ALTO |
| src/pages/ElectoralMap.jsx | Contact, Demand, ElectoralData, Leader | 4 | ALTO |
| src/pages/StrategicPlanning.jsx | StrategicAction (x4) | 4 | ALTO |
| src/pages/Configuracoes.jsx | base44.auth (x8), Contact, Demand, Mission, UploadFile | 11 | CRITICO |
| src/pages/SaudeSistema.jsx | AuditLog, Leader, Mission, functions (x4) | 7 | ALTO |
| src/pages/InteligenciaEleitoral.jsx | Contact, Demand, GamificationProfile, Leader, Mission, StrategicAction, functions | 7 | ALTO |
| src/pages/DiagnosticoTSE.jsx | functions (x2) | 2 | ALTO |
| src/pages/ElectoralConsult.jsx | functions (x2) | 2 | ALTO |
| src/pages/PortalLideranca.jsx | base44.auth (x2), Contact, Demand, GamificationProfile, Mission, functions | 7 | CRITICO |
| src/components/electoral/SofiaInsight.jsx | InvokeLLM | 1 | ALTO |
| src/components/gamification/SofiaGamificationInsight.jsx | InvokeLLM | 1 | MEDIO |
| src/components/gamification/SofiaMissionRecommendation.jsx | InvokeLLM | 1 | MEDIO |
| src/components/portal/SofiaPortal.jsx | InvokeLLM | 1 | ALTO |
| src/components/portal/CadastrarDemanda.jsx | UploadFile | 1 | ALTO |
| src/components/integrations/TSEImportModal.jsx | functions (x2) | 2 | ALTO |
| src/components/integrations/WhatsAppModal.jsx | functions, Contact | 2 | ALTO |
| src/components/gamification/WhatsAppMissionModal.jsx | functions, Mission | 2 | ALTO |
| vite.config.js | @base44/vite-plugin | 1 | CRITICO |

---

## 12. RESUMO POR TIPO DE DEPENDENCIA

| Tipo | Quantidade | Risco |
|------|-----------|-------|
| SDK (@base44/sdk) | 6 pontos | CRITICO |
| Plugin Vite (@base44/vite-plugin) | 2 pontos | CRITICO |
| Auth (base44.auth) | 17 pontos | CRITICO |
| Entities (base44.entities.*) | ~50 pontos | ALTO |
| Functions (base44.functions.invoke) | 22 pontos | ALTO |
| Integrations (base44.integrations.Core) | 12 pontos | ALTO |
| **TOTAL** | **~109 pontos** | |

---

## 13. ORDEM DE MIGRACAO RECOMENDADA

Baseado no risco e dependencias entre modulos:

1. **Auth** (17 pontos) — Sem isso, nada funciona
2. **Entities core** — Contact (13), Leader (12), Demand (12), Mission (14)
3. **Entities suporte** — GamificationProfile (5), Campaign (1), StrategicAction (5), Notification (2), ElectoralData (2), AuditLog (1)
4. **Functions** — gamificationEngine, whatsappSend, sofiaAnalysis, tseDataSync, etc.
5. **Integrations** — InvokeLLM, UploadFile, SendEmail, etc.
6. **SDK/Plugin** — Remocao final
