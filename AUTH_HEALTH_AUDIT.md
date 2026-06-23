AUTH HEALTH AUDIT — ESPERANÇAR
=================================
Data: 2026-06-23

USUÁRIO ADMIN:
  Email:      admin@esperancar.app
  Role:       ADMIN
  Status:     ACTIVE
  Hash:       $2b$12$ITCzAJSXcFzTvA.LnCw4JuvQjLUvzMfaUGj824tj8keN9CbRCPP8G (bcrypt, 12 rounds)

TESTE DE LOGIN (interno):
  Endpoint: POST /api/v1/auth/login
  Body:     {"email":"admin@esperancar.app","password":"Admin@2026"}
  
  Resultado: NÃO TESTADO diretamente (bloqueado: curl para localhost:3001 via SSH)
  
  Análise do código (auth.service.ts):
    ✅ Busca usuário por email
    ✅ Verifica status === 'ACTIVE'
    ✅ bcrypt.compare para validar senha
    ✅ Gera tokens JWT (access + refresh)
    ✅ Atualiza last_login
    ✅ Retorna user object sem password_hash

  Conclusão: Auth logic está correta. Se o usuário existe e está ACTIVE,
  e o hash corresponde à senha "Admin@2026", o login deve funcionar.

PENDÊNCIA: Teste de login externo não pôde ser realizado porque
o backend não é acessível via Traefik (ver ROUTE_PROXY_AUDIT).

STATUS: ✅ LÓGICA AUTH OK (aguarda correção de proxy para teste completo)
