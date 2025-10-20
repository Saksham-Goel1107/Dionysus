import prisma from '@/lib/prisma';
import { auth, currentUser } from '@clerk/nextjs/server';
import { NextRequest, NextResponse } from 'next/server';

// GET - Fetch single blog for admin
export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { userId, sessionClaims } = await auth();

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    if (!sessionClaims?.metadata?.role) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const user = await currentUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (
      user.emailAddresses[0]?.emailAddress !== process.env.ADMIN_EMAIL ||
      sessionClaims?.metadata?.role !== process.env.ADMIN_SECRET ||
      userId !== process.env.ADMIN_USER_ID
    ) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const awaitedParams = await params;
    const blogId = awaitedParams.id;

    const blog = await prisma.blog.findUnique({
      where: { id: blogId },
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

// PATCH - Update blog
export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { userId } = await auth();
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const user = await currentUser();
    const email = user?.emailAddresses?.[0]?.emailAddress;
    if (email !== process.env.ADMIN_EMAIL || userId !== process.env.ADMIN_USER_ID) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const {
      action,
      title,
      slug,
      content,
      excerpt,
      coverImage,
      isPublished,
      isSponsored,
      isCommentsEnabled,
      tags,
      publishedAt,
    } = await request.json();
    const awaitedParams = await params;
    const blogId = awaitedParams.id;

    const blog = await prisma.blog.findUnique({
      where: { id: blogId },
      include: { tags: true },
    });

    if (!blog) {
      return NextResponse.json({ error: 'Blog not found' }, { status: 404 });
    }

    if (action === 'toggle-publish') {
      const updatedBlog = await prisma.blog.update({
        where: { id: blogId },
        data: {
          isPublished: !blog.isPublished,
          publishedAt: !blog.isPublished ? new Date() : blog.publishedAt,
        },
        include: { tags: true },
      });

      return NextResponse.json({
        blog: updatedBlog,
        message: `Blog ${updatedBlog.isPublished ? 'published' : 'unpublished'} successfully`,
      });
    }

    if (action === 'update') {
      if (!title?.trim() || !content?.trim()) {
        return NextResponse.json({ error: 'Title and content are required' }, { status: 400 });
      }

      // Check if slug already exists (excluding current blog)
      if (slug !== blog.slug) {
        const existingBlog = await prisma.blog.findUnique({
          where: { slug },
        });

        if (existingBlog) {
          return NextResponse.json(
            { error: 'A blog with this slug already exists' },
            { status: 400 },
          );
        }
      }

      // Handle tags
      const tagConnections = [];
      if (tags && tags.length > 0) {
        for (const tagName of tags) {
          const tag = await prisma.blogTag.upsert({
            where: { name: tagName },
            update: {},
            create: { name: tagName },
          });
          tagConnections.push({ id: tag.id });
        }
      }

      // Disconnect all existing tags first
      await prisma.blog.update({
        where: { id: blogId },
        data: {
          tags: {
            set: [],
          },
        },
      });

      // Use provided publishedAt if present, otherwise preserve existing logic
      const publishedAtDate = publishedAt
        ? new Date(publishedAt)
        : isPublished && !blog.publishedAt
          ? new Date()
          : blog.publishedAt;

      const updatedBlog = await prisma.blog.update({
        where: { id: blogId },
        data: {
          title,
          slug,
          content,
          excerpt: excerpt || null,
          coverImage: coverImage || null,
          isPublished,
          isSponsored: isSponsored !== undefined ? isSponsored : blog.isSponsored,
          isCommentsEnabled:
            isCommentsEnabled !== undefined ? isCommentsEnabled : blog.isCommentsEnabled,
          publishedAt: publishedAtDate,
          tags: {
            connect: tagConnections,
          },
        },
        include: {
          tags: true,
        },
      });

      return NextResponse.json({
        blog: updatedBlog,
        message: 'Blog updated successfully',
      });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error) {
    console.error('Error updating blog:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// DELETE - Delete blog
export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user is admin
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user || user.emailAddress !== process.env.ADMIN_EMAIL) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    const awaitedParams = await params;
    const blogId = awaitedParams.id;

    const blog = await prisma.blog.findUnique({
      where: { id: blogId },
    });

    if (!blog) {
      return NextResponse.json({ error: 'Blog not found' }, { status: 404 });
    }

    await prisma.blog.delete({
      where: { id: blogId },
    });

    return NextResponse.json({ message: 'Blog deleted successfully' });
  } catch (error) {
    console.error('Error deleting blog:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
