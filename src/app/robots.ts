import type { MetadataRoute } from 'next';

const SITE_URL = 'https://thememory.app';

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
