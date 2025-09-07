import { generateApiKey, getKeyId, hashApiKey } from '@/lib/api-keys';
import prisma from '@/lib/prisma';
import { auth } from '@clerk/nextjs/server';
import { NextRequest, NextResponse } from 'next/server';

// POST - Regenerate API key
export async function POST(request: NextRequest, { params }: { params: { keyId: string } }) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // `params` may be a promise in Next.js route handlers; await before using properties
    const { keyId } = await params;

    // Find the API key and verify ownership
    const existingKey = await prisma.formApiKey.findFirst({
      where: {
        keyId,
        project: {
          userId,
        },
      },
      include: {
        project: true,
      },
    });

    if (!existingKey) {
      return NextResponse.json({ error: 'API key not found' }, { status: 404 });
    }

    // Generate new API key
    const newApiKey = generateApiKey();
    const newKeyId = getKeyId(newApiKey);
    const newKeyHash = await hashApiKey(newApiKey);

    // Update the existing key record
    const updatedKey = await prisma.formApiKey.update({
      where: { id: existingKey.id },
      data: {
        keyId: newKeyId,
        keyHash: newKeyHash,
        lastUsedAt: null,
        requestCount: 0,
      },
    });

    return NextResponse.json({
      apiKey: newApiKey,
      keyRecord: {
        id: updatedKey.id,
        keyId: updatedKey.keyId,
        name: updatedKey.name,
        isActive: updatedKey.isActive,
        lastUsedAt: updatedKey.lastUsedAt,
        requestCount: updatedKey.requestCount,
        createdAt: updatedKey.createdAt,
      },
    });
  } catch (error) {
    console.error('Error regenerating API key:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
