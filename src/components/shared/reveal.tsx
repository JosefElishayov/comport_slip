'use client';

import { useEffect, useRef, useState, type ReactNode, type ElementType } from 'react';

type RevealVariant = 'up' | 'left' | 'right' | 'zoom';

interface RevealProps {
  children: ReactNode;
  variant?: RevealVariant;
  delay?: 0 | 1 | 2 | 3 | 4 | 5;
  className?: string;
  as?: ElementType;
  once?: boolean;
}

export function Reveal({
  children,
  variant = 'up',
  delay = 0,
  className = '',
  as: Tag = 'div',
  once = true,
}: RevealProps) {
  const ref = useRef<HTMLElement | null>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    if (typeof IntersectionObserver === 'undefined') {
      setVisible(true);
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setVisible(true);
            if (once) observer.unobserve(entry.target);
          } else if (!once) {
            setVisible(false);
          }
        }
      },
      { threshold: 0.15, rootMargin: '0px 0px -60px 0px' },
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [once]);

  const variantClass =
    variant === 'left' ? 'reveal-left'
    : variant === 'right' ? 'reveal-right'
    : variant === 'zoom' ? 'reveal-zoom'
    : '';

  const delayClass = delay > 0 ? `reveal-delay-${delay}` : '';

  return (
    <Tag
      ref={ref as never}
      className={`reveal ${variantClass} ${delayClass} ${visible ? 'is-visible' : ''} ${className}`.trim()}
    >
      {children}
    </Tag>
  );
}
