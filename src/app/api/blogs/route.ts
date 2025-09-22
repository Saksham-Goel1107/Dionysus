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

    // First get blogs with basic data and comment counts
    const blogs = await prisma.blog.findMany({
      where,
      include: {
        tags: true,
        _count: {
          select: {
            comments: true,
          },
        },
      },
      orderBy,
      skip,
      take: limit,
    });

    const total = await prisma.blog.count({ where });

    // Then calculate like/dislike counts for each blog
    const blogsWithCounts = await Promise.all(
      blogs.map(async (blog) => {
        const [likeCount, dislikeCount] = await Promise.all([
          prisma.blogLike.count({
            where: {
              blogId: blog.id,
              isLike: true,
            },
          }),
          prisma.blogLike.count({
            where: {
              blogId: blog.id,
              isLike: false,
            },
          }),
        ]);

        return {
          ...blog,
          _count: {
            likes: likeCount,
            dislikes: dislikeCount,
            comments: blog._count.comments,
          },
        };
      }),
    );

    const totalPages = Math.ceil(total / limit);

    return NextResponse.json({
      blogs: blogsWithCounts,
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
