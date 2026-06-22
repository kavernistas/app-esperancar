import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerModule } from '@nestjs/throttler';
import { TerminusModule } from '@nestjs/terminus';
import { PrismaModule } from './common/prisma.module';
import { HealthModule } from './modules/health/health.module';
import { AuthModule } from './modules/auth/auth.module';
import { UsersModule } from './modules/users/users.module';
import { ContactsModule } from './modules/contacts/contacts.module';
import { LeadersModule } from './modules/leaders/leaders.module';
import { DemandsModule } from './modules/demands/demands.module';
import { MissionsModule } from './modules/missions/missions.module';
import { CampaignModule } from './modules/campaigns/campaigns.module';
import { GamificationModule } from './modules/gamification/gamification.module';
import { ElectoralModule } from './modules/electoral/electoral.module';
import { TseModule } from './modules/tse/tse.module';
import { NotificationModule } from './modules/notifications/notifications.module';
import { AuditModule } from './modules/audit/audit.module';
import { WhatsAppModule } from './modules/whatsapp/whatsapp.module';
import { SofiaModule } from './modules/sofia/sofia.module';
import { FilesModule } from './modules/files/files.module';
import { JobsModule } from './modules/jobs/jobs.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    ThrottlerModule.forRoot([{ ttl: 60000, limit: 100 }]),
    TerminusModule,
    PrismaModule,
    HealthModule,
    AuthModule,
    UsersModule,
    ContactsModule,
    LeadersModule,
    DemandsModule,
    MissionsModule,
    CampaignModule,
    GamificationModule,
    ElectoralModule,
    TseModule,
    NotificationModule,
    AuditModule,
    WhatsAppModule,
    SofiaModule,
    FilesModule,
    JobsModule,
  ],
})
export class AppModule {}
