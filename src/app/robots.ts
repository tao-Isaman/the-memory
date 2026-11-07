import type { MetadataRoute } from 'next';
import { SITE_URL } from '@/lib/site-url';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        // /memory/* are private gift links — crawling them would expose users' memories.
        disallow: ['/admin', '/api/', '/memory/', '/payment/'],
      },
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}
