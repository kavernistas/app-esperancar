# CHECKLIST_GO_LIVE_FINAL.md
# Plataforma Politica Esperancar — Checklist de Producao
# Data: 2026-06-22

---

## PRÉ-DEPLOY

### Infraestrutura
- [ ] VPS com mínimo 2GB RAM, 2 vCPUs, 40GB SSD
- [ ] Docker Engine 24+ instalado
- [ ] Docker Compose 2.20+ instalado
- [ ] Git instalado
- [ ] Domínio apontado para IP da VPS (DNS A record)
- [ ] Portas 80 e 443 liberadas no firewall (ufw/iptables)

### Segurança
- [ ] JWT_ACCESS_SECRET gerado (openssl rand -hex 64)
- [ ] JWT_REFRESH_SECRET gerado (openssl rand -hex 64)
- [ ] POSTGRES_PASSWORD gerado (senha forte)
- [ ] TSE_ETL_SHARED_SECRET gerado (openssl rand -hex 32)
- [ ] EVOLUTION_API_KEY obtida
- [ ] LLM_API_KEY obtida
- [ ] CORS_ORIGIN restrito ao domínio de produção
- [ ] SSL/HTTPS configurado (Let's Encrypt)

### Arquivos
- [ ] .env.production criado e preenchido
- [ ] docker-compose.prod.yml validado (docker compose config)
- [ ] nginx.conf revisado
- [ ] SSL certificates em nginx/ssl/ (fullchain.pem, privkey.pem)

---

## DEPLOY

### 1. Clone e Build
```bash
git clone https://github.com/kavernistas/app-esperancar.git
cd app-esperancar
cp .env.production.example .env.production
# Editar .env.production com valores reais
docker compose -f docker-compose.prod.yml build --no-cache
```

### 2. Primeira execução (com seed)
```bash
docker compose -f docker-compose.prod.yml up -d
# Aguardar 30s para inicialização
docker compose -f docker-compose.prod.yml exec -T backend npx prisma migrate deploy
docker compose -f docker-compose.prod.yml exec -T backend npm run prisma:seed
```

### 3. Verificar saúde
```bash
./scripts/healthcheck.sh
curl http://localhost:3001/api/v1/health
docker compose -f docker-compose.prod.yml ps
```

### 4. Testar login
```bash
curl -X POST http://localhost:3001/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@esperancar.app","password":"Admin@2026"}'
```

---

## PÓS-DEPLOY

### Verificações
- [ ] Frontend carrega em http://dominio/
- [ ] Login funciona
- [ ] Dashboard exibe dados
- [ ] CRUD de contatos funciona
- [ ] Upload de arquivo funciona
- [ ] API docs em http://dominio/api/docs
- [ ] Health check retorna OK
- [ ] Logs sem erros críticos

### Monitoramento
- [ ] Configurar log rotation
- [ ] Configurar alertas de disco (>80%)
- [ ] Configurar backup automático (cron)
- [ ] Testar restore em ambiente de staging

### SSL (Let's Encrypt)
```bash
# Instalar certbot
sudo apt install certbot

# Obter certificado
sudo certbot certonly --standalone -d app.esperancar.com.br

# Copiar para projeto
sudo cp /etc/letsencrypt/live/app.esperancar.com.br/fullchain.pem nginx/ssl/
sudo cp /etc/letsencrypt/live/app.esperancar.com.br/privkey.pem nginx/ssl/

# Descomentar bloco HTTPS no nginx.conf
# Reiniciar nginx
docker compose -f docker-compose.prod.yml restart nginx

# Renovação automática
# 0 0 1 * * certbot renew --quiet && docker compose -f /caminho/docker-compose.prod.yml restart nginx
```

### Backup automático (cron)
```bash
# Editar crontab
crontab -e

# Backup diário às 3h
0 3 * * * cd /caminho/app-esperancar && ./scripts/backup.sh --full >> /var/log/esperancar-backup.log 2>&1

# Limpeza de logs semanal
0 4 * * 0 find /var/log/esperancar-*.log -mtime +30 -delete
```

---

## ROLLBACK

### Rollback rápido (mesma versão)
```bash
docker compose -f docker-compose.prod.yml restart
```

### Rollback de código
```bash
./scripts/rollback.sh <tag_ou_commit>
```

### Rollback de banco
```bash
./scripts/restore.sh backups/esperancar_YYYYMMDD_HHMMSS.tar.gz
```

---

## CONTATOS DE EMERGÊNCIA

- **Logs**: `docker compose -f docker-compose.prod.yml logs -f`
- **Status**: `docker compose -f docker-compose.prod.yml ps`
- **Health**: `./scripts/healthcheck.sh`
- **Backup**: `./scripts/backup.sh --full`
- **Restore**: `./scripts/restore.sh <arquivo>`

---

## MÉTRICAS DE SUCESSO

| Métrica | Meta |
|---------|------|
| Uptime | >99.5% |
| Tempo de resposta API | <200ms (p95) |
| Tempo de carga frontend | <3s |
| Disco | <80% |
| Memória | <80% |
| Erros 5xx | <0.1% |
