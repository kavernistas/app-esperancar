# BACKUP_RESTORE_GUIDE.md
# Guia de Backup e Restore — Esperancar

---

## BACKUP

### Backup Completo (BD + Uploads)
```bash
./scripts/backup.sh --full
```

### Backup Apenas Banco
```bash
./scripts/backup.sh
```

### Backup Automático (Cron)
```bash
# Editar crontab
crontab -e

# Backup diário às 3h com uploads
0 3 * * * cd /opt/app-esperancar && ./scripts/backup.sh --full >> /var/log/esperancar-backup.log 2>&1
```

### Localização dos Backups
- Diretório: `./backups/`
- Formato: `esperancar_YYYYMMDD_HHMMSS.tar.gz`
- Retenção: 30 dias (configurável via BACKUP_RETENTION_DAYS)

### Conteúdo do Backup
- `*.dump` — Dump PostgreSQL (pg_dump custom format)
- `*_uploads.tar.gz` — Arquivos upload (modo --full)
- `backup.log` — Log de backups realizados

---

## RESTORE

### Restore Completo
```bash
./scripts/restore.sh backups/esperancar_20260622_030000.tar.gz
```

### Restore de Backup Específico
```bash
# Listar backups disponíveis
ls -la backups/

# Restaurar
./scripts/restore.sh backups/esperancar_20260622_030000.tar.gz
```

### Restore Manual (emergência)

```bash
# 1. Extrair backup
tar xzf backups/esperancar_20260622_030000.tar.gz -C /tmp/restore

# 2. Restaurar banco
docker compose -f docker-compose.prod.yml exec -T postgres \
    pg_restore -U esperancar -d esperancar_db --clean --if-exists < /tmp/restore/*.dump

# 3. Restaurar uploads
docker compose -f docker-compose.prod.yml cp /tmp/restore/*_uploads.tar.gz backend:/tmp/
docker compose -f docker-compose.prod.yml exec -T backend \
    tar xzf /tmp/*_uploads.tar.gz -C /app/uploads

# 4. Reiniciar
docker compose -f docker-compose.prod.yml restart backend
```

---

## MANUTENÇÃO

### Verificar Integridade do Backup
```bash
# Testar se o dump é válido
pg_restore --list backups/esperancar_20260622_030000.tar.gz
```

### Limpar Backups Antigos
```bash
# Remover backups com mais de 30 dias
find backups/ -name "esperancar_*.tar.gz" -mtime +30 -delete
```

### Verificar Espaço em Disco
```bash
df -h
du -sh backups/
```

---

## DISASTER RECOVERY

### Cenário 1: Banco corrompido
```bash
# 1. Parar backend
docker compose -f docker-compose.prod.yml stop backend

# 2. Restaurar último backup
./scripts/restore.sh backups/ULTIMO_BACKUP.tar.gz

# 3. Reiniciar
docker compose -f docker-compose.prod.yml start backend
```

### Cenário 2: Servidor perdido
```bash
# 1. Provisionar nova VPS
# 2. Instalar Docker
# 3. Clonar repositório
git clone https://github.com/kavernistas/app-esperancar.git

# 4. Restaurar backup
scp backups/esperancar_*.tar.gz root@NOVO_IP:/opt/app-esperancar/backups/
./scripts/restore.sh backups/esperancar_*.tar.gz

# 5. Verificar
./scripts/healthcheck.sh
```

### Cenário 3: Rollback de migration
```bash
# Ver status das migrations
docker compose -f docker-compose.prod.yml exec backend npx prisma migrate status

# Reverter última migration
docker compose -f docker-compose.prod.yml exec backend npx prisma migrate resolve --rolled-back <migration_name>

# Ou restaurar backup anterior
./scripts/restore.sh backups/ANTERIOR.tar.gz
```

---

## TESTES DE BACKUP

### Testar Backup
```bash
# Criar backup de teste
./scripts/backup.sh --full

# Verificar se foi criado
ls -la backups/

# Verificar conteúdo
tar tzf backups/esperancar_*.tar.gz
```

### Teste de Restore (Staging)
```bash
# Em ambiente de staging
docker compose -f docker-compose.prod.yml down -v
docker compose -f docker-compose.prod.yml up -d postgres redis
./scripts/restore.sh backups/TESTE.tar.gz
./scripts/healthcheck.sh
```
