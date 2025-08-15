import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const model = formData.get('model') as string;
    const responseFormat = formData.get('response_format') as string;

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    const maxSize = 25 * 1024 * 1024;
    if (file.size > maxSize) {
      return NextResponse.json({ error: 'File size exceeds 25MB limit' }, { status: 400 });
    }

    const validTypes = [
      'audio/mp3',
      'audio/mpeg',
      'audio/wav',
      'audio/m4a',
      'audio/aac',
      'audio/ogg',
      'audio/webm',
      'audio/flac',
    ];
    const validExts = ['.mp3', '.mpeg', '.wav', '.m4a', '.aac', '.ogg', '.webm', '.flac'];
    const fileType = file.type;
    const fileName = (file.name || '').toLowerCase();
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
          error: 'Invalid file type. Supported formats: MP3, WAV, M4A, AAC, OGG, WebM, FLAC',
        },
        { status: 400 },
      );
    }

    const groqApiKey = process.env.GROQ_API_KEY;
    if (!groqApiKey) {
      return NextResponse.json({ error: 'Groq API key not configured' }, { status: 500 });
    }

    const groqFormData = new FormData();
    groqFormData.append('file', file);
    groqFormData.append('model', model || 'whisper-large-v3-turbo');
    groqFormData.append('response_format', responseFormat || 'json');

    const groqResponse = await fetch('https://api.groq.com/openai/v1/audio/transcriptions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${groqApiKey}`,
      },
      body: groqFormData,
    });

    if (!groqResponse.ok) {
      const errorText = await groqResponse.text();
      console.error('Groq API error:', errorText);
      return NextResponse.json(
        {
          error: `Transcription failed: ${groqResponse.status} ${groqResponse.statusText}`,
        },
        { status: groqResponse.status },
      );
    }

    const transcriptionData = await groqResponse.json();

    return NextResponse.json({
      text: transcriptionData.text,
      model: transcriptionData.model || model,
      language: transcriptionData.language,
      duration: transcriptionData.duration,
    });
  } catch (error) {
    console.error('Audio transcription error:', error);
    return NextResponse.json(
      {
        error: 'Internal server error during transcription',
      },
      { status: 500 },
    );
  }
}
