import type { Metadata } from "next";
import { Itim, Kanit, Leckerli_One } from "next/font/google";
import Script from "next/script";
import "./globals.css";
import FloatingHearts from "@/components/FloatingHearts";
import ClientProviders from "@/components/ClientProviders";
import { Analytics } from "@vercel/analytics/next";

const itim = Itim({
  weight: "400",
  subsets: ["thai", "latin"],
  variable: "--font-itim",
});

const kanit = Kanit({
  weight: ["100", "200", "300", "400", "500", "600", "700", "800", "900"],
  subsets: ["thai", "latin"],
  variable: "--font-kanit",
});

const leckerliOne = Leckerli_One({
  weight: "400",
  subsets: ["latin"],
  variable: "--font-leckerli",
});

export const metadata: Metadata = {
  title: "The Memory - เว็บเซอร์ไพรส์แฟน สร้างของขวัญออนไลน์สุดโรแมนติก",
  description: "เว็บเซอร์ไพรส์แฟน สร้างของขวัญความทรงจำออนไลน์ รวมรูปภาพ ข้อความ เพลง ไว้ในที่เดียว เหมาะสำหรับวันวาเลนไทน์ วันครบรอบ วันเกิดแฟน ส่งความรักผ่านลิงก์หรือ QR Code ใช้งานง่าย ไม่ต้องติดตั้งแอป",
  keywords: "เว็บเซอร์ไพรส์แฟน, เซอร์ไพรส์แฟน, ของขวัญวันวาเลนไทน์, ของขวัญให้แฟน, ของขวัญวันครบรอบ, ของขวัญวันเกิดแฟน, ของขวัญออนไลน์, ของขวัญโรแมนติก, ไอเดียเซอร์ไพรส์แฟน, ของขวัญความทรงจำ, สร้างอัลบั้มออนไลน์",
  authors: [{ name: "The Memory" }],
  creator: "The Memory",
  publisher: "The Memory",
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  openGraph: {
    title: "The Memory - เว็บเซอร์ไพรส์แฟน สร้างของขวัญออนไลน์สุดโรแมนติก",
    description: "เว็บเซอร์ไพรส์แฟน สร้างของขวัญความทรงจำออนไลน์ รวมรูปภาพ ข้อความ เพลง ไว้ในที่เดียว เหมาะสำหรับวันวาเลนไทน์ วันครบรอบ วันเกิดแฟน",
    siteName: "The Memory",
    images: [
      {
        url: "/og-image.webp",
        width: 420,
        height: 300,
        alt: "The Memory - เว็บเซอร์ไพรส์แฟน",
      },
    ],
    locale: "th_TH",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "The Memory - เว็บเซอร์ไพรส์แฟน สร้างของขวัญออนไลน์",
    description: "เว็บเซอร์ไพรส์แฟน สร้างของขวัญความทรงจำออนไลน์ รวมรูปภาพ ข้อความ เพลง เหมาะสำหรับวันวาเลนไทน์ วันครบรอบ วันเกิดแฟน",
    images: ["/og-image.webp"],
  },
  alternates: {
    canonical: "https://thememory.app",
  },
  category: "gift",
  verification: {
    google: "rmJ1lfrMVRg7O8BWKQPV7wc1YAmrQ8gzsbFXUfCS-68",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="th">
      <head>
        <Script
          src="https://www.googletagmanager.com/gtag/js?id=G-MZKHDF94QX"
          strategy="afterInteractive"
        />
        <Script id="google-analytics" strategy="afterInteractive">
          {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', 'G-MZKHDF94QX');
          `}
        </Script>
        <Script
          id="json-ld-app"
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "WebApplication",
              "name": "The Memory",
              "alternateName": "เว็บเซอร์ไพรส์แฟน",
              "description": "เว็บเซอร์ไพรส์แฟน สร้างของขวัญความทรงจำออนไลน์ รวมรูปภาพ ข้อความ เพลง ไว้ในที่เดียว เหมาะสำหรับวันวาเลนไทน์ วันครบรอบ วันเกิดแฟน",
              "url": "https://thememory.app",
              "applicationCategory": "LifestyleApplication",
              "operatingSystem": "Web Browser",
              "offers": {
                "@type": "Offer",
                "price": "0",
                "priceCurrency": "THB"
              },
              "aggregateRating": {
                "@type": "AggregateRating",
                "ratingValue": "4.9",
                "ratingCount": "150"
              },
              "inLanguage": "th",
              "keywords": "เว็บเซอร์ไพรส์แฟน, เซอร์ไพรส์แฟน, ของขวัญวันวาเลนไทน์, ของขวัญให้แฟน, ของขวัญวันครบรอบ"
            })
          }}
        />
        <Script
          id="json-ld-faq"
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "FAQPage",
              "mainEntity": [
                {
                  "@type": "Question",
                  "name": "เว็บเซอร์ไพรส์แฟน The Memory คืออะไร?",
                  "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "The Memory คือเว็บไซต์สำหรับสร้างของขวัญออนไลน์ให้แฟน คุณสามารถรวมรูปภาพ ข้อความ เพลง และรหัสลับ ไว้ในที่เดียว แล้วส่งลิงก์หรือ QR Code ให้คนพิเศษของคุณได้เลย เหมาะสำหรับวันวาเลนไทน์ วันครบรอบ วันเกิด หรือโอกาสพิเศษอื่นๆ"
                  }
                },
                {
                  "@type": "Question",
                  "name": "ใช้งานเว็บเซอร์ไพรส์แฟนยากไหม?",
                  "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "ไม่ยากเลย! แค่ 3 ขั้นตอนง่ายๆ คือ 1) สร้างความทรงจำใหม่ 2) เพิ่มรูปภาพ ข้อความ หรือเพลง 3) แชร์ลิงก์ให้แฟน ไม่ต้องติดตั้งแอป ใช้งานผ่านเว็บบราวเซอร์ได้เลย"
                  }
                },
                {
                  "@type": "Question",
                  "name": "เว็บเซอร์ไพรส์แฟนนี้ฟรีไหม?",
                  "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "คุณสามารถสร้างความทรงจำได้ฟรี และดูตัวอย่างก่อนได้ เมื่อพอใจแล้วค่อยชำระเงินเพื่อเปิดใช้งานและแชร์ให้คนพิเศษของคุณ"
                  }
                },
                {
                  "@type": "Question",
                  "name": "ของขวัญวันวาเลนไทน์แบบไหนที่เหมาะกับเว็บนี้?",
                  "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "เหมาะมากสำหรับคนที่อยากเซอร์ไพรส์แฟนด้วยของขวัญที่มีความหมาย เช่น รวมรูปภาพความทรงจำตั้งแต่วันแรกที่เจอกัน เพิ่มข้อความบอกรัก ใส่เพลงที่เคยฟังด้วยกัน และล็อคด้วยรหัสลับที่มีแค่คุณสองคนรู้"
                  }
                },
                {
                  "@type": "Question",
                  "name": "สามารถใส่รหัสผ่านล็อคของขวัญได้ไหม?",
                  "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "ได้ครับ! คุณสามารถใส่รหัส PIN 6 หลักเพื่อล็อคเนื้อหา ทำให้แฟนต้องใส่รหัสก่อนถึงจะเห็นเนื้อหาถัดไป สร้างความตื่นเต้นและความพิเศษให้ของขวัญของคุณ"
                  }
                }
              ]
            })
          }}
        />
      </head>
      <body
        className={`${itim.variable} ${kanit.variable} ${leckerliOne.variable} antialiased min-h-screen`}
      >
        <ClientProviders>
          <FloatingHearts />
          {children}
        </ClientProviders>
        <Analytics />
      </body>
    </html>
  );
}
