# ESPERANCAR V2 — ESPECIFICAÇÃO FUNCIONAL
=========================================

## 1. CORE — IDENTITY & AUTH

### 1.1 Login
- **Tela:** /login
- **Fluxo:** Email + Senha → JWT Access + Refresh Token
- **Ações:**
  - Botão "Entrar"
  - Link "Esqueci minha senha" (futuro)
  - Validação de campos
  - Loading state
  - Error state (credenciais inválidas, conta inativa)
- **Pós-login:** Redirecionar para página principal

### 1.2 Refresh Token
- **Automático:** Quando access token expira (401), usar refresh para obter novo
- **Falha no refresh:** Redirecionar para login
- **Rotação:** A cada refresh, o token antigo é revogado

### 1.3 Logout
- **Ação:** Revogar todos os refresh tokens do usuário
- **Limpar:** localStorage (tokens, user data)
- **Redirecionar:** /login

### 1.4 Perfil do Usuário
- **Tela:** /configuracoes/perfil
- **Campos editáveis:** Nome, telefone, avatar, preferências
- **Alteração de senha:** Requer senha atual + nova senha + confirmação
- **2FA:** Ativar/desativar TOTP

### 1.5 Gestão de Usuários (Admin)
- **Tela:** /configuracoes/usuarios
- **Listagem:** Todos os usuários com busca e filtros
- **Ações:** Criar, editar, ativar/desativar, excluir
- **Atribuição de roles:** admin, coordenador, lideranca, user

---

## 2. CRM POLÍTICO

### 2.1 Contatos (Apoiadores/Eleitores)

#### Lista de Contatos
- **Tela:** /contacts
- **Layout:** DataTable com virtual scroll
- **Colunas:** Nome, telefone, cidade/bairro, segmento, score, tags, status
- **Ações por linha:** Editar, excluir, ver perfil, adicionar interação
- **Filtros:**
  - Busca text (nome, telefone, email)
  - Cidade, bairro, zona, seção
  - Segmento (apoiador, indeciso, contrário, lideranca_potencial)
  - Score IA (1-100)
  - Tags (multi-select)
  - Status (ativo, inativo, pendente)
- **Bulk actions:** Adicionar tags, exportar, excluir
- **Exportação:** CSV, Excel

#### Perfil do Contato (Página dedicada)
- **Tela:** /contacts/:id
- **Layout:** Page com sidebar ou seções
- **Seções:**
  - Dados básicos (nome, telefone, email, endereço)
  - Localização (mapa)
  - Tags e segmento
  - Score IA com breakdown
  - Timeline de interações
  - Demandas vinculadas
  - Missões vinculadas
  - Histórico de WhatsApp
  - Consentimentos LGPD
- **Ações:** Editar, excluir, criar interação, criar demanda, criar missão

#### Formulário de Contato
- **Campos:** Nome*, telefone, email, CEP, cidade, bairro, endereço,
  zona eleitoral, seção, posição, segmento, suporte_intent, tags, notas
- **Validação:** Nome obrigatório, telefone formato BR
- **CEP auto-completar:** Via ViaCEP API
- **Geolocalização:** Auto via CEP ou manual

#### Pipeline de Conversão
- **Tela:** /contacts/pipeline
- **Layout:** Kanban com estágios
- **Estágios:** Prospecção → Contato → Interessado → Apoiador → Liderança
- **Ações:** Drag-and-drop entre estágios
- **Filtros:** Por estágio, segmento, cidade

### 2.2 Lideranças

#### Lista de Lideranças
- **Tela:** /leaders
- **Layout:** Cards ou grid
- **Cards:** Nome, foto, cidade, bairro, seguidores, score, status
- **Filtros:** Cidade, bairro, status, score, potencial
- **Busca:** Nome, telefone

#### Perfil 360° da Liderança
- **Tela:** /leaders/:id
- **Layout:** Página completa (NUNCA modal)
- **Seções:**
  - **Header:** Foto, nome, cidade, bairro, status, score
  - **Resumo IA:** Pontos fortes, áreas de atenção, sugestões
  - **Timeline:** Todas as interações, missões, eventos
  - **Mapa:** Área de atuação com pontos de visita
  - **Estatísticas:** Seguidores, conversões, missões completadas
  - **Demandas:** Demandas criadas/vinculadas
  - **Missões:** Histórico e em andamento
  - **Rede:** Quem indicou, quem foi indicado
  - **Documentos:** Documentos compartilhados
  - **Fotos/Vídeos:** Mídia da liderança
  - **Interações:** Registrar nova interação
- **Ações:** Editar, criar missão, criar demanda, enviar WhatsApp

#### Formulário de Liderança
- **Campos:** Nome*, telefone, email, cidade, bairro, zona eleitoral,
  segmento, meta mensal, foto, notas
- **Validação:** Nome obrigatório

### 2.3 Interações

#### Registrar Interação
- **Tipos:** Visita, telefone, mensagem, email, evento, reunião
- **Campos:** Tipo, data, descrição, notas
- **Vincular:** Contato ou liderança
- **Geolocalização:** Automática (se visita)
- **Fotos:** Anexar evidências

---

## 3. INTELIGÊNCIA TERRITORIAL

### 3.1 Mapa Interativo
- **Tela:** /territory
- **Layout:** Mapa em tela cheia com sidebar de filtros
- **Camadas (toggle):**
  - Bairros (polígonos com cor por indicador)
  - Zonas eleitorais
  - Seções eleitorais
  - Pontos de interesse (escolas, UBS, CRAS, CREAS, hospitais, igrejas, empresas, associações)
  - Lideranças (markers)
  - Contatos (markers com cluster)
  - Demandas (markers com cor por status)
  - Rotas de visitas
  - Heatmap de influência
- **Filtros:**
  - Camadas ativas
  - Cidade, bairro, zona
  - Tipo de ponto de interesse
  - Status da demanda
  - Líder responsável
- **Ações:**
  - Clicar em ponto → detalhes
  - Desenhar raio de influência
  - Exportar dados da camada
  - Criar rota otimizada

### 3.2 Gestão de Pontos de Interesse
- **Cadastro:** Nome, tipo, endereço, coordenadas, metadata
- **Tipos:** Escola, UBS, CRAS, CREAS, hospital, igreja, empresa, associação, outro
- **Importação:** CSV/Excel com geocodificação

### 3.3 Visitas e Rotas
- **Registrar Visita:** Líder, contato, data, local, notas, tipo
- **Roteirização:** Otimizar rota de visitas por região
- **Histórico:** Visitas por líder, por período

---

## 4. INTELIGÊNCIA ELEITORAL

### 4.1 Dashboard Eleitoral
- **Tela:** /electoral
- **Layout:** Dashboard com widgets configuráveis
- **Widgets:**
  - Mapa de votos por bairro
  - Gráfico de evolução temporal
  - Top candidatos por seção
  - Perfil do eleitorado
  - Comparativo entre eleições
  - Heatmap de participação

### 4.2 Diagnóstico TSE
- **Tela:** /electoral/diagnostic
- **Seções:**
  - Status de sincronização
  - Última importação
  - Candidatos por cargo
  - Resultados por bairro/seção
  - Perfil do eleitorado
  - Projeções

### 4.3 Consulta Eleitoral
- **Tela:** /electoral/consult
- **Filtros:** Ano, UF, município, cargo, candidato, zona, seção
- **Resultados:** Tabela com votos, comparecimento, ranking
- **Exportação:** CSV, Excel

### 4.4 Importação TSE
- **Upload:** ZIP ou CSV
- **Configuração:** Ano, UF, tipo de dataset
- **Progresso:** Barra de progresso em tempo real
- **Status:** Pendente, processando, concluído, erro
- **Retry:** Reimportar com offset

---

## 5. COMUNICAÇÃO

### 5.1 WhatsApp — Central de Conversas
- **Tela:** /communication/whatsapp
- **Layout:** Inbox estilo chat (lista de conversas + área de mensagem)
- **Lista de conversas:**
  - Filtros: Todas, não atribuídas, em andamento, resolvidas
  - Busca por nome, telefone, conteúdo
  - Etiquetas: urgente, novo, pendente
  - Preview da última mensagem
  - Contador de não lidas
- **Área de mensagem:**
  - Histórico completo
  - Anexar arquivo/imagem
  - Enviar template
  - Resposta rápida
- **Info do contato:**
  - Dados básicos
  - Tags
  - Histórico de interações
  - Vincular a demanda/missão

### 5.2 Campanhas
- **Tela:** /communication/campaigns
- **Criar campanha:**
  - Nome, tipo (broadcast, agendada)
  - Template com variáveis
  - Segmentação (cidade, bairro, tags, score)
  - Agendamento
  - A/B testing (2 variantes)
- **Dashboard:**
  - Enviadas, entregues, lidas, respondidas
  - Taxa de conversão
  - Gráfico temporal
- **Relatório final:** Exportação CSV

### 5.3 Templates
- **Tela:** /communication/templates
- **Biblioteca:** Templates categorizados
- **Criar template:**
  - Nome, categoria
  - Conteúdo com variáveis ({{nome}}, {{telefone}}, etc.)
  - Preview
- **Categorias:** Convite, campanha, cobrança, evento, agradecimento, confirmação, pesquisa, comunicado

### 5.4 Automações
- **Tela:** /communication/automations
- **Editor visual:**
  - Triggers: mensagem recebida, palavra-chave, novo contato, mudança de status, evento
  - Condições: horário, dia da semana, localização
  - Ações: responder, criar demanda, criar liderança, notificar, enviar webhook
- **Templates de fluxo:** Boas-vindas, follow-up, pesquisa de satisfação

### 5.5 Agente IA WhatsApp
- **Ativação:** Toggle por conversa
- **Capacidades:**
  - Resumir conversa
  - Detectar sentimento (positivo/negativo/neutro)
  - Identificar urgência (1-5)
  - Sugerir respostas
  - Responder automaticamente (modo assistido)
  - Extrair demandas da conversa
  - Criar tarefas automaticamente

---

## 6. DEMANDAS

### 6.1 Lista de Demandas
- **Tela:** /demands
- **Layout:** Lista com filtros ou Kanban
- **Colunas (Kanban):** Aberta → Em andamento → Pendente → Resolvida → Cancelada
- **Filtros:** Status, tipo, prioridade, cidade, bairro, responsável, prazo
- **Busca:** Título, protocolo, descrição
- **Prioridade:** Baixa, média, alta, urgente (com cores)

### 6.2 Detalhe da Demanda
- **Tela:** /demands/:id
- **Layout:** Página com timeline
- **Seções:**
  - Header: Título, protocolo, status, prioridade
  - Descrição completa
  - Localização (mapa)
  - Fotos/vídeos/documentos anexos
  - Responsável e equipe
  - Timeline de atualizações
  - Comentários
  - Histórico de status
- **Ações:**
  - Mudar status
  - Atribuir responsável
  - Adicionar comentário
  - Criar missão vinculada
  - Criar evento na agenda
  - Gerar ofício (IA)
  - Gerar indicação (IA)
  - Gerar requerimento (IA)

### 6.3 Criar Demanda
- **Campos:** Título*, tipo, descrição, solicitante, telefone, endereço,
  cidade, bairro, prioridade, prazo, fotos, documentos
- **Protocolo automático:** Gerado sequencialmente
- **Validação:** Título obrigatório

### 6.4 IA em Demandas
- **Sugestão de solução:** Baseada em demandas anteriores resolvidas
- **Classificação automática:** Tipo e prioridade baseado na descrição
- **Geração de documentos:** Ofício, indicação, requerimento automáticos

---

## 7. MISSÕES

### 7.1 Centro de Missões
- **Tela:** /missions
- **Layout:** Dashboard com lista/kanban
- **Filtros:** Status, tipo, líder, prazo, prioridade
- **Status:** Pendente → Em andamento → Completada / Atrasada / Cancelada

### 7.2 Criar Missão
- **Campos:** Título*, descrição, tipo, prioridade, pontos, prazo,
  bairro, cidade, checklist, anexos
- **Tipo:** Cadastrar apoiadores, visitar região, mobilizar reunião,
  coletar demandas, confirmar presença, compartilhar conteúdo,
  organizar núcleo local, atualizar dados territoriais, encaminhar atendimento, outro
- **Atribuição:**
  - Individual: Selecionar líder
  - Em grupo: Filtros (todos, por bairro, por segmento, por equipe, filtros customizados)
  - Com checklist personalizado

### 7.3 Detalhe da Missão
- **Tela:** /missions/:id
- **Seções:**
  - Informações básicas
  - Checklist interativo
  - Evidências (fotos, notas)
  - Histórico
  - Prazo e lembretes
- **Ações:** Marcar como completada, reatribuir, duplicar, editar

### 7.4 Gamificação
- **Pontos por ação:**
  - Missão completada: 30 pts
  - Liderança convertida: 50 pts
  - Apoiador cadastrado: 10 pts
  - Demanda resolvida: 20 pts
  - Visita registrada: 15 pts
- **Níveis:** Semente → Mobilizador (100) → Liderança Local (250) → Coordenador Territorial (500) → Referência Esperançar (1000)
- **Badges:** Centena (100 pts), Meio Milhar (500 pts), etc.
- **Ranking:** Individual, por equipe, por período
- **Desafios:** Temporários com recompensas

---

## 8. FINANCEIRO

### 8.1 Dashboard Financeiro
- **Tela:** /financial
- **Widgets:**
  - Saldo atual
  - Receitas do período
  - Despesas do período
  - Fluxo de caixa (gráfico)
  - Top categorias de despesa
  - Doações recebidas
  - Orçamento vs. gasto

### 8.2 Transações
- **Lista:** Data, tipo, categoria, valor, descrição, centro de custo
- **Filtros:** Período, tipo, categoria, centro de custo
- **Ações:** Criar receita, criar despesa, transferência
- **Importação:** CSV/OFX de extratos bancários

### 8.3 Doações
- **Registro:** Doador, valor, data, método (PIX, boleto, cartão), recibo
- **Recibo automático:** Gerado e enviado por email
- **Doações recorrentes:** Configurar periodicidade
- **Relatório:** Por doador, por período, total

### 8.4 Centro de Custo
- **Cadastro:** Nome, descrição, orçamento
- **Alocação:** Transações vinculadas
- **Relatório:** Orçamento vs. realizado

### 8.5 Prestação de Contas
- **Relatório automático:** Por período
- **Categorias:** Administrativa, campanha, eventos, transporte, alimentação, etc.
- **Exportação:** PDF, Excel
- **Formato TSE:** Exportação no formato exigido

---

## 9. AGENDA

### 9.1 Calendário
- **Tela:** /agenda
- **Layout:** Calendário mensal/semanal/diário
- **Eventos:** Visitas, reuniões, audiências, prazos de demandas, missões
- **Cores:** Por tipo de evento
- **Filtros:** Tipo, responsável, cidade

### 9.2 Criar Evento
- **Campos:** Título*, tipo, data/hora, local, descrição, participantes, lembrete
- **Tipos:** Visita, reunião, audiência, prazo, outro
- **Lembretes:** 1h antes, 1 dia antes, 1 semana antes
- **Recorrência:** Diária, semanal, mensal

### 9.3 Sincronização Externa
- **Google Calendar:** Bidirecional
- **Outlook:** Bidirecional
- **Configuração:** Por usuário

---

## 10. DOCUMENTOS (GED)

### 10.1 Biblioteca
- **Tela:** /documents
- **Layout:** Explorador de pastas (estilo Google Drive)
- **Pastas:** Organizáveis hierarquicamente
- **Filtros:** Tipo, data, autor, tags

### 10.2 Upload
- **Formatos:** PDF, DOC, DOCX, XLS, XLSX, JPG, PNG
- **Tamanho máximo:** 50MB
- **Versionamento:** Automático a cada upload do mesmo arquivo
- **OCR:** Automático para PDFs escaneados

### 10.3 Modelos
- **Biblioteca:** Ofícios, indicações, requerimentos, comunicados, contratos
- **Criar modelo:** Editor de texto com variáveis
- **Variáveis:** {{nome}}, {{endereço}}, {{data}}, {{protocolo}}, etc.

### 10.4 Geração com IA
- **IA Resume:** Resumo automático de documentos longos
- **IA Cria:** Gerar documento a partir de briefing
- **IA Revisa:** Revisão gramatical e jurídica

### 10.5 Assinatura Digital
- **Upload de certificado:** A1, A3
- **Assinar:** Vincular certificado ao documento
- **Verificar:** Validade da assinatura

### 10.6 Protocolos
- **Numeração automática:** Sequencial por tipo
- **Rastreabilidade:** Quem criou, quando, onde
- **Vinculação:** Demanda, missão, contato

---

## 11. IA — CENTRAL DE AGENTES

### 11.1 AI Gateway
- **Configuração:** Providers, API keys, modelos padrão
- **Fallback:** Se um provider falhar, usar próximo
- **Cache:** Respostas idênticas cacheadas
- **Rate limit:** Por provider e por usuário

### 11.2 Agentes Especializados

#### IA Jurídica
- **Input:** Texto de processo, consulta
- **Output:** Análise, parecer, sugestões de ação
- **Tools:** Busca CNJ, legislação, jurisprudência

#### IA Política
- **Input:** Cenário, propostas, contexto
- **Output:** Análise SWOT, estratégia, discurso
- **Tools:** Dados TSE, histórico de campanhas

#### IA Marketing
- **Input:** Produto/serviço, público-alvo, objetivo
- **Output:** Copy, slogans, posts, campanha
- **Tools:** Templates, histórico de campanhas

#### IA Comunicação
- **Input:** Contexto, destinatário, objetivo
- **Output:** Email, comunicado, resposta
- **Tools:** Templates, histórico

#### IA Financeiro
- **Input:** Dados financeiros, período
- **Output:** Análise, projeções, alertas
- **Tools:** Dados transações, orçamentos

#### IA Territorial
- **Input:** Região, objetivo
- **Output:** Segmentação, rotas, priorização
- **Tools:** Mapas, dados geográficos

#### IA Estratégica
- **Input:** Objetivo, recursos, prazo
- **Output:** Plano de ação, cronograma, matriz GUT
- **Tools:** Dados históricos, benchmarks

#### IA Legislativa
- **Input:** Projeto, contexto político
- **Output:** Análise de viabilidade, emendas sugeridas
- **Tools:** Base legislativa, histórico

#### IA Redes Sociais
- **Input:** Objetivo, público, plataforma
- **Output:** Calendário de conteúdo, posts, hashtags
- **Tools:** Templates, analytics

#### IA WhatsApp
- **Input:** Conversa, contexto
- **Output:** Resumo, sentimento, sugestões
- **Tools:** Histórico de conversas

#### IA TSE
- **Input:** Consulta eleitoral
- **Output:** Análise de dados, projeções
- **Tools:** Base TSE, histórico

#### IA Projetos
- **Input:** Objetivo, escopo, recursos
- **Output:** Cronograma, marcos, riscos
- **Tools:** Dados de missões, agenda

#### IA Discursos
- **Input:** Tema, público, duração
- **Output:** Roteiro, discurso completo, dicas de oratória
- **Tools:** Histórico, templates

### 11.3 Interface Central de IA
- **Tela:** /ai
- **Layout:** Estilo Cursor AI (sidebar com conversas + área principal)
- **Funcionalidades:**
  - Selecionar agente
  - Chat com contexto
  - Histórico de conversas
  - Biblioteca de prompts
  - Upload de arquivos como contexto
  - Exportação de respostas
  - Sugestões de follow-up

---

## 12. ANALYTICS & BI

### 12.1 Dashboard Configurável
- **Tela:** /analytics
- **Layout:** Grid de widgets arrastáveis
- **Widgets disponíveis:**
  - KPI cards (total contatos, lideranças ativas, demandas pendentes)
  - Gráficos de linha (evolução temporal)
  - Gráficos de pizza (distribuição)
  - Gráficos de barras (ranking)
  - Mapas de calor
  - Tabelas com ordenação
  - Timeline de eventos
- **Filtros globais:** Período, cidade, responsável
- **Auto-refresh:** Configurável (5min, 15min, 1h)

### 12.2 Relatórios
- **Tipos:** CRM, territorial, eleitoral, financeiro, comunicação, missões
- **Agendamento:** Diário, semanal, mensal
- **Destinatário:** Email, download
- **Formatos:** PDF, Excel, CSV

### 12.3 Predição IA
- **Projeção de votos:** Baseado em dados TSE + territorial
- **Tendência de demandas:** Sazonalidade
- **Churn de apoiadores:** Quem está perdendo engajamento
- **Oportunidades:** Segmentos não explorados

---

## 13. INTEGRAÇÕES

### 13.1 Google
- **Calendar:** Sync bidirecional
- **Drive:** Backup de documentos
- **Gmail:** Envio de emails
- **Maps:** Geocodificação

### 13.2 Evolution API
- **WhatsApp:** Conversas, campanhas, automações
- **Instâncias:** Múltiplas conexões
- **Health check:** Monitoramento

### 13.3 N8N
- **Webhooks:** Trigger de automações
- **Workflows:** Criação visual
- **Integração:** Esperançar → N8N → Sistemas externos

### 13.3 APIs Governamentais
- **TSE:** Dados eleitorais
- **IBGE:** Dados territoriais
- **CNJ:** Processos
- **DataSUS:** Saúde pública
- **Receita Federal:** CPF/CNPJ

---

## 14. CONFIGURAÇÕES

### 14.1 Organização
- **Dados:** Nome, CNPJ, endereço, logo
- **Plano:** Features habilitadas
- **Preferências:** Moeda, formato data, fuso horário

### 14.2 Usuários
- **Gestão:** CRUD, roles, status
- **Permissões:** Por módulo e ação

### 14.3 Integrações
- **API Keys:** Google, OpenAI, Evolution
- **Webhooks:** URLs de callback
- **N8N:** URL do servidor

### 14.4 Módulos
- **Ativar/desativar:** Por feature
- **Customização:** Campos personalizados

### 14.5 Segurança
- **2FA:** Obrigatório para admins
- **Session timeout:** Configurável
- **IP whitelist:** Restrição de acesso
- **Audit log:** Retenção configurável

### 14.6 LGPD
- **Política de privacidade:** URL
- **Retenção de dados:** Período
- **Anonização:** Configuração

---

## 15. MATURIDADE DO PROJETO

| Área | Atual | Meta V2 |
|------|-------|---------|
| Arquitetura | 6/10 | 10/10 |
| Backend | 8/10 | 10/10 |
| Frontend | 7/10 | 10/10 |
| UX | 5/10 | 10/10 |
| IA | 6/10 | 10/10 |
| Segurança | 6/10 | 10/10 |
| Performance | 6/10 | 10/10 |
| Escalabilidade | 7/10 | 10/10 |
| Integrações | 7/10 | 10/10 |
| Observabilidade | 4/10 | 10/10 |
| Testes | 0/10 | 8/10 |
| Documentação | 3/10 | 9/10 |
| LGPD | 3/10 | 9/10 |

---

## 16. FLUXOS PRINCIPAIS (USER STORIES)

### 16.1 Eleição 2026 — Preparação
1. Admin configura organização e usuários
2. Coordenador importa dados TSE (candidatos, eleitorado)
3. Coordenador cadastra lideranças e regiões
4. Coordenador cria campanhas de WhatsApp para mobilização
5. Lideranças recebem missões via WhatsApp
6. Lideranças reportam resultados via app
7. Dashboard mostra progresso em tempo real

### 16.2 Atendimento ao Cidadão
1. Cidadão cria demanda via portal público
2. Sistema classifica automaticamente (IA)
3. Coordenador atribui a responsável
4. Responsável executa e atualiza status
5. Cidadão acompanha via protocolo
6. Ao resolver, cidadão avalia atendimento

### 16.3 Gestão de Campanha
1. Coordenador cria campanha de arrecadação
2. Sistema segmenta doadores por perfil
3. Envio em massa via WhatsApp
4. Acompanhamento de conversão em tempo real
5. Relatório final com ROI

### 16.4 Dia do Mandato
1. Agenda do dia na tela inicial
2. Alertas de prazos e reuniões
3. Mapa de visitas otimizado
4. Registro de interações em campo
5. Relatório diário automático
6. Dashboard de performance

---

FIM DA ESPECIFICAÇÃO
