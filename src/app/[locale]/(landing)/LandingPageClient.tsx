'use client';

import { useEffect, useState, useRef } from 'react';
import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';
import HeartIcon from '@/components/HeartIcon';
import Mascot from '@/components/Mascot';
import MascotWalker from '@/components/MascotWalker';
import LanguageSwitcher from '@/components/LanguageSwitcher';
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
  startAnimation,
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

const FEATURE_KEYS = [
  { key: 'image', icon: Camera, color: 'from-pink-500 to-rose-500' },
  { key: 'message', icon: MessageCircleHeart, color: 'from-rose-500 to-red-500' },
  { key: 'music', icon: Music, color: 'from-red-500 to-pink-500' },
  { key: 'pin', icon: Lock, color: 'from-pink-500 to-purple-500' },
  { key: 'textImage', icon: ImagePlus, color: 'from-purple-500 to-pink-500' },
  { key: 'scratch', icon: MousePointerClick, color: 'from-amber-500 to-orange-500' },
  { key: 'question', icon: Puzzle, color: 'from-violet-500 to-purple-500' },
  { key: 'share', icon: Share2, color: 'from-sky-500 to-blue-500' },
] as const;

const STEP_KEYS = [
  { key: 'one', step: '1', icon: Sparkles },
  { key: 'two', step: '2', icon: Gift },
  { key: 'three', step: '3', icon: PartyPopper },
] as const;

const TESTIMONIAL_BORDERS = ['border-pink-200', 'border-amber-200', 'border-blue-200'];

/** Scattered decoration behind the final CTA. Fixed so SSG HTML and hydration agree. */
const CTA_HEARTS = [
  { left: 4, top: 12, size: 62 },
  { left: 13, top: 68, size: 44 },
  { left: 21, top: 33, size: 88 },
  { left: 28, top: 84, size: 52 },
  { left: 34, top: 7, size: 70 },
  { left: 41, top: 52, size: 46 },
  { left: 47, top: 91, size: 96 },
  { left: 53, top: 24, size: 58 },
  { left: 60, top: 63, size: 42 },
  { left: 66, top: 15, size: 78 },
  { left: 72, top: 45, size: 54 },
  { left: 77, top: 88, size: 66 },
  { left: 83, top: 29, size: 48 },
  { left: 88, top: 71, size: 92 },
  { left: 93, top: 9, size: 56 },
  { left: 97, top: 55, size: 40 },
  { left: 9, top: 44, size: 74 },
  { left: 17, top: 96, size: 50 },
  { left: 57, top: 78, size: 84 },
  { left: 69, top: 97, size: 60 },
];

export default function LandingPageClient() {
  const t = useTranslations('landing');
  const tc = useTranslations('useCase.useCases');

  const [isVisible, setIsVisible] = useState(false);
  const [stats, setStats] = useState<SiteStats | null>(null);
  const [startCountAnimation, setStartCountAnimation] = useState(false);
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  const testimonials = t.raw('socialProof.items') as { quote: string; occasion: string }[];
  const faqs = t.raw('faq.items') as { q: string; a: string }[];

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
            <Mascot size={36} emotion="idle" animation="idle" />
            <span className="text-2xl font-bold bg-gradient-to-r from-[#FF6B9D] to-[#E63946] bg-clip-text text-transparent">
              The Memory
            </span>
          </div>
          <div className="flex items-center gap-4">
            <Link
              href="/login"
              className="text-[#E63946] hover:text-[#FF6B9D] transition-colors font-medium"
            >
              {t('nav.signIn')}
            </Link>
            <Link href="/login" className="btn-primary text-sm py-2 px-6">
              {t('nav.start')}
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative min-h-screen flex items-center justify-center pt-20 overflow-hidden">
        {/* Animated Background Hearts */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          {[
            { left: 8, top: 15, delay: 0.2, duration: 5.5, size: 28 },
            { left: 22, top: 70, delay: 1.4, duration: 6.8, size: 40 },
            { left: 35, top: 35, delay: 2.1, duration: 4.5, size: 22 },
            { left: 48, top: 82, delay: 0.8, duration: 7.2, size: 34 },
            { left: 60, top: 12, delay: 3.0, duration: 5.0, size: 48 },
            { left: 72, top: 55, delay: 1.1, duration: 6.0, size: 26 },
            { left: 85, top: 28, delay: 2.6, duration: 7.8, size: 38 },
            { left: 92, top: 75, delay: 0.5, duration: 4.8, size: 30 },
            { left: 15, top: 48, delay: 3.4, duration: 6.5, size: 44 },
            { left: 55, top: 60, delay: 1.8, duration: 5.3, size: 24 },
            { left: 78, top: 88, delay: 2.3, duration: 7.0, size: 36 },
            { left: 40, top: 5, delay: 0.9, duration: 6.2, size: 32 },
          ].map((h, i) => (
            <div
              key={i}
              className="absolute animate-float opacity-[0.06]"
              style={{
                left: `${h.left}%`,
                top: `${h.top}%`,
                animationDelay: `${h.delay}s`,
                animationDuration: `${h.duration}s`,
              }}
            >
              <HeartIcon size={h.size} color="#E8A0B5" />
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
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-[#FFF8F0] border border-[#F5EDE4] rounded-full text-sm text-[#E63946] mb-14 md:mb-16">
              <HeartIcon size={16} filled />
              <span>{t('hero.badge')}</span>
            </div>

            {/* Main Headline — the mascot walks around this block, tap it for a reaction */}
            <div className="relative w-fit mx-auto px-4 py-2 mb-14 md:mb-16">
              <h1 className="text-5xl md:text-7xl font-bold leading-tight">
                <span className="font-leckerli font-normal bg-gradient-to-r from-[#FF6B9D] via-[#E63946] to-[#FF6B9D] bg-clip-text text-transparent">
                  {t('hero.titleTop')}
                </span>
                <br />
                <span className="text-[#4A1942] text-3xl md:text-5xl">
                  {t('hero.titleBottom')}
                </span>
              </h1>
              <MascotWalker variant="orbit" size={56} className="hidden sm:block" />
              <MascotWalker variant="orbit" size={40} className="sm:hidden" />
            </div>

            {/* Stats below headline */}
            {stats && (stats.users > 0 || stats.memories > 0 || stats.stories > 0) && (
              <div className="inline-flex items-center justify-center gap-6 md:gap-10 mb-8 bg-white/60 backdrop-blur-sm rounded-2xl px-8 py-4 border border-gray-100">
                <AnimatedStat
                  value={stats.users}
                  label={t('stats.users')}
                  icon={Users}
                  startAnimation={startCountAnimation}
                />
                <div className="h-12 w-px bg-gray-200" />
                <AnimatedStat
                  value={stats.memories}
                  label={t('stats.memories')}
                  icon={BookHeart}
                  startAnimation={startCountAnimation}
                />
                <div className="h-12 w-px bg-gray-200" />
                <AnimatedStat
                  value={stats.stories}
                  label={t('stats.stories')}
                  icon={Layers}
                  startAnimation={startCountAnimation}
                />
              </div>
            )}

            {/* Subheadline */}
            <p className="text-xl md:text-2xl text-gray-600 mb-4 max-w-2xl mx-auto leading-relaxed">
              {t('hero.tagline')}
            </p>
            <p className="text-lg text-[#6B5E57] mb-10">
              {t.rich('hero.occasions', {
                b: (chunks) => <strong>{chunks}</strong>,
              })}
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link
                href="/login"
                className="btn-primary text-lg py-4 px-10 flex items-center gap-3 shadow-2xl shadow-pink-500/20"
              >
                <span>{t('hero.ctaPrimary')}</span>
                <HeartIcon size={20} filled />
              </Link>
              <a href="#how-it-works" className="btn-secondary text-lg py-4 px-10">
                {t('hero.ctaSecondary')}
              </a>
            </div>

            {/* Trust Badges */}
            <div className="mt-8 flex flex-wrap items-center justify-center gap-x-4 gap-y-2 text-sm text-[#6B5E57]">
              <span className="flex items-center gap-1">
                <Shield size={14} className="text-green-500" /> {t('trust.secure')}
              </span>
              <span>&#183;</span>
              <span>{t('trust.noApp')}</span>
              <span>&#183;</span>
              <span>{t('trust.easy')}</span>
              <span>&#183;</span>
              <span className="flex items-center gap-1">
                <Clock size={14} className="text-[#E63946]" /> {t('trust.forever')}
              </span>
            </div>

            {/* Pricing hint */}
            <p className="mt-4 text-sm text-gray-400">
              {t.rich('hero.pricingHint', {
                price: (chunks) => <span className="font-bold text-[#E63946]">{chunks}</span>,
              })}
            </p>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-24 bg-white" id="features">
        <div className="max-w-6xl mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-[#4A1942] mb-4">
              {t('features.heading')}
            </h2>
            <p className="text-gray-600 text-lg max-w-2xl mx-auto">
              {t('features.subheading')}
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {FEATURE_KEYS.map((feature) => {
              const IconComponent = feature.icon;
              return (
                <div
                  key={feature.key}
                  className="group relative bg-white rounded-2xl p-6 shadow-sm shadow-gray-100 hover:shadow-lg hover:shadow-gray-200 transition-all duration-300 hover:-translate-y-1 border border-gray-100"
                >
                  <div
                    className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${feature.color} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}
                  >
                    <IconComponent size={28} className="text-white" />
                  </div>
                  <h3 className="text-lg font-bold text-[#4A1942] mb-2">
                    {t(`features.${feature.key}.title`)}
                  </h3>
                  <p className="text-gray-500 text-sm">
                    {t(`features.${feature.key}.desc`)}
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
            {t('socialProof.heading')}
          </h2>
          <p className="text-gray-500 text-center mb-12">
            {t('socialProof.subheading')}
          </p>
          <div className="grid md:grid-cols-3 gap-6">
            {testimonials.map((testimonial, index) => (
              <div
                key={index}
                className={`bg-white p-6 rounded-2xl shadow-sm border ${
                  TESTIMONIAL_BORDERS[index % TESTIMONIAL_BORDERS.length]
                }`}
              >
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
              {t('howItWorks.heading')}
            </h2>
            <p className="text-gray-600 text-lg">{t('howItWorks.subheading')}</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {STEP_KEYS.map((item, index) => {
              const IconComponent = item.icon;
              return (
                <div key={item.key} className="relative text-center">
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
                    {t(`howItWorks.${item.key}.title`)}
                  </h3>
                  <p className="text-gray-600 max-w-xs mx-auto">
                    {t(`howItWorks.${item.key}.desc`)}
                  </p>
                </div>
              );
            })}
          </div>

          {/* Pricing mention */}
          <p className="mt-12 text-center text-gray-500">
            {t.rich('howItWorks.pricingNote', {
              price: (chunks) => <span className="font-bold text-[#E63946]">{chunks}</span>,
            })}
          </p>
        </div>
      </section>

      {/* Use Case Navigator */}
      <section className="py-24 bg-white" id="use-cases">
        <div className="max-w-6xl mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-[#4A1942] mb-4">
              {t('useCases.heading')}
            </h2>
            <p className="text-gray-600 text-lg max-w-2xl mx-auto">
              {t('useCases.subheading')}
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
                  {tc(`${useCase.slug}.title`)}
                </h3>
                <p className="text-gray-500 text-sm">{tc(`${useCase.slug}.subtitle`)}</p>
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
              {t('faq.heading')}
            </h2>
            <p className="text-gray-600 text-lg">{t('faq.subheading')}</p>
          </div>

          <div className="space-y-4">
            {faqs.map((faq, index) => (
              <div
                key={index}
                className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden"
              >
                <button
                  onClick={() => setOpenFaq(openFaq === index ? null : index)}
                  className="w-full p-6 text-left flex items-center justify-between gap-4"
                >
                  <h3 className="text-lg font-bold text-[#4A1942]">{faq.q}</h3>
                  <ChevronDown
                    size={20}
                    className={`text-gray-400 shrink-0 transition-transform duration-200 ${
                      openFaq === index ? 'rotate-180' : ''
                    }`}
                  />
                </button>
                {openFaq === index && (
                  <div className="px-6 pb-6">
                    <p className="text-gray-600 leading-relaxed">{faq.a}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 bg-gradient-to-br from-[#FF6B9D] via-[#E63946] to-[#FF6B9D] relative overflow-hidden">
        {/* Background Pattern — fixed positions, not Math.random(): this page is
            statically prerendered, so random values would differ between the server
            HTML and the client render and trip a hydration mismatch. */}
        <div className="absolute inset-0 opacity-10">
          {CTA_HEARTS.map((h, i) => (
            <HeartIcon
              key={i}
              size={h.size}
              color="white"
              className="absolute"
              style={{
                left: `${h.left}%`,
                top: `${h.top}%`,
              }}
            />
          ))}
        </div>

        <div className="relative z-10 max-w-4xl mx-auto px-4 text-center text-white">
          <h2 className="text-4xl md:text-6xl font-bold mb-6">{t('finalCta.heading')}</h2>
          <p className="text-xl md:text-2xl mb-4 opacity-90">{t('finalCta.subheading')}</p>
          <p className="text-lg mb-10 opacity-75">{t('finalCta.note')}</p>
          <Link
            href="/login"
            className="inline-flex items-center gap-3 bg-white text-[#E63946] font-bold text-lg py-4 px-10 rounded-full hover:bg-[#FFF8F0] transition-colors shadow-2xl"
          >
            <span>{t('finalCta.button')}</span>
            <HeartIcon size={24} color="#E63946" />
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 bg-[#4A1942] text-white">
        <div className="max-w-6xl mx-auto px-4">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6 mb-8">
            <div className="flex items-center gap-2">
              <Mascot size={32} emotion="sleepy" animation="idle" />
              <span className="text-xl font-bold">The Memory</span>
            </div>
            <p className="text-pink-200 text-sm">{t('footer.tagline')}</p>
            <div className="flex flex-wrap items-center justify-center gap-6 text-sm text-pink-200">
              <Link href="/login" className="hover:text-white transition-colors">
                {t('footer.signIn')}
              </Link>
              <a href="#features" className="hover:text-white transition-colors">
                {t('footer.features')}
              </a>
              <a href="#use-cases" className="hover:text-white transition-colors">
                {t('footer.occasions')}
              </a>
              <a href="#faq" className="hover:text-white transition-colors">
                {t('footer.faq')}
              </a>
              <Link href="/terms" className="hover:text-white transition-colors">
                {t('footer.terms')}
              </Link>
              <Link href="/privacy" className="hover:text-white transition-colors">
                {t('footer.privacy')}
              </Link>
              <LanguageSwitcher />
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
                  {tc(`${uc.slug}.title`)}
                </Link>
              ))}
            </div>
          </div>

          {/* Trust & SEO Footer */}
          <div className="border-t border-pink-900/50 pt-6 text-center">
            <p className="text-pink-300 text-sm mb-2">{t('footer.trustLine')}</p>
            <p className="text-pink-300 text-sm mb-4">{t('footer.seoLine')}</p>
            <p className="text-pink-400 text-xs">{t('footer.keywordLine')}</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
