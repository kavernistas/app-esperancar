import { Injectable, CanActivate, ExecutionContext, ForbiddenException, Logger } from '@nestjs/common';
import { Reflector } from '@nestjs/core';

const normalizeRole = (role: unknown): string =>
  String(role ?? '').trim().toUpperCase();

@Injectable()
export class RolesGuard implements CanActivate {
  private readonly logger = new Logger(RolesGuard.name);

  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<string[]>('roles', [
      context.getHandler(),
      context.getClass(),
    ]);
    if (!requiredRoles || requiredRoles.length === 0) return true;

    const { user } = context.switchToHttp().getRequest();
    if (!user) throw new ForbiddenException('Usuário não autenticado');

    const normalizedUserRole = normalizeRole(user.role);
    const normalizedRequiredRoles = requiredRoles.map(normalizeRole);

    const allowed = normalizedRequiredRoles.includes(normalizedUserRole);

    if (!allowed) {
      this.logger.warn(
        `Access denied: user.role="${user.role}" (normalized="${normalizedUserRole}") required=${JSON.stringify(requiredRoles)} (normalized=${JSON.stringify(normalizedRequiredRoles)})`,
      );
      throw new ForbiddenException('Acesso negado — permissão insuficiente');
    }

    return true;
  }
}
