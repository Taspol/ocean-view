'use client';

import Image from 'next/image';
import Link from 'next/link';
import React, { useEffect, useRef, useState } from 'react';
import {
  AnimatePresence,
  motion,
  useScroll,
  useTransform,
} from 'framer-motion';

type StoryStep = {
  id: string;
  eyebrow: string;
  title: string;
  body: string;
  accent: string;
  metricA: string;
  metricB: string;
  screenshot: string;
};

const STORY_STEPS: StoryStep[] = [
  {
    id: 'line-oa',
    eyebrow: 'Instant Entry',
    title: 'Can Access through Line OA',
    body: 'Launch the platform directly from LINE Official Account for a smooth, one-tap start your crew can use anywhere.',
    accent: 'from-lime-400/60 to-green-500/60',
    metricA: 'One-tap access',
    metricB: 'LINE-ready workflow',
    screenshot: '/ui_features/1.PNG',
  },
  {
    id: 'dashboard',
    eyebrow: 'Ocean Command Center',
    title: 'Overview every ocean zone in one glance',
    body: 'Scan sea-state signals, zone conditions, and operational context from a single mission-ready view built for fast marine decisions.',
    accent: 'from-cyan-400/60 to-blue-500/60',
    metricA: 'Multi-zone visibility',
    metricB: 'Live environment sync',
    screenshot: '/ui_features/1.PNG',
  },
  {
    id: 'alerts',
    eyebrow: 'Map Intelligence',
    title: 'Explore fishing zones and save maps offline',
    body: 'Inspect productive areas on the fishing map, then download tiles for no-signal scenarios so your team stays navigation-ready anywhere.',
    accent: 'from-amber-400/60 to-orange-500/60',
    metricA: 'Interactive zone layers',
    metricB: 'Offline map downloads',
    screenshot: '/ui_features/2.PNG',
  },
  {
    id: 'analytics',
    eyebrow: 'Prediction Engine',
    title: 'Generate high-confidence fishing zone predictions',
    body: 'Run smart zone forecasts using ocean signals and historical patterns to prioritize where to fish with greater confidence.',
    accent: 'from-emerald-400/60 to-teal-500/60',
    metricA: 'Zone probability scoring',
    metricB: 'Prediction history',
    screenshot: '/ui_features/3.PNG',
  },
  {
    id: 'team',
    eyebrow: 'Weather Readiness',
    title: 'Forecast weather and wave levels before departure',
    body: 'Monitor upcoming wind, weather, and wave trends to plan safer departures, reduce uncertainty, and protect every mission window.',
    accent: 'from-violet-400/60 to-indigo-500/60',
    metricA: 'Wave-height outlook',
    metricB: 'Trip safety planning',
    screenshot: '/ui_features/4.PNG',
  },
];

function PhoneFrame({ activeIndex }: { activeIndex: number }) {

  return (
    <div className="relative mx-auto w-[min(68vw,245px)] sm:w-[min(74vw,278px)] lg:w-[min(84vw,320px)]">
      <div className="absolute inset-0 -z-10 scale-110 rounded-[3.2rem] bg-gradient-to-b from-cyan-200/40 via-blue-200/20 to-transparent blur-2xl" />

      <motion.div
        className="pointer-events-none absolute -left-40 top-24 hidden rounded-2xl border border-slate-200/70 bg-white/85 px-3 py-2 text-xs text-slate-700 shadow-lg backdrop-blur lg:block"
        animate={{ y: [0, -6, 0] }}
        transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
      >
        {STORY_STEPS[activeIndex].metricA}
      </motion.div>
      <motion.div
        className="pointer-events-none absolute -right-40 top-40 hidden rounded-2xl border border-slate-200/70 bg-white/85 px-3 py-2 text-xs text-slate-700 shadow-lg backdrop-blur lg:block"
        animate={{ y: [0, 6, 0] }}
        transition={{ duration: 2.8, repeat: Infinity, ease: 'easeInOut' }}
      >
        {STORY_STEPS[activeIndex].metricB}
      </motion.div>

      <div className="relative rounded-[3rem] border-[0.5px] border-slate-200/70 bg-slate-900 p-[7px] shadow-[0_30px_90px_-35px_rgba(15,23,42,0.7)]">
        <div className="rounded-[2.5rem] bg-black p-[3px]">
          <div className="relative aspect-[9/19.5] overflow-hidden rounded-[2.15rem] bg-slate-950">
            <div className="pointer-events-none absolute left-1/2 top-2 z-30 h-6 w-24 -translate-x-1/2 rounded-full bg-black" />

            <div className="absolute inset-0">
              <div className="absolute inset-0 bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950" />
              <div className="absolute -left-16 top-16 h-40 w-40 rounded-full bg-cyan-400/20 blur-3xl" />
              <div className="absolute -right-10 top-44 h-40 w-40 rounded-full bg-violet-400/20 blur-3xl" />
            </div>

            {/* Image fills entire screen */}
            <div className="absolute inset-0">
              {STORY_STEPS.map((step, index) => (
                <motion.div
                  key={step.id}
                  className="absolute inset-0"
                  initial={false}
                  animate={{ opacity: index === activeIndex ? 1 : 0 }}
                  transition={{ duration: 0.35, ease: 'easeOut' }}
                >
                  <Image
                    src={step.screenshot}
                    alt={`${step.title} preview`}
                    fill
                    sizes="(max-width: 1068px) 260px, 300px"
                    className="object-contain object-top"
                    priority={step.id === 'dashboard'}
                  />
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function ScrollPhoneLanding() {
  const storyRef = useRef<HTMLElement | null>(null);
  const phoneColumnRef = useRef<HTMLDivElement | null>(null);
  const phoneFrameRef = useRef<HTMLDivElement | null>(null);
  const textColumnRef = useRef<HTMLDivElement | null>(null);

  const { scrollYProgress } = useScroll({
    target: storyRef,
    offset: ['start start', 'end end'],
  });

  const [activeIndex, setActiveIndex] = useState(0);
  const [phonePinMode, setPhonePinMode] = useState<'start' | 'fixed' | 'end'>('start');
  const [hideNavbar, setHideNavbar] = useState(false);
  const gridContainerRef = useRef<HTMLDivElement | null>(null);
  const [gridOffsetTop, setGridOffsetTop] = useState(0);
  const backgroundY = useTransform(scrollYProgress, [0, 1], [0, -140]);

  useEffect(() => {
    const previousBodyOverflow = document.body.style.overflow;
    const previousHtmlScrollBehavior = document.documentElement.style.scrollBehavior;

    document.body.style.overflow = 'auto';
    document.documentElement.style.scrollBehavior = 'smooth';

    return () => {
      document.body.style.overflow = previousBodyOverflow;
      document.documentElement.style.scrollBehavior = previousHtmlScrollBehavior;
    };
  }, []);

  useEffect(() => {
    let lastY = window.scrollY;

    const updateNavbarVisibility = () => {
      const currentY = window.scrollY;
      const scrollingDown = currentY > lastY;
      const passedThreshold = currentY > 36;
      setHideNavbar(scrollingDown && passedThreshold);
      lastY = currentY;
    };

    window.addEventListener('scroll', updateNavbarVisibility, { passive: true });

    return () => {
      window.removeEventListener('scroll', updateNavbarVisibility);
    };
  }, []);

  useEffect(() => {
    const updatePhonePin = () => {
      if (!storyRef.current || !phoneColumnRef.current || !phoneFrameRef.current || !textColumnRef.current || !gridContainerRef.current) return;

      const storyTop = storyRef.current.offsetTop;
      const storyHeight = storyRef.current.offsetHeight;
      const scrollable = Math.max(1, storyHeight - window.innerHeight);
      const traveled = Math.min(Math.max(window.scrollY - storyTop, 0), scrollable);
      const normalized = traveled / scrollable;
      const nextIndex = Math.min(
        STORY_STEPS.length - 1,
        Math.max(0, Math.floor(normalized * STORY_STEPS.length)),
      );
      setActiveIndex(nextIndex);

      const isDesktop = window.matchMedia('(min-width: 768px)').matches;
      const topOffset = isDesktop ? 64 : 84;
      const sectionRect = storyRef.current.getBoundingClientRect();
      const frameHeight = phoneFrameRef.current.offsetHeight;
      const viewportHeight = window.innerHeight;
      const pinTop = topOffset + (viewportHeight - topOffset - frameHeight) / 2;

      if (sectionRect.top > topOffset) {
        setPhonePinMode('start');
      } else if (sectionRect.bottom <= pinTop + frameHeight) {
        setPhonePinMode('end');
      } else {
        setPhonePinMode('fixed');
      }

      setGridOffsetTop(gridContainerRef.current.getBoundingClientRect().top + window.scrollY);
    };

    updatePhonePin();
    window.addEventListener('scroll', updatePhonePin, { passive: true });
    window.addEventListener('resize', updatePhonePin);

    return () => {
      window.removeEventListener('scroll', updatePhonePin);
      window.removeEventListener('resize', updatePhonePin);
    };
  }, []);

  return (
    <main className="relative min-h-[100svh] w-full flex-1 overflow-x-hidden bg-slate-50 text-slate-900">
      <motion.div style={{ y: backgroundY }} className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute -top-40 left-1/2 h-[28rem] w-[28rem] -translate-x-1/2 rounded-full bg-cyan-300/30 blur-3xl" />
        <div className="absolute top-[36rem] -left-24 h-80 w-80 rounded-full bg-blue-300/20 blur-3xl" />
        <div className="absolute right-0 top-[70rem] h-80 w-80 rounded-full bg-indigo-200/30 blur-3xl" />
      </motion.div>

      <header
        className={`fixed left-1/2 top-4 z-40 w-[min(94vw,980px)] -translate-x-1/2 transition-all duration-300 ${
          hideNavbar ? 'pointer-events-none -translate-y-24 opacity-0' : 'translate-y-0 opacity-100'
        }`}
      >
        <div className="flex h-16 items-center justify-between rounded-full border border-slate-200/80 bg-white/80 px-4 shadow-[0_12px_40px_-24px_rgba(15,23,42,0.55)] backdrop-blur-xl sm:px-6 lg:px-8">
          <div className="text-base font-semibold tracking-[0.16em] text-slate-700">OCEAN FISHING</div>
          <nav className="hidden items-center gap-6 text-base text-slate-600 md:flex">
            <a href="#hero" className="hover:text-slate-900">Introduction</a>
            <a href="#story" className="hover:text-slate-900">Features</a>
            <a href="#pricing" className="hover:text-slate-900">Pricing</a>
            <Link href="/login" className="rounded-full bg-slate-900 px-5 py-2.5 text-base text-white hover:bg-slate-700">
              Sign In
            </Link>
          </nav>
          <div className="md:hidden">
            <Link href="/login" className="rounded-full bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-700">
              Sign In
            </Link>
          </div>
        </div>
      </header>

      <section id="hero" className="flex min-h-[100svh] w-full flex-col justify-center px-8 pb-12 pt-28 sm:px-12 sm:pb-30 lg:px-20 lg:pt-32 xl:px-24">
        <p className="mb-5 text-sm font-semibold uppercase tracking-[0.2em] text-cyan-700">Ocean Monitoring Platform</p>
        <h1 className="max-w-4xl text-3xl font-semibold leading-tight text-slate-900 sm:text-6xl md:text-7xl">
          Navigate faster decisions
          <br />
          with a dashboard built for sea operations.
        </h1>
        <p className="mt-6 max-w-2xl text-base leading-relaxed text-slate-600 sm:text-xl">
          Premium analytics for captains and teams. Monitor changing ocean conditions and fishing zone visualization.
        </p>
        <div className="mt-8 flex flex-wrap gap-3">
          <a href="#story" className="rounded-full bg-slate-900 px-5 py-2.5 text-sm font-medium text-white hover:bg-slate-700 sm:px-6 sm:py-3 sm:text-base">
            Explore Story
          </a>
          <Link href="/login" className="rounded-full border border-slate-300 px-5 py-2.5 text-sm font-medium text-slate-800 hover:bg-white sm:px-6 sm:py-3 sm:text-base">
            Open Dashboard
          </Link>
        </div>
      </section>

      <section id="story" ref={storyRef} className="relative -mt-20 min-h-[360svh] md:mt-0 md:min-h-[460svh]">
        <div
          ref={gridContainerRef}
          className={
            phonePinMode === 'fixed'
              ? 'fixed left-0 right-0 top-7 z-20 md:top-14'
              : phonePinMode === 'end'
                ? 'absolute bottom-0 left-0 right-0'
                : 'relative'
          }
          style={
            phonePinMode === 'fixed'
              ? {
                  width: '100%',
                }
              : undefined
          }
        >
          <div className="grid h-full w-full grid-cols-1 gap-3 px-4 sm:px-6 md:grid-cols-[1.1fr_1fr] md:gap-10 lg:px-10">
            <div ref={textColumnRef} className="flex min-h-[36svh] items-start px-4 pt-2 sm:min-h-[44svh] sm:px-8 sm:pt-4 md:h-[100svh] md:items-center md:px-20 md:pt-0">
              <div>
            <div className="mb-6 flex items-center gap-3">
              {STORY_STEPS.map((step, index) => (
                <button
                  type="button"
                  key={step.id}
                  onClick={() => {
                    const segment = index / STORY_STEPS.length;
                    const top = (storyRef.current?.offsetTop ?? 0) + segment * (storyRef.current?.offsetHeight ?? 0);
                    window.scrollTo({ top, behavior: 'smooth' });
                  }}
                  className={`h-2 w-10 rounded-full transition-colors ${
                    index === activeIndex ? 'bg-slate-900' : 'bg-slate-300'
                  }`}
                  aria-label={`Jump to ${step.title}`}
                />
              ))}
            </div>

            <AnimatePresence mode="wait">
              <motion.div
                key={STORY_STEPS[activeIndex].id}
                initial={{ opacity: 0, y: 26 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -26 }}
                transition={{ duration: 0.35, ease: 'easeOut' }}
              >
                <p className="hidden text-sm font-semibold uppercase tracking-[0.2em] text-cyan-700 md:block">{STORY_STEPS[activeIndex].eyebrow}</p>
                <h2 className="mt-3 max-w-xl text-3xl font-semibold leading-tight text-slate-900 sm:mt-4 sm:text-5xl">
                  {STORY_STEPS[activeIndex].title}
                </h2>
                <p className="mt-2 max-w-lg text-base leading-relaxed text-slate-600 sm:mt-4 sm:text-lg">
                  {STORY_STEPS[activeIndex].body}
                </p>

                <div className="mt-6 hidden max-w-lg grid-cols-2 gap-3 md:grid">
                  <div className="rounded-2xl border border-slate-300/70 bg-white/70 p-4 backdrop-blur-sm">
                    <p className="text-xs uppercase tracking-[0.16em] text-slate-500">Signal</p>
                    <p className="mt-1 text-base font-semibold text-slate-800 sm:text-lg">{STORY_STEPS[activeIndex].metricA}</p>
                  </div>
                  <div className="rounded-2xl border border-slate-300/70 bg-white/70 p-4 backdrop-blur-sm">
                    <p className="text-xs uppercase tracking-[0.16em] text-slate-500">Impact</p>
                    <p className="mt-1 text-base font-semibold text-slate-800 sm:text-lg">{STORY_STEPS[activeIndex].metricB}</p>
                  </div>
                </div>
              </motion.div>
            </AnimatePresence>
            </div>
          </div>

          <div ref={phoneColumnRef} className="relative -mt-12 h-[70svh] md:mt-0 md:h-full">
            <div className="hidden h-[100svh] md:block" />
            <div className="md:absolute md:left-0 md:right-0 md:top-16">
              <div ref={phoneFrameRef} className="flex h-[min(50svh,420px)] items-start justify-center pt-0 sm:h-[min(60svh,520px)] md:h-[calc(100svh-4rem)] md:items-center md:pt-0">
                <div className="-translate-y-2 origin-top scale-[0.92] sm:scale-95 md:scale-100 md:-translate-y-1">
                  <PhoneFrame activeIndex={activeIndex} />
                </div>
              </div>
            </div>
          </div>
        </div>
        </div>
      </section>

      <section id="pricing" className="w-full px-4 pb-24 pt-8 sm:px-6 lg:px-10">
        <div className="rounded-3xl border border-slate-200 bg-white/90 p-8 shadow-sm">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-cyan-700">Pricing</p>
          <h2 className="mt-4 text-4xl font-semibold text-slate-900 md:text-5xl">Start in beta, scale with your fleet</h2>
          <p className="mt-4 max-w-2xl text-lg text-slate-600">
            Early-access users join free during beta. Production plans will launch with individual, team, and enterprise
            tiers once advanced analytics modules are released.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link href="/login" className="rounded-full bg-slate-900 px-6 py-3 text-base font-medium text-white hover:bg-slate-700">
              Sign In
            </Link>
            <a href="#hero" className="rounded-full border border-slate-300 px-6 py-3 text-base font-medium text-slate-800 hover:bg-slate-100">
              Back to top
            </a>
          </div>
        </div>
      </section>
    </main>
  );
}
