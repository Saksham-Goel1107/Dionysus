import prisma from '@/lib/prisma';
import { NextRequest, NextResponse } from 'next/server';

// GET - Fetch published blogs for public view
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const tag = searchParams.get('tag');
    const search = searchParams.get('search');
    const sort = searchParams.get('sort') || 'newest';

    const skip = (page - 1) * limit;

    const where: any = {
      isPublished: true,
    };

    if (tag) {
      where.tags = {
        some: {
          name: {
            equals: tag,
            mode: 'insensitive',
          },
        },
      };
    }

    if (search) {
      where.OR = [
        {
          title: {
            contains: search,
            mode: 'insensitive',
          },
        },
        {
          excerpt: {
            contains: search,
            mode: 'insensitive',
          },
        },
      ];
    }

    // Handle sorting
    let orderBy: any = { publishedAt: 'desc' }; // default
    switch (sort) {
      case 'oldest':
        orderBy = { publishedAt: 'asc' };
        break;
      case 'title_asc':
        orderBy = { title: 'asc' };
        break;
      case 'title_desc':
        orderBy = { title: 'desc' };
        break;
      case 'newest':
      default:
        orderBy = { publishedAt: 'desc' };
        break;
    }

    const [blogs, total] = await Promise.all([
      prisma.blog.findMany({
        where,
        include: {
          tags: true,
        },
        orderBy,
        skip,
        take: limit,
      }),
      prisma.blog.count({ where }),
    ]);

    const totalPages = Math.ceil(total / limit);

    return NextResponse.json({
      blogs,
      pagination: {
        page,
        limit,
        total,
        totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1,
      },
    });
  } catch (error) {
    console.error('Error fetching blogs:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
