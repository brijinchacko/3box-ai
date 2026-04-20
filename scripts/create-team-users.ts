/**
 * Create internal team user accounts.
 * Run: npx tsx scripts/create-team-users.ts
 */
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

interface TeamMember {
  name: string;
  email: string;
  password: string;
  isAdmin: boolean;
  role: 'Head' | 'Team';
}

const team: TeamMember[] = [
  { name: 'Aparna Shaji',   email: 'aparna.shaji@wartens.com',   password: '3BoxHead@2026!',   isAdmin: true,  role: 'Head' },
  { name: 'Arjun Kumar',    email: 'arjun.kumar@wartens.com',    password: '3BoxTeamAK@2026!', isAdmin: false, role: 'Team' },
  { name: 'Rohith Krishna', email: 'rohith.krishna@wartens.com', password: '3BoxTeamRK@2026!', isAdmin: false, role: 'Team' },
  { name: 'Ananth',         email: 'ananth@wartens.com',         password: '3BoxTeamAN@2026!', isAdmin: false, role: 'Team' },
];

async function main() {
  console.log('Creating team users...\n');

  for (const member of team) {
    const email = member.email.toLowerCase();
    const hashedPassword = await bcrypt.hash(member.password, 12);

    const existing = await prisma.user.findUnique({ where: { email } });

    if (existing) {
      // Update password + flags if already exists
      await prisma.user.update({
        where: { email },
        data: {
          name: member.name,
          hashedPassword,
          plan: 'MAX',
          isOforoInternal: member.isAdmin,
          onboardingDone: true,
        },
      });
      console.log(`  \u2713 UPDATED  ${member.name.padEnd(18)} ${email.padEnd(32)} [${member.role}${member.isAdmin ? ', ADMIN' : ''}]`);
    } else {
      // Create new user
      await prisma.user.create({
        data: {
          email,
          name: member.name,
          hashedPassword,
          plan: 'MAX',
          isOforoInternal: member.isAdmin,
          onboardingDone: true,
          emailVerified: new Date(),
        },
      });
      console.log(`  \u2713 CREATED  ${member.name.padEnd(18)} ${email.padEnd(32)} [${member.role}${member.isAdmin ? ', ADMIN' : ''}]`);
    }
  }

  console.log('\nCredentials:');
  console.log('\u2500'.repeat(70));
  team.forEach(m => {
    console.log(`  ${m.email.padEnd(32)}  ${m.password}${m.isAdmin ? '  [ADMIN]' : ''}`);
  });
  console.log('\u2500'.repeat(70));
  console.log('\nAll team users created with MAX plan and onboarding marked complete.');
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(async () => { await prisma.$disconnect(); });
