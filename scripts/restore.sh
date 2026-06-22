#!/bin/bash
# scripts/restore.sh
# Restaura backup do banco de dados e uploads
# Uso: ./scripts/restore.sh <arquivo_backup.tar.gz>

set -euo pipefail

# Cores
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

log() { echo -e "${GREEN}[$(date +'%Y-%m-%d %H:%M:%S')]${NC} $1"; }
warn() { echo -e "${YELLOW}[$(date +'%Y-%m-%d %H:%M:%S')] WARNING:${NC} $1"; }
error() { echo -e "${RED}[$(date +'%Y-%m-%d %H:%M:%S')] ERROR:${NC} $1"; exit 1; }

# Verificar argumentos
if [ -z "${1:-}" ]; then
    error "Uso: $0 <arquivo_backup.tar.gz>"
fi

BACKUP_FILE="$1"
BACKUP_DIR="${BACKUP_DIR:-./backups}"
TEMP_DIR=$(mktemp -d)

# Verificar se arquivo existe
if [ ! -f "${BACKUP_FILE}" ]; then
    # Tentar no diretório de backups
    if [ -f "${BACKUP_DIR}/${BACKUP_FILE}" ]; then
        BACKUP_FILE="${BACKUP_DIR}/${BACKUP_FILE}"
    else
        error "Arquivo de backup não encontrado: ${BACKUP_FILE}"
    fi
fi

# Verificar se está no diretório correto
if [ ! -f "docker-compose.prod.yml" ]; then
    error "Execute este script no diretório raiz do projeto"
fi

# Carregar variáveis
if [ -f ".env.production" ]; then
    export $(grep -v '^#' .env.production | xargs)
fi

log "Iniciando restauração de: ${BACKUP_FILE}"

# =============================================
# 1. Extrair backup
# =============================================
log "Extraindo backup..."
tar xzf "${BACKUP_FILE}" -C "${TEMP_DIR}"

DUMP_FILE=$(find "${TEMP_DIR}" -name "*.dump" | head -1)
UPLOADS_FILE=$(find "${TEMP_DIR}" -name "*_uploads.tar.gz" | head -1)

if [ -z "${DUMP_FILE}" ]; then
    error "Arquivo .dump não encontrado no backup"
fi

log "Dump encontrado: $(basename ${DUMP_FILE})"

# =============================================
# 2. Confirmar restauração
# =============================================
echo ""
warn "ATENÇÃO: Esta operação irá SOBRESCREVER os dados atuais!"
warn "Banco: ${POSTGRES_DB:-esperancar_db}"
warn "Host: postgres"
echo ""
read -p "Deseja continuar? (digite 'sim' para confirmar): " CONFIRM

if [ "${CONFIRM}" != "sim" ]; then
    log "Restauração cancelada pelo usuário"
    rm -rf "${TEMP_DIR}"
    exit 0
fi

# =============================================
# 3. Restaurar PostgreSQL
# =============================================
log "Restaurando banco de dados..."

# Parar backend para evitar conflitos
log "Parando backend..."
docker compose -f docker-compose.prod.yml stop backend

# Restaurar
docker compose -f docker-compose.prod.yml exec -T postgres \
    pg_restore -U "${POSTGRES_USER:-esperancar}" -d "${POSTGRES_DB:-esperancar_db}" \
    --clean --if-exists --verbose \
    < "${DUMP_FILE}" 2>/dev/null

if [ $? -eq 0 ]; then
    log "Banco de dados restaurado com sucesso"
else
    warn "Restauração concluída com avisos (pode ser normal)"
fi

# Reiniciar backend
log "Reiniciando backend..."
docker compose -f docker-compose.prod.yml start backend

# =============================================
# 4. Restaurar uploads (se existir)
# =============================================
if [ -n "${UPLOADS_FILE}" ]; then
    log "Restaurando uploads..."
    
    docker compose -f docker-compose.prod.yml exec -T backend \
        rm -rf /app/uploads/* 2>/dev/null || true
    
    docker compose -f docker-compose.prod.yml cp \
        "${UPLOADS_FILE}" \
        backend:/tmp/uploads_restore.tar.gz
    
    docker compose -f docker-compose.prod.yml exec -T backend \
        tar xzf /tmp/uploads_restore.tar.gz -C /app/uploads
    
    log "Uploads restaurados"
fi

# =============================================
# 5. Limpar temporários
# =============================================
rm -rf "${TEMP_DIR}"

# =============================================
# 6. Verificar saúde
# =============================================
log "Verificando saúde do sistema..."
sleep 5

HEALTH=$(curl -sf http://localhost:3001/api/v1/health 2>/dev/null || echo '{"status":"error"}')
if echo "${HEALTH}" | grep -q "ok"; then
    log "Health check: OK"
else
    warn "Health check falhou — verifique os logs"
fi

log "Restauração concluída!"
echo ""
echo "Verifique o sistema em: http://localhost"
