import bcrypt from 'bcryptjs';
import crypto from 'crypto';

export function generateApiKey(): string {
  // Generate a 32-byte random key and encode as base64
  const key = crypto.randomBytes(32).toString('base64url');
  return `fk_${key}`; // fk = form key prefix
}

export function getKeyId(apiKey: string): string {
  // Remove prefix and take first 8 characters for identification
  const keyPart = apiKey.replace('fk_', '');
  return keyPart.slice(0, 8);
}

export async function hashApiKey(apiKey: string): Promise<string> {
  // Hash the API key for secure storage
  const salt = await bcrypt.genSalt(12);
  return bcrypt.hash(apiKey, salt);
}

export async function verifyApiKey(apiKey: string, hashedKey: string): Promise<boolean> {
  try {
    return await bcrypt.compare(apiKey, hashedKey);
  } catch (error) {
    console.error('Error verifying API key:', error);
    return false;
  }
}

export function validateApiKeyFormat(apiKey: string): boolean {
  // Check if API key has correct format
  if (!apiKey || typeof apiKey !== 'string') {
    return false;
  }

  // Should start with fk_ and have reasonable length
  if (!apiKey.startsWith('fk_') || apiKey.length < 20) {
    return false;
  }

  return true;
}
