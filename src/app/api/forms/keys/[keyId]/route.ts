import prisma from '@/lib/prisma';
import { auth } from '@clerk/nextjs/server';
import { NextRequest, NextResponse } from 'next/server';

export async function PATCH(request: NextRequest, { params }: { params: { keyId: string } }) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { keyId } = await params;
    const { name, isActive } = await request.json();

    // Find the API key and verify ownership through project
    const apiKey = await prisma.formApiKey.findFirst({
      where: {
        id: keyId,
        project: {
          userId,
        },
      },
      include: {
        project: true,
      },
    });

    if (!apiKey) {
      return NextResponse.json({ error: 'API key not found' }, { status: 404 });
    }

    const updatedKey = await prisma.formApiKey.update({
      where: { id: keyId },
      data: {
        ...(name && { name: name.trim() }),
        ...(isActive !== undefined && { isActive }),
      },
    });

    return NextResponse.json({
      apiKey: {
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
    console.error('Error updating API key:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE({ params }: { params: { keyId: string } }) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { keyId } = await params;

    // Find the API key and verify ownership through project
    const apiKey = await prisma.formApiKey.findFirst({
      where: {
        id: keyId,
        project: {
          userId,
        },
      },
    });

    if (!apiKey) {
      return NextResponse.json({ error: 'API key not found' }, { status: 404 });
    }

    await prisma.formApiKey.delete({
      where: { id: keyId },
    });

    return NextResponse.json({ message: 'API key deleted successfully' });
  } catch (error) {
    console.error('Error deleting API key:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
