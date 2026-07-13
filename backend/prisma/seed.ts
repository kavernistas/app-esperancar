// Prisma Seed — Dados iniciais do sistema
// Executar: npm run prisma:seed

import { PrismaClient, Role } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database...');

  // System configs
  await prisma.systemConfig.upsert({
    where: { key: 'app.name' },
    update: {},
    create: {
      key: 'app.name',
      value: { value: 'Plataforma Politica Esperancar' },
      description: 'Nome da aplicacao',
    },
  });

  await prisma.systemConfig.upsert({
    where: { key: 'app.version' },
    update: {},
    create: {
      key: 'app.version',
      value: { value: '1.0.0' },
      description: 'Versao da aplicacao',
    },
  });

  await prisma.systemConfig.upsert({
    where: { key: 'gamification.levels' },
    update: {},
    create: {
      key: 'gamification.levels',
      value: {
        levels: [
          { name: 'semente', label: 'Semente', min: 0, max: 99 },
          { name: 'mobilizador', label: 'Mobilizador', min: 100, max: 299 },
          { name: 'lideranca_local', label: 'Lideranca Local', min: 300, max: 699 },
          { name: 'coordenador_territorial', label: 'Coordenador Territorial', min: 700, max: 1499 },
          { name: 'referencia_esperancar', label: 'Referencia Esperancar', min: 1500, max: null },
        ],
      },
      description: 'Niveis de gamificacao',
    },
  });

  await prisma.systemConfig.upsert({
    where: { key: 'gamification.points' },
    update: {},
    create: {
      key: 'gamification.points',
      value: {
        rules: {
          register_supporter: 10,
          meeting_attendance: 15,
          demand_resolved: 20,
          neighborhood_report: 25,
          mission_completed: 30,
          new_leader: 50,
          leader_converted: 60,
          visual_carro: 5,
          visual_residencia: 5,
          weekly_goal_bonus: 100,
        },
      },
      description: 'Regras de pontuacao',
    },
  });

  // Admin user — credenciais via variaveis de ambiente
  const adminEmail = process.env.ADMIN_EMAIL;
  const adminPassword = process.env.ADMIN_PASSWORD;
  if (!adminEmail || !adminPassword) {
    console.error('Defina ADMIN_EMAIL e ADMIN_PASSWORD nas variaveis de ambiente antes de executar o seed.');
    process.exit(1);
  }
  const passwordHash = await bcrypt.hash(adminPassword, 12);
  
  await prisma.user.upsert({
    where: { email: adminEmail },
    update: {},
    create: {
      email: adminEmail,
      password_hash: passwordHash,
      full_name: 'Administrador',
      role: Role.ADMIN,
      status: 'ACTIVE',
      lgpd_consent: true,
      notif_email: true,
      sofia_enabled: true,
    },
  });

  console.log('Seed completed successfully!');
  console.log('Admin user created from environment variables.');
}

main()
  .catch((e) => {
    console.error('Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });