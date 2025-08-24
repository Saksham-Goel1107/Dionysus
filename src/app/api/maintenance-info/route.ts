import { getFeatureFlagValue } from '@/lib/configcat';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const isMaintenance = await getFeatureFlagValue('maintenancemode', false);
    let maintenanceEnd: number | undefined = undefined;

    const maintenanceEndValue = await getFeatureFlagValue('maintenanceend', '');
    if (maintenanceEndValue) {
      const parsed = Number(maintenanceEndValue);
      if (!isNaN(parsed) && parsed > 0) {
        maintenanceEnd = parsed;
      } else {
        const date = new Date(maintenanceEndValue);
        if (!isNaN(date.getTime())) {
          maintenanceEnd = date.getTime();
        }
      }
    }

    if (!isMaintenance) {
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
  } catch (error) {
    console.error('Failed to get maintenance info from ConfigCat:', error);

    return NextResponse.json({
      message: 'Site is not under maintenance mode and is perfectly working',
    });
  }
}
