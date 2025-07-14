import { NextResponse } from 'next/server';
import { spawn } from 'child_process';
import path from 'path';
import fs from 'fs/promises';
import fsSync from 'fs';
import { auth } from '@clerk/nextjs/server';

function waitForFile(filePath: string, timeout = 8000): Promise<void> {
  return new Promise((resolve, reject) => {
    const start = Date.now();
    const interval = setInterval(() => {
      if (fsSync.existsSync(filePath)) {
        clearInterval(interval);
        resolve();
      } else if (Date.now() - start > timeout) {
        clearInterval(interval);
        reject(new Error('File generation timed out'));
      }
    }, 300);
  });
}

export async function POST(req: Request) {
  const { has } = await auth();
  const hasProPlan = has({ plan: 'dionysus_pro_pack' }) || has({ plan: 'dionysus_advance_pack' });

  if (!hasProPlan) {
    return NextResponse.json(
      { error: 'You need to upgrade to Pro to use this feature.' },
      { status: 403 },
    );
  }

  try {
    const { owner, repo } = await req.json();

    if (!owner || !repo) {
      return NextResponse.json({ error: 'Missing owner or repo' }, { status: 400 });
    }

    const scriptPath = path.resolve('generate_diagram.py'); // Python file at root
    const outputFile = 'diagram.png';
    const outputPath = path.resolve(outputFile);
    const svgPath = path.resolve('diagram.svg'); // Fallback SVG path

    console.log(`[API] Running script for repo ${owner}/${repo}`);

    return await new Promise((resolve) => {
      const cleanOwner = owner.replace(/[^a-zA-Z0-9-_]/g, '');
      const cleanRepo =
        repo
          .replace(/\.git$/, '')
          .split('/')
          .pop() ?? repo;
      const child = spawn('python', [scriptPath, cleanOwner, cleanRepo], {
        cwd: process.cwd(), // ensure running from project root
        env: process.env, // pass env vars if needed
      });

      let stderr = '';
      let stdout = '';

      child.stdout.on('data', (data) => {
        const msg = data.toString();
        stdout += msg;
        console.log('[PYTHON STDOUT]:', msg);
      });

      child.stderr.on('data', (data) => {
        const err = data.toString();
        stderr += err;
        console.error('[PYTHON STDERR]:', err);
      });

      child.on('close', async (code) => {
        if (code !== 0) {
          console.error('❌ Python script failed with exit code:', code);
          return resolve(
            NextResponse.json(
              {
                error: 'Python script failed.',
                stderr,
                stdout,
              },
              { status: 500 },
            ),
          );
        }

        try {
          // First try to find a PNG file
          let fileToSend = outputPath;
          let contentType = 'image/png';
          let fileExtension = 'png';

          if (!fsSync.existsSync(outputPath)) {
            // If PNG doesn't exist, try SVG
            if (fsSync.existsSync(svgPath)) {
              fileToSend = svgPath;
              contentType = 'image/svg+xml';
              fileExtension = 'svg';
              console.log('📄 Using SVG file as PNG is not available');
            } else {
              // Try HTML as final fallback
              const htmlPath = path.resolve('diagram.html');
              if (fsSync.existsSync(htmlPath)) {
                fileToSend = htmlPath;
                contentType = 'text/html';
                fileExtension = 'html';
                console.log('📄 Using HTML file as final fallback');
              } else {
                throw new Error('No diagram file generated');
              }
            }
          }

          const fileBuffer = await fs.readFile(fileToSend);

          return resolve(
            new NextResponse(new Uint8Array(fileBuffer), {
              status: 200,
              headers: {
                'Content-Type': contentType,
                'Content-Disposition': `attachment; filename="${repo}_diagram.${fileExtension}"`,
              },
            }),
          );
        } catch (err) {
          console.error('❌ Diagram file not found or could not be read:', err);
          return resolve(
            NextResponse.json({ error: 'Diagram generation failed or file not found.' }, { status: 500 }),
          );
        }
      });
    });
  } catch (err) {
    console.error('❌ API Internal error:', err);
    return NextResponse.json({ error: 'Internal server error.' }, { status: 500 });
  }
}
