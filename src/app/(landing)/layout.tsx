import type { Metadata } from "next";
import FloatingHearts from "@/components/FloatingHearts";

export const metadata: Metadata = {
  title: "The Memory - สร้างความทรงจำสวยๆ ให้คนที่คุณรัก",
  description: "สร้างเซอร์ไพรส์พิเศษ รวมรูปภาพ ข้อความ และเพลงที่มีความหมาย แชร์ให้คนที่คุณรักได้ง่ายๆ",
};

export default function LandingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <FloatingHearts />
      {children}
    </>
  );
}
