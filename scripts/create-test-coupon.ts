import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  // Delete existing test coupon if present
  await prisma.coupon.deleteMany({ where: { code: 'TEST-ULTRA' } });

  const coupon = await prisma.coupon.create({
    data: {
      code: 'TEST-ULTRA',
      plan: 'ULTRA',
      maxUses: 100,
      durationDays: 30,
      createdBy: 'system',
    },
  });

  console.log('Test coupon created:');
  console.log(`  Code: ${coupon.code}`);
  console.log(`  Plan: ${coupon.plan}`);
  console.log(`  Max Uses: ${coupon.maxUses}`);
  console.log(`  Duration: ${coupon.durationDays} days`);
  console.log(`  Active: ${coupon.isActive}`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
