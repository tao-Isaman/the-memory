'use client';

import { useEffect, useState, useRef } from 'react';
import Link from 'next/link';
import HeartIcon from '@/components/HeartIcon';
import { trackEvent } from '@/lib/analytics';
import { USE_CASES } from '@/data/use-cases';
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
  Users,
  BookHeart,
  Layers,
  Puzzle,
  MousePointerClick,
  Shield,
  Clock,
  ChevronDown,
} from 'lucide-react';

interface SiteStats {
  users: number;
  memories: number;
  stories: number;
}

// Animated counter hook
function useCountUp(end: number, duration: number = 2000, start: boolean = true) {
  const [count, setCount] = useState(0);
  const countRef = useRef(0);
  const startTimeRef = useRef<number | null>(null);

  useEffect(() => {
    if (!start || end === 0) {
      setCount(end);
      return;
    }

    const animate = (timestamp: number) => {
      if (!startTimeRef.current) startTimeRef.current = timestamp;
      const progress = timestamp - startTimeRef.current;
      const percentage = Math.min(progress / duration, 1);

      // Easing function for smooth animation
      const easeOut = 1 - Math.pow(1 - percentage, 3);
      const currentCount = Math.floor(easeOut * end);

      if (currentCount !== countRef.current) {
        countRef.current = currentCount;
        setCount(currentCount);
      }

      if (percentage < 1) {
        requestAnimationFrame(animate);
      } else {
        setCount(end);
      }
    };

    requestAnimationFrame(animate);

    return () => {
      startTimeRef.current = null;
    };
  }, [end, duration, start]);

  return count;
}

// Animated stat component
function AnimatedStat({
  value,
  label,
  icon: Icon,
  startAnimation
}: {
  value: number;
  label: string;
  icon: React.ElementType;
  startAnimation: boolean;
}) {
  const count = useCountUp(value, 2000, startAnimation);

  return (
    <div className="text-center">
      <Icon size={20} className="text-[#E63946] mx-auto mb-1" />
      <p className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-[#FF6B9D] to-[#E63946] bg-clip-text text-transparent">
        {count.toLocaleString()}+
      </p>
      <p className="text-gray-500 text-xs mt-0.5">{label}</p>
    </div>
  );
}

export default function LandingPage() {
  const [isVisible, setIsVisible] = useState(false);
  const [stats, setStats] = useState<SiteStats | null>(null);
  const [startCountAnimation, setStartCountAnimation] = useState(false);
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  useEffect(() => {
    setIsVisible(true);
    trackEvent('view_home');

    // Fetch site stats
    fetch('/api/stats')
      .then((res) => res.json())
      .then((data) => {
        if (data.users !== undefined) {
          setStats(data);
          setTimeout(() => setStartCountAnimation(true), 500);
        }
      })
      .catch((err) => console.error('Failed to fetch stats:', err));
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#FFFBF7] via-white to-[#FFF8F0]">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-[#FFFBF7]/90 backdrop-blur-md border-b border-gray-100">
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
          {[...Array(12)].map((_, i) => (
            <div
              key={i}
              className="absolute animate-float opacity-[0.06]"
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
                animationDelay: `${Math.random() * 5}s`,
                animationDuration: `${4 + Math.random() * 4}s`,
              }}
            >
              <HeartIcon size={20 + Math.random() * 40} color="#E8A0B5" />
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
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-[#FFF8F0] border border-[#F5EDE4] rounded-full text-sm text-[#E63946] mb-6">
              <HeartIcon size={16} filled />
              <span>เว็บเซอร์ไพรส์แฟน อันดับ 1 ในไทย</span>
            </div>

            {/* Main Headline */}
            <h1 className="text-5xl md:text-7xl font-bold mb-6 leading-tight">
              <span className="bg-gradient-to-r from-[#FF6B9D] via-[#E63946] to-[#FF6B9D] bg-clip-text text-transparent">
                ของขวัญเซอร์ไพรส์แฟน
              </span>
              <br />
              <span className="text-[#4A1942] text-3xl md:text-5xl">
                ส่งความรู้สึกผ่านความทรงจำที่สร้างเอง
              </span>
            </h1>

            {/* Stats below headline */}
            {stats && (stats.users > 0 || stats.memories > 0 || stats.stories > 0) && (
              <div className="inline-flex items-center justify-center gap-6 md:gap-10 mb-8 bg-white/60 backdrop-blur-sm rounded-2xl px-8 py-4 border border-gray-100">
                <AnimatedStat
                  value={stats.users}
                  label="ผู้ใช้งาน"
                  icon={Users}
                  startAnimation={startCountAnimation}
                />
                <div className="h-12 w-px bg-gray-200" />
                <AnimatedStat
                  value={stats.memories}
                  label="ความทรงจำ"
                  icon={BookHeart}
                  startAnimation={startCountAnimation}
                />
                <div className="h-12 w-px bg-gray-200" />
                <AnimatedStat
                  value={stats.stories}
                  label="เรื่องราว"
                  icon={Layers}
                  startAnimation={startCountAnimation}
                />
              </div>
            )}

            {/* Subheadline */}
            <p className="text-xl md:text-2xl text-gray-600 mb-4 max-w-2xl mx-auto leading-relaxed">
              รวมรูปภาพ ข้อความ และเพลงที่มีความหมาย ไว้ในลิงก์เดียว
            </p>
            <p className="text-lg text-[#6B5E57] mb-10">
              เหมาะกับทุกโอกาส: <strong>วันครบรอบ วันเกิด ขอโทษ คิดถึง ครอบครัว</strong>
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link
                href="/login"
                className="btn-primary text-lg py-4 px-10 flex items-center gap-3 shadow-2xl shadow-pink-500/20"
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

            {/* Trust Badges */}
            <div className="mt-8 flex flex-wrap items-center justify-center gap-x-4 gap-y-2 text-sm text-[#6B5E57]">
              <span className="flex items-center gap-1"><Shield size={14} className="text-green-500" /> ปลอดภัย 100%</span>
              <span>&#183;</span>
              <span>ไม่ต้องติดตั้งแอป</span>
              <span>&#183;</span>
              <span>ใช้งานง่าย</span>
              <span>&#183;</span>
              <span className="flex items-center gap-1"><Clock size={14} className="text-[#E63946]" /> เก็บไว้ดูได้ตลอด</span>
            </div>

            {/* Pricing hint */}
            <p className="mt-4 text-sm text-gray-400">
              สร้างฟรี | เปิดใช้งานเพียง <span className="font-bold text-[#E63946]">99 บาท</span>
            </p>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-24 bg-white" id="features">
        <div className="max-w-6xl mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-[#4A1942] mb-4">
              สร้างของขวัญได้หลากหลาย
            </h2>
            <p className="text-gray-600 text-lg max-w-2xl mx-auto">
              เลือกรูปแบบที่คุณต้องการ และจัดเรียงตามลำดับที่คุณอยากให้เห็น
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              {
                icon: Camera,
                title: 'รูปภาพ',
                description: 'อัพโหลดรูปความทรงจำพิเศษ พร้อมคำบรรยาย',
                color: 'from-pink-500 to-rose-500',
              },
              {
                icon: MessageCircleHeart,
                title: 'ข้อความจากใจ',
                description: 'เขียนข้อความที่อยากบอกให้คนพิเศษได้อ่าน',
                color: 'from-rose-500 to-red-500',
              },
              {
                icon: Music,
                title: 'เพลงประกอบ',
                description: 'เพิ่มเพลงจาก YouTube ที่มีความหมาย',
                color: 'from-red-500 to-pink-500',
              },
              {
                icon: Lock,
                title: 'รหัสลับ',
                description: 'ใส่รหัส PIN สร้างความตื่นเต้นก่อนเปิดดู',
                color: 'from-pink-500 to-purple-500',
              },
              {
                icon: ImagePlus,
                title: 'ข้อความ + รูปภาพ',
                description: 'รวมรูปภาพและข้อความไว้ในหน้าเดียวกัน',
                color: 'from-purple-500 to-pink-500',
              },
              {
                icon: MousePointerClick,
                title: 'สแครชการ์ด',
                description: 'ขูดเพื่อเปิดรูปลับ สร้างเซอร์ไพรส์สุดพิเศษ',
                color: 'from-amber-500 to-orange-500',
              },
              {
                icon: Puzzle,
                title: 'คำถามทายใจ',
                description: 'ตั้งคำถามให้ตอบถูกก่อนดูเนื้อหาถัดไป',
                color: 'from-violet-500 to-purple-500',
              },
              {
                icon: Share2,
                title: 'แชร์ได้ทันที',
                description: 'ส่งลิงก์หรือ QR Code ให้คนพิเศษได้เลย',
                color: 'from-sky-500 to-blue-500',
              },
            ].map((feature, index) => {
              const IconComponent = feature.icon;
              return (
                <div
                  key={index}
                  className="group relative bg-white rounded-2xl p-6 shadow-sm shadow-gray-100 hover:shadow-lg hover:shadow-gray-200 transition-all duration-300 hover:-translate-y-1 border border-gray-100"
                >
                  <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${feature.color} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
                    <IconComponent size={28} className="text-white" />
                  </div>
                  <h3 className="text-lg font-bold text-[#4A1942] mb-2">
                    {feature.title}
                  </h3>
                  <p className="text-gray-500 text-sm">
                    {feature.description}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Social Proof Section */}
      <section className="py-20 bg-[#FFFBF7]">
        <div className="max-w-4xl mx-auto px-4">
          <h2 className="text-3xl md:text-4xl font-bold text-[#4A1942] mb-4 text-center">
            คนใช้จริง พูดจริง
          </h2>
          <p className="text-gray-500 text-center mb-12">
            เสียงจากผู้ใช้ที่สร้างความทรงจำให้คนสำคัญ
          </p>
          <div className="grid md:grid-cols-3 gap-6">
            {[
              {
                quote: 'แฟนเปิดดูแล้วร้องไห้เลย ดีใจมากที่ลงมือทำเอง',
                occasion: 'วันวาเลนไทน์',
                color: 'border-pink-200',
              },
              {
                quote: 'ใช้เวลาไม่ถึง 10 นาทีก็เสร็จ ผลลัพธ์ออกมาน่ารักมาก',
                occasion: 'วันครบรอบ',
                color: 'border-amber-200',
              },
              {
                quote: 'ส่งให้แม่ตอนวันเกิด แม่ดีใจมากเลย บอกว่าเก็บไว้ดูตลอด',
                occasion: 'วันเกิดแม่',
                color: 'border-blue-200',
              },
            ].map((testimonial, index) => (
              <div key={index} className={`bg-white p-6 rounded-2xl shadow-sm border ${testimonial.color}`}>
                <p className="text-gray-600 mb-4 leading-relaxed">&ldquo;{testimonial.quote}&rdquo;</p>
                <div className="text-sm text-gray-400">{testimonial.occasion}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section id="how-it-works" className="py-24 bg-gradient-to-b from-white to-[#FFF8F0]">
        <div className="max-w-6xl mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-[#4A1942] mb-4">
              3 ขั้นตอนง่ายๆ
            </h2>
            <p className="text-gray-600 text-lg">
              สร้างของขวัญได้ง่ายๆ ไม่กี่นาทีก็เสร็จ
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                step: '1',
                title: 'สร้างความทรงจำใหม่',
                description: 'ตั้งชื่อ เลือกธีม และเริ่มเพิ่มเนื้อหาที่คุณต้องการ',
                icon: Sparkles,
              },
              {
                step: '2',
                title: 'เพิ่มเรื่องราวความทรงจำ',
                description: 'ใส่รูปภาพ ข้อความ เพลง รหัสลับ ตามที่ต้องการ',
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
                    <div className="hidden md:block absolute top-16 left-[60%] w-[80%] h-0.5 bg-gradient-to-r from-[#FF6B9D] to-[#E63946] opacity-20" />
                  )}

                  {/* Step Number */}
                  <div className="relative inline-flex items-center justify-center w-32 h-32 mb-6">
                    <div className="absolute inset-0 bg-gradient-to-br from-[#FF6B9D] to-[#E63946] rounded-full opacity-10 animate-pulse" />
                    <div className="relative w-24 h-24 bg-white rounded-full shadow-md shadow-gray-200 flex items-center justify-center">
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

          {/* Pricing mention */}
          <p className="mt-12 text-center text-gray-500">
            สร้างฟรี ดูตัวอย่างฟรี | เปิดใช้งานเพียง <span className="font-bold text-[#E63946]">99 บาท</span> — เก็บได้ตลอด ส่งกี่ครั้งก็ได้
          </p>
        </div>
      </section>

      {/* Use Case Navigator */}
      <section className="py-24 bg-white" id="use-cases">
        <div className="max-w-6xl mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-[#4A1942] mb-4">
              สร้างความทรงจำสำหรับโอกาสไหน?
            </h2>
            <p className="text-gray-600 text-lg max-w-2xl mx-auto">
              เลือกโอกาสที่ตรงกับคุณ แล้วเริ่มสร้างของขวัญได้เลย
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {USE_CASES.map((useCase) => (
              <Link
                key={useCase.slug}
                href={`/use-case/${useCase.slug}`}
                onClick={() => trackEvent('click_usecase_tile', { use_case: useCase.slug })}
                className="group p-6 rounded-2xl bg-white border border-gray-100 hover:shadow-xl hover:shadow-gray-200/50 hover:-translate-y-1 transition-all duration-300"
              >
                <span className="text-4xl mb-4 block">{useCase.emoji}</span>
                <h3 className="text-xl font-bold text-[#4A1942] mb-2 group-hover:text-[#E63946] transition-colors">
                  {useCase.titleThai}
                </h3>
                <p className="text-gray-500 text-sm">{useCase.subtitleThai}</p>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-24 bg-gradient-to-b from-white to-[#FFF8F0]" id="faq">
        <div className="max-w-4xl mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-[#4A1942] mb-4">
              คำถามที่พบบ่อย
            </h2>
            <p className="text-gray-600 text-lg">
              เกี่ยวกับ The Memory
            </p>
          </div>

          <div className="space-y-4">
            {[
              {
                q: "The Memory คืออะไร?",
                a: "The Memory คือแพลตฟอร์มสำหรับสร้างความทรงจำออนไลน์ส่งให้คนสำคัญ คุณสามารถรวมรูปภาพ ข้อความ เพลง และรหัสลับ ไว้ในลิงก์เดียว แล้วส่งให้คนที่คุณรักได้ทันที เหมาะกับทุกโอกาส ไม่ว่าจะเป็นเซอร์ไพรส์แฟน วันครบรอบ วันเกิด ขอโทษ หรือบอกรักครอบครัว"
              },
              {
                q: "ใช้งานยากไหม? ใช้เวลานานไหม?",
                a: "ไม่ยากเลย! แค่ 3 ขั้นตอนง่ายๆ: 1) สร้างความทรงจำใหม่ 2) เพิ่มรูปภาพ ข้อความ หรือเพลง 3) แชร์ลิงก์ ไม่ต้องติดตั้งแอป ใช้เวลาไม่ถึง 5 นาทีก็เสร็จ"
              },
              {
                q: "ราคาเท่าไร? สร้างฟรีได้ไหม?",
                a: "คุณสามารถสร้างความทรงจำได้ฟรี และดูตัวอย่างก่อนได้ เมื่อพอใจแล้วค่อยชำระเงินเพียง 99 บาท เพื่อเปิดใช้งานและแชร์ให้คนพิเศษของคุณ ลิงก์เก็บไว้ดูได้ตลอด ส่งกี่ครั้งก็ได้"
              },
              {
                q: "ชำระเงินปลอดภัยไหม?",
                a: "ปลอดภัย 100% เราใช้ระบบชำระเงิน Stripe ซึ่งเป็นมาตรฐานเดียวกับ Shopify, Amazon และบริษัทระดับโลก รองรับบัตรเครดิต/เดบิต และ PromptPay"
              },
              {
                q: "คนที่ได้รับลิงก์ต้องสมัครสมาชิกไหม?",
                a: "ไม่ต้องเลย! แค่กดลิงก์ก็เปิดดูได้ทันที ใช้ได้ทั้งมือถือและคอมพิวเตอร์ ไม่ต้องติดตั้งแอป ไม่ต้องสมัครสมาชิก"
              },
              {
                q: "ใส่รหัสผ่านล็อคได้ไหม?",
                a: "ได้ครับ! คุณสามารถใส่รหัส PIN 6 หลักเพื่อล็อคเนื้อหา ทำให้คนพิเศษต้องใส่รหัสก่อนถึงจะเห็นเนื้อหาถัดไป สร้างความตื่นเต้นและความพิเศษ"
              },
            ].map((faq, index) => (
              <div key={index} className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                <button
                  onClick={() => setOpenFaq(openFaq === index ? null : index)}
                  className="w-full p-6 text-left flex items-center justify-between gap-4"
                >
                  <h3 className="text-lg font-bold text-[#4A1942]">
                    {faq.q}
                  </h3>
                  <ChevronDown
                    size={20}
                    className={`text-gray-400 shrink-0 transition-transform duration-200 ${openFaq === index ? 'rotate-180' : ''}`}
                  />
                </button>
                {openFaq === index && (
                  <div className="px-6 pb-6">
                    <p className="text-gray-600 leading-relaxed">
                      {faq.a}
                    </p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 bg-gradient-to-br from-[#FF6B9D] via-[#E63946] to-[#FF6B9D] relative overflow-hidden">
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-10">
          {[...Array(20)].map((_, i) => (
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
            พร้อมส่งความรู้สึกให้คนสำคัญหรือยัง?
          </h2>
          <p className="text-xl md:text-2xl mb-4 opacity-90">
            เริ่มสร้างความทรงจำได้เลย ใช้เวลาไม่ถึง 5 นาที
          </p>
          <p className="text-lg mb-10 opacity-75">
            สร้างฟรี — จ่ายเมื่อพร้อมแชร์
          </p>
          <Link
            href="/login"
            className="inline-flex items-center gap-3 bg-white text-[#E63946] font-bold text-lg py-4 px-10 rounded-full hover:bg-[#FFF8F0] transition-colors shadow-2xl"
          >
            <span>เริ่มสร้างเลย</span>
            <HeartIcon size={24} color="#E63946" />
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 bg-[#4A1942] text-white">
        <div className="max-w-6xl mx-auto px-4">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6 mb-8">
            <div className="flex items-center gap-2">
              <HeartIcon size={24} color="#FF6B9D" />
              <span className="text-xl font-bold">The Memory</span>
            </div>
            <p className="text-pink-200 text-sm">
              แพลตฟอร์มสร้างความทรงจำออนไลน์ให้คนสำคัญ
            </p>
            <div className="flex items-center gap-6 text-sm text-pink-200">
              <Link href="/login" className="hover:text-white transition-colors">
                เข้าสู่ระบบ
              </Link>
              <a href="#features" className="hover:text-white transition-colors">
                ฟีเจอร์
              </a>
              <a href="#use-cases" className="hover:text-white transition-colors">
                โอกาส
              </a>
              <a href="#faq" className="hover:text-white transition-colors">
                คำถาม
              </a>
            </div>
          </div>

          {/* Use case links */}
          <div className="border-t border-pink-900/50 pt-6 pb-4">
            <div className="flex flex-wrap justify-center gap-4 text-sm text-pink-300">
              {USE_CASES.map((uc) => (
                <Link
                  key={uc.slug}
                  href={`/use-case/${uc.slug}`}
                  className="hover:text-white transition-colors"
                >
                  {uc.titleThai}
                </Link>
              ))}
            </div>
          </div>

          {/* Trust & SEO Footer */}
          <div className="border-t border-pink-900/50 pt-6 text-center">
            <p className="text-pink-300 text-sm mb-2">
              ชำระเงินปลอดภัยผ่าน Stripe | สร้างง่าย ส่งลิงก์ได้ทันที | เก็บไว้ดูได้ตลอด
            </p>
            <p className="text-pink-300 text-sm mb-4">
              The Memory - ของขวัญเซอร์ไพรส์แฟน สร้างความทรงจำออนไลน์ เหมาะกับวันครบรอบ วันเกิด ขอโทษ คิดถึง ครอบครัว
            </p>
            <p className="text-pink-400 text-xs">
              ของขวัญเซอร์ไพรส์แฟน | ของขวัญวันครบรอบ | ของขวัญวันเกิด | ง้อแฟน | ของขวัญครอบครัว | ของขวัญโรแมนติก | ไอเดียเซอร์ไพรส์แฟน | ของขวัญความทรงจำ
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
