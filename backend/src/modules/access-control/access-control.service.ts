import { Injectable, ForbiddenException, CanActivate, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PrismaService } from '@/common/prisma.service';
import { normalizeRole } from './role-permissions';

export interface AccessContext {
  userId: string;
  email: string;
  fullName: string;
  role: string;
  organizationId: string | null;
  activeCampaignId: string | null;
}

@Injectable()
export class AccessControlService {
  constructor(private prisma: PrismaService) {}

  async getContext(userId: string): Promise<AccessContext | null> {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) return null;
    return {
      userId: user.id,
      email: user.email,
      fullName: user.full_name,
      role: user.role as string,
      organizationId: user.organization_id,
      activeCampaignId: user.active_campaign_id,
    };
  }

  async getRole(userId: string): Promise<string | null> {
    const user = await this.prisma.user.findUnique({ where: { id: userId }, select: { role: true } });
    return normalizeRole(user?.role as string);
  }

  async hasPermissionDB(userId: string, permission: string): Promise<boolean> {
    const user = await this.prisma.user.findUnique({ where: { id: userId }, select: { role: true } });
    const role = normalizeRole(user?.role);
    if (role === 'ADMIN') return true;

    const dbPerm = await this.prisma.rolePermission.findFirst({
      where: { role, permission },
    });
    return !!dbPerm;
  }
}

@Injectable()
export class PermissionsGuard implements CanActivate {
  constructor(private reflector: Reflector, private ac: AccessControlService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const required = this.reflector.getAllAndOverride<string[]>('permissions', [
      context.getHandler(),
      context.getClass(),
    ]);
    if (!required || required.length === 0) return true;

    const req = context.switchToHttp().getRequest();
    const user = req.user;
    if (!user) throw new ForbiddenException('Não autenticado');

    const userRole = normalizeRole(user.role);
    if (userRole === 'ADMIN') return true;

    for (const perm of required) {
      const has = await this.ac.hasPermissionDB(user.id, perm);
      if (has) continue;
      throw new ForbiddenException(`Acesso negado: permissão '${perm}' necessária`);
    }
    return true;
  }
}
