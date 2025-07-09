import { MetadataRoute } from 'next';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = 'https://dionysus-gray.vercel.app';

  // Define all the static routes of your site
  const routes = ['', '/docs', '/privacy', '/terms', '/sign-in', '/sign-up'].map((route) => ({
    url: `${baseUrl}${route}`,
    lastModified: new Date().toISOString(),
    changeFrequency: 'weekly' as const,
    priority: route === '' ? 1 : 0.8,
  }));

  // Protected routes that still should be in the sitemap
  // but might have lower priority
  const protectedRoutes = ['/dashboard', '/billing', '/meetings', '/qa'].map((route) => ({
    url: `${baseUrl}${route}`,
    lastModified: new Date().toISOString(),
    changeFrequency: 'weekly' as const,
    priority: 0.5,
  }));

  return [...routes, ...protectedRoutes];
}
