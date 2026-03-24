import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/config';
import { uploadResumePdf } from '@/lib/cloudinary';
import { prisma } from '@/lib/db/prisma';

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const formData = await req.formData();
    const file = formData.get('file') as File | null;
    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    const fileName = file.name;
    const buffer = Buffer.from(await file.arrayBuffer());

    // Upload to Cloudinary
    const pdfUrl = await uploadResumePdf(buffer, session.user.id);

    // Save pdfUrl and fileName to the user's resume record
    const resume = await prisma.resume.findFirst({
      where: { userId: session.user.id },
      orderBy: [{ isFinalized: 'desc' }, { updatedAt: 'desc' }],
    });

    if (resume) {
      const content = resume.content as any;
      await prisma.resume.update({
        where: { id: resume.id },
        data: {
          pdfUrl: pdfUrl || null,
          content: { ...content, uploadedFileName: fileName },
        },
      });
    }

    return NextResponse.json({ pdfUrl, fileName });
  } catch (error) {
    console.error('[Resume Upload PDF]', error);
    return NextResponse.json({ error: 'Upload failed' }, { status: 500 });
  }
}
