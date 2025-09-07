import { generateApiKey, getKeyId, hashApiKey } from '@/lib/api-keys';
import prisma from '@/lib/prisma';
import { auth } from '@clerk/nextjs/server';
import { NextRequest, NextResponse } from 'next/server';

// GET - List user's form projects
export async function GET() {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const projects = await prisma.formProject.findMany({
      where: { userId },
      include: {
        apiKeys: {
          select: {
            id: true,
            keyId: true,
            name: true,
            isActive: true,
            lastUsedAt: true,
            requestCount: true,
            createdAt: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({ projects });
  } catch (error) {
    console.error('Error fetching form projects:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST - Create new form project
export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { name, description, domain } = await request.json();

    if (!name || name.length < 3) {
      return NextResponse.json(
        { error: 'Project name must be at least 3 characters' },
        { status: 400 },
      );
    }

    // Create project
    const project = await prisma.formProject.create({
      data: {
        name: name.trim(),
        description: description?.trim() || null,
        domain: domain?.trim() || null,
        userId,
      },
    });

    // Generate initial API key
    const apiKey = generateApiKey();
    const keyId = getKeyId(apiKey);
    const keyHash = await hashApiKey(apiKey);

    const apiKeyRecord = await prisma.formApiKey.create({
      data: {
        keyId,
        keyHash,
        name: 'Default Key',
        projectId: project.id,
      },
    });

    return NextResponse.json({
      project: {
        ...project,
        apiKeys: [
          {
            id: apiKeyRecord.id,
            keyId: apiKeyRecord.keyId,
            name: apiKeyRecord.name,
            isActive: apiKeyRecord.isActive,
            lastUsedAt: apiKeyRecord.lastUsedAt,
            requestCount: apiKeyRecord.requestCount,
            createdAt: apiKeyRecord.createdAt,
          },
        ],
      },
      apiKey, // Return the raw API key only once
    });
  } catch (error) {
    console.error('Error creating form project:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
