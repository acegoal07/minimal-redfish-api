import { PrismaClient } from '@prisma/client';
import { PrismaMariaDb } from '@prisma/adapter-mariadb';

const globalForPrisma = globalThis as unknown as {
   prisma: PrismaClient | undefined;
};

const adapter = new PrismaMariaDb({
   host: process.env.DB_HOST!,
   user: process.env.DB_USERNAME!,
   password: process.env.DB_PASSWORD!,
   database: process.env.DB_NAME!,
   connectionLimit: 10
});

export const prisma =
   globalForPrisma.prisma ??
   new PrismaClient({
      adapter
   });

if (process.env.NODE_ENV !== 'production') {
   globalForPrisma.prisma = prisma;
}
