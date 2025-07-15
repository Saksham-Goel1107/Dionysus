// Force dynamic to bypass caching
export const dynamic = 'force-dynamic';

export async function GET() {
  return new Response('OK', { status: 200 });
}
