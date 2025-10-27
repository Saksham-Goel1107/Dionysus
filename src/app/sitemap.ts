import { db } from '@/server/db';
import { MetadataRoute } from 'next';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = 'https://dionysus-gray.vercel.app';

  // Define all the static routes of your site
  const routes = [
    '',
    '/docs',
    '/privacy',
    '/terms',
    '/cookie-policy',
    '/support',
    '/sign-in',
    '/sign-up',
    '/status',
    '/blogs',
    '/about',
    '/pricing',
  ].map((route) => ({
    url: `${baseUrl}${route}`,
    lastModified: new Date().toISOString(),
    changeFrequency: 'weekly' as const,
    priority: 1.0,
  }));

  // Protected routes that still should be in the sitemap
  // but might have lower priority
  const protectedRoutes = [
    '/dashboard',
    '/billing',
    '/meetings',
    '/qa',
    '/advanced',
    '/supportAuth',
    '/subscriptions',
  ].map((route) => ({
    url: `${baseUrl}${route}`,
    lastModified: new Date().toISOString(),
    changeFrequency: 'weekly' as const,
    priority: 0.4,
  }));

  // Dynamically fetch all published blogs from the database
  let blogRoutes: MetadataRoute.Sitemap = [];
  try {
    const blogs = await db.blog.findMany({
      where: {
        isPublished: true,
      },
      select: {
        slug: true,
        updatedAt: true,
        publishedAt: true,
      },
      orderBy: {
        publishedAt: 'desc',
      },
    });

    blogRoutes = blogs.map((blog) => ({
      url: `${baseUrl}/blogs/${blog.slug}`,
      lastModified: blog.updatedAt.toISOString(),
      changeFrequency: 'monthly' as const,
      priority: 0.8,
    }));
  } catch (error) {
    console.error('Error fetching blogs for sitemap:', error);
    // Continue without blog routes if database query fails
  }

  return [...routes, ...protectedRoutes, ...blogRoutes];
}
