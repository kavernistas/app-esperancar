import { Injectable, UnauthorizedException, BadRequestException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '@/common/prisma.service';
import { AuditService } from '@/modules/audit/audit.service';
import { EventsService } from '@/modules/events/events.service';
import { AuthUserSerializer } from './auth-user.serializer';
import * as bcrypt from 'bcrypt';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwt: JwtService,
    private config: ConfigService,
    private audit: AuditService,
    private events: EventsService,
    private serializer: AuthUserSerializer,
  ) {}

  async login(dto: { email: string; password: string }) {
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });

    if (!user) {
      throw new UnauthorizedException('Credenciais invalidas');
    }

    if (user.status !== 'ACTIVE') {
      throw new UnauthorizedException('Conta inativa ou suspensa');
    }

    const passwordValid = await bcrypt.compare(dto.password, user.password_hash);
    if (!passwordValid) {
      throw new UnauthorizedException('Credenciais invalidas');
    }

    // Check membership is active
    if (user.organization_id) {
      const membership = await this.prisma.membership.findFirst({
        where: { user_id: user.id, organization_id: user.organization_id, is_active: true },
      });
      if (!membership) {
        throw new UnauthorizedException('Membro sem acesso ativo nesta organizacao');
      }
    }

    // Update last login
    await this.prisma.user.update({
      where: { id: user.id },
      data: { last_login_at: new Date() },
    });

    const tokens = await this.generateTokens(user.id, user.email, user.role);

    // Audit + Event
    await this.audit.log({
      action: 'login',
      entity: 'User',
      entity_id: user.id,
      entity_label: user.email,
      user_id: user.id,
      user_name: user.full_name,
      organization_id: user.organization_id,
      module: 'auth',
    });
    await this.events.emit({
      type: 'user.login',
      title: `Login: ${user.email}`,
      userId: user.id,
      organizationId: user.organization_id,
      entityType: 'user',
      entityId: user.id,
      entityLabel: user.email,
    });

    const authenticatedUser = await this.serializer.build(user.id);

    return {
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      user: authenticatedUser,
    };
  }

  async refresh(dto: { refreshToken: string }) {
    const storedToken = await this.prisma.refreshToken.findUnique({
      where: { token: dto.refreshToken },
      include: { user: true },
    });

    if (!storedToken) {
      throw new UnauthorizedException('Refresh token invalido');
    }

    if (storedToken.revoked_at) {
      throw new UnauthorizedException('Refresh token revogado');
    }

    if (new Date() > storedToken.expires_at) {
      throw new UnauthorizedException('Refresh token expirado');
    }

    const user = storedToken.user;

    // Re-validate status from DB (not old token)
    if (user.status !== 'ACTIVE') {
      throw new UnauthorizedException('Conta inativa ou suspensa');
    }

    // Re-validate membership
    if (user.organization_id) {
      const membership = await this.prisma.membership.findFirst({
        where: { user_id: user.id, organization_id: user.organization_id, is_active: true },
      });
      if (!membership) {
        throw new UnauthorizedException('Membro sem acesso ativo nesta organizacao');
      }
    }

    // Revoke old refresh token (rotation)
    await this.prisma.refreshToken.update({
      where: { id: storedToken.id },
      data: { revoked_at: new Date() },
    });

    const tokens = await this.generateTokens(user.id, user.email, user.role);
    const authenticatedUser = await this.serializer.build(user.id);

    return {
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      user: authenticatedUser,
    };
  }

  async logout(userId: string, refreshToken?: string): Promise<{ success: boolean }> {
    if (refreshToken) {
      await this.prisma.refreshToken.updateMany({
        where: { token: refreshToken, user_id: userId },
        data: { revoked_at: new Date() },
      });
    } else {
      await this.prisma.refreshToken.updateMany({
        where: { user_id: userId, revoked_at: null },
        data: { revoked_at: new Date() },
      });
    }

    await this.audit.log({
      action: 'logout',
      entity: 'User',
      entity_id: userId,
      user_id: userId,
      module: 'auth',
    });

    return { success: true };
  }

  async updateProfile(userId: string, data: any) {
    const allowedFields = ['full_name', 'phone', 'avatar_url', 'ui_dark_mode', 'notif_email', 'whatsapp_status', 'metas', 'profile'];
    const updateData: any = {};
    for (const field of allowedFields) {
      if (data[field] !== undefined) updateData[field] = data[field];
    }
    if (data.password && data.current_password) {
      const user = await this.prisma.user.findUnique({ where: { id: userId } });
      if (!user) throw new UnauthorizedException('Usuario nao encontrado');
      const valid = await bcrypt.compare(data.current_password, user.password_hash);
      if (!valid) throw new UnauthorizedException('Senha atual incorreta');
      const newHash = await bcrypt.hash(data.password, 12);
      updateData.password_hash = newHash;
    }
    if (Object.keys(updateData).length === 0) throw new BadRequestException('Nenhum campo para atualizar');
    await this.prisma.user.update({ where: { id: userId }, data: updateData });
    return this.getMe(userId);
  }

  async getMe(userId: string) {
    const user = await this.serializer.build(userId);
    if (!user) throw new UnauthorizedException('Usuario nao encontrado');
    return user;
  }

  async validateUserById(userId: string) {
    return this.prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, email: true, role: true, status: true, organization_id: true, active_campaign_id: true },
    });
  }

  private async generateTokens(userId: string, email: string, role: string) {
    const payload = { sub: userId, email, role };

    const accessToken = this.jwt.sign(payload, {
      secret: this.config.get('JWT_ACCESS_SECRET'),
      expiresIn: this.config.get('JWT_ACCESS_EXPIRATION', '15m'),
    });

    const refreshTokenValue = uuidv4();
    const refreshExpiresDays = parseInt(this.config.get('JWT_REFRESH_EXPIRATION', '7d').replace('d', ''));
    const refreshExpiresAt = new Date();
    refreshExpiresAt.setDate(refreshExpiresAt.getDate() + refreshExpiresDays);

    await this.prisma.refreshToken.create({
      data: {
        user_id: userId,
        token: refreshTokenValue,
        expires_at: refreshExpiresAt,
      },
    });

    return {
      accessToken,
      refreshToken: refreshTokenValue,
    };
  }
}
