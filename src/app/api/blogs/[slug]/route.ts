import prisma from '@/lib/prisma';
import { NextRequest, NextResponse } from 'next/server';

// GET - Fetch single blog by slug for public view
export async function GET(request: NextRequest, { params }: { params: { slug: string } }) {
  try {
    const awaitedParams = await params;
    const slug = awaitedParams.slug;

    const blog = await prisma.blog.findUnique({
      where: {
        slug,
        isPublished: true,
      },
      include: {
        tags: true,
      },
    });

    if (!blog) {
      return NextResponse.json({ error: 'Blog not found' }, { status: 404 });
    }

    return NextResponse.json({ blog });
  } catch (error) {
    console.error('Error fetching blog:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
