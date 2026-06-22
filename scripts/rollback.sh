#!/bin/bash
# scripts/rollback.sh
# Rollback para versão anterior
# Uso: ./scripts/rollback.sh [tag_ou_commit]

set -euo pipefail

# Cores
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

log() { echo -e "${GREEN}[$(date +'%Y-%m-%d %H:%M:%S')]${NC} $1"; }
warn() { echo -e "${YELLOW}[$(date +'%Y-%m-%d %H:%M:%S')] WARNING:${NC} $1"; }
error() { echo -e "${RED}[$(date +'%Y-%m-%d %H:%M:%S')] ERROR:${NC} $1"; exit 1; }

if [ ! -f "docker-compose.prod.yml" ]; then
    error "Execute este script no diretório raiz do projeto"
fi

# Determinar versão de rollback
if [ -n "${1:-}" ]; then
    ROLLBACK_VERSION="$1"
else
    # Usar a tag/commit anterior
    ROLLBACK_VERSION=$(git describe --tags --abbrev=0 HEAD~1 2>/dev/null || git log --oneline -2 | tail -1 | awk '{print $1}')
fi

if [ -z "${ROLLBACK_VERSION}" ]; then
    error "Não foi possível determinar a versão de rollback"
fi

log "=== ROLLBACK PARA: ${ROLLBACK_VERSION} ==="
echo ""

# Confirmar
warn "Isso irá reverter o código para: ${ROLLBACK_VERSION}"
read -p "Continuar? (digite 'sim'): " CONFIRM
if [ "${CONFIRM}" != "sim" ]; then
    log "Rollback cancelado"
    exit 0
fi

# Backup antes do rollback
log "1/4 — Backup preventivo..."
bash scripts/backup.sh 2>/dev/null || warn "Backup falhou"

# Checkout da versão
log "2/4 — Revertendo código..."
git checkout "${ROLLBACK_VERSION}"

# Build e deploy
log "3/4 — Reconstruindo imagens..."
docker compose -f docker-compose.prod.yml build --no-cache

log "4/4 — Reiniciando serviços..."
docker compose -f docker-compose.prod.yml down
docker compose -f docker-compose.prod.yml up -d

# Verificar
sleep 10
HEALTH=$(curl -sf http://localhost:3001/api/v1/health 2>/dev/null || echo "error")
if echo "${HEALTH}" | grep -q "ok"; then
    log "=== ROLLBACK CONCLUÍDO ==="
else
    warn "=== ROLLBACK CONCLUÍDO COM AVISOS ==="
fi
