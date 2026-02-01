'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import HeartIcon from '@/components/HeartIcon';
import {
  Camera,
  MessageCircleHeart,
  Music,
  Lock,
  ImagePlus,
  Share2,
  Sparkles,
  Gift,
  PartyPopper,
  Heart,
  Cake,
  Gem,
  GraduationCap,
  Baby,
  Plane,
  Flower2,
  Star,
} from 'lucide-react';

export default function LandingPage() {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    setIsVisible(true);
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#FFF0F5] via-white to-[#FFF0F5]">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-md border-b border-pink-100">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <HeartIcon size={28} className="animate-pulse-heart" />
            <span className="text-2xl font-bold bg-gradient-to-r from-[#FF6B9D] to-[#E63946] bg-clip-text text-transparent">
              The Memory
            </span>
          </div>
          <div className="flex items-center gap-4">
            <Link
              href="/login"
              className="text-[#E63946] hover:text-[#FF6B9D] transition-colors font-medium"
            >
              เข้าสู่ระบบ
            </Link>
            <Link
              href="/login"
              className="btn-primary text-sm py-2 px-6"
            >
              เริ่มสร้างเลย
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative min-h-screen flex items-center justify-center pt-20 overflow-hidden">
        {/* Animated Background Hearts */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          {[...Array(20)].map((_, i) => (
            <div
              key={i}
              className="absolute animate-float opacity-10"
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
                animationDelay: `${Math.random() * 5}s`,
                animationDuration: `${4 + Math.random() * 4}s`,
              }}
            >
              <HeartIcon size={20 + Math.random() * 40} color="#FF6B9D" />
            </div>
          ))}
        </div>

        <div className="relative z-10 max-w-4xl mx-auto px-4 text-center">
          <div
            className={`transition-all duration-1000 ${
              isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
            }`}
          >
            {/* Badge */}
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-pink-100 rounded-full text-sm text-[#E63946] mb-6">
              <HeartIcon size={16} filled />
              <span>สร้างความทรงจำพิเศษให้คนที่คุณรัก</span>
            </div>

            {/* Main Headline */}
            <h1 className="text-5xl md:text-7xl font-bold mb-6 leading-tight">
              <span className="bg-gradient-to-r from-[#FF6B9D] via-[#E63946] to-[#FF6B9D] bg-clip-text text-transparent">
                สร้างเซอร์ไพรส์
              </span>
              <br />
              <span className="text-[#4A1942]">ที่จะทำให้หัวใจละลาย</span>
            </h1>

            {/* Subheadline */}
            <p className="text-xl md:text-2xl text-gray-600 mb-10 max-w-2xl mx-auto leading-relaxed">
              รวมรูปภาพ ข้อความ และเพลงที่มีความหมาย
              <br className="hidden md:block" />
              สร้างความทรงจำดิจิทัลที่สวยงามและแชร์ให้คนพิเศษของคุณ
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link
                href="/login"
                className="btn-primary text-lg py-4 px-10 flex items-center gap-3 shadow-2xl shadow-pink-500/30"
              >
                <span>เริ่มสร้างฟรี</span>
                <HeartIcon size={20} filled />
              </Link>
              <a
                href="#how-it-works"
                className="btn-secondary text-lg py-4 px-10"
              >
                ดูวิธีใช้งาน
              </a>
            </div>

            {/* Trust Badge */}
            <p className="mt-8 text-sm text-gray-500">
              ฟรี ไม่ต้องติดตั้งแอป ใช้งานง่าย
            </p>
          </div>

          {/* Hero Image/Preview */}
          <div
            className={`mt-16 transition-all duration-1000 delay-300 ${
              isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
            }`}
          >
            <div className="relative mx-auto max-w-md">
              {/* Phone Mockup */}
              <div className="bg-white rounded-[3rem] p-4 shadow-2xl shadow-pink-500/20 border border-pink-100">
                <div className="bg-gradient-to-br from-[#FFF0F5] to-white rounded-[2.5rem] p-6 aspect-[9/16] flex flex-col">
                  {/* Mock Header */}
                  <div className="flex items-center justify-center gap-2 mb-4">
                    <HeartIcon size={20} className="animate-pulse-heart" />
                    <span className="font-semibold text-[#E63946]">วันครบรอบของเรา</span>
                  </div>
                  {/* Mock Content */}
                  <div className="flex-grow flex items-center justify-center">
                    <div className="text-center">
                      <div className="w-32 h-32 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-pink-200 to-pink-300 flex items-center justify-center">
                        <HeartIcon size={48} color="#E63946" />
                      </div>
                      <p className="text-gray-600 text-sm px-4">
                        &ldquo;ขอบคุณที่อยู่ข้างกันเสมอ รักนะ&rdquo;
                      </p>
                    </div>
                  </div>
                  {/* Mock Progress */}
                  <div className="h-1 bg-pink-100 rounded-full overflow-hidden">
                    <div className="h-full w-2/3 bg-gradient-to-r from-[#FF6B9D] to-[#E63946]" />
                  </div>
                </div>
              </div>
              {/* Decorative Elements */}
              <div className="absolute -top-4 -right-4 animate-float">
                <HeartIcon size={40} color="#FF6B9D" />
              </div>
              <div className="absolute -bottom-4 -left-4 animate-float" style={{ animationDelay: '1s' }}>
                <HeartIcon size={32} color="#E63946" />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-24 bg-white">
        <div className="max-w-6xl mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-[#4A1942] mb-4">
              ทำให้ทุกช่วงเวลาพิเศษยิ่งขึ้น
            </h2>
            <p className="text-gray-600 text-lg max-w-2xl mx-auto">
              เลือกรูปแบบความทรงจำที่คุณต้องการ และจัดเรียงตามลำดับที่คุณอยากให้เห็น
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {/* Feature Cards */}
            {[
              {
                icon: Camera,
                title: 'รูปภาพ',
                description: 'อัพโหลดรูปความทรงจำพิเศษ พร้อมคำบรรยายน่ารักๆ',
                color: 'from-pink-500 to-rose-500',
              },
              {
                icon: MessageCircleHeart,
                title: 'ข้อความจากใจ',
                description: 'เขียนข้อความที่อยากบอก ให้คนพิเศษได้อ่าน',
                color: 'from-rose-500 to-red-500',
              },
              {
                icon: Music,
                title: 'เพลงประกอบ',
                description: 'เพิ่มเพลงจาก YouTube ที่มีความหมายพิเศษ',
                color: 'from-red-500 to-pink-500',
              },
              {
                icon: Lock,
                title: 'รหัสลับ',
                description: 'ใส่รหัสผ่านเพื่อสร้างความตื่นเต้นก่อนเปิดดู',
                color: 'from-pink-500 to-purple-500',
              },
              {
                icon: ImagePlus,
                title: 'ข้อความ + รูปภาพ',
                description: 'รวมรูปภาพและข้อความไว้ในหน้าเดียวกัน',
                color: 'from-purple-500 to-pink-500',
              },
              {
                icon: Share2,
                title: 'แชร์ได้ทันที',
                description: 'ส่งลิงก์หรือ QR Code ให้คนพิเศษได้เลย',
                color: 'from-pink-500 to-rose-500',
              },
            ].map((feature, index) => {
              const IconComponent = feature.icon;
              return (
                <div
                  key={index}
                  className="group relative bg-white rounded-2xl p-8 shadow-lg shadow-pink-100 hover:shadow-xl hover:shadow-pink-200 transition-all duration-300 hover:-translate-y-2 border border-pink-50"
                >
                  <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${feature.color} flex items-center justify-center mb-6 group-hover:scale-110 transition-transform`}>
                    <IconComponent size={32} className="text-white" />
                  </div>
                  <h3 className="text-xl font-bold text-[#4A1942] mb-3">
                    {feature.title}
                  </h3>
                  <p className="text-gray-600">
                    {feature.description}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section id="how-it-works" className="py-24 bg-gradient-to-b from-[#FFF0F5] to-white">
        <div className="max-w-6xl mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-[#4A1942] mb-4">
              ง่ายแค่ 3 ขั้นตอน
            </h2>
            <p className="text-gray-600 text-lg">
              สร้างความทรงจำสวยๆ ได้ภายในไม่กี่นาที
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                step: '1',
                title: 'สร้างความทรงจำใหม่',
                description: 'ตั้งชื่อและเริ่มเพิ่มเนื้อหาที่คุณต้องการ',
                icon: Sparkles,
              },
              {
                step: '2',
                title: 'เพิ่มโหนดความทรงจำ',
                description: 'ใส่รูปภาพ ข้อความ เพลง และรหัสผ่านตามที่ต้องการ',
                icon: Gift,
              },
              {
                step: '3',
                title: 'แชร์ให้คนพิเศษ',
                description: 'ส่งลิงก์หรือ QR Code ให้คนที่คุณรักได้เลย',
                icon: PartyPopper,
              },
            ].map((item, index) => {
              const IconComponent = item.icon;
              return (
                <div key={index} className="relative text-center">
                  {/* Connector Line */}
                  {index < 2 && (
                    <div className="hidden md:block absolute top-16 left-[60%] w-[80%] h-0.5 bg-gradient-to-r from-[#FF6B9D] to-[#E63946] opacity-30" />
                  )}

                  {/* Step Number */}
                  <div className="relative inline-flex items-center justify-center w-32 h-32 mb-6">
                    <div className="absolute inset-0 bg-gradient-to-br from-[#FF6B9D] to-[#E63946] rounded-full opacity-10 animate-pulse" />
                    <div className="relative w-24 h-24 bg-white rounded-full shadow-lg shadow-pink-200 flex items-center justify-center">
                      <IconComponent size={48} className="text-[#E63946]" />
                    </div>
                    <div className="absolute -top-2 -right-2 w-10 h-10 bg-gradient-to-br from-[#FF6B9D] to-[#E63946] rounded-full flex items-center justify-center text-white font-bold shadow-lg">
                      {item.step}
                    </div>
                  </div>

                  <h3 className="text-xl font-bold text-[#4A1942] mb-3">
                    {item.title}
                  </h3>
                  <p className="text-gray-600 max-w-xs mx-auto">
                    {item.description}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Use Cases Section */}
      <section className="py-24 bg-white">
        <div className="max-w-6xl mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-[#4A1942] mb-4">
              เหมาะสำหรับทุกโอกาส
            </h2>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { icon: Heart, text: 'วันวาเลนไทน์', color: 'text-rose-500' },
              { icon: Cake, text: 'วันเกิด', color: 'text-pink-500' },
              { icon: Gem, text: 'วันครบรอบ', color: 'text-purple-500' },
              { icon: GraduationCap, text: 'วันรับปริญญา', color: 'text-indigo-500' },
              { icon: Baby, text: 'ต้อนรับสมาชิกใหม่', color: 'text-pink-400' },
              { icon: Plane, text: 'ก่อนเดินทางไกล', color: 'text-sky-500' },
              { icon: Flower2, text: 'ขอบคุณคนพิเศษ', color: 'text-rose-400' },
              { icon: Star, text: 'หรือวันธรรมดาที่พิเศษ', color: 'text-amber-500' },
            ].map((item, index) => {
              const IconComponent = item.icon;
              return (
                <div
                  key={index}
                  className="flex items-center gap-4 p-4 rounded-xl bg-gradient-to-r from-pink-50 to-white border border-pink-100 hover:shadow-lg hover:shadow-pink-100 transition-all"
                >
                  <IconComponent size={28} className={item.color} />
                  <span className="text-[#4A1942] font-medium">{item.text}</span>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 bg-gradient-to-br from-[#FF6B9D] via-[#E63946] to-[#FF6B9D] relative overflow-hidden">
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-10">
          {[...Array(30)].map((_, i) => (
            <HeartIcon
              key={i}
              size={40 + Math.random() * 60}
              color="white"
              className="absolute"
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
              }}
            />
          ))}
        </div>

        <div className="relative z-10 max-w-4xl mx-auto px-4 text-center text-white">
          <h2 className="text-4xl md:text-6xl font-bold mb-6">
            พร้อมสร้างความทรงจำพิเศษหรือยัง?
          </h2>
          <p className="text-xl md:text-2xl mb-10 opacity-90">
            เริ่มต้นฟรี ไม่มีค่าใช้จ่าย
          </p>
          <Link
            href="/login"
            className="inline-flex items-center gap-3 bg-white text-[#E63946] font-bold text-lg py-4 px-10 rounded-full hover:bg-pink-50 transition-colors shadow-2xl"
          >
            <span>เริ่มสร้างเลย</span>
            <HeartIcon size={24} color="#E63946" />
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 bg-[#4A1942] text-white">
        <div className="max-w-6xl mx-auto px-4">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-2">
              <HeartIcon size={24} color="#FF6B9D" />
              <span className="text-xl font-bold">The Memory</span>
            </div>
            <p className="text-pink-200 text-sm">
              สร้างด้วย <HeartIcon size={14} color="#FF6B9D" className="inline-block mx-1" /> สำหรับช่วงเวลาพิเศษของคุณ
            </p>
            <div className="flex items-center gap-6 text-sm text-pink-200">
              <Link href="/login" className="hover:text-white transition-colors">
                เข้าสู่ระบบ
              </Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
