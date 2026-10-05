'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import { Link } from '@/lib/navigation';
import { useTranslations } from '@/lib/translations';

const AUTOPLAY_MS = 7000;
const SWIPE_THRESHOLD = 60;

// Each slide reads its copy from messages/*.json under `home.heroSlide{n}*`.
const SLIDES = [
  { image: '/products-hero.webp', href: '/products' },
  { image: '/hero/king-koil.webp', href: '/products?search=קינג קויל' },
  { image: '/bedroom-bg.webp', href: '/products' },
  { image: '/hero/aminach.webp', href: '/products?search=עמינח' },
  { image: '/hero/golden-touch.webp', href: '/products?search=גולדן' },
  { image: '/hero/protector.webp', href: '/products?search=מגן מזרן' },
] as const;

export function HeroSlideshow() {
  const t = useTranslations('home');
  const count = SLIDES.length;
  const [current, setCurrent] = useState(0);
  const [drag, setDrag] = useState(0);
  const [dragging, setDragging] = useState(false);
  const stageRef = useRef<HTMLDivElement>(null);
  const slideRef = useRef<HTMLDivElement>(null);
  const startX = useRef<number | null>(null);
  // set when a pointer gesture was a swipe, so the click that follows doesn't follow a link
  const swiped = useRef(false);
  const [step, setStep] = useState(0);
  const [reduceMotion, setReduceMotion] = useState(false);
  // -1 in RTL: the next slide sits to the left and is revealed by dragging right
  const [dirSign, setDirSign] = useState(-1);

  const go = useCallback((index: number) => setCurrent(((index % count) + count) % count), [count]);

  useEffect(() => {
    setReduceMotion(window.matchMedia('(prefers-reduced-motion: reduce)').matches);
    setDirSign(document.documentElement.dir === 'rtl' ? -1 : 1);
    const measure = () => setStep((slideRef.current?.offsetWidth ?? 0) + 14);
    measure();
    window.addEventListener('resize', measure);
    return () => window.removeEventListener('resize', measure);
  }, []);

  // Restart the autoplay timer whenever the slide changes (manual or automatic).
  useEffect(() => {
    if (dragging) return;
    const id = window.setTimeout(() => go(current + 1), AUTOPLAY_MS);
    return () => window.clearTimeout(id);
  }, [current, dragging, go]);

  useEffect(() => {
    if (!dragging) return;
    let dx = 0;
    const onMove = (e: PointerEvent) => {
      if (startX.current === null) return;
      dx = e.clientX - startX.current;
      setDrag(dx);
    };
    const onUp = () => {
      setDragging(false);
      setDrag(0);
      startX.current = null;
      swiped.current = Math.abs(dx) > 5;
      if (Math.abs(dx) > SWIPE_THRESHOLD) go(current + (dx * -dirSign > 0 ? 1 : -1));
    };
    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onUp);
    window.addEventListener('pointercancel', onUp);
    return () => {
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onUp);
      window.removeEventListener('pointercancel', onUp);
    };
  }, [dragging, current, go, dirSign]);

  return (
    <section className="hero-slideshow" aria-roledescription="carousel" aria-label={t('heroSlidesLabel')}>
      <div
        ref={stageRef}
        className={`hero-slideshow__stage ${dragging ? 'is-dragging' : ''}`}
        onPointerDown={(e) => {
          startX.current = e.clientX;
          setDragging(true);
        }}
      >
        {SLIDES.map((slide, i) => {
          let rel = (((i - current) % count) + count) % count;
          if (rel > count / 2) rel -= count;
          const active = rel === 0;
          const n = i + 1;
          return (
            <div
              key={slide.image}
              ref={i === 0 ? slideRef : undefined}
              className={`hero-slide ${active ? 'is-active' : ''}`}
              role="group"
              aria-roledescription="slide"
              aria-label={`${n} / ${count}`}
              aria-hidden={!active}
              style={{
                transform: `translateX(${rel * step * dirSign + drag}px) scale(${active ? 1 : 0.93})`,
                opacity: Math.abs(rel) > 1 ? 0 : 1,
                zIndex: active ? 2 : 1,
              }}
              onClick={(e) => {
                if (swiped.current) {
                  e.preventDefault();
                } else if (!active) {
                  e.preventDefault();
                  go(i);
                }
              }}
            >
              <div className="hero-slide__scene">
                <Image
                  src={slide.image}
                  alt=""
                  fill
                  sizes="(max-width: 860px) 86vw, 58vw"
                  priority={i === 0}
                  className="object-cover"
                  draggable={false}
                />
              </div>
              <div className="hero-slide__caption">
                <span className="hero-slide__kicker">{t(`heroSlide${n}Kicker`)}</span>
                {i === 0 ? (
                  <h1 className="hero-slide__title">{t('heroTitle')}</h1>
                ) : (
                  <h2 className="hero-slide__title">{t(`heroSlide${n}Title`)}</h2>
                )}
                <p className="hero-slide__text">{i === 0 ? t('heroSubtitle') : t(`heroSlide${n}Text`)}</p>
                <Link href={slide.href} className="hero-slide__cta" tabIndex={active ? 0 : -1} draggable={false}>
                  {i === 0 ? t('heroCta') : t(`heroSlide${n}Cta`)}
                </Link>
              </div>
            </div>
          );
        })}
      </div>

      <div className="hero-slideshow__controls">
        <button type="button" className="hero-slideshow__arrow" onClick={() => go(current - 1)} aria-label={t('heroSlidePrev')}>
          <svg className="h-4 w-4 rtl:rotate-180" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 6l-6 6 6 6" />
          </svg>
        </button>
        <div className="hero-slideshow__progress" aria-live="polite">
          <span dir="ltr">{String(current + 1).padStart(2, '0')}</span>
          <span className="hero-slideshow__bar">
            {/* keyed on the slide so the fill animation restarts on every change */}
            <i key={current} className={reduceMotion || dragging ? '' : 'is-running'} />
          </span>
          <span dir="ltr">{String(count).padStart(2, '0')}</span>
        </div>
        <button type="button" className="hero-slideshow__arrow" onClick={() => go(current + 1)} aria-label={t('heroSlideNext')}>
          <svg className="h-4 w-4 rtl:rotate-180" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 6l6 6-6 6" />
          </svg>
        </button>
      </div>
    </section>
  );
}
