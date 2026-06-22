import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '@/common/prisma.service';
import { AuditService } from '../audit/audit.service';
import * as cron from 'node-cron';

interface JobStatus {
  name: string;
  description: string;
  schedule: string;
  lastRun?: Date;
  lastResult?: string;
  isRunning: boolean;
  enabled: boolean;
}

@Injectable()
export class JobsService {
  private readonly logger = new Logger(JobsService.name);
  private readonly jobs: Map<string, JobStatus> = new Map();
  private readonly cronTasks: Map<string, cron.ScheduledTask> = new Map();

  constructor(
    private config: ConfigService,
    private prisma: PrismaService,
    private audit: AuditService,
  ) {
    this.registerJobs();
  }

  // ============ JOB REGISTRATION ============

  private registerJobs() {
    // Weekly maintenance — every Sunday at 3am
    this.registerJob({
      name: 'weekly_maintenance',
      description: 'Manutencao semanal: reset ranking, metas, verificar inativos',
      schedule: '0 3 * * 0',
      handler: () => this.weeklyMaintenance(),
    });

    // Check overdue demands — every hour
    this.registerJob({
      name: 'check_overdue_demands',
      description: 'Verificar demandas vencidas e notificar',
      schedule: '0 * * * *',
      handler: () => this.checkOverdueDemands(),
    });

    // Mark overdue missions — every hour
    this.registerJob({
      name: 'mark_overdue_missions',
      description: 'Marcar missoes vencidas como overdue',
      schedule: '30 * * * *',
      handler: () => this.markOverdueMissions(),
    });
  }

  private registerJob(options: {
    name: string;
    description: string;
    schedule: string;
    handler: () => Promise<any>;
  }) {
    const { name, description, schedule, handler } = options;

    this.jobs.set(name, {
      name,
      description,
      schedule,
      isRunning: false,
      enabled: true,
    });

    // Schedule with node-cron
    const task = cron.schedule(schedule, async () => {
      const job = this.jobs.get(name);
      if (!job?.enabled || job.isRunning) return;

      job.isRunning = true;
      job.lastRun = new Date();

      try {
        this.logger.log(`[Job] Starting: ${name}`);
        const result = await handler();
        job.lastResult = JSON.stringify(result);
        this.logger.log(`[Job] Completed: ${name}`);
      } catch (error) {
        job.lastResult = `ERROR: ${error.message}`;
        this.logger.error(`[Job] Failed: ${name} — ${error.message}`);
      } finally {
        job.isRunning = false;
      }
    });

    this.cronTasks.set(name, task);
    this.logger.log(`[Job] Registered: ${name} (${schedule})`);
  }

  // ============ JOB HANDLERS ============

  async weeklyMaintenance() {
    const results: any = {};

    // 1. Reset weekly ranking
    const profiles = await this.prisma.gamificationProfile.findMany();
    const weekStart = new Date();
    weekStart.setDate(weekStart.getDate() - weekStart.getDay()); // Start of week

    await Promise.all(
      profiles.map(p =>
        this.prisma.gamificationProfile.update({
          where: { id: p.id },
          data: { weekly_points: 0, week_start: weekStart },
        }),
      ),
    );
    results.weeklyRankingReset = profiles.length;

    // 2. Reset weekly goals for leaders
    const leaders = await this.prisma.leader.findMany({ where: { status: 'ACTIVE' } });
    await Promise.all(
      leaders.map(l =>
        this.prisma.leader.update({
          where: { id: l.id },
          data: { actions_completed: 0 },
        }),
      ),
    );
    results.weeklyGoalsReset = leaders.length;

    // 3. Check inactive leaders (no activity in 30 days)
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const inactiveProfiles = profiles.filter(p => {
      const lastActivity = p.last_activity_at ? new Date(p.last_activity_at) : new Date(0);
      return lastActivity < thirtyDaysAgo;
    });

    if (inactiveProfiles.length > 0) {
      await Promise.all(
        inactiveProfiles.map(p =>
          this.prisma.leader.update({
            where: { id: p.leader_id },
            data: { status: 'INACTIVE' },
          }),
        ),
      );
    }
    results.inactiveLeaders = inactiveProfiles.length;

    await this.audit.log({
      action: 'job',
      entity: 'Job',
      entity_label: 'weekly_maintenance',
      module: 'jobs',
      severity: 'INFO',
      metadata: results,
    });

    return results;
  }

  async checkOverdueDemands() {
    const today = new Date().toISOString().slice(0, 10);

    const overdueDemands = await this.prisma.demand.findMany({
      where: {
        deleted_at: null,
        status: { not: 'RESOLVED' },
        due_date: { lt: new Date(today) },
      },
    });

    if (overdueDemands.length === 0) {
      return { processed: 0, message: 'Nenhuma demanda vencida' };
    }

    // Get admins and coordinators
    const admins = await this.prisma.user.findMany({
      where: { role: { in: ['ADMIN', 'COORDENADOR'] }, status: 'ACTIVE' },
    });

    // Create notifications
    const notifications = [];
    for (const demand of overdueDemands) {
      const daysOverdue = Math.floor(
        (Date.now() - new Date(demand.due_date!).getTime()) / 86400000,
      );

      for (const admin of admins) {
        notifications.push({
          user_id: admin.id,
          title: `Demanda vencida: ${demand.title}`,
          message: `"${demand.title}" (Protocolo: ${demand.protocol || 'N/A'}) esta ${daysOverdue} dia(s) alem do prazo. Status: ${demand.status}. Tipo: ${demand.type}. Bairro: ${demand.neighborhood || 'N/A'}.`,
          type: 'DEMAND_OVERDUE',
          link: '/Demands',
          entity_id: demand.id,
        });
      }
    }

    if (notifications.length > 0) {
      await this.prisma.notification.createMany({ data: notifications });
    }

    await this.audit.log({
      action: 'job',
      entity: 'Job',
      entity_label: 'check_overdue_demands',
      module: 'jobs',
      severity: 'INFO',
      metadata: { overdueCount: overdueDemands.length, notificationsCreated: notifications.length },
    });

    return {
      processed: overdueDemands.length,
      notificationsCreated: notifications.length,
    };
  }

  async markOverdueMissions() {
    const now = new Date();
    now.setHours(0, 0, 0, 0);

    const missions = await this.prisma.mission.findMany({
      where: {
        deleted_at: null,
        status: { in: ['PENDING', 'IN_PROGRESS'] },
        deadline: { lt: now },
      },
    });

    let updated = 0;
    for (const m of missions) {
      await this.prisma.mission.update({
        where: { id: m.id },
        data: { status: 'OVERDUE' },
      });
      updated++;
    }

    await this.audit.log({
      action: 'job',
      entity: 'Job',
      entity_label: 'mark_overdue_missions',
      module: 'jobs',
      severity: 'INFO',
      metadata: { updated, totalChecked: missions.length },
    });

    return { updated, totalChecked: missions.length };
  }

  // ============ ADMIN ENDPOINTS ============

  getAllJobs() {
    return Array.from(this.jobs.values());
  }

  getJob(name: string) {
    return this.jobs.get(name);
  }

  async runJob(name: string, userId?: string) {
    const job = this.jobs.get(name);
    if (!job) throw new Error(`Job ${name} nao encontrado`);
    if (job.isRunning) throw new Error(`Job ${name} ja esta em execucao`);

    job.isRunning = true;
    job.lastRun = new Date();

    try {
      let result: any;
      switch (name) {
        case 'weekly_maintenance':
          result = await this.weeklyMaintenance();
          break;
        case 'check_overdue_demands':
          result = await this.checkOverdueDemands();
          break;
        case 'mark_overdue_missions':
          result = await this.markOverdueMissions();
          break;
        default:
          throw new Error(`Handler para job ${name} nao implementado`);
      }
      job.lastResult = JSON.stringify(result);
      return result;
    } catch (error) {
      job.lastResult = `ERROR: ${error.message}`;
      throw error;
    } finally {
      job.isRunning = false;
    }
  }

  toggleJob(name: string, enabled: boolean) {
    const job = this.jobs.get(name);
    if (!job) throw new Error(`Job ${name} nao encontrado`);

    job.enabled = enabled;
    const task = this.cronTasks.get(name);
    if (task) {
      if (enabled) {
        task.start();
      } else {
        task.stop();
      }
    }

    return job;
  }
}
