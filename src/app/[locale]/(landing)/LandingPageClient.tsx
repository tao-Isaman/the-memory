'use client';

import { useEffect, useRef, useState } from 'react';
import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';
import HeartIcon from '@/components/HeartIcon';
import Mascot from '@/components/Mascot';
import LanguageSwitcher from '@/components/LanguageSwitcher';
import DemoMemoryModal from '@/components/DemoMemoryModal';
import HeroPhoneDemo from '@/components/landing/HeroPhoneDemo';
import { trackEvent } from '@/lib/analytics';
import { getThemeColors } from '@/lib/themes';
import { USE_CASES } from '@/data/use-cases';
import {
  ArrowRight,
  BookHeart,
  Camera,
  Check,
  ChevronDown,
  Clock,
  Cake,
  Flower2,
  Gem,
  Gift,
  HeartHandshake,
  ImagePlus,
  Layers,
  Lock,
  MessageCircleHeart,
  MousePointerClick,
  Music,
  PartyPopper,
  Plane,
  Puzzle,
  Quote,
  Share2,
  Shield,
  Smartphone,
  Sparkles,
  Users,
} from 'lucide-react';

interface SiteStats {
  users: number;
  memories: number;
  stories: number;
}

/** Counts from 0 to `end` with an ease-out curve once `start` flips to true. */
function useCountUp(end: number, duration = 1800, start = true) {
  const [count, setCount] = useState(0);
  const startTimeRef = useRef<number | null>(null);

  useEffect(() => {
    if (!start || end === 0) {
      setCount(end);
      return;
    }
    let frame = 0;
    const animate = (timestamp: number) => {
      if (startTimeRef.current === null) startTimeRef.current = timestamp;
      const progress = Math.min((timestamp - startTimeRef.current) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setCount(Math.floor(eased * end));
      if (progress < 1) frame = requestAnimationFrame(animate);
      else setCount(end);
    };
    frame = requestAnimationFrame(animate);
    return () => {
      cancelAnimationFrame(frame);
      startTimeRef.current = null;
    };
  }, [end, duration, start]);

  return count;
}

function StatInline({
  value,
  label,
  icon: Icon,
  start,
}: {
  value: number;
  label: string;
  icon: React.ElementType;
  start: boolean;
}) {
  const count = useCountUp(value, 1800, start);
  return (
    <span className="flex items-center gap-1.5">
      <Icon size={15} className="text-[#E63946]" />
      <strong className="font-kanit font-semibold text-[#4A1942]">{count.toLocaleString()}+</strong>
      <span>{label}</span>
    </span>
  );
}

function SectionHeading({ heading, sub }: { heading: string; sub?: string }) {
  return (
    <div className="mb-10 text-center sm:mb-14">
      <h2 className="font-kanit text-3xl font-extrabold leading-tight text-[#4A1942] sm:text-4xl lg:text-5xl">{heading}</h2>
      {sub && <p className="mx-auto mt-3 max-w-2xl text-sm text-[#6B5E57] sm:text-lg">{sub}</p>}
    </div>
  );
}

const FEATURES = [
  { key: 'image', icon: Camera, tint: '#FFE1EA', ink: '#E63946' },
  { key: 'message', icon: MessageCircleHeart, tint: '#FFE4DE', ink: '#D64545' },
  { key: 'music', icon: Music, tint: '#EEE6FF', ink: '#7C5CBF' },
  { key: 'pin', icon: Lock, tint: '#F3E3EE', ink: '#4A1942' },
  { key: 'textImage', icon: ImagePlus, tint: '#FFE9D6', ink: '#D9742B' },
  { key: 'scratch', icon: MousePointerClick, tint: '#FFF1CC', ink: '#B7791F' },
  { key: 'question', icon: Puzzle, tint: '#E9E3FF', ink: '#6B4FD8' },
  { key: 'share', icon: Share2, tint: '#DCEFFF', ink: '#2B7FD9' },
] as const;

// Occasion tiles use the same line icons as the feature cards (emoji render
// differently on every platform). Unknown slugs fall back to the heart gift.
const OCCASION_ICONS: Record<string, React.ElementType> = {
  'surprise-gift': Gift,
  anniversary: Gem,
  birthday: Cake,
  apology: Flower2,
  'long-distance': Plane,
  family: HeartHandshake,
};

const STEPS = [
  { key: 'one', step: '1', icon: Sparkles },
  { key: 'two', step: '2', icon: Gift },
  { key: 'three', step: '3', icon: PartyPopper },
] as const;

export default function LandingPageClient() {
  const t = useTranslations('landing');
  const tc = useTranslations('useCase.useCases');

  const [demoOpen, setDemoOpen] = useState(false);
  const [stats, setStats] = useState<SiteStats | null>(null);
  const [countStart, setCountStart] = useState(false);
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  const rotate = t.raw('hero.rotate') as string[];
  const pricingItems = t.raw('pricing.items') as string[];
  const testimonials = t.raw('socialProof.items') as { quote: string; occasion: string }[];
  const faqs = t.raw('faq.items') as { q: string; a: string }[];

  useEffect(() => {
    trackEvent('view_home');
    fetch('/api/stats')
      .then((res) => res.json())
      .then((data) => {
        if (data.users !== undefined) {
          setStats(data);
          setTimeout(() => setCountStart(true), 300);
        }
      })
      .catch((err) => console.error('Failed to fetch stats:', err));
  }, []);

  const createCta = (source: string) => () => trackEvent('click_create_cta', { source });

  return (
    <div className="min-h-screen bg-[#FFFBF7] text-[#4A1942]">
      <DemoMemoryModal open={demoOpen} onClose={() => setDemoOpen(false)} />

      {/* ───────────────── Header ───────────────── */}
      <header className="fixed inset-x-0 top-0 z-50 border-b border-[#F5EDE4]/80 bg-[#FFFBF7]/85 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4">
          <Link href="/" className="flex items-center gap-2" aria-label="The Memory">
            <Mascot size={32} emotion="idle" animation="idle" />
            <span className="font-leckerli text-2xl text-[#E63946]">The Memory</span>
          </Link>
          <nav className="flex items-center gap-3 sm:gap-6">
            <a href="#use-cases" className="hidden text-sm text-[#6B5E57] transition-colors hover:text-[#E63946] md:inline">
              {t('footer.occasions')}
            </a>
            <a href="#faq" className="hidden text-sm text-[#6B5E57] transition-colors hover:text-[#E63946] md:inline">
              {t('footer.faq')}
            </a>
            <Link href="/login" className="hidden text-sm font-medium transition-colors hover:text-[#E63946] sm:inline">
              {t('nav.signIn')}
            </Link>
            <Link href="/login" onClick={createCta('nav')} className="btn-primary px-5 py-2 text-sm">
              {t('nav.start')}
            </Link>
          </nav>
        </div>
      </header>

      {/* ───────────────── Hero ───────────────── */}
      <section className="relative overflow-hidden pt-16">
        <div aria-hidden className="pointer-events-none absolute inset-0">
          <div className="absolute -left-24 top-16 h-72 w-72 rounded-full bg-[#FFB6C1]/45 blur-3xl" />
          <div className="absolute -right-24 top-48 h-96 w-96 rounded-full bg-[#FFD9C4]/60 blur-3xl" />
          <div className="absolute left-1/3 top-[36rem] h-64 w-64 rounded-full bg-[#F3E3EE]/70 blur-3xl lg:top-[28rem]" />
        </div>

        <div className="relative z-10 mx-auto grid max-w-6xl items-center gap-12 px-4 pb-16 pt-10 sm:pt-14 lg:grid-cols-12 lg:gap-8 lg:pb-24 lg:pt-20">
          <div className="lg:col-span-7">
            <div className="inline-flex items-center gap-2 rounded-full border border-[#F5EDE4] bg-white/80 px-3.5 py-1.5 text-xs text-[#E63946] shadow-sm sm:text-sm">
              <HeartIcon size={14} filled />
              <span>{t('hero.badge')}</span>
            </div>

            <h1 className="mt-5 font-kanit text-[2.6rem] font-extrabold leading-[1.08] sm:text-6xl lg:text-[4.1rem]">
              {t('hero.titleBottom')}
              <span className="mt-1 block text-[1.7rem] font-bold leading-[1.2] sm:text-4xl lg:text-5xl">
                {t('hero.forPrefix')}{' '}
                <span className="lp-rotate">
                  {rotate.map((word, i) => (
                    <span
                      key={word}
                      className="lp-word bg-gradient-to-r from-[#FF6B9D] to-[#E63946] bg-clip-text text-transparent"
                      style={{ animationDelay: `${i * 2.5}s` }}
                    >
                      {word}
                    </span>
                  ))}
                </span>
              </span>
            </h1>

            <p className="mt-5 max-w-xl text-base leading-relaxed text-[#6B5E57] sm:text-xl">{t('hero.tagline')}</p>

            <div className="mt-7 flex flex-col gap-3 sm:flex-row sm:items-center">
              <Link
                href="/login"
                onClick={createCta('hero')}
                className="btn-primary flex items-center justify-center gap-2 px-8 py-4 text-lg shadow-xl shadow-pink-500/20"
              >
                <span>{t('hero.ctaPrimary')}</span>
                <HeartIcon size={20} color="white" />
              </Link>
              <button type="button" onClick={() => setDemoOpen(true)} className="btn-secondary px-8 py-4 text-lg">
                {t('hero.ctaSecondary')}
              </button>
            </div>

            <div className="mt-6 flex flex-wrap items-center gap-x-5 gap-y-2 text-xs text-[#6B5E57] sm:text-sm">
              <span className="flex items-center gap-1.5">
                <Shield size={15} className="text-emerald-500" />
                {t('trust.secure')}
              </span>
              <span className="flex items-center gap-1.5">
                <Smartphone size={15} className="text-[#E63946]" />
                {t('trust.noApp')}
              </span>
              <span className="flex items-center gap-1.5">
                <Clock size={15} className="text-[#E63946]" />
                {t('trust.forever')}
              </span>
            </div>

            {stats && (stats.users > 0 || stats.memories > 0) && (
              <div className="mt-6 flex flex-wrap items-center gap-x-5 gap-y-2 border-t border-[#F5EDE4] pt-5 text-xs text-[#6B5E57] sm:text-sm">
                <StatInline value={stats.users} label={t('stats.users')} icon={Users} start={countStart} />
                <StatInline value={stats.memories} label={t('stats.memories')} icon={BookHeart} start={countStart} />
                <StatInline value={stats.stories} label={t('stats.stories')} icon={Layers} start={countStart} />
              </div>
            )}
          </div>

          <div className="flex justify-center pt-8 lg:col-span-5 lg:justify-end lg:pt-0">
            <HeroPhoneDemo onOpen={() => setDemoOpen(true)} />
          </div>
        </div>
      </section>

      {/* ───────────────── Occasions ───────────────── */}
      <section id="use-cases" className="py-16 sm:py-24">
        <div className="mx-auto max-w-6xl px-4">
          <SectionHeading heading={t('useCases.heading')} sub={t('useCases.subheading')} />
          <div className="grid grid-cols-2 gap-3 sm:gap-5 lg:grid-cols-3">
            {USE_CASES.map((uc) => {
              const c = getThemeColors(uc.theme);
              const OccasionIcon = OCCASION_ICONS[uc.slug] ?? Gift;
              return (
                <Link
                  key={uc.slug}
                  href={`/use-case/${uc.slug}`}
                  onClick={() => trackEvent('click_usecase_tile', { use_case: uc.slug })}
                  className="group flex flex-col gap-3 rounded-3xl border border-white bg-white/80 p-4 shadow-[0_10px_30px_-14px_rgba(74,25,66,0.18)] transition-[transform,box-shadow] duration-300 motion-reduce:hover:translate-y-0 hover:-translate-y-1 hover:shadow-[0_18px_40px_-16px_rgba(74,25,66,0.28)] sm:p-6"
                >
                  <span
                    aria-hidden
                    className="flex h-12 w-12 items-center justify-center rounded-2xl sm:h-14 sm:w-14"
                    style={{ backgroundColor: c.background, color: c.dark }}
                  >
                    <OccasionIcon size={24} strokeWidth={2} />
                  </span>
                  <div>
                    <h3 className="font-kanit text-base font-bold leading-snug text-[#4A1942] sm:text-xl">{tc(`${uc.slug}.title`)}</h3>
                    <p className="mt-1 text-[13px] leading-relaxed text-[#6B5E57] sm:text-sm">{tc(`${uc.slug}.subtitle`)}</p>
                  </div>
                  <span className="mt-auto inline-flex items-center gap-1 font-kanit text-xs font-medium sm:text-sm" style={{ color: c.dark }}>
                    {t('nav.start')}
                    <ArrowRight size={14} className="transition-transform group-hover:translate-x-0.5" />
                  </span>
                </Link>
              );
            })}
          </div>
        </div>
      </section>

      {/* ───────────────── Features ───────────────── */}
      <section id="features" className="bg-white py-16 sm:py-24">
        <div className="mx-auto max-w-6xl px-4">
          <SectionHeading heading={t('features.heading')} sub={t('features.subheading')} />
          <div className="grid grid-cols-2 gap-3 sm:gap-5 lg:grid-cols-4">
            {FEATURES.map(({ key, icon: Icon, tint, ink }) => (
              <div
                key={key}
                className="rounded-3xl border border-[#F5EDE4] bg-[#FFFBF7] p-4 transition-[transform,box-shadow,background-color] duration-300 hover:-translate-y-1 hover:bg-white motion-reduce:hover:translate-y-0 hover:shadow-[0_18px_40px_-18px_rgba(74,25,66,0.25)] sm:p-6"
              >
                <span className="flex h-11 w-11 items-center justify-center rounded-2xl sm:h-12 sm:w-12" style={{ backgroundColor: tint, color: ink }}>
                  <Icon size={22} />
                </span>
                <h3 className="mt-4 font-kanit text-base font-bold text-[#4A1942] sm:text-lg">{t(`features.${key}.title`)}</h3>
                <p className="mt-1 text-[13px] leading-relaxed text-[#6B5E57] sm:text-sm">{t(`features.${key}.desc`)}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ───────────────── How it works + pricing ───────────────── */}
      <section id="how-it-works" className="py-16 sm:py-24">
        <div className="mx-auto max-w-6xl px-4">
          <SectionHeading heading={t('howItWorks.heading')} sub={t('howItWorks.subheading')} />
          <div className="grid gap-10 lg:grid-cols-12 lg:items-center lg:gap-14">
            <ol className="lg:col-span-7">
              {STEPS.map(({ key, step, icon: Icon }, i) => (
                <li key={key} className="relative flex gap-4 sm:gap-6">
                  <div className="flex flex-col items-center">
                    <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-[#FF6B9D] to-[#E63946] font-kanit text-lg font-bold text-white shadow-lg shadow-pink-500/25">
                      {step}
                    </span>
                    {i < STEPS.length - 1 && <span className="my-2 w-px flex-1 bg-gradient-to-b from-[#FFB6C1] to-transparent" />}
                  </div>
                  <div className={i < STEPS.length - 1 ? 'pb-9' : ''}>
                    <div className="flex items-center gap-2">
                      <Icon size={18} className="text-[#E63946]" />
                      <h3 className="font-kanit text-lg font-bold text-[#4A1942] sm:text-xl">{t(`howItWorks.${key}.title`)}</h3>
                    </div>
                    <p className="mt-1.5 text-sm leading-relaxed text-[#6B5E57] sm:text-base">{t(`howItWorks.${key}.desc`)}</p>
                  </div>
                </li>
              ))}
            </ol>

            <div className="lg:col-span-5">
              <div className="relative overflow-hidden rounded-[2rem] bg-[#4A1942] p-7 text-white shadow-[0_30px_60px_-24px_rgba(74,25,66,0.6)] sm:p-8">
                <HeartIcon size={160} color="#FF6B9D" className="absolute -right-8 -top-10 opacity-20" />
                <p className="font-kanit text-sm font-medium text-pink-200">{t('pricing.heading')}</p>
                <div className="mt-2 flex items-end gap-2">
                  <span className="font-kanit text-6xl font-extrabold leading-none">{t('pricing.price')}</span>
                  <span className="pb-1 text-pink-200">{t('pricing.unit')}</span>
                </div>
                <p className="mt-3 text-sm text-pink-100/90">{t('pricing.sub')}</p>
                <ul className="mt-5 space-y-2.5">
                  {pricingItems.map((item) => (
                    <li key={item} className="flex items-start gap-2.5 text-sm">
                      <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[#FF6B9D]/30">
                        <Check size={12} />
                      </span>
                      {item}
                    </li>
                  ))}
                </ul>
                <Link
                  href="/login"
                  onClick={createCta('pricing')}
                  className="btn-primary mt-6 flex w-full items-center justify-center gap-2 py-3.5 text-base"
                >
                  <span>{t('pricing.cta')}</span>
                  <HeartIcon size={18} color="white" />
                </Link>
                <p className="mt-3 text-center text-xs text-pink-200/80">{t('pricing.note')}</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ───────────────── Social proof ───────────────── */}
      <section className="bg-white py-16 sm:py-24">
        <div className="mx-auto max-w-6xl px-4">
          <SectionHeading heading={t('socialProof.heading')} sub={t('socialProof.subheading')} />
          <div className="-mx-4 flex snap-x snap-mandatory gap-4 overflow-x-auto px-4 pb-2 sm:mx-0 sm:grid sm:grid-cols-3 sm:gap-5 sm:overflow-visible sm:px-0">
            {testimonials.map((item, i) => (
              <figure
                key={i}
                className="flex min-w-[82%] snap-center flex-col rounded-3xl border border-[#F5EDE4] bg-[#FFFBF7] p-6 sm:min-w-0"
              >
                <Quote size={26} className="text-[#FFB6C1]" />
                <blockquote className="mt-3 flex-1 text-base leading-relaxed text-[#4A1942]">{item.quote}</blockquote>
                <figcaption className="mt-5 flex items-center justify-between text-xs text-[#6B5E57]">
                  <span>{item.occasion}</span>
                  <span className="flex gap-0.5" aria-hidden>
                    {Array.from({ length: 5 }).map((_, k) => (
                      <HeartIcon key={k} size={12} />
                    ))}
                  </span>
                </figcaption>
              </figure>
            ))}
          </div>
        </div>
      </section>

      {/* ───────────────── FAQ ───────────────── */}
      <section id="faq" className="py-16 sm:py-24">
        <div className="mx-auto max-w-3xl px-4">
          <SectionHeading heading={t('faq.heading')} sub={t('faq.subheading')} />
          <div className="space-y-3">
            {faqs.map((faq, index) => {
              const open = openFaq === index;
              return (
                <div key={index} className={`rounded-2xl border bg-white transition-colors ${open ? 'border-[#FFB6C1]' : 'border-[#F5EDE4]'}`}>
                  <button
                    type="button"
                    onClick={() => setOpenFaq(open ? null : index)}
                    aria-expanded={open}
                    className="flex w-full items-center justify-between gap-4 p-5 text-left"
                  >
                    <h3 className="font-kanit text-base font-semibold text-[#4A1942] sm:text-lg">{faq.q}</h3>
                    <ChevronDown size={20} className={`shrink-0 text-[#E63946] transition-transform duration-200 ${open ? 'rotate-180' : ''}`} />
                  </button>
                  {open && <p className="px-5 pb-5 text-sm leading-relaxed text-[#6B5E57] sm:text-base">{faq.a}</p>}
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ───────────────── Final CTA ───────────────── */}
      <section className="px-4 pb-20 pt-4 sm:pb-28">
        <div className="relative mx-auto max-w-5xl overflow-hidden rounded-[2.5rem] bg-gradient-to-br from-[#FF6B9D] via-[#E63946] to-[#FF8FB1] px-6 py-14 text-center text-white shadow-[0_30px_70px_-30px_rgba(230,57,70,0.7)] sm:px-12 sm:py-20">
          <HeartIcon size={220} color="white" className="absolute -left-16 -top-16 opacity-10" />
          <HeartIcon size={160} color="white" className="absolute -bottom-12 -right-10 opacity-10" />
          <div className="relative z-10">
            <div className="mb-4 flex justify-center">
              <Mascot size={72} emotion="love" animation="bounce" mono />
            </div>
            <h2 className="font-kanit text-3xl font-extrabold leading-tight sm:text-5xl">{t('finalCta.heading')}</h2>
            <p className="mt-4 text-base text-white/90 sm:text-xl">{t('finalCta.subheading')}</p>
            <p className="mt-2 text-sm text-white/75 sm:text-base">{t('finalCta.note')}</p>
            <Link
              href="/login"
              onClick={createCta('final')}
              className="mt-8 inline-flex items-center gap-2 rounded-full bg-white px-9 py-4 font-kanit text-lg font-bold text-[#E63946] shadow-2xl transition-transform hover:-translate-y-0.5"
            >
              <span>{t('finalCta.button')}</span>
              <HeartIcon size={22} color="#E63946" />
            </Link>
          </div>
        </div>
      </section>

      {/* ───────────────── Footer ───────────────── */}
      <footer className="bg-[#4A1942] py-12 text-white">
        <div className="mx-auto max-w-6xl px-4">
          <div className="flex flex-col items-center justify-between gap-6 md:flex-row">
            <div className="flex items-center gap-2">
              <Mascot size={32} emotion="sleepy" animation="idle" />
              <span className="font-leckerli text-2xl">The Memory</span>
            </div>
            <p className="text-sm text-pink-200">{t('footer.tagline')}</p>
            <div className="flex flex-wrap items-center justify-center gap-x-5 gap-y-2 text-sm text-pink-200">
              <Link href="/login" className="transition-colors hover:text-white">
                {t('footer.signIn')}
              </Link>
              <a href="#features" className="transition-colors hover:text-white">
                {t('footer.features')}
              </a>
              <a href="#use-cases" className="transition-colors hover:text-white">
                {t('footer.occasions')}
              </a>
              <a href="#faq" className="transition-colors hover:text-white">
                {t('footer.faq')}
              </a>
              <Link href="/terms" className="transition-colors hover:text-white">
                {t('footer.terms')}
              </Link>
              <Link href="/privacy" className="transition-colors hover:text-white">
                {t('footer.privacy')}
              </Link>
              <LanguageSwitcher />
            </div>
          </div>

          <div className="mt-8 border-t border-pink-900/50 pt-6">
            <div className="flex flex-wrap justify-center gap-x-5 gap-y-2 text-sm text-pink-300">
              {USE_CASES.map((uc) => (
                <Link key={uc.slug} href={`/use-case/${uc.slug}`} className="transition-colors hover:text-white">
                  {tc(`${uc.slug}.title`)}
                </Link>
              ))}
            </div>
          </div>

          <div className="mt-6 border-t border-pink-900/50 pt-6 text-center">
            <p className="mb-2 text-sm text-pink-300">{t('footer.trustLine')}</p>
            <p className="mb-4 text-sm text-pink-300">{t('footer.seoLine')}</p>
            <p className="text-xs text-pink-400">{t('footer.keywordLine')}</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
