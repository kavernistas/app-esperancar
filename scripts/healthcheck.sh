#!/bin/bash
# scripts/healthcheck.sh
# Verificação completa de saúde do sistema
# Uso: ./scripts/healthcheck.sh [--json]

set -euo pipefail

# Cores
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

JSON_MODE=false
[ "${1:-}" == "--json" ] && JSON_MODE=true

# Contadores
OK=0
WARN=0
FAIL=0

check() {
    local name="$1"
    local status="$2"
    local detail="${3:-}"
    
    if [ "${status}" == "ok" ]; then
        OK=$((OK + 1))
        [ "${JSON_MODE}" == false ] && echo -e "  ${GREEN}✓${NC} ${name}: ${detail:-ok}"
    elif [ "${status}" == "warn" ]; then
        WARN=$((WARN + 1))
        [ "${JSON_MODE}" == false ] && echo -e "  ${YELLOW}⚠${NC} ${name}: ${detail:-warning}"
    else
        FAIL=$((FAIL + 1))
        [ "${JSON_MODE}" == false ] && echo -e "  ${RED}✗${NC} ${name}: ${detail:-error}"
    fi
}

[ "${JSON_MODE}" == false ] && echo "=== HEALTH CHECK ESPERANCAR ==="
[ "${JSON_MODE}" == false ] && echo ""

# =============================================
# 1. Docker Services
# =============================================
[ "${JSON_MODE}" == false ] && echo "Docker Services:"

for svc in nginx backend postgres redis; do
    STATUS=$(docker compose -f docker-compose.prod.yml ps --format json "${svc}" 2>/dev/null | grep -o '"State":"[^"]*"' | cut -d'"' -f4)
    if [ "${STATUS}" == "running" ]; then
        check "${svc}" "ok" "running"
    else
        check "${svc}" "fail" "${STATUS:-not running}"
    fi
done

[ "${JSON_MODE}" == false ] && echo ""

# =============================================
# 2. API Health
# =============================================
[ "${JSON_MODE}" == false ] && echo "API Health:"

API_RESPONSE=$(curl -sf http://localhost:3001/api/v1/health 2>/dev/null || echo "")
if echo "${API_RESPONSE}" | grep -q "ok"; then
    check "API /health" "ok" "responding"
else
    check "API /health" "fail" "not responding"
fi

# =============================================
# 3. PostgreSQL
# =============================================
[ "${JSON_MODE}" == false ] && echo ""
[ "${JSON_MODE}" == false ] && echo "PostgreSQL:"

PG_STATUS=$(docker compose -f docker-compose.prod.yml exec -T postgres pg_isready -U "${POSTGRES_USER:-esperancar}" 2>/dev/null || echo "not ready")
if echo "${PG_STATUS}" | grep -q "accepting"; then
    check "PostgreSQL" "ok" "accepting connections"
    
    # Tamanho do banco
    DB_SIZE=$(docker compose -f docker-compose.prod.yml exec -T postgres psql -U "${POSTGRES_USER:-esperancar}" -d "${POSTGRES_DB:-esperancar_db}" -t -c "SELECT pg_size_pretty(pg_database_size('${POSTGRES_DB:-escritorio_db}'));" 2>/dev/null | xargs || echo "N/A")
    [ "${JSON_MODE}" == false ] && echo -e "    ${NC}Database size: ${DB_SIZE}"
else
    check "PostgreSQL" "fail" "${PG_STATUS}"
fi

# =============================================
# 4. Redis
# =============================================
[ "${JSON_MODE}" == false ] && echo ""
[ "${JSON_MODE}" == false ] && echo "Redis:"

REDIS_PING=$(docker compose -f docker-compose.prod.yml exec -T redis redis-cli ping 2>/dev/null || echo "PONG_FAIL")
if [ "${REDIS_PING}" == "PONG" ]; then
    check "Redis" "ok" "PONG"
    
    REDIS_MEM=$(docker compose -f docker-compose.prod.yml exec -T redis redis-cli INFO memory 2>/dev/null | grep "used_memory_human" | cut -d: -f2 | tr -d '\r' || echo "N/A")
    [ "${JSON_MODE}" == false ] && echo -e "    ${NC}Memory: ${REDIS_MEM}"
else
    check "Redis" "fail" "not responding"
fi

# =============================================
# 5. Disco
# =============================================
[ "${JSON_MODE}" == false ] && echo ""
[ "${JSON_MODE}" == false ] && echo "Disk Usage:"

DISK_PCT=$(df -h / | tail -1 | awk '{print $5}' | tr -d '%')
if [ "${DISK_PCT}" -lt 80 ]; then
    check "Disk" "ok" "${DISK_PCT}% used"
elif [ "${DISK_PCT}" -lt 90 ]; then
    check "Disk" "warn" "${DISK_PCT}% used"
else
    check "Disk" "fail" "${DISK_PCT}% used"
fi

# =============================================
# 6. Logs recentes (últimos erros)
# =============================================
[ "${JSON_MODE}" == false ] && echo ""
[ "${JSON_MODE}" == false ] && echo "Recent Errors (last 5 min):"

ERROR_COUNT=$(docker compose -f docker-compose.prod.yml logs --since 5m backend 2>/dev/null | grep -c "ERROR" || echo "0")
if [ "${ERROR_COUNT}" -eq 0 ]; then
    check "Error logs" "ok" "no errors in last 5 min"
else
    check "Error logs" "warn" "${ERROR_COUNT} errors in last 5 min"
fi

# =============================================
# Resumo
# =============================================
[ "${JSON_MODE}" == false ] && echo ""
[ "${JSON_MODE}" == false ] && echo "=============================="

if [ "${FAIL}" -eq 0 ] && [ "${WARN}" -eq 0 ]; then
    [ "${JSON_MODE}" == false ] && echo -e "${GREEN}ALL OK${NC} — ${OK} checks passed"
elif [ "${FAIL}" -eq 0 ]; then
    [ "${JSON_MODE}" == false ] && echo -e "${YELLOW}WARNINGS${NC} — ${OK} ok, ${WARN} warnings"
else
    [ "${JSON_MODE}" == false ] && echo -e "${RED}FAILURES${NC} — ${OK} ok, ${WARN} warnings, ${FAIL} failures"
fi

# JSON output
if [ "${JSON_MODE}" == true ]; then
    cat <<EOF
{
  "timestamp": "$(date -Iseconds)",
  "status": "$([ "${FAIL}" -eq 0 ] && echo "healthy" || echo "unhealthy")",
  "checks": { "ok": ${OK}, "warn": ${WARN}, "fail": ${FAIL} },
  "services": {
    "nginx": "$(docker compose -f docker-compose.prod.yml ps --format json nginx 2>/dev/null | grep -o '"State":"[^"]*"' | cut -d'"' -f4)",
    "backend": "$(docker compose -f docker-compose.prod.yml ps --format json backend 2>/dev/null | grep -o '"State":"[^"]*"' | cut -d'"' -f4)",
    "postgres": "$(docker compose -f docker-compose.prod.yml ps --format json postgres 2>/dev/null | grep -o '"State":"[^"]*"' | cut -d'"' -f4)",
    "redis": "$(docker compose -f docker-compose.prod.yml ps --format json redis 2>/dev/null | grep -o '"State":"[^"]*"' | cut -d'"' -f4)"
  }
}
EOF
fi

# Exit code
[ "${FAIL}" -eq 0 ] && exit 0 || exit 1
