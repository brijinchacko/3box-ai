import { NextRequest, NextResponse } from 'next/server';
import { sendJobApplicationEmail } from '@/lib/email';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { to, candidateName, candidateEmail, jobTitle, company } = body;

    // Validate required fields
    if (!to || !candidateName || !candidateEmail || !jobTitle || !company) {
      return NextResponse.json(
        { error: 'Missing required fields: to, candidateName, candidateEmail, jobTitle, company' },
        { status: 400 }
      );
    }

    // Sample cover letter with placeholders replaced
    const coverLetter = `I am writing to express my strong interest in the ${jobTitle} position at ${company}. With a proven track record in software development and a passion for building innovative solutions, I believe I would be a valuable addition to your team.

Throughout my career, I have developed expertise in full-stack development, cloud architecture, and agile methodologies. I have successfully led cross-functional teams to deliver high-impact projects on time and within budget, consistently exceeding stakeholder expectations.

Key highlights of my experience include:
\u2022 Architected and deployed scalable microservices serving 1M+ daily active users
\u2022 Reduced system latency by 40% through strategic infrastructure optimization
\u2022 Mentored junior developers and established coding best practices across teams
\u2022 Implemented CI/CD pipelines that reduced deployment time by 60%

I am particularly drawn to ${company}'s commitment to innovation and would welcome the opportunity to contribute to your mission. I am confident that my technical skills and collaborative approach would make me an excellent fit for this role.

I would welcome the opportunity to discuss how my background and skills align with your team's needs. Thank you for considering my application.

Best regards,
${candidateName}`;

    const result = await sendJobApplicationEmail({
      to,
      candidateName,
      candidateEmail,
      jobTitle,
      company,
      coverLetter,
    });

    if (result.error) {
      return NextResponse.json(
        { error: result.error },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      emailId: result.id,
      message: `Test application email sent to ${to}`,
    });
  } catch (err: any) {
    console.error('[Test Send Application] Error:', err.message);
    return NextResponse.json(
      { error: err.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
