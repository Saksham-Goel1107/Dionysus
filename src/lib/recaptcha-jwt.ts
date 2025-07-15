import { SignJWT, jwtVerify, JWTPayload } from 'jose';

function getJwtSecret(): Uint8Array {
  const secret = process.env.RECAPTCHA_JWT_SECRET;
  if (!secret) {
    throw new Error('RECAPTCHA_JWT_SECRET environment variable is not set');
  }
  return new TextEncoder().encode(secret);
}

export async function signRecaptchaJWT(payload: JWTPayload) {
  const JWT_SECRET = getJwtSecret();
  return await new SignJWT(payload)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('1h')
    .sign(JWT_SECRET);
}

export async function verifyRecaptchaJWT(token: string) {
  try {
    const JWT_SECRET = getJwtSecret();
    const { payload } = await jwtVerify(token, JWT_SECRET);
    return payload;
  } catch {
    return null;
  }
}
