'use client';

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import Globe from '@/components/ui/globe';
import { cn } from '@/lib/utils';

interface ScrollGlobeProps {
  sections: {
    id: string;
    badge?: string;
    title: string;
    subtitle?: string;
    description: string;
    align?: 'left' | 'center' | 'right';
    features?: { title: string; description: string }[];
    actions?: { label: string; variant: 'primary' | 'secondary'; onClick?: () => void }[];
  }[];
  globeConfig?: {
    positions: {
      top: string;
      left: string;
      scale: number;
    }[];
  };
  className?: string;
}

const defaultGlobeConfig = {
  positions: [
    { top: '50%', left: '75%', scale: 1.4 },
    { top: '25%', left: '50%', scale: 0.9 },
    { top: '15%', left: '90%', scale: 2 },
    { top: '50%', left: '50%', scale: 1.8 },
  ],
};

const parsePercent = (value: string): number => parseFloat(value.replace('%', ''));

function ScrollGlobe({ sections, globeConfig = defaultGlobeConfig, className }: ScrollGlobeProps) {
  const [activeSection, setActiveSection] = useState(0);
  const [scrollProgress, setScrollProgress] = useState(0);
  const [globeTransform, setGlobeTransform] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);
  const sectionRefs = useRef<(HTMLElement | null)[]>([]);
  const animationFrameId = useRef<number | null>(null);

  const calculatedPositions = useMemo(() => {
    return globeConfig.positions.map((pos) => ({
      top: parsePercent(pos.top),
      left: parsePercent(pos.left),
      scale: pos.scale,
    }));
  }, [globeConfig.positions]);

  const updateScrollPosition = useCallback(() => {
    const scrollTop = window.pageYOffset;
    const docHeight = document.documentElement.scrollHeight - window.innerHeight;
    const progress = Math.min(Math.max(scrollTop / docHeight, 0), 1);

    setScrollProgress(progress);

    const viewportCenter = window.innerHeight / 2;
    let newActiveSection = 0;
    let minDistance = Infinity;

    sectionRefs.current.forEach((ref, index) => {
      if (!ref) return;
      const rect = ref.getBoundingClientRect();
      const sectionCenter = rect.top + rect.height / 2;
      const distance = Math.abs(sectionCenter - viewportCenter);

      if (distance < minDistance) {
        minDistance = distance;
        newActiveSection = index;
      }
    });

    const currentPos = calculatedPositions[newActiveSection];
    const transform = `translate3d(${currentPos.left}vw, ${currentPos.top}vh, 0) translate3d(-50%, -50%, 0) scale3d(${currentPos.scale}, ${currentPos.scale}, 1)`;

    setGlobeTransform(transform);
    setActiveSection(newActiveSection);
  }, [calculatedPositions]);

  useEffect(() => {
    let ticking = false;

    const handleScroll = () => {
      if (ticking) return;
      animationFrameId.current = requestAnimationFrame(() => {
        updateScrollPosition();
        ticking = false;
      });
      ticking = true;
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    updateScrollPosition();

    return () => {
      window.removeEventListener('scroll', handleScroll);
      if (animationFrameId.current) {
        cancelAnimationFrame(animationFrameId.current);
      }
    };
  }, [updateScrollPosition]);

  useEffect(() => {
    const initialPos = calculatedPositions[0];
    const initialTransform = `translate3d(${initialPos.left}vw, ${initialPos.top}vh, 0) translate3d(-50%, -50%, 0) scale3d(${initialPos.scale}, ${initialPos.scale}, 1)`;
    setGlobeTransform(initialTransform);
  }, [calculatedPositions]);

  return (
    <div
      ref={containerRef}
      className={cn('relative min-h-screen w-full max-w-screen overflow-x-hidden bg-gradient-to-br from-slate-50 via-blue-50/40 to-slate-100 text-slate-900', className)}
    >
      <div className="fixed left-0 top-0 z-50 h-0.5 w-full bg-gradient-to-r from-border/20 via-border/40 to-border/20">
        <div
          className="h-full bg-gradient-to-r from-primary via-blue-600 to-blue-900 shadow-sm will-change-transform"
          style={{
            transform: `scaleX(${scrollProgress})`,
            transformOrigin: 'left center',
            transition: 'transform 0.15s ease-out',
            filter: 'drop-shadow(0 0 2px rgba(59, 130, 246, 0.3))',
          }}
        />
      </div>

      <div className="fixed right-2 top-1/2 z-40 hidden -translate-y-1/2 sm:flex sm:right-4 lg:right-8">
        <div className="space-y-3 sm:space-y-4 lg:space-y-6">
          {sections.map((section, index) => (
            <div key={section.id} className="group relative">
              <div
                className={cn(
                  'nav-label absolute right-5 top-1/2 z-50 -translate-y-1/2 rounded-md border border-slate-200 bg-white/95 px-2 py-1 text-xs font-medium whitespace-nowrap text-slate-700 shadow-lg backdrop-blur-md sm:right-6 sm:rounded-lg sm:px-3 sm:py-1.5 sm:text-sm lg:right-8 lg:px-4 lg:py-2',
                  activeSection === index ? 'animate-fadeOut' : 'opacity-0',
                )}
              >
                <div className="flex items-center gap-1 sm:gap-1.5 lg:gap-2">
                  <div className="h-1 w-1 animate-pulse rounded-full bg-primary sm:h-1.5 sm:w-1.5 lg:h-2 lg:w-2" />
                  <span className="text-xs sm:text-sm lg:text-base">{section.badge || `Section ${index + 1}`}</span>
                </div>
              </div>

              <button
                onClick={() => {
                  sectionRefs.current[index]?.scrollIntoView({ behavior: 'smooth', block: 'center' });
                }}
                className={cn(
                  'relative h-2 w-2 rounded-full border-2 transition-all duration-300 hover:scale-125 sm:h-2.5 sm:w-2.5 lg:h-3 lg:w-3',
                  'before:absolute before:inset-0 before:rounded-full before:transition-all before:duration-300',
                  activeSection === index
                    ? 'border-primary bg-primary shadow-lg before:animate-ping before:bg-primary/20'
                    : 'border-muted-foreground/40 bg-transparent hover:border-primary/60 hover:bg-primary/10',
                )}
                aria-label={`Go to ${section.badge || `section ${index + 1}`}`}
              />
            </div>
          ))}
        </div>

        <div className="absolute bottom-0 left-1/2 top-0 -z-10 w-0.5 -translate-x-1/2 bg-gradient-to-b from-transparent via-primary/20 to-transparent lg:w-px" />
      </div>

      <div
        className="pointer-events-none fixed z-10 transition-all duration-[1400ms] ease-[cubic-bezier(0.23,1,0.32,1)] will-change-transform"
        style={{
          transform: globeTransform,
          filter: `opacity(${activeSection === 3 ? 0.28 : 0.52})`,
        }}
      >
        <div className="scale-75 sm:scale-90 lg:scale-100">
          <Globe />
        </div>
      </div>

      {sections.map((section, index) => (
        <section
          key={section.id}
          ref={(el) => {
            sectionRefs.current[index] = el;
          }}
          className={cn(
            'relative z-20 flex min-h-screen w-full max-w-full flex-col justify-center overflow-hidden px-10 py-16 sm:px-8 sm:py-20 md:px-12 lg:px-16 lg:py-24',
            section.align === 'center' && 'items-center text-center',
            section.align === 'right' && 'items-end text-right pr-8 sm:pr-12 md:pr-16 lg:pr-24',
            section.align !== 'center' && section.align !== 'right' && 'items-start text-left',
          )}
        >
          <div className="w-full max-w-sm transition-all duration-700 will-change-transform sm:max-w-lg md:max-w-2xl lg:max-w-4xl xl:max-w-5xl">
            {index === 0 && (
              <Image src="/logo.png" alt="OceanView logo" width={220} height={66} className="mb-5 h-auto w-auto max-w-[220px]" priority />
            )}

            <h1
              className={cn(
                'mb-6 font-bold leading-[1.1] tracking-tight sm:mb-8',
                index === 0
                  ? 'text-3xl sm:text-4xl md:text-5xl lg:text-6xl xl:text-7xl 2xl:text-8xl'
                  : 'text-2xl sm:text-3xl md:text-4xl lg:text-5xl xl:text-6xl 2xl:text-7xl',
              )}
            >
              {section.subtitle ? (
                <div className="space-y-1 sm:space-y-2">
                  <div className="bg-gradient-to-r from-foreground to-foreground/80 bg-clip-text text-transparent">{section.title}</div>
                  <div className="text-[0.6em] font-medium tracking-wider !text-slate-600 sm:text-[0.7em]">{section.subtitle}</div>
                </div>
              ) : (
                <div className="bg-gradient-to-r from-slate-900 via-slate-900 to-slate-700 bg-clip-text text-transparent">{section.title}</div>
              )}
            </h1>

            <div
              className={cn(
                'mb-8 text-base leading-relaxed font-light !text-slate-600 sm:mb-10 sm:text-lg lg:text-xl',
                section.align === 'center' ? 'mx-auto max-w-full text-center' : 'max-w-full',
              )}
            >
              <p className="mb-3 !text-slate-600 sm:mb-4">{section.description}</p>
              {index === 0 && (
                <div className="mt-4 flex flex-wrap items-center gap-3 text-xs !text-slate-500 sm:mt-6 sm:gap-4 sm:text-sm">
                  <div className="flex items-center gap-1.5 sm:gap-2">
                    <div className="h-1 w-1 animate-pulse rounded-full bg-primary" />
                    <span>Live Ocean Monitoring</span>
                  </div>
                  <div className="flex items-center gap-1.5 sm:gap-2">
                    <div className="h-1 w-1 animate-pulse rounded-full bg-primary" style={{ animationDelay: '0.5s' }} />
                    <span>Scroll to Explore Features</span>
                  </div>
                </div>
              )}
            </div>

            {section.features && (
              <div className="mb-8 grid gap-3 sm:mb-10 sm:gap-4">
                {section.features.map((feature, featureIndex) => (
                  <div
                    key={feature.title}
                    className={cn(
                      'group rounded-lg border border-slate-200 bg-white/80 p-4 backdrop-blur-sm transition-all duration-300 hover:-translate-y-1 hover:border-primary/20 hover:bg-white hover:shadow-lg hover:shadow-primary/5 sm:rounded-xl sm:p-5 lg:p-6',
                    )}
                    style={{ animationDelay: `${featureIndex * 0.1}s` }}
                  >
                    <div className="flex items-start gap-3 sm:gap-4">
                      <div className="mt-1.5 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-primary/60 transition-colors group-hover:bg-primary sm:mt-2 sm:h-2 sm:w-2" />
                      <div className="min-w-0 flex-1 space-y-1.5 sm:space-y-2">
                        <h3 className="text-base font-semibold !text-slate-900 sm:text-lg">{feature.title}</h3>
                        <p className="text-sm leading-relaxed !text-slate-600 sm:text-base">{feature.description}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {section.actions && (
              <div
                className={cn(
                  'flex flex-col flex-wrap gap-3 sm:flex-row sm:gap-4',
                  section.align === 'center' && 'justify-center',
                  section.align === 'right' && 'justify-end',
                  (!section.align || section.align === 'left') && 'justify-start',
                )}
              >
                {section.actions.map((action, actionIndex) => (
                  <button
                    key={action.label}
                    onClick={action.onClick}
                    className={cn(
                      'group relative w-full rounded-lg px-6 py-3 text-sm font-medium transition-all duration-300 hover:scale-[1.02] hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-primary/20 active:scale-[0.98] sm:w-auto sm:rounded-xl sm:px-8 sm:py-4 sm:text-base',
                      action.variant === 'primary'
                        ? 'bg-primary text-primary-foreground shadow-lg shadow-primary/20 hover:bg-primary/90 hover:shadow-primary/30'
                        : 'border-2 border-slate-300 bg-white/80 text-slate-900 backdrop-blur-sm hover:border-primary/30 hover:bg-white',
                    )}
                    style={{ animationDelay: `${actionIndex * 0.1 + 0.2}s` }}
                  >
                    <span className="relative z-10">{action.label}</span>
                    {action.variant === 'primary' && (
                      <div className="absolute inset-0 rounded-lg bg-gradient-to-r from-primary to-primary/80 opacity-0 transition-opacity duration-300 group-hover:opacity-100 sm:rounded-xl" />
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>
        </section>
      ))}
    </div>
  );
}

export default function GlobeScrollDemo() {
  const router = useRouter();

  const demoSections = [
    {
      id: 'hero',
      badge: 'OceanView',
      title: 'Smarter Fishing',
      subtitle: 'Starts with Better Visibility',
      description:
        'Monitor weather, wave behavior, and high-yield fishing zones in one unified platform built for daily coastal operations.',
      align: 'left' as const,
      actions: [
        { label: 'Start Monitoring', variant: 'primary' as const, onClick: () => router.push('/login') },
        { label: 'Open Fishing Maps', variant: 'secondary' as const, onClick: () => router.push('/maps') },
      ],
    },
    {
      id: 'situational-awareness',
      badge: 'Situational Awareness',
      title: 'Real-Time Marine Context',
      description:
        'Track marine alerts and quickly identify risk windows before departures. Stay informed with clear, actionable updates instead of scattered data sources.',
      align: 'center' as const,
      actions: [{ label: 'View Weather Forecast', variant: 'secondary' as const, onClick: () => router.push('/weather') }],
    },
    {
      id: 'zone-intelligence',
      badge: 'Zone Intelligence',
      title: 'Prioritize Productive Waters',
      subtitle: 'with Catch-Focused Signals',
      description:
        'Compare zones by predicted catch potential, vessel activity, and environmental conditions so teams can commit to the best route with confidence.',
      align: 'left' as const,
      features: [
        { title: 'Unified Map Layers', description: 'Overlay contour lines, key zones, and operational indicators in one place.' },
        { title: 'Rapid Zone Selection', description: 'Switch between monitored areas quickly to compare opportunities.' },
        { title: 'Clear Daily Briefing', description: 'Start each shift with a single source of truth for ocean conditions.' },
      ],
    },
    {
      id: 'mobile-access',
      badge: 'Mobile Access',
      title: 'Stay Connected',
      subtitle: 'On Shore and Offshore',
      description:
        'Use LINE sign-in and secure session access to return instantly from phone or desktop, keeping decisions synchronized across your crew.',
      align: 'center' as const,
      actions: [
        { label: 'Continue with LINE', variant: 'primary' as const, onClick: () => router.push('/liff') },
        { label: 'Go to Dashboard', variant: 'secondary' as const, onClick: () => router.push('/dashboard') },
      ],
    },
  ];

  return <ScrollGlobe sections={demoSections} className="bg-gradient-to-br from-background via-muted/20 to-background" />;
}
