import { Injectable } from '@nestjs/common';
import { PrismaService } from '@/common/prisma.service';

export interface AuthenticatedUser {
  id: string;
  email: string;
  full_name: string;
  phone: string | null;
  role: string;
  profile: string | null;
  avatar_url: string | null;
  status: string;
  organization_id: string | null;
  active_campaign_id: string | null;
  lgpd_consent: boolean;
  notif_email: boolean;
  sofia_enabled: boolean;
  ui_dark_mode: boolean;
  whatsapp_status: string | null;
  metas: any;
  created_at: Date | null;
  last_login_at: Date | null;
  organization: { id: string; name: string; slug: string } | null;
  active_campaign: { id: string; name: string; status: string } | null;
  membership: { id: string; role: string; is_active: boolean } | null;
  permissions: string[];
}

@Injectable()
export class AuthUserSerializer {
  constructor(private prisma: PrismaService) {}

  async build(userId: string): Promise<AuthenticatedUser | null> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        full_name: true,
        phone: true,
        role: true,
        profile: true,
        avatar_url: true,
        status: true,
        organization_id: true,
        active_campaign_id: true,
        lgpd_consent: true,
        notif_email: true,
        sofia_enabled: true,
        ui_dark_mode: true,
        whatsapp_status: true,
        metas: true,
        created_at: true,
        last_login_at: true,
      },
    });

    if (!user) return null;

    let organization: { id: string; name: string; slug: string } | null = null;
    let active_campaign: { id: string; name: string; status: string } | null = null;
    let membership: { id: string; role: string; is_active: boolean } | null = null;
    const permissions: string[] = [];

    if (user.organization_id) {
      const org = await this.prisma.organization.findUnique({
        where: { id: user.organization_id },
        select: { id: true, name: true, slug: true },
      });
      organization = org;

      const mem = await this.prisma.membership.findFirst({
        where: { user_id: userId, organization_id: user.organization_id },
      });
      if (mem) {
        membership = { id: mem.id, role: mem.role, is_active: mem.is_active };
      }

      if (user.role === 'ADMIN') {
        permissions.push('*');
      } else {
        const rolePerms = await this.prisma.rolePermission.findMany({
          where: { role: user.role },
          select: { permission: true },
        });
        permissions.push(...rolePerms.map(p => p.permission));
      }
    }

    if (user.active_campaign_id) {
      const camp = await this.prisma.campaign.findFirst({
        where: { id: user.active_campaign_id, organization_id: user.organization_id },
        select: { id: true, name: true, status: true },
      });
      active_campaign = camp;
    }

    return {
      id: user.id,
      email: user.email,
      full_name: user.full_name,
      phone: user.phone,
      role: user.role as string,
      profile: user.profile,
      avatar_url: user.avatar_url,
      status: user.status,
      organization_id: user.organization_id,
      active_campaign_id: user.active_campaign_id,
      lgpd_consent: user.lgpd_consent,
      notif_email: user.notif_email,
      sofia_enabled: user.sofia_enabled,
      ui_dark_mode: user.ui_dark_mode,
      whatsapp_status: user.whatsapp_status,
      metas: user.metas,
      created_at: user.created_at,
      last_login_at: user.last_login_at,
      organization,
      active_campaign,
      membership,
      permissions,
    };
  }
}
