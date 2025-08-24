import { NextResponse } from 'next/server';

export async function GET() {
  const maintenanceEnd = new Date('2025-07-14T18:00:00Z').getTime();
  if (process.env.NEXT_PUBLIC_MAINTAINENCE_MODE === 'false') {
    return NextResponse.json({
      message: 'Site is not under maintenance mode and is perfectly working',
    });
  }
  return NextResponse.json({
    maintenanceEnd,
    features: [
      'AI-powered chat assistant',
      'Real-time code collaboration',
      'One-click GitHub integration',
      'Beautiful UI with Tailwind CSS',
      'Secure authentication with Clerk',
      'Lightning-fast Prisma database',
      'Vercel deployment ready',
      'Live status and analytics dashboard',
      'Dark/light mode switching',
      'Instant feedback and support tools',
    ],
    message: "We're working on something epic! Enjoy this sneak peek while we finish up.",
    // images: [
    //   'https://images.unsplash.com/photo-1465101046530-73398c7f28ca?auto=format&fit=crop&w=800&q=80', // dev workspace
    //   'https://images.unsplash.com/photo-1519125323398-675f0ddb6308?auto=format&fit=crop&w=800&q=80', // code
    //   'https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=800&q=80', // team
    // ],
    // videos: ['https://www.w3schools.com/html/movie.mp4'],
    banner:
      'https://images.unsplash.com/photo-1465101046530-73398c7f28ca?auto=format&fit=crop&w=1600&q=80', // dev workspace banner
  });
}
