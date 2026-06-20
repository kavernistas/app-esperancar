# Instalação e Deploy — Esperançar

## ⚠️ Importante

**Esperançar NÃO requer VPS própria.** A plataforma é 100% hospedada no Base44 (backend-as-a-service), que gerencia:

- Banco de dados (PostgreSQL)
- Autenticação (JWT, OAuth)
- Funções serverless (Deno Deploy)
- Hospedagem do frontend (CDN global)
- SSL/TLS (automático)
- Domínio customizado (opcional)

## Deploy

O deploy é automático via push para o repositório Git conectado ao Base44:

```bash
git add .
git commit -m "Atualização"
git push origin main
```

A plataforma detecta o push e implanta automaticamente em segundos.

## Domínio Customizado

No dashboard Base44: Settings → Domains → Add Domain
- Configure o DNS (CNAME ou A record conforme instruções)
- SSL/TLS provisionado automaticamente via Let's Encrypt

## Desenvolvimento Local

```bash
# Instalar dependências
npm install

# Iniciar servidor de desenvolvimento
npm run dev
```

O app roda em `http://localhost:5173` com hot reload.

## Variáveis de Ambiente

Criar `.env` na raiz:

```env
VITE_BASE44_APP_ID=seu_app_id
VITE_BASE44_BACKEND_URL=https://api.base44.com
```

Ver `VARIAVEIS-AMBIENTE.md` para documentação completa.

## Estrutura de Deploy

```
┌─────────────────────────────────────┐
│         Base44 Platform             │
│                                     │
│  ┌──────────┐  ┌─────────────────┐  │
│  │ Frontend │  │ Deno Functions  │  │
│  │  (CDN)   │  │  (Serverless)   │  │
│  └──────────┘  └─────────────────┘  │
│  ┌──────────┐  ┌─────────────────┐  │
│  │   Auth   │  │   Database      │  │
│  │  (JWT)   │  │  (PostgreSQL)   │  │
│  └──────────┘  └─────────────────┘  │
└─────────────────────────────────────┘
```

## Backup

Backups são gerenciados automaticamente pela plataforma Base44. Para exportação manual de dados, use:
- Página Configurações → LGPD → Exportar Meus Dados
- Funções Deno podem exportar entidades via SDK
- Relatórios CSV/PDF disponíveis na Central de Inteligência

## Monitoramento

- Status do app: Dashboard Base44
- Logs de funções: Dashboard → Code → Functions → [função] → Logs
- Erros do frontend: Console do navegador
- Métricas: Dashboard Base44 → Analytics