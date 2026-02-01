import type { Metadata } from "next";
import { Itim, Kanit, Leckerli_One } from "next/font/google";
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
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="th">
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
