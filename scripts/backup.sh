#!/bin/bash
# scripts/backup.sh
# Backup completo do banco de dados e uploads
# Uso: ./scripts/backup.sh [--full]

set -euo pipefail

# Configurações
BACKUP_DIR="${BACKUP_DIR:-./backups}"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_NAME="esperancar_${TIMESTAMP}"
RETENTION_DAYS="${BACKUP_RETENTION_DAYS:-30}"

# Cores
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

log() { echo -e "${GREEN}[$(date +'%Y-%m-%d %H:%M:%S')]${NC} $1"; }
warn() { echo -e "${YELLOW}[$(date +'%Y-%m-%d %H:%M:%S')] WARNING:${NC} $1"; }
error() { echo -e "${RED}[$(date +'%Y-%m-%d %H:%M:%S')] ERROR:${NC} $1"; exit 1; }

# Verificar se está no diretório correto
if [ ! -f "docker-compose.prod.yml" ]; then
    error "Execute este script no diretório raiz do projeto"
fi

# Carregar variáveis de ambiento
if [ -f ".env.production" ]; then
    export $(grep -v '^#' .env.production | xargs)
fi

mkdir -p "${BACKUP_DIR}"

log "Iniciando backup: ${BACKUP_NAME}"

# =============================================
# 1. Backup do PostgreSQL
# =============================================
log "Fazendo dump do PostgreSQL..."

docker compose -f docker-compose.prod.yml exec -T postgres \
    pg_dump -U "${POSTGRES_USER:-esperancar}" -d "${POSTGRES_DB:-esperancar_db}" \
    --format=custom --compress=9 --verbose \
    > "${BACKUP_DIR}/${BACKUP_NAME}.dump" 2>/dev/null

if [ $? -eq 0 ]; then
    DUMP_SIZE=$(du -h "${BACKUP_DIR}/${BACKUP_NAME}.dump" | cut -f1)
    log "Dump criado: ${BACKUP_DIR}/${BACKUP_NAME}.dump (${DUMP_SIZE})"
else
    error "Falha ao criar dump do PostgreSQL"
fi

# =============================================
# 2. Backup dos uploads
# =============================================
if [ "${1:-}" == "--full" ]; then
    log "Fazendo backup dos uploads..."
    
    docker compose -f docker-compose.prod.yml exec -T backend \
        tar czf /tmp/uploads_backup.tar.gz -C /app/uploads . 2>/dev/null
    
    docker compose -f docker-compose.prod.yml cp \
        backend:/tmp/uploads_backup.tar.gz \
        "${BACKUP_DIR}/${BACKUP_NAME}_uploads.tar.gz" 2>/dev/null
    
    UPLOAD_SIZE=$(du -h "${BACKUP_DIR}/${BACKUP_NAME}_uploads.tar.gz" 2>/dev/null | cut -f1 || echo "0")
    log "Uploads backup: ${BACKUP_DIR}/${BACKUP_NAME}_uploads.tar.gz (${UPLOAD_SIZE})"
fi

# =============================================
# 3. Comprimir tudo
# =============================================
log "Comprimindo backup..."
cd "${BACKUP_DIR}"
tar czf "${BACKUP_NAME}.tar.gz" \
    "${BACKUP_NAME}.dump" \
    ${BACKUP_NAME}_uploads.tar.gz 2>/dev/null || true

# Remover arquivos individuais
rm -f "${BACKUP_NAME}.dump" "${BACKUP_NAME}_uploads.tar.gz"

FINAL_SIZE=$(du -h "${BACKUP_NAME}.tar.gz" | cut -f1)
log "Backup completo: ${BACKUP_DIR}/${BACKUP_NAME}.tar.gz (${FINAL_SIZE})"

# =============================================
# 4. Limpar backups antigos
# =============================================
log "Limpando backups com mais de ${RETENTION_DAYS} dias..."
find "${BACKUP_DIR}" -name "esperancar_*.tar.gz" -mtime +${RETENTION_DAYS} -delete
REMAINING=$(find "${BACKUP_DIR}" -name "esperancar_*.tar.gz" | wc -l)
log "Backups restantes: ${REMAINING}"

# =============================================
# 5. Log de backup
# =============================================
echo "${TIMESTAMP} | ${BACKUP_NAME}.tar.gz | ${FINAL_SIZE} | OK" >> "${BACKUP_DIR}/backup.log"

log "Backup concluído com sucesso!"
echo ""
echo "Para restaurar, use:"
echo "  ./scripts/restore.sh ${BACKUP_NAME}.tar.gz"
