import type { Metadata } from "next";
import { Itim, Kanit, Leckerli_One } from "next/font/google";
import Script from "next/script";
import "./globals.css";
import FloatingHearts from "@/components/FloatingHearts";
import ClientProviders from "@/components/ClientProviders";

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
  title: "The Memory - สร้างความทรงจำสวยๆ ให้คนที่คุณรัก",
  description: "แอปสำหรับสร้างและแชร์ความทรงจำสวยๆ ให้คนที่คุณรัก",
  openGraph: {
    title: "The Memory - สร้างความทรงจำสวยๆ ให้คนที่คุณรัก",
    description: "แอปสำหรับสร้างและแชร์ความทรงจำสวยๆ ให้คนที่คุณรัก",
    images: [
      {
        url: "/og-image.webp",
        width: 420,
        height: 300,
        alt: "The Memory",
      },
    ],
    locale: "th_TH",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "The Memory - สร้างความทรงจำสวยๆ ให้คนที่คุณรัก",
    description: "แอปสำหรับสร้างและแชร์ความทรงจำสวยๆ ให้คนที่คุณรัก",
    images: ["/og-image.webp"],
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
      </head>
      <body
        className={`${itim.variable} ${kanit.variable} ${leckerliOne.variable} antialiased min-h-screen`}
      >
        <ClientProviders>
          <FloatingHearts />
          {children}
        </ClientProviders>
      </body>
    </html>
  );
}
