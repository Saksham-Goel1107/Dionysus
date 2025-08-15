import { GoogleGenerativeAI } from '@google/generative-ai';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const imageFile = formData.get('image') as File;
    const question = formData.get('question') as string;

    if (!imageFile) {
      return NextResponse.json({ error: 'No image provided' }, { status: 400 });
    }

    if (!question || !question.trim()) {
      return NextResponse.json({ error: 'No question provided' }, { status: 400 });
    }

    const maxSize = 10 * 1024 * 1024;
    if (imageFile.size > maxSize) {
      return NextResponse.json({ error: 'File size exceeds 10MB limit' }, { status: 400 });
    }

    const validTypes = [
      'image/jpeg',
      'image/jpg',
      'image/png',
      'image/gif',
      'image/webp',
      'image/bmp',
    ];
    const validExts = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.bmp'];
    const fileType = imageFile.type;
    const fileName = (imageFile.name || '').toLowerCase();
    const hasValidExt = validExts.some((ext) => fileName.endsWith(ext));

    const forbiddenExts = [
      '.exe',
      '.bat',
      '.sh',
      '.js',
      '.ts',
      '.py',
      '.php',
      '.pl',
      '.rb',
      '.jar',
      '.com',
      '.msi',
      '.cmd',
      '.scr',
      '.pif',
      '.cpl',
      '.msc',
      '.gadget',
    ];
    const hasDoubleExt = fileName.split('.').length > 2;
    const hasForbiddenExt = forbiddenExts.some((ext) => fileName.endsWith(ext));
    if (hasDoubleExt || hasForbiddenExt) {
      return NextResponse.json(
        { error: 'File name is not allowed for security reasons.' },
        { status: 400 },
      );
    }

    if (!(validTypes.includes(fileType) || hasValidExt)) {
      return NextResponse.json(
        {
          error: 'Invalid file type. Supported formats: JPG, PNG, GIF, WebP, BMP',
        },
        { status: 400 },
      );
    }

    const geminiApiKey = process.env.GEMINI_API_KEY;
    if (!geminiApiKey) {
      return NextResponse.json({ error: 'Gemini API key not configured' }, { status: 500 });
    }

    const genAI = new GoogleGenerativeAI(geminiApiKey);
    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

    const imageBuffer = await imageFile.arrayBuffer();
    const imageBase64 = Buffer.from(imageBuffer).toString('base64');

    let mimeType = imageFile.type;
    if (!mimeType || mimeType === 'application/octet-stream') {
      if (fileName.endsWith('.jpg') || fileName.endsWith('.jpeg')) mimeType = 'image/jpeg';
      else if (fileName.endsWith('.png')) mimeType = 'image/png';
      else if (fileName.endsWith('.gif')) mimeType = 'image/gif';
      else if (fileName.endsWith('.webp')) mimeType = 'image/webp';
      else if (fileName.endsWith('.bmp')) mimeType = 'image/bmp';
      else mimeType = 'image/jpeg';
    }

    const imagePart = {
      inlineData: {
        data: imageBase64,
        mimeType: mimeType,
      },
    };

    const result = await model.generateContent([question.trim(), imagePart]);
    const response = await result.response;
    const analysisText = response.text();

    if (!analysisText) {
      return NextResponse.json({ error: 'No analysis generated' }, { status: 500 });
    }

    return NextResponse.json({
      analysis: analysisText,
    });
  } catch (error) {
    console.error('Image analysis error:', error);

    if (error instanceof Error) {
      if (error.message.includes('API key')) {
        return NextResponse.json({ error: 'Invalid API key configuration' }, { status: 500 });
      }
      if (error.message.includes('quota')) {
        return NextResponse.json(
          { error: 'API quota exceeded. Please try again later.' },
          { status: 429 },
        );
      }
      if (error.message.includes('safety')) {
        return NextResponse.json(
          { error: 'Image content was blocked for safety reasons.' },
          { status: 400 },
        );
      }
    }

    return NextResponse.json(
      {
        error: 'Internal server error during image analysis',
      },
      { status: 500 },
    );
  }
}
