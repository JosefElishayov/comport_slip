'use client';

import { useEffect, useState } from 'react';
import {
  getClosureStatus,
  formatJerusalemTime,
  formatJerusalemDate,
  formatReasonHeading,
  type ClosureStatus,
} from '@/lib/shabbat';

export function ShabbatOverlay() {
  const [status, setStatus] = useState<ClosureStatus | null>(null);

  useEffect(() => {
    const update = () => setStatus(getClosureStatus(new Date()));
    update();
    const id = setInterval(update, 60_000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    if (status?.isClosed) {
      const prev = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = prev;
      };
    }
  }, [status?.isClosed]);

  if (!status?.isClosed) return null;

  const endTime = formatJerusalemTime(status.end);
  const endDate = formatJerusalemDate(status.end);
  const { greeting, description } = formatReasonHeading(status.reasonsHe);
  const endLabel = status.reasonsHe.includes('שבת') && status.reasonsHe.length === 1
    ? 'צאת השבת'
    : 'פתיחה מחדש';

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="closure-title"
      className="fixed inset-0 z-[9999] flex items-center justify-center px-4"
      style={{
        background:
          'radial-gradient(ellipse at top, #1a1a2e 0%, #0f0e1a 50%, #050410 100%)',
      }}
    >
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 opacity-40"
        style={{
          backgroundImage:
            'radial-gradient(1px 1px at 20% 30%, #fff, transparent), radial-gradient(1px 1px at 70% 60%, #fff, transparent), radial-gradient(1.5px 1.5px at 40% 80%, #fff, transparent), radial-gradient(1px 1px at 85% 20%, #fff, transparent), radial-gradient(1px 1px at 15% 70%, #fff, transparent), radial-gradient(1.5px 1.5px at 55% 15%, #fff, transparent)',
          backgroundSize: '300px 300px',
        }}
      />

      <div className="relative max-w-xl w-full text-center text-white">
        <div className="mb-8 flex justify-center items-end gap-8" aria-hidden="true">
          <ChagIcons reasons={status.reasonsHe} />
        </div>

        <h1
          id="closure-title"
          className="text-4xl md:text-5xl font-semibold mb-4 tracking-wide"
          style={{ fontFamily: 'serif' }}
        >
          {greeting}
        </h1>

        <p className="text-lg md:text-xl text-white/80 mb-2 leading-relaxed">
          {description}
        </p>

        <p className="text-base text-white/60 mb-10 leading-relaxed">
          נשמח לארח אתכם מחדש בקרוב
        </p>

        <div className="inline-block bg-white/5 border border-white/10 rounded-2xl px-8 py-6 backdrop-blur-sm">
          <div className="text-sm text-white/50 mb-2">{endLabel}</div>
          <div className="text-2xl font-semibold mb-1" dir="ltr">
            {endTime}
          </div>
          <div className="text-sm text-white/60">{endDate}</div>
        </div>

        <p className="mt-10 text-sm text-white/40">
          קומפורט סליפ &nbsp;·&nbsp; מבית רהיטי וייס
        </p>
      </div>

      <style>{`
        @keyframes flicker {
          0%, 100% { transform: scale(1) rotate(-1deg); opacity: 1; }
          25%      { transform: scale(1.05) rotate(1deg); opacity: 0.92; }
          50%      { transform: scale(0.97) rotate(-0.5deg); opacity: 0.98; }
          75%      { transform: scale(1.03) rotate(0.8deg); opacity: 0.95; }
        }
      `}</style>
    </div>
  );
}

function ChagIcons({ reasons }: { reasons: string[] }) {
  // Priority: chag-specific icon set wins over plain Shabbat candles.
  const chag = reasons.find((r) => r !== 'שבת');
  switch (chag) {
    case 'פסח':
    case 'שביעי של פסח':
      return (
        <>
          <Matzah />
          <KiddushCup />
        </>
      );
    case 'ראש השנה':
      return (
        <>
          <Shofar />
          <AppleHoney />
        </>
      );
    case 'יום הכיפורים':
      return (
        <>
          <Candle color="white" />
          <Candle color="white" delay="0.3s" />
        </>
      );
    case 'סוכות':
      return (
        <>
          <Lulav />
          <Etrog />
        </>
      );
    case 'שמיני עצרת':
      return (
        <>
          <TorahScroll />
          <TorahScroll mirror />
        </>
      );
    case 'שבועות':
      return (
        <>
          <Wheat />
          <Tablets />
        </>
      );
    default:
      return (
        <>
          <Candle />
          <Candle delay="0.3s" />
        </>
      );
  }
}

const GOLD = '#e8c87a';
const GOLD_DARK = '#c9a14a';
const CREAM = '#f5e6c8';
const WAX = '#e8d4a8';
const WINE = '#7a1f2b';
const GREEN = '#4a7c3a';
const GREEN_DARK = '#2f5a25';
const ETROG = '#e8c547';

function Candle({ delay = '0s', color = 'flame' }: { delay?: string; color?: 'flame' | 'white' }) {
  const flame =
    color === 'white'
      ? 'radial-gradient(ellipse at center, #ffffff 0%, #e8e6ff 45%, #a8b4ff 80%, transparent 100%)'
      : 'radial-gradient(ellipse at center, #fff5a8 0%, #ffb347 45%, #ff6b1a 80%, transparent 100%)';
  const glow =
    color === 'white'
      ? '0 0 24px 6px rgba(200,210,255,0.5), 0 0 60px 18px rgba(150,170,255,0.2)'
      : '0 0 24px 6px rgba(255,179,71,0.55), 0 0 60px 18px rgba(255,140,40,0.25)';
  return (
    <div className="flex flex-col items-center">
      <div
        style={{
          width: '14px',
          height: '24px',
          background: flame,
          borderRadius: '50% 50% 40% 40% / 60% 60% 40% 40%',
          filter: 'blur(0.5px)',
          boxShadow: glow,
          animation: `flicker 1.6s ease-in-out infinite`,
          animationDelay: delay,
        }}
      />
      <div
        style={{
          width: '6px',
          height: '60px',
          background: `linear-gradient(to bottom, ${CREAM} 0%, ${WAX} 50%, #c9a96e 100%)`,
          marginTop: '-2px',
          borderRadius: '2px',
        }}
      />
    </div>
  );
}

function Matzah() {
  return (
    <svg width="84" height="84" viewBox="0 0 100 100" fill="none">
      <defs>
        <radialGradient id="matzah-grad" cx="50%" cy="40%">
          <stop offset="0%" stopColor="#fbe3b3" />
          <stop offset="70%" stopColor="#e6c182" />
          <stop offset="100%" stopColor="#b8894a" />
        </radialGradient>
      </defs>
      <rect x="8" y="8" width="84" height="84" rx="10" fill="url(#matzah-grad)" stroke="#8a5a2b" strokeWidth="1.5" />
      {Array.from({ length: 7 }).map((_, row) =>
        Array.from({ length: 7 }).map((_, col) => {
          const cx = 18 + col * 11;
          const cy = 18 + row * 11;
          return <circle key={`${row}-${col}`} cx={cx} cy={cy} r="1.4" fill="#7a4a1a" opacity="0.55" />;
        })
      )}
      <circle cx="22" cy="22" r="6" fill="#8a5a2b" opacity="0.18" />
      <circle cx="78" cy="76" r="8" fill="#8a5a2b" opacity="0.15" />
      <circle cx="76" cy="24" r="4" fill="#8a5a2b" opacity="0.2" />
    </svg>
  );
}

function KiddushCup() {
  return (
    <svg width="64" height="84" viewBox="0 0 80 100" fill="none">
      <defs>
        <linearGradient id="cup-grad" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor={GOLD_DARK} />
          <stop offset="50%" stopColor={GOLD} />
          <stop offset="100%" stopColor={GOLD_DARK} />
        </linearGradient>
      </defs>
      {/* wine */}
      <ellipse cx="40" cy="18" rx="22" ry="5" fill={WINE} />
      <path d="M18 18 Q18 50 30 60 L50 60 Q62 50 62 18 Z" fill={WINE} opacity="0.85" />
      {/* cup body */}
      <path d="M14 16 Q14 56 32 64 L48 64 Q66 56 66 16 Z" fill="url(#cup-grad)" stroke={GOLD_DARK} strokeWidth="1.5" opacity="0.95" />
      <ellipse cx="40" cy="16" rx="26" ry="4" fill="none" stroke={GOLD_DARK} strokeWidth="1.5" />
      {/* stem */}
      <rect x="36" y="64" width="8" height="14" fill="url(#cup-grad)" />
      <ellipse cx="40" cy="64" rx="10" ry="2.5" fill={GOLD_DARK} />
      {/* base */}
      <ellipse cx="40" cy="84" rx="20" ry="5" fill="url(#cup-grad)" stroke={GOLD_DARK} strokeWidth="1.5" />
      {/* decorative band */}
      <path d="M18 32 Q40 38 62 32" stroke={GOLD_DARK} strokeWidth="1" fill="none" opacity="0.7" />
    </svg>
  );
}

function Shofar() {
  return (
    <svg width="100" height="60" viewBox="0 0 120 70" fill="none">
      <defs>
        <linearGradient id="shofar-grad" x1="0" y1="0" x2="1" y2="0.5">
          <stop offset="0%" stopColor="#5a3a1a" />
          <stop offset="50%" stopColor="#a87742" />
          <stop offset="100%" stopColor="#f0d4a0" />
        </linearGradient>
      </defs>
      <path
        d="M8 38 Q20 22 50 22 Q80 22 96 32 Q108 38 114 50 L108 56 Q102 46 92 42 Q78 36 60 38 Q40 40 26 50 Q18 56 12 50 Z"
        fill="url(#shofar-grad)"
        stroke="#3a2410"
        strokeWidth="1.2"
      />
      <ellipse cx="111" cy="46" rx="5" ry="6" fill="#1a0e05" />
      <path d="M22 38 Q50 32 88 36" stroke="#3a2410" strokeWidth="0.8" fill="none" opacity="0.5" />
    </svg>
  );
}

function AppleHoney() {
  return (
    <svg width="72" height="84" viewBox="0 0 90 100" fill="none">
      <defs>
        <radialGradient id="apple-grad" cx="35%" cy="35%">
          <stop offset="0%" stopColor="#ff8b8b" />
          <stop offset="70%" stopColor="#d23636" />
          <stop offset="100%" stopColor="#7a1a1a" />
        </radialGradient>
      </defs>
      {/* leaf */}
      <path d="M48 18 Q58 10 64 18 Q58 22 48 22 Z" fill={GREEN} />
      {/* stem */}
      <rect x="44" y="14" width="2" height="10" fill="#3a2410" />
      {/* apple */}
      <path
        d="M22 50 Q22 30 38 26 Q44 24 46 28 Q48 24 54 26 Q70 30 70 50 Q70 80 46 86 Q22 80 22 50 Z"
        fill="url(#apple-grad)"
      />
      <ellipse cx="34" cy="42" rx="6" ry="10" fill="#ffd0d0" opacity="0.5" />
      {/* honey drip */}
      <path d="M58 70 Q60 78 62 86 Q64 92 60 94 Q56 92 58 70 Z" fill="#f5b942" opacity="0.9" />
      <ellipse cx="60" cy="94" rx="3" ry="1.5" fill="#e09a20" />
    </svg>
  );
}

function Lulav() {
  return (
    <svg width="48" height="100" viewBox="0 0 60 120" fill="none">
      {/* central stalk */}
      <rect x="28" y="10" width="4" height="100" fill={GREEN_DARK} />
      {/* fronds */}
      {Array.from({ length: 8 }).map((_, i) => {
        const y = 14 + i * 12;
        return (
          <g key={i}>
            <path d={`M30 ${y} Q14 ${y + 4} 6 ${y + 14}`} stroke={GREEN} strokeWidth="2.5" fill="none" strokeLinecap="round" />
            <path d={`M30 ${y} Q46 ${y + 4} 54 ${y + 14}`} stroke={GREEN} strokeWidth="2.5" fill="none" strokeLinecap="round" />
          </g>
        );
      })}
      {/* tip */}
      <path d="M30 4 L30 16" stroke={GREEN_DARK} strokeWidth="3" strokeLinecap="round" />
    </svg>
  );
}

function Etrog() {
  return (
    <svg width="60" height="84" viewBox="0 0 80 100" fill="none">
      <defs>
        <radialGradient id="etrog-grad" cx="35%" cy="30%">
          <stop offset="0%" stopColor="#fff4a8" />
          <stop offset="70%" stopColor={ETROG} />
          <stop offset="100%" stopColor="#a8841a" />
        </radialGradient>
      </defs>
      {/* pitam (tip) */}
      <circle cx="40" cy="14" r="3" fill="#6a4a18" />
      <rect x="38" y="12" width="4" height="6" fill="#6a4a18" />
      <ellipse cx="40" cy="55" rx="28" ry="34" fill="url(#etrog-grad)" stroke="#8a6a18" strokeWidth="1" />
      {/* texture bumps */}
      <circle cx="28" cy="42" r="2" fill="#a8841a" opacity="0.3" />
      <circle cx="48" cy="50" r="2" fill="#a8841a" opacity="0.3" />
      <circle cx="32" cy="62" r="2" fill="#a8841a" opacity="0.3" />
      <circle cx="50" cy="70" r="2" fill="#a8841a" opacity="0.3" />
      <ellipse cx="30" cy="40" rx="6" ry="10" fill="#fff8d0" opacity="0.5" />
    </svg>
  );
}

function TorahScroll({ mirror = false }: { mirror?: boolean }) {
  return (
    <svg width="80" height="90" viewBox="0 0 100 110" fill="none" style={{ transform: mirror ? 'scaleX(-1)' : undefined }}>
      <defs>
        <linearGradient id="parchment" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#fdf2d0" />
          <stop offset="100%" stopColor="#e6c890" />
        </linearGradient>
        <linearGradient id="wood" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#5a3a1a" />
          <stop offset="50%" stopColor="#8a5a2a" />
          <stop offset="100%" stopColor="#5a3a1a" />
        </linearGradient>
      </defs>
      {/* parchment */}
      <rect x="20" y="14" width="60" height="82" fill="url(#parchment)" stroke="#a87a3a" strokeWidth="1" />
      {/* hebrew-like text lines */}
      {Array.from({ length: 7 }).map((_, i) => (
        <line key={i} x1="26" y1={26 + i * 10} x2="74" y2={26 + i * 10} stroke="#6a4a1a" strokeWidth="1" opacity="0.7" />
      ))}
      {/* left handle */}
      <rect x="10" y="6" width="14" height="98" rx="3" fill="url(#wood)" />
      <circle cx="17" cy="8" r="5" fill={GOLD} stroke={GOLD_DARK} strokeWidth="1" />
      <circle cx="17" cy="102" r="5" fill={GOLD} stroke={GOLD_DARK} strokeWidth="1" />
      {/* right handle */}
      <rect x="76" y="6" width="14" height="98" rx="3" fill="url(#wood)" />
      <circle cx="83" cy="8" r="5" fill={GOLD} stroke={GOLD_DARK} strokeWidth="1" />
      <circle cx="83" cy="102" r="5" fill={GOLD} stroke={GOLD_DARK} strokeWidth="1" />
    </svg>
  );
}

function Wheat() {
  return (
    <svg width="60" height="100" viewBox="0 0 70 120" fill="none">
      {/* stalk */}
      <path d="M35 110 Q35 60 35 20" stroke="#b88a3a" strokeWidth="2" fill="none" />
      {/* grain head */}
      {Array.from({ length: 6 }).map((_, i) => {
        const y = 20 + i * 10;
        return (
          <g key={i}>
            <ellipse cx="28" cy={y} rx="6" ry="4" fill="#e8c87a" stroke="#a87a2a" strokeWidth="0.8" transform={`rotate(-25 28 ${y})`} />
            <ellipse cx="42" cy={y} rx="6" ry="4" fill="#e8c87a" stroke="#a87a2a" strokeWidth="0.8" transform={`rotate(25 42 ${y})`} />
          </g>
        );
      })}
      {/* top grain */}
      <ellipse cx="35" cy="14" rx="5" ry="6" fill="#e8c87a" stroke="#a87a2a" strokeWidth="0.8" />
      {/* awns (whiskers) */}
      <line x1="35" y1="8" x2="35" y2="-2" stroke="#a87a2a" strokeWidth="1" />
      <line x1="35" y1="8" x2="28" y2="0" stroke="#a87a2a" strokeWidth="1" />
      <line x1="35" y1="8" x2="42" y2="0" stroke="#a87a2a" strokeWidth="1" />
    </svg>
  );
}

function Tablets() {
  return (
    <svg width="84" height="84" viewBox="0 0 100 100" fill="none">
      <defs>
        <linearGradient id="stone-grad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#d8d4cc" />
          <stop offset="100%" stopColor="#8a847a" />
        </linearGradient>
      </defs>
      {/* left tablet */}
      <path d="M10 30 Q10 14 24 14 Q38 14 38 30 L38 88 L10 88 Z" fill="url(#stone-grad)" stroke="#5a544a" strokeWidth="1.5" />
      {/* right tablet */}
      <path d="M62 30 Q62 14 76 14 Q90 14 90 30 L90 88 L62 88 Z" fill="url(#stone-grad)" stroke="#5a544a" strokeWidth="1.5" />
      {/* Hebrew letters: א ב ג / ד ה ו (representing 1-3 and 4-6 commandments) */}
      <text x="24" y="40" textAnchor="middle" fill="#3a342a" fontSize="11" fontWeight="600" fontFamily="serif">א</text>
      <text x="24" y="56" textAnchor="middle" fill="#3a342a" fontSize="11" fontWeight="600" fontFamily="serif">ב</text>
      <text x="24" y="72" textAnchor="middle" fill="#3a342a" fontSize="11" fontWeight="600" fontFamily="serif">ג</text>
      <text x="76" y="40" textAnchor="middle" fill="#3a342a" fontSize="11" fontWeight="600" fontFamily="serif">ד</text>
      <text x="76" y="56" textAnchor="middle" fill="#3a342a" fontSize="11" fontWeight="600" fontFamily="serif">ה</text>
      <text x="76" y="72" textAnchor="middle" fill="#3a342a" fontSize="11" fontWeight="600" fontFamily="serif">ו</text>
    </svg>
  );
}

