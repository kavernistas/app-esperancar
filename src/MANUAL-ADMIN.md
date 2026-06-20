# Manual do Administrador — Esperançar

## Acesso

Administradores têm acesso completo à plataforma. O primeiro usuário criado é automaticamente admin. Para adicionar novos admins, use o SDK via exec_tool ou convide via e-mail com role "admin".

## Módulos Administrativos

### Central de Inteligência
Dashboard unificado com abas para todos os módulos. KPIs principais:
- Total de contatos, lideranças ativas, demandas abertas, apoiadores
- Engajamento por faixa (0-20%, 21-40%, 41-60%, 61-80%, 81-100%)
- Lideranças que precisam de atenção (inativas, missões atrasadas, poucos apoiadores)
- Ranking de gamificação

### CRM — Contatos
- Cadastrar contatos com dados completos (nome, telefone, endereço, CEP)
- Segmentar por tags multi-select
- Classificar intenção de apoio (apoiador, indeciso, contrário, liderança potencial)
- Converter contato em liderança
- Histórico de interações
- Exportar CSV

### Lideranças
- Cadastrar e editar lideranças
- Associar região (cidade/bairro)
- Acompanhar performance (apoiadores, conversões, força política)
- Vincular ao Portal da Liderança

### Demandas
- Criar demandas com protocolo automático
- Atribuir responsável
- Acompanhar status (aberta → em andamento → resolvida)
- Anexar fotos/documentos
- Filtrar por tipo, bairro, prioridade, status

### Missões
- Criar missões individuais, por bairro, por segmento ou para todas lideranças
- Configurar checklist e anexos
- Definir recorrência (diária, semanal, quinzenal, mensal)
- Configurar WhatsApp automático (envio imediato, lembrete, alerta de atraso)
- Duplicar, reatribuir e editar missões

### Gamificação
- 5 níveis: Semente → Mobilizador → Liderança Local → Coordenador Territorial → Referência Esperançar
- Pontos por: cadastrar apoiador, concluir missão, resolver demanda, converter liderança, material visual
- Bônus hierárquico: mentores recebem % dos pontos de seus liderados
- Ranking e badges

### WhatsApp
- Conectar instância Evolution API (URL + token)
- Envio individual e em massa
- Anti-ban automático (1.5s delay, lotes de 8, pausa 45s, máx 30/h)
- Templates de mensagem para missões

### Inteligência Eleitoral
- Importar dados do TSE (via Diagnóstico TSE)
- Consultar resultados por ano, UF, cargo, município, candidato
- Comparativos entre eleições
- Mapas de calor de votação
- Relatórios PDF/CSV

### Sofia IA
- Análise de redutos eleitorais
- Identificação de zonas de risco
- Recomendações territoriais
- Projeção de tendências
- Insights de gamificação

### Relatórios
- Exportação CSV para todas as entidades
- PDF executivo com gráficos e análises
- Dados brutos para análise externa

### Configurações
- Perfil do usuário (nome, telefone, foto)
- Preferências de notificação
- Segurança (troca de senha, logout dispositivos)
- Integrações (WhatsApp Evolution API)
- Sofia IA (nome, tom, permissões)
- LGPD (consentimento, exportação, exclusão)

## Convidando Usuários

```javascript
await base44.users.inviteUser("email@dominio.com", "user");  // usuário comum
await base44.users.inviteUser("email@dominio.com", "admin"); // administrador
```

## Manutenção

- **Missões vencidas:** Automação marca como `overdue` a cada 1h
- **Backup:** Gerenciado pela plataforma Base44
- **Logs:** Console do navegador e respostas das funções Deno