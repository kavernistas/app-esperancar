#!/bin/bash
# scripts/deploy.sh
# Deploy completo em produção
# Uso: ./scripts/deploy.sh [--migrate] [--seed]

set -euo pipefail

# Cores
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

log() { echo -e "${GREEN}[$(date +'%Y-%m-%d %H:%M:%S')]${NC} $1"; }
warn() { echo -e "${YELLOW}[$(date +'%Y-%m-%d %H:%M:%S')] WARNING:${NC} $1"; }
error() { echo -e "${RED}[$(date +'%Y-%m-%d %H:%M:%S')] ERROR:${NC} $1"; exit 1; }
info() { echo -e "${BLUE}[$(date +'%Y-%m-%d %H:%M:%S')] INFO:${NC} $1"; }

# Verificar diretório
if [ ! -f "docker-compose.prod.yml" ]; then
    error "Execute este script no diretório raiz do projeto"
fi

# Verificar .env.production
if [ ! -f ".env.production" ]; then
    error ".env.production não encontrado. Copie de .env.production.example"
fi

log "=== DEPLOY ESPERANCAR ==="
echo ""

# =============================================
# 1. Backup antes do deploy
# =============================================
log "1/6 — Fazendo backup preventivo..."
if [ -f "scripts/backup.sh" ]; then
    bash scripts/backup.sh || warn "Backup falhou, continuando..."
else
    warn "Script de backup não encontrado"
fi

# =============================================
# 2. Pull das imagens mais recentes
# =============================================
log "2/6 — Atualizando imagens..."
docker compose -f docker-compose.prod.yml pull 2>/dev/null || true

# =============================================
# 3. Build das imagens
# =============================================
log "3/6 — Construindo imagens..."
docker compose -f docker-compose.prod.yml build --no-cache

# =============================================
# 4. Parar serviços antigos
# =============================================
log "4/6 — Parando serviços antigos..."
docker compose -f docker-compose.prod.yml down --remove-orphans

# =============================================
# 5. Subir serviços
# =============================================
log "5/6 — Subindo serviços..."
docker compose -f docker-compose.prod.yml up -d

# =============================================
# 6. Executar migrations (se solicitado)
# =============================================
if [[ "$*" == *"--migrate"* ]]; then
    log "6/6 — Executando migrations..."
    sleep 10  # Aguardar postgres
    
    docker compose -f docker-compose.prod.yml exec -T backend \
        npx prisma migrate deploy
    
    if [[ "$*" == *"--seed"* ]]; then
        log "Executando seed..."
        docker compose -f docker-compose.prod.yml exec -T backend \
            npm run prisma:seed
    fi
else
    log "6/6 — Pulando migrations (use --migrate para executar)"
fi

# =============================================
# 7. Verificar saúde
# =============================================
echo ""
log "Verificando saúde dos serviços..."
sleep 10

SERVICES=("nginx" "backend" "postgres" "redis")
ALL_OK=true

for svc in "${SERVICES[@]}"; do
    STATUS=$(docker compose -f docker-compose.prod.yml ps --format json "${svc}" 2>/dev/null | grep -o '"State":"[^"]*"' | cut -d'"' -f4)
    if [ "${STATUS}" == "running" ]; then
        echo -e "  ${GREEN}✓${NC} ${svc}: running"
    else
        echo -e "  ${RED}✗${NC} ${svc}: ${STATUS:-not found}"
        ALL_OK=false
    fi
done

# Health check da API
API_HEALTH=$(curl -sf http://localhost:3001/api/v1/health 2>/dev/null || echo "error")
if echo "${API_HEALTH}" | grep -q "ok"; then
    echo -e "  ${GREEN}✓${NC} API health: ok"
else
    echo -e "  ${RED}✗${NC} API health: ${API_HEALTH}"
    ALL_OK=false
fi

echo ""
if [ "${ALL_OK}" = true ]; then
    log "=== DEPLOY CONCLUÍDO COM SUCESSO ==="
else
    warn "=== DEPLOY CONCLUÍDO COM AVISOS ==="
    warn "Verifique os logs: docker compose -f docker-compose.prod.yml logs"
fi

echo ""
info "Comandos úteis:"
info "  Ver logs:     docker compose -f docker-compose.prod.yml logs -f"
info "  Status:       docker compose -f docker-compose.prod.yml ps"
info "  Health:       curl http://localhost:3001/api/v1/health"
info "  Backup:       ./scripts/backup.sh"
info "  Rollback:     ./scripts/rollback.sh"
