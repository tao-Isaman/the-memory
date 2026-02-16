import type { Metadata } from "next";
import FloatingHearts from "@/components/FloatingHearts";

export const metadata: Metadata = {
  title: "The Memory - ของขวัญเซอร์ไพรส์แฟน สร้างความทรงจำออนไลน์ให้คนสำคัญ",
  description: "สร้างของขวัญเซอร์ไพรส์แฟนออนไลน์ รวมรูปภาพ ข้อความ เพลง เหมาะกับวันครบรอบ วันเกิด ขอโทษ คิดถึง ครอบครัว ส่งลิงก์ให้คนสำคัญได้ทันที",
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
