# Segurança — Esperançar

## Autenticação

A autenticação é gerenciada inteiramente pela plataforma Base44:

- **Login:** Via página de login da plataforma (`base44.auth.redirectToLogin()`)
- **Logout:** `base44.auth.logout()` limpa tokens e redireciona
- **Sessão:** Tokens JWT gerenciados automaticamente pelo SDK
- **Refresh:** Transparente — SDK renova tokens expirados

**Nunca** implementar lógica de auth no frontend. A plataforma é responsável por:
- Hash de senhas
- Verificação de e-mail
- Rotação de tokens
- Proteção contra brute force

## Autorização (Controle de Perfil)

O sistema usa roles da plataforma Base44:

- **admin:** Acesso total — todos os módulos, exportação, configurações
- **user:** Acesso limitado — operações conforme permissões do perfil

**Estado atual:** O frontend não implementa gates por role. Todas as páginas são acessíveis a qualquer usuário autenticado. As funções backend usam `base44.auth.me()` para identificar o usuário e `base44.asServiceRole` para operações administrativas.

**Recomendação:** Implementar HOC ou wrapper que verifica `user.role` antes de renderizar páginas administrativas.

## Segredos e Credenciais

| Local | Prática |
|---|---|
| Chaves de API | ✅ Variáveis de ambiente (`import.meta.env.VITE_*`) |
| Token WhatsApp | ✅ Fornecido pelo usuário via UI, nunca armazenado no código |
| Secrets Deno | ✅ `Deno.env.get("NOME")` nas funções |
| Hardcoded | ✅ Nenhum segredo hardcoded encontrado na auditoria |

## LGPD (Lei Geral de Proteção de Dados)

### Implementado
- Campo `contact_authorized` (boolean) para consentimento do contato
- Campo `whatsapp_optin` para autorização de mensagens
- Página de Configurações com:
  - Toggle de consentimento
  - Exportação de dados (JSON download)
  - Solicitação de exclusão

### Pendente
- Fluxo automatizado de exclusão (atualmente apenas notifica administrador)
- Anonimização de dados em relatórios
- Registro de auditoria de acessos a dados pessoais

## Validação e Sanitização

- Formulários usam validação nativa HTML5 e React state
- Inputs de texto escapados pelo React (XSS prevention)
- Uploads de arquivo passam pelo `UploadFile` da plataforma
- WhatsApp: números validados antes do envio

## Logs e Auditoria

- Funções Deno retornam erros estruturados (`Response.json({ error })`)
- Frontend usa `console.error` para debugging
- Sem sistema de log centralizado (pendente)

## Recomendações de Hardening

1. ✅ Manter segredos em variáveis de ambiente
2. ✅ Nunca commitar credenciais no repositório
3. ⚠️ Implementar gates de role no frontend
4. ⚠️ Adicionar rate-limiting nas funções Deno
5. ⚠️ Implementar log de auditoria para ações sensíveis
6. ⚠️ Configurar CORS adequadamente na plataforma