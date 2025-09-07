import { generateApiKey, getKeyId, hashApiKey } from '@/lib/api-keys';
import prisma from '@/lib/prisma';
import { auth } from '@clerk/nextjs/server';
import { NextRequest, NextResponse } from 'next/server';

// POST - Create new API key for project
export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id: projectId } = await params;
    const { name } = await request.json();

    if (!name || name.length < 3) {
      return NextResponse.json(
        { error: 'API key name must be at least 3 characters' },
        { status: 400 },
      );
    }

    // Verify user owns the project
    const project = await prisma.formProject.findFirst({
      where: {
        id: projectId,
        userId,
      },
    });

    if (!project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }

    // Check if user has too many API keys (limit to 10 per project)
    const existingKeys = await prisma.formApiKey.count({
      where: { projectId },
    });

    if (existingKeys >= 10) {
      return NextResponse.json({ error: 'Maximum 10 API keys per project' }, { status: 400 });
    }

    // Generate new API key
    const apiKey = generateApiKey();
    const keyId = getKeyId(apiKey);
    const keyHash = await hashApiKey(apiKey);

    const apiKeyRecord = await prisma.formApiKey.create({
      data: {
        keyId,
        keyHash,
        name: name.trim(),
        projectId,
      },
    });

    return NextResponse.json({
      apiKeyRecord: {
        id: apiKeyRecord.id,
        keyId: apiKeyRecord.keyId,
        name: apiKeyRecord.name,
        isActive: apiKeyRecord.isActive,
        lastUsedAt: apiKeyRecord.lastUsedAt,
        requestCount: apiKeyRecord.requestCount,
        createdAt: apiKeyRecord.createdAt,
      },
      apiKey, // Return the raw API key only once
    });
  } catch (error) {
    console.error('Error creating API key:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
