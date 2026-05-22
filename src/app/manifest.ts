import type { MetadataRoute } from 'next';

// Web App Manifest (served by Next.js at /manifest.webmanifest).
// Makes the site installable as a PWA.
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'The Memory - ของขวัญเซอร์ไพรส์แฟน',
    short_name: 'The Memory',
    description:
      'สร้างความทรงจำออนไลน์ให้คนสำคัญ รวมรูปภาพ ข้อความ เพลง ไว้ในลิงก์เดียว เหมาะกับทุกโอกาส',
    // start_url carries a marker so PWA launches are distinguishable in analytics.
    start_url: '/?source=pwa',
    scope: '/',
    display: 'standalone',
    orientation: 'portrait',
    background_color: '#FFFBF7',
    theme_color: '#E63946',
    lang: 'th',
    dir: 'ltr',
    categories: ['lifestyle', 'social'],
    icons: [
      { src: '/icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
      { src: '/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
      { src: '/icon-maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
    ],
  };
}
