# API e Backend Functions

## Funções Deno (11 funções)

Todas as funções residem em `functions/` e são implantadas automaticamente.

### 1. gamificationEngine
**Propósito:** Motor de gamificação — pontuação, níveis, badges, bônus hierárquico.

**Ações:**
- `register_supporter` — pontos por cadastrar apoiador
- `complete_mission` — pontos por concluir missão
- `resolve_demand` — pontos por resolver demanda
- `convert_leader` — pontos por converter contato em liderança
- `add_visual` — pontos por material visual (carro/residência)
- `get_profile` — retorna perfil gamificado
- `get_ranking` — ranking geral

### 2. whatsappSend
**Propósito:** Envio de mensagens WhatsApp via Evolution API com anti-ban.

**Parâmetros:**
- `instanceUrl`, `instanceToken` — credenciais da instância
- `to` — número destino
- `message` — texto da mensagem
- `action` — `send` | `test_connection`

**Anti-ban:** 1.5s entre mensagens, lotes de 8, pausa 45s entre lotes, máximo 30/hora, 200/dia, jitter aleatório.

### 3. markOverdueMissions
**Propósito:** Marcar missões com prazo expirado como `overdue`.
**Automação:** Executada a cada 1 hora (scheduled).

### 4. sofiaAnalysis
**Propósito:** Análise estratégica da Sofia IA usando InvokeLLM.

**Ações:**
- `analyze_territory` — análise de redutos e zonas de risco
- `recommend_missions` — recomendar missões baseado em dados
- `insight_gamification` — insights de engajamento

### 5. tseDataSync
**Propósito:** Sincronização e consulta de dados TSE.

**Ações:**
- `status` — verifica status de sincronização
- `query` — consulta dados locais com filtros
- `sync` — inicia sincronização

### 6. tseImport
**Propósito:** Importação de arquivos TSE (CSV/ZIP) para o banco.

### 7. tseResolveSource
**Propósito:** Resolver URLs de datasets TSE oficiais.

### 8. tseQueryLocal
**Propósito:** Consultas otimizadas na base TSE local.

### 9. tseApiQuery
**Propósito:** Consultas à API externa do TSE.

### 10. receiveTSEBatch
**Propósito:** Receber lotes de dados pré-processados do ETL externo.

### 11. exportMapPDF
**Propósito:** Gerar PDF do mapa territorial com jsPDF.

---

## SDK Frontend

```javascript
import { base44 } from "@/api/base44Client";

// Entidades
const contacts = await base44.entities.Contact.list("-created_date", 100);
const contact = await base44.entities.Contact.create({ full_name: "João" });
await base44.entities.Contact.update(id, { engagement_level: 80 });
await base44.entities.Contact.delete(id);

// Funções backend
const res = await base44.functions.invoke("gamificationEngine", {
  action: "register_supporter",
  leader_id: "..."
});

// Auth
const user = await base44.auth.me();
await base44.auth.logout();
const isAuth = await base44.auth.isAuthenticated();

// Usuários
await base44.users.inviteUser("email@exemplo.com", "user");
```

---

## Automações

| Nome | Tipo | Função | Schedule |
|---|---|---|---|
| Atualizar Missões Vencidas | Scheduled | markOverdueMissions | A cada 1 hora |

---

## Webhooks e Eventos

O sistema atualmente não possui webhooks configurados para serviços externos. Automações por entidade podem ser adicionadas para:
- Notificar nova demanda criada
- Disparar WhatsApp em nova missão
- Atualizar gamificação em contato convertido