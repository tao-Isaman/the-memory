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
  title: "The Memory - ของขวัญเซอร์ไพรส์แฟน สร้างความทรงจำออนไลน์ให้คนสำคัญ",
  description: "ของขวัญเซอร์ไพรส์แฟน สร้างความทรงจำออนไลน์ รวมรูปภาพ ข้อความ เพลง ไว้ในลิงก์เดียว เหมาะกับทุกโอกาส วันครบรอบ วันเกิด ขอโทษ คิดถึง ครอบครัว ส่งลิงก์ได้ทันที",
  keywords: "ของขวัญเซอร์ไพรส์แฟน, เซอร์ไพรส์แฟน, ของขวัญวันวาเลนไทน์, ของขวัญให้แฟน, ของขวัญวันครบรอบ, ของขวัญวันเกิด, ง้อแฟน, ขอโทษแฟน, ของขวัญครอบครัว, ของขวัญออนไลน์, ของขวัญโรแมนติก, ไอเดียเซอร์ไพรส์แฟน, ของขวัญความทรงจำ",
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
    title: "The Memory - ของขวัญเซอร์ไพรส์แฟน สร้างความทรงจำออนไลน์ให้คนสำคัญ",
    description: "สร้างของขวัญเซอร์ไพรส์แฟนออนไลน์ รวมรูปภาพ ข้อความ เพลง เหมาะกับวันครบรอบ วันเกิด ขอโทษ คิดถึง ครอบครัว",
    siteName: "The Memory",
    images: [
      {
        url: "/og-image.webp",
        width: 420,
        height: 300,
        alt: "The Memory - ของขวัญเซอร์ไพรส์แฟน สร้างความทรงจำออนไลน์",
      },
    ],
    locale: "th_TH",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "The Memory - ของขวัญเซอร์ไพรส์แฟน สร้างความทรงจำออนไลน์",
    description: "สร้างของขวัญเซอร์ไพรส์แฟนออนไลน์ รวมรูปภาพ ข้อความ เพลง เหมาะกับทุกโอกาส วันครบรอบ วันเกิด ขอโทษ คิดถึง ครอบครัว",
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
              "alternateName": "ของขวัญเซอร์ไพรส์แฟน",
              "description": "แพลตฟอร์มสร้างความทรงจำออนไลน์ให้คนสำคัญ รวมรูปภาพ ข้อความ เพลง ไว้ในลิงก์เดียว เหมาะกับทุกโอกาส เซอร์ไพรส์แฟน วันครบรอบ วันเกิด ขอโทษ คิดถึง ครอบครัว",
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
              "keywords": "ของขวัญเซอร์ไพรส์แฟน, เซอร์ไพรส์แฟน, ของขวัญวันครบรอบ, ของขวัญวันเกิด, ง้อแฟน, ของขวัญครอบครัว"
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
                  "name": "The Memory คืออะไร?",
                  "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "The Memory คือแพลตฟอร์มสำหรับสร้างความทรงจำออนไลน์ส่งให้คนสำคัญ รวมรูปภาพ ข้อความ เพลง และรหัสลับ ไว้ในลิงก์เดียว เหมาะกับทุกโอกาส ไม่ว่าจะเป็นเซอร์ไพรส์แฟน วันครบรอบ วันเกิด ขอโทษ หรือบอกรักครอบครัว"
                  }
                },
                {
                  "@type": "Question",
                  "name": "ใช้งานยากไหม? ใช้เวลานานไหม?",
                  "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "ไม่ยากเลย! แค่ 3 ขั้นตอนง่ายๆ: สร้างความทรงจำใหม่ เพิ่มรูปภาพ ข้อความ หรือเพลง แล้วแชร์ลิงก์ ไม่ต้องติดตั้งแอป ใช้เวลาไม่ถึง 5 นาที"
                  }
                },
                {
                  "@type": "Question",
                  "name": "ราคาเท่าไร? สร้างฟรีได้ไหม?",
                  "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "สร้างความทรงจำได้ฟรี ดูตัวอย่างก่อนได้ เมื่อพอใจแล้วค่อยชำระเงินเพียง 99 บาท เพื่อเปิดใช้งานและแชร์ ลิงก์เก็บไว้ดูได้ตลอด"
                  }
                },
                {
                  "@type": "Question",
                  "name": "ชำระเงินปลอดภัยไหม?",
                  "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "ปลอดภัย 100% ใช้ระบบชำระเงิน Stripe มาตรฐานเดียวกับ Shopify, Amazon รองรับบัตรเครดิต/เดบิต และ PromptPay"
                  }
                },
                {
                  "@type": "Question",
                  "name": "คนที่ได้รับลิงก์ต้องสมัครสมาชิกไหม?",
                  "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "ไม่ต้อง! แค่กดลิงก์ก็เปิดดูได้ทันที ใช้ได้ทั้งมือถือและคอมพิวเตอร์ ไม่ต้องติดตั้งแอป"
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
