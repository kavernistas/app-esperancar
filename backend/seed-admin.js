const bcrypt = require('bcrypt');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const adminEmail = process.env.ADMIN_EMAIL;
  const adminPassword = process.env.ADMIN_PASSWORD;
  if (!adminEmail || !adminPassword) {
    console.error('Defina ADMIN_EMAIL e ADMIN_PASSWORD nas variaveis de ambiente antes de executar o seed.');
    process.exit(1);
  }
  const hash = await bcrypt.hash(adminPassword, 12);
  const user = await prisma.user.create({
    data: {
      email: adminEmail,
      password_hash: hash,
      full_name: 'Alan Ferreira',
      role: 'ADMIN',
      status: 'ACTIVE',
    }
  });
  console.log('Created:', user.email, user.role);
}

main().then(() => prisma.$disconnect()).catch(e => { console.error(e); process.exit(1); });