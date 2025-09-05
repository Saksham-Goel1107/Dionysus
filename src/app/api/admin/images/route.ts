import { v2 as cloudinary } from 'cloudinary';
import { NextRequest, NextResponse } from 'next/server';

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// GET - Fetch uploaded images from Cloudinary
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');

    // Fetch images from Cloudinary
    const result = await cloudinary.search
      .expression('folder:uploads OR folder:blog-images OR resource_type:image')
      .sort_by('created_at', 'desc')
      .max_results(limit)
      .next_cursor(page > 1 ? searchParams.get('cursor') || undefined : undefined)
      .execute();

    const images = result.resources.map((resource: any) => ({
      public_id: resource.public_id,
      url: resource.secure_url,
      filename: resource.original_filename || resource.public_id,
      size: resource.bytes,
      width: resource.width,
      height: resource.height,
      created_at: resource.created_at,
      format: resource.format,
    }));

    return NextResponse.json({
      images,
      next_cursor: result.next_cursor,
      total_count: result.total_count,
    });
  } catch (error: any) {
    console.error('Failed to fetch images:', error);
    return NextResponse.json({ error: 'Failed to fetch images' }, { status: 500 });
  }
}
