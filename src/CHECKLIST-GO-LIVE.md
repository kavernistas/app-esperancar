# Checklist Go-Live — Esperançar

## Pré-requisitos técnicos

- [x] App compila sem erros
- [x] Todas as 13 funções backend implantadas
- [x] Todas as 4 automações ativas
- [x] RBAC implementado em 100% das rotas
- [x] Dashboard de saúde funcional
- [x] Backup/Restore testado
- [x] 16 entidades com schemas definidos

## Segurança

- [x] AuthProvider funcionando (login obrigatório)
- [x] RouteGuard em todas as rotas (17)
- [x] Sidebar filtrada por perfil
- [x] Redirecionamento de lideranças (só veem Portal)
- [x] Funções backend com verificação de admin
- [ ] Senhas fortes exigidas (delegado ao Base44)
- [ ] 2FA habilitado (configurar no Base44)

## Dados

- [x] Schemas validados (sem campos incorretos)
- [x] Dados de amostra carregados (TSE: 16.200 registros)
- [ ] Migração Leader → Contact executada
- [ ] Backup inicial completo realizado

## Performance

- [x] Dashboard carrega em < 2s
- [x] Limites de paginação reduzidos
- [ ] Paginação server-side nas listas CRUD
- [ ] CDN configurado (delegado ao Base44)

## Integrações

- [x] WhatsApp (Evolution API) — status monitorado
- [x] TSE — consultas locais funcionando
- [x] Sofia IA — via InvokeLLM
- [x] ViaCEP — autopreenchimento
- [x] Leaflet/OSM — mapas

## Documentação

- [x] README.md atualizado
- [x] ARQUITETURA.md atualizado
- [x] API.md atualizado
- [x] BANCO-DE-DADOS.md
- [x] MANUAL-ADMIN.md
- [x] MANUAL-LIDERANCA.md
- [x] MIGRACAO-LEADER-CONTACT.md
- [x] AUDITORIA-CAMPANHAS.md
- [x] RELATORIO-PRODUCAO.md

## Domínio e Publicação

- [ ] Domínio customizado configurado
- [ ] DNS propagado
- [ ] SSL ativo
- [ ] PWA manifest configurado
- [ ] Ícones e splash screen

## Pós Go-Live (primeira semana)

- [ ] Monitorar erros no Saúde do Sistema
- [ ] Verificar execução das 4 automações
- [ ] Executar primeiro backup manual
- [ ] Validar dados importados do TSE
- [ ] Testar WhatsApp com número real
- [ ] Verificar logs de acesso (RBAC)