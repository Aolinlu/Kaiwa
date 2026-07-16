import 'dotenv/config'
import { PrismaClient } from '../src/generated/prisma/client'
import { PrismaBetterSqlite3 } from '@prisma/adapter-better-sqlite3'
import bcrypt from 'bcryptjs'

const adapter = new PrismaBetterSqlite3({
  url: process.env.DATABASE_URL!,
})
const prisma = new PrismaClient({ adapter })

async function main() {
  const hashedPassword = await bcrypt.hash('admin123', 10)

  const admin = await prisma.user.upsert({
    where: { email: 'admin@kaiwa.dev' },
    update: {},
    create: {
      email: 'admin@kaiwa.dev',
      password: hashedPassword,
      name: 'Admin',
      role: 'admin',
    },
  })

  console.log('Seeded admin user:', admin.email)
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
