const bcrypt = require('bcrypt');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const hash = await bcrypt.hash('Admin@2026', 12);
  const user = await prisma.user.create({
    data: {
      email: 'dralanrobertoferreira@gmail.com',
      password_hash: hash,
      full_name: 'Alan Ferreira',
      role: 'ADMIN',
      status: 'ACTIVE',
    }
  });
  console.log('Created:', user.email, user.role);
}

main().then(() => prisma.$disconnect()).catch(e => { console.error(e); process.exit(1); });
