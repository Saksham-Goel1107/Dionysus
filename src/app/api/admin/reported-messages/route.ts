import { NextRequest, NextResponse } from 'next/server';
import { auth, currentUser } from '@clerk/nextjs/server';
import { db } from '@/server/db';

export const dynamic = 'force-dynamic';
export const revalidate = 60;

/**
 * Admin API endpoint for fetching reported messages with full details
 * Requires admin authentication
 */
export async function GET(req: NextRequest) {
  try {
    // Authentication check
    const { userId, sessionClaims } = await auth();
    if (!userId) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    // Admin verification
    const user = await currentUser();
    const email = user?.emailAddresses?.[0]?.emailAddress;

    if (
      email !== process.env.ADMIN_EMAIL ||
      userId !== process.env.ADMIN_USER_ID ||
      sessionClaims?.metadata?.role !== process.env.ADMIN_SECRET
    ) {
      return NextResponse.json(
        { success: false, error: 'Forbidden - Admin only' },
        { status: 403 },
      );
    }

    // Get query parameters for filtering
    const searchParams = req.nextUrl.searchParams;
    const status = searchParams.get('status') || 'all'; // 'all', 'pending', 'reviewed', 'resolved', 'dismissed'
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');

    // Build where clause
    const where: any = {};
    if (status !== 'all') {
      where.status = status;
    }

    // Fetch reported messages with full details
    const reports = await db.messageReport.findMany({
      where,
      include: {
        message: {
          include: {
            session: {
              include: {
                user: {
                  select: {
                    id: true,
                    firstName: true,
                    lastName: true,
                    emailAddress: true,
                  },
                },
              },
            },
          },
        },
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            emailAddress: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: limit,
      skip: offset,
    });

    // Get total count for pagination
    const totalCount = await db.messageReport.count({ where });

    // Transform the data for the frontend
    const transformedReports = reports.map((report) => ({
      id: report.id,
      reason: report.reason,
      description: report.description,
      status: report.status,
      reviewedBy: report.reviewedBy,
      reviewedAt: report.reviewedAt,
      resolution: report.resolution,
      createdAt: report.createdAt,
      updatedAt: report.updatedAt,
      // Message details
      message: {
        id: report.message.id,
        role: report.message.role,
        content: report.message.content,
        model: report.message.model,
        attachments: report.message.attachments,
        sources: report.message.sources,
        features: report.message.features,
        imageUrl: report.message.imageUrl,
        thinkingSteps: report.message.thinkingSteps,
        createdAt: report.message.createdAt,
      },
      // Reporter details
      reporter: {
        id: report.user.id,
        firstName: report.user.firstName,
        lastName: report.user.lastName,
        email: report.user.emailAddress,
      },
      // Message author details (from session)
      author: {
        id: report.message.session.user.id,
        firstName: report.message.session.user.firstName,
        lastName: report.message.session.user.lastName,
        email: report.message.session.user.emailAddress,
      },
      // Session details
      session: {
        id: report.message.session.id,
        title: report.message.session.title,
        createdAt: report.message.session.createdAt,
      },
    }));

    return NextResponse.json(
      {
        success: true,
        data: {
          reports: transformedReports,
          pagination: {
            total: totalCount,
            limit,
            offset,
            hasMore: offset + limit < totalCount,
          },
        },
        timestamp: new Date().toISOString(),
      },
      { status: 200 },
    );
  } catch (error) {
    console.error('Error fetching reported messages:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch reported messages',
        message: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString(),
      },
      { status: 500 },
    );
  }
}

/**
 * Admin API endpoint for updating report status and resolution
 * Requires admin authentication
 */
export async function PATCH(req: NextRequest) {
  try {
    // Authentication check
    const { userId, sessionClaims } = await auth();
    if (!userId) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    // Admin verification
    const user = await currentUser();
    const email = user?.emailAddresses?.[0]?.emailAddress;

    if (
      email !== process.env.ADMIN_EMAIL ||
      userId !== process.env.ADMIN_USER_ID ||
      sessionClaims?.metadata?.role !== process.env.ADMIN_SECRET
    ) {
      return NextResponse.json(
        { success: false, error: 'Forbidden - Admin only' },
        { status: 403 },
      );
    }

    const body = await req.json();
    const { reportId, status, resolution } = body;

    if (!reportId) {
      return NextResponse.json(
        { success: false, error: 'Missing reportId parameter' },
        { status: 400 },
      );
    }

    // Update the report
    const updatedReport = await db.messageReport.update({
      where: { id: reportId },
      data: {
        status: status || undefined,
        resolution: resolution || undefined,
        reviewedBy: userId,
        reviewedAt: new Date(),
      },
      include: {
        message: {
          include: {
            session: {
              include: {
                user: {
                  select: {
                    id: true,
                    firstName: true,
                    lastName: true,
                    emailAddress: true,
                  },
                },
              },
            },
          },
        },
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            emailAddress: true,
          },
        },
      },
    });

    return NextResponse.json(
      {
        success: true,
        data: updatedReport,
        timestamp: new Date().toISOString(),
      },
      { status: 200 },
    );
  } catch (error) {
    console.error('Error updating report:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to update report',
        message: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString(),
      },
      { status: 500 },
    );
  }
}
