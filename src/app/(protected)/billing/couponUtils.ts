'use server';
import { auth, currentUser } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';
import crypto from 'crypto';

export async function generateCouponCode(discount: number, expiresInMinutes: number = 10) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  const user = await currentUser();
  const email = user?.emailAddresses?.[0]?.emailAddress;
  if (email !== 'sakshamgoel1107@gmail.com') {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }
  const secret = process.env.COUPON_SECRET || 'dionysus-coupon-secret';
  const exp = Date.now() + expiresInMinutes * 60 * 1000;
  const payload = `${discount}:${exp}`;
  const hmac = crypto.createHmac('sha256', secret);
  hmac.update(payload);
  const sigHex = hmac.digest('hex');
  return Buffer.from(`${payload}:${sigHex}`).toString('base64');
}

export async function validateCouponCode(code: string) {
  const secret = process.env.COUPON_SECRET || 'dionysus-coupon-secret';
  try {
    const decoded = Buffer.from(code, 'base64').toString('utf-8');
    const [discount, exp, sigHex] = decoded.split(':');
    if (!discount || !exp || !sigHex) return null;
    if (Date.now() > parseInt(exp)) return null;
    const payload = `${discount}:${exp}`;
    const hmac = crypto.createHmac('sha256', secret);
    hmac.update(payload);
    const expectedSig = hmac.digest('hex');
    if (expectedSig !== sigHex) return null;
    return { discount: parseInt(discount), exp: parseInt(exp) };
  } catch {
    return null;
  }
}
