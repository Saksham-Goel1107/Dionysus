import { NextResponse } from 'next/server';
import { signRecaptchaJWT } from '@/lib/recaptcha-jwt';

const SECRET_KEY = process.env.RECAPTCHA_SECRET_KEY;

export async function POST(req: Request) {
  let token: string | undefined;
  try {
    const body = await req.json();
    token = body?.token;
  } catch (error) {
    return NextResponse.json(
      { success: false, error: 'Invalid or missing JSON body' },
      { status: 400 },
    );
  }

  if (!token || !SECRET_KEY) {
    return NextResponse.json(
      { success: false, error: 'Missing token or secret key' },
      { status: 400 },
    );
  }

  const params = new URLSearchParams();
  params.append('secret', SECRET_KEY);
  params.append('response', token);

  const verifyRes = await fetch('https://www.google.com/recaptcha/api/siteverify', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: params.toString(),
  });

  const data = await verifyRes.json();
  if (process.env.NODE_ENV !== 'production') {
    data.score = 1;
  }
  if (data.success && data.score && data.score > 0.5) {
    const jwt = await signRecaptchaJWT({ verified: true });
    const res = NextResponse.json({ success: true });
    res.cookies.set('recaptcha_jwt', jwt, {
      httpOnly: true,
      secure: true,
      sameSite: 'strict',
      maxAge: 60 * 60,
      path: '/',
    });
    res.cookies.set('recaptcha_failed', '', {
      httpOnly: true,
      secure: true,
      sameSite: 'strict',
      maxAge: 0,
      path: '/',
    });
    return res;
  }

  const res = NextResponse.json(
    { success: false, error: 'reCAPTCHA score too low' },
    { status: 403 },
  );
  res.cookies.set('recaptcha_failed', 'true', {
    httpOnly: true,
    secure: true,
    sameSite: 'strict',
    maxAge: 60 * 60,
    path: '/',
  });
  res.cookies.set('recaptcha_jwt', '', {
    httpOnly: true,
    secure: true,
    sameSite: 'strict',
    maxAge: 0,
    path: '/',
  });
  return res;
}
