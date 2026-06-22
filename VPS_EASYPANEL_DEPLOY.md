# VPS_EASYPANEL_DEPLOY.md
# Guia de Deploy — VPS com EasyPanel
# Plataforma Politica Esperancar

---

## OPÇÃO 1: Deploy Direto na VPS (Docker Compose)

### 1. Preparar a VPS

```bash
# Conectar via SSH
ssh root@SEU_IP

# Atualizar sistema
apt update && apt upgrade -y

# Instalar Docker
curl -fsSL https://get.docker.com | sh
systemctl enable docker
systemctl start docker

# Instalar Docker Compose
apt install docker-compose-plugin -y

# Verificar
docker --version
docker compose version
```

### 2. Clonar e Configurar

```bash
cd /opt
git clone https://github.com/kavernistas/app-esperancar.git
cd app-esperancar

# Criar .env de produção
cp .env.production.example .env.production
nano .env.production
# Preencher todas as variáveis
```

### 3. Build e Deploy

```bash
# Build
docker compose -f docker-compose.prod.yml build --no-cache

# Subir serviços
docker compose -f docker-compose.prod.yml up -d

# Executar migrations
docker compose -f docker-compose.prod.yml exec -T backend npx prisma migrate deploy

# Seed (primeira vez)
docker compose -f docker-compose.prod.yml exec -T backend npm run prisma:seed
```

### 4. Verificar

```bash
./scripts/healthcheck.sh
docker compose -f docker-compose.prod.yml ps
```

---

## OPÇÃO 2: Deploy via EasyPanel

### 1. Criar Projeto no EasyPanel

1. Acessar painel EasyPanel (geralmente `http://IP:8080`)
2. Criar novo projeto → "Docker Compose"
3. Fazer upload do `docker-compose.prod.yml`
4. Configurar variáveis de ambiente no painel

### 2. Configurar Variáveis no EasyPanel

```
DATABASE_URL=postgresql://esperancar:SENHA@postgres:5432/esperancar_db
REDIS_URL=redis://redis:6379
JWT_ACCESS_SECRET=GERE_COM_openssl_rand_-hex_64
JWT_REFRESH_SECRET=GERE_COM_openssl_rand_-hex_64
CORS_ORIGIN=https://app.seudominio.com.br
POSTGRES_USER=esperancar
POSTGRES_PASSWORD=SENHA_FORTE
POSTGRES_DB=esperancar_db
VITE_API_MODE=BACKEND
VITE_API_BASE_URL=/api
```

### 3. Deploy

1. Clicar em "Deploy" no EasyPanel
2. Aguardar build completar
3. Verificar logs para erros

### 4. Executar Migrations

```bash
# Acessar container do backend
docker exec -it <container_id> npx prisma migrate deploy

# Seed
docker exec -it <container_id> npm run prisma:seed
```

---

## OPÇÃO 3: Deploy com Git + CI/CD (GitHub Actions)

### 1. Configurar Secrets no GitHub

No repositório → Settings → Secrets:
- `SSH_HOST` — IP da VPS
- `SSH_USER` — root
- `SSH_KEY` — chave privada SSH
- `DEPLOY_PATH` — /opt/app-esperancar

### 2. Criar Workflow

```yaml
# .github/workflows/deploy.yml
name: Deploy Production
on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Deploy via SSH
        uses: appleboy/ssh-action@v1
        with:
          host: ${{ secrets.SSH_HOST }}
          username: ${{ secrets.SSH_USER }}
          key: ${{ secrets.SSH_KEY }}
          script: |
            cd ${{ secrets.DEPLOY_PATH }}
            git pull origin main
            docker compose -f docker-compose.prod.yml build --no-cache
            docker compose -f docker-compose.prod.yml up -d
            docker compose -f docker-compose.prod.yml exec -T backend npx prisma migrate deploy
```

---

## FIREWALL (UFW)

```bash
# Permitir SSH, HTTP, HTTPS
ufw allow 22/tcp
ufw allow 80/tcp
ufw allow 443/tcp

# Ativar
ufw enable
ufw status
```

---

## SSL COM LET'S ENCRYPT

```bash
# Instalar certbot
apt install certbot -y

# Obter certificado (parar nginx na porta 80 temporariamente)
docker compose -f docker-compose.prod.yml stop nginx
certbot certonly --standalone -d app.seudominio.com.br
docker compose -f docker-compose.prod.yml start nginx

# Copiar certificados
cp /etc/letsencrypt/live/app.seudominio.com.br/fullchain.pem nginx/ssl/
cp /etc/letsencrypt/live/app.seudominio.com.br/privkey.pem nginx/ssl/

# Descomentar bloco HTTPS no nginx.conf
nano nginx/nginx.conf

# Reiniciar nginx
docker compose -f docker-compose.prod.yml restart nginx

# Renovação automática (crontab)
# 0 0 1 * * certbot renew --quiet && docker compose -f /opt/app-esperancar/docker-compose.prod.yml restart nginx
```

---

## TROUBLESHOOTING

### Container não sobe
```bash
docker compose -f docker-compose.prod.yml logs <servico>
docker compose -f docker-compose.prod.yml ps
```

### Banco não conecta
```bash
docker compose -f docker-compose.prod.yml exec postgres pg_isready
docker compose -f docker-compose.prod.yml logs postgres
```

### Migration falha
```bash
docker compose -f docker-compose.prod.yml exec backend npx prisma migrate status
docker compose -f docker-compose.prod.yml exec backend npx prisma migrate resolve --applied <migration>
```

### Disco cheio
```bash
docker system prune -a --volumes
docker compose -f docker-compose.prod.yml logs --tail 100
```
