import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  // Create demo user
  const hashedPassword = await bcrypt.hash('demo123456', 12);

  const demoUser = await prisma.user.upsert({
    where: { email: 'demo@nxted.ai' },
    update: {},
    create: {
      name: 'Alex Johnson',
      email: 'demo@nxted.ai',
      hashedPassword,
      plan: 'PRO',
      aiCreditsUsed: 127,
      aiCreditsLimit: 500,
    },
  });

  // Create OFORO internal user
  const oforoUser = await prisma.user.upsert({
    where: { email: 'admin@oforo.ai' },
    update: {},
    create: {
      name: 'OFORO Admin',
      email: 'admin@oforo.ai',
      hashedPassword,
      plan: 'ULTRA',
      isOforoInternal: true,
      aiCreditsUsed: 0,
      aiCreditsLimit: -1, // unlimited
    },
  });

  // Create Career Twin for demo user
  await prisma.careerTwin.upsert({
    where: { userId: demoUser.id },
    update: {},
    create: {
      userId: demoUser.id,
      skillSnapshot: {
        Python: 88,
        'Machine Learning': 75,
        'Deep Learning': 62,
        MLOps: 45,
        'System Design': 55,
        'Data Engineering': 70,
      },
      interests: ['AI', 'Machine Learning', 'NLP', 'Computer Vision'],
      targetRoles: [
        { title: 'AI Engineer', probability: 0.68 },
        { title: 'ML Engineer', probability: 0.72 },
        { title: 'Research Engineer', probability: 0.45 },
      ],
      marketReadiness: 72,
      hireProb: 0.68,
    },
  });

  // Create demo assessment
  await prisma.assessment.create({
    data: {
      userId: demoUser.id,
      targetRole: 'AI Engineer',
      status: 'COMPLETED',
      questions: [],
      answers: {},
      skillScores: {
        Python: 88,
        'Machine Learning': 75,
        'Deep Learning': 62,
        MLOps: 45,
        'System Design': 55,
      },
      aiAnalysis: {
        overallScore: 68,
        gaps: [
          { skill: 'MLOps', current: 45, required: 75, priority: 'high' },
          { skill: 'System Design', current: 55, required: 80, priority: 'high' },
        ],
        recommendations: [
          'Focus on MLOps tools',
          'Practice system design problems',
          'Build end-to-end ML projects',
        ],
        timelineEstimate: '3-4 months',
      },
    },
  });

  // Create demo career plan
  await prisma.careerPlan.create({
    data: {
      userId: demoUser.id,
      targetRole: 'AI Engineer',
      timeline: { totalWeeks: 12, startDate: '2026-02-01' },
      milestones: [
        { id: '1', title: 'Foundation: Python & ML Basics', status: 'completed', duration: '2 weeks' },
        { id: '2', title: 'Deep Learning & Neural Networks', status: 'in-progress', duration: '3 weeks' },
        { id: '3', title: 'MLOps & Production Systems', status: 'upcoming', duration: '3 weeks' },
        { id: '4', title: 'System Design for ML', status: 'upcoming', duration: '2 weeks' },
        { id: '5', title: 'Portfolio & Job Preparation', status: 'upcoming', duration: '2 weeks' },
      ],
      projects: [],
    },
  });

  // Create demo resume
  await prisma.resume.create({
    data: {
      userId: demoUser.id,
      title: 'AI Engineer Resume',
      template: 'modern',
      content: {
        contact: { name: 'Alex Johnson', email: 'alex.johnson@email.com' },
        summary: 'Results-driven AI Engineer with 3+ years of experience.',
        experience: [],
        education: [],
        skills: ['Python', 'PyTorch', 'TensorFlow'],
      },
      atsScore: 85,
    },
  });

  // Create coach settings
  await prisma.coachSettings.upsert({
    where: { userId: demoUser.id },
    update: {},
    create: {
      userId: demoUser.id,
      name: 'Nova',
      personality: 'friendly',
      enabled: true,
    },
  });

  console.log('✅ Seed data created successfully');
  console.log(`   Demo user: demo@nxted.ai / demo123456`);
  console.log(`   OFORO admin: admin@oforo.ai / demo123456`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
