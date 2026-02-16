'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import HeartIcon from '@/components/HeartIcon';
import { trackEvent } from '@/lib/analytics';
import { UseCase } from '@/data/use-cases';
import {
  Camera,
  MessageCircleHeart,
  Music,
  Lock,
  Share2,
  Shield,
  Clock,
  ChevronDown,
  Lightbulb,
  ArrowLeft,
} from 'lucide-react';
import { useState } from 'react';

interface Props {
  useCase: UseCase;
}

export default function UseCasePageClient({ useCase }: Props) {
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  useEffect(() => {
    trackEvent('view_usecase_page', { use_case: useCase.slug });
  }, [useCase.slug]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#FFFBF7] via-white to-[#FFF8F0]">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-[#FFFBF7]/90 backdrop-blur-md border-b border-gray-100">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <HeartIcon size={28} className="animate-pulse-heart" />
            <span className="text-2xl font-bold bg-gradient-to-r from-[#FF6B9D] to-[#E63946] bg-clip-text text-transparent">
              The Memory
            </span>
          </Link>
          <div className="flex items-center gap-4">
            <Link
              href="/login"
              className="text-[#E63946] hover:text-[#FF6B9D] transition-colors font-medium"
            >
              เข้าสู่ระบบ
            </Link>
            <Link
              href={`/login?usecase=${useCase.slug}`}
              className="btn-primary text-sm py-2 px-6"
            >
              เริ่มสร้างเลย
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-32 pb-20 px-4">
        <div className="max-w-4xl mx-auto text-center">
          {/* Back link */}
          <Link
            href="/#use-cases"
            className="inline-flex items-center gap-1 text-sm text-gray-400 hover:text-[#E63946] transition-colors mb-8"
          >
            <ArrowLeft size={14} />
            ดูโอกาสทั้งหมด
          </Link>

          {/* Emoji */}
          <div className="text-6xl mb-6">{useCase.emoji}</div>

          {/* Headline */}
          <h1 className="text-4xl md:text-6xl font-bold text-[#4A1942] mb-6 leading-tight">
            {useCase.heroHeadline}
          </h1>

          {/* Subtext */}
          <p className="text-xl md:text-2xl text-gray-600 mb-10 max-w-2xl mx-auto leading-relaxed">
            {useCase.heroSubtext}
          </p>

          {/* CTA */}
          <Link
            href={`/login?usecase=${useCase.slug}`}
            className="btn-primary text-lg py-4 px-10 inline-flex items-center gap-3 shadow-2xl shadow-pink-500/20"
          >
            <span>{useCase.ctaText}</span>
            <HeartIcon size={20} filled />
          </Link>

          {/* Trust badges */}
          <div className="mt-8 flex flex-wrap items-center justify-center gap-x-4 gap-y-2 text-sm text-[#6B5E57]">
            <span className="flex items-center gap-1"><Shield size={14} className="text-green-500" /> ปลอดภัย 100%</span>
            <span>&#183;</span>
            <span>เพียง 99 บาท</span>
            <span>&#183;</span>
            <span className="flex items-center gap-1"><Clock size={14} className="text-[#E63946]" /> เก็บไว้ดูได้ตลอด</span>
          </div>
        </div>
      </section>

      {/* Features Highlights */}
      <section className="py-16 bg-white">
        <div className="max-w-5xl mx-auto px-4">
          <h2 className="text-3xl font-bold text-[#4A1942] mb-10 text-center">
            ใส่อะไรได้บ้าง?
          </h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { icon: Camera, title: 'รูปภาพ', desc: 'รูปความทรงจำพิเศษ', color: 'from-pink-500 to-rose-500' },
              { icon: MessageCircleHeart, title: 'ข้อความจากใจ', desc: 'เขียนสิ่งที่อยากบอก', color: 'from-rose-500 to-red-500' },
              { icon: Music, title: 'เพลงประกอบ', desc: 'เพลงที่มีความหมาย', color: 'from-red-500 to-pink-500' },
              { icon: Lock, title: 'รหัสลับ', desc: 'สร้างความตื่นเต้น', color: 'from-pink-500 to-purple-500' },
            ].map((feature, index) => {
              const IconComponent = feature.icon;
              return (
                <div key={index} className="text-center p-6 rounded-2xl bg-gray-50 border border-gray-100">
                  <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${feature.color} flex items-center justify-center mx-auto mb-3`}>
                    <IconComponent size={24} className="text-white" />
                  </div>
                  <h3 className="font-bold text-[#4A1942] mb-1">{feature.title}</h3>
                  <p className="text-sm text-gray-500">{feature.desc}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Sample Prompts Section */}
      {useCase.samplePrompts.length > 0 && (
        <section className="py-16 bg-[#FFFBF7]">
          <div className="max-w-3xl mx-auto px-4">
            <div className="flex items-center justify-center gap-2 mb-8">
              <Lightbulb size={24} className="text-amber-500" />
              <h2 className="text-2xl font-bold text-[#4A1942]">
                ไม่รู้จะเขียนอะไร? ลองแบบนี้
              </h2>
            </div>
            <div className="space-y-4">
              {useCase.samplePrompts.map((prompt, index) => (
                <div
                  key={index}
                  className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm"
                >
                  <p className="text-gray-600 italic leading-relaxed">&ldquo;{prompt}&rdquo;</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* How it works */}
      <section className="py-16 bg-white">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold text-[#4A1942] mb-10">
            3 ขั้นตอนง่ายๆ
          </h2>
          <div className="grid md:grid-cols-3 gap-8">
            {[
              { step: '1', title: 'สร้างความทรงจำ', desc: 'เลือกธีมและเริ่มเพิ่มเนื้อหา' },
              { step: '2', title: 'เพิ่มเรื่องราว', desc: 'ใส่รูปภาพ ข้อความ เพลง ตามใจ' },
              { step: '3', title: 'ส่งให้คนพิเศษ', desc: 'ส่งลิงก์หรือ QR Code ได้เลย' },
            ].map((item, index) => (
              <div key={index} className="text-center">
                <div className="w-12 h-12 bg-gradient-to-br from-[#FF6B9D] to-[#E63946] rounded-full flex items-center justify-center text-white font-bold text-lg mx-auto mb-4">
                  {item.step}
                </div>
                <h3 className="font-bold text-[#4A1942] mb-2">{item.title}</h3>
                <p className="text-sm text-gray-500">{item.desc}</p>
              </div>
            ))}
          </div>
          <p className="mt-10 text-gray-500">
            สร้างฟรี ดูตัวอย่างฟรี | เปิดใช้งานเพียง <span className="font-bold text-[#E63946]">99 บาท</span>
          </p>
        </div>
      </section>

      {/* FAQ */}
      {useCase.faqItems.length > 0 && (
        <section className="py-16 bg-[#FFFBF7]">
          <div className="max-w-3xl mx-auto px-4">
            <h2 className="text-3xl font-bold text-[#4A1942] mb-10 text-center">
              คำถามที่พบบ่อย
            </h2>
            <div className="space-y-4">
              {useCase.faqItems.map((faq, index) => (
                <div key={index} className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                  <button
                    onClick={() => setOpenFaq(openFaq === index ? null : index)}
                    className="w-full p-5 text-left flex items-center justify-between gap-4"
                  >
                    <h3 className="font-bold text-[#4A1942]">{faq.q}</h3>
                    <ChevronDown
                      size={18}
                      className={`text-gray-400 shrink-0 transition-transform duration-200 ${openFaq === index ? 'rotate-180' : ''}`}
                    />
                  </button>
                  {openFaq === index && (
                    <div className="px-5 pb-5">
                      <p className="text-gray-600 leading-relaxed">{faq.a}</p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Final CTA */}
      <section className="py-20 bg-gradient-to-br from-[#FF6B9D] via-[#E63946] to-[#FF6B9D] text-white text-center">
        <div className="max-w-4xl mx-auto px-4">
          <h2 className="text-3xl md:text-5xl font-bold mb-6">
            พร้อม{useCase.titleThai}หรือยัง?
          </h2>
          <p className="text-xl mb-4 opacity-90">
            ใช้เวลาไม่ถึง 5 นาที สร้างฟรี จ่ายเมื่อพร้อมแชร์
          </p>
          <Link
            href={`/login?usecase=${useCase.slug}`}
            className="inline-flex items-center gap-3 bg-white text-[#E63946] font-bold text-lg py-4 px-10 rounded-full hover:bg-[#FFF8F0] transition-colors shadow-2xl mt-4"
          >
            <span>{useCase.ctaText}</span>
            <HeartIcon size={24} color="#E63946" />
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 bg-[#4A1942] text-white text-center">
        <div className="max-w-6xl mx-auto px-4">
          <div className="flex items-center justify-center gap-2 mb-4">
            <HeartIcon size={20} color="#FF6B9D" />
            <span className="font-bold">The Memory</span>
          </div>
          <p className="text-pink-300 text-sm mb-2">
            แพลตฟอร์มสร้างความทรงจำออนไลน์ให้คนสำคัญ
          </p>
          <div className="flex items-center justify-center gap-4 text-sm text-pink-300">
            <Link href="/" className="hover:text-white transition-colors">หน้าแรก</Link>
            <Link href="/login" className="hover:text-white transition-colors">เข้าสู่ระบบ</Link>
            <Link href="/#faq" className="hover:text-white transition-colors">คำถาม</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
