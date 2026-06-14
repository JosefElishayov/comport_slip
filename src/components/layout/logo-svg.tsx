'use client';

import type { CSSProperties } from 'react';

const NAVY = '#1a3670';
const SW = 2.5;

// Cloud outline — 3 bumps (left, middle, right), flat bottom
const cloudPath =
  'M 54,172 C 38,172 26,162 26,148 C 26,134 36,122 50,120 ' +
  'C 44,104 46,86 58,74 C 70,62 84,58 96,64 ' +
  'C 102,50 116,40 134,36 C 154,30 174,32 185,44 ' +
  'C 194,33 206,25 222,25 C 242,25 260,37 268,53 ' +
  'C 280,47 296,49 310,63 C 322,71 326,85 322,97 ' +
  'C 336,101 346,115 346,131 C 346,147 336,159 322,163 ' +
  'C 322,168 316,174 306,174 L 56,174 Z';

// Interior mesh: each segment [x1, y1, x2, y2]
// Two hub nodes: K=(158,116) left-interior, L=(212,112) right-interior
const lines: [number, number, number, number][] = [
  [54,  148, 158, 116],  //  1 left-edge  → K
  [95,   64, 158, 116],  //  2 left-bump  → K
  [136,  82, 158, 116],  //  3 valley-LM  → K
  [185,  44, 158, 116],  //  4 mid-bump   → K
  [185,  44, 212, 112],  //  5 mid-bump   → L
  [234,  72, 212, 112],  //  6 valley-MR  → L
  [272,  72, 212, 112],  //  7 right-bump → L
  [322, 160, 212, 112],  //  8 right-edge → L
  [158, 116, 212, 112],  //  9 K → L
  [158, 116, 110, 172],  // 10 K → bottom-left
  [158, 116, 185, 172],  // 11 K → bottom-center
  [212, 112, 185, 172],  // 12 L → bottom-center
  [212, 112, 260, 172],  // 13 L → bottom-right
];

// Scroll range over which the build animation plays out (px)
const ANIM_RANGE = 110;
const STEP = ANIM_RANGE / (lines.length + 2); // +1 for cloud, +1 for text

interface LogoSVGProps {
  scrollY: number;
  isTransparent: boolean;
  className?: string;
}

export function LogoSVG({ scrollY, isTransparent, className }: LogoSVGProps) {
  const getColor = (index: number): string => {
    if (!isTransparent) return NAVY;
    return scrollY >= index * STEP ? NAVY : 'rgba(255,255,255,0.9)';
  };

  const t: CSSProperties = { transition: 'stroke 0.4s ease, fill 0.4s ease' };

  return (
    <svg
      viewBox="0 0 370 220"
      className={className}
      aria-hidden="true"
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Cloud outline */}
      <path
        d={cloudPath}
        stroke={getColor(0)}
        strokeWidth={SW}
        fill="none"
        style={t}
      />

      {/* Internal mesh lines */}
      {lines.map(([x1, y1, x2, y2], i) => (
        <line
          key={i}
          x1={x1} y1={y1} x2={x2} y2={y2}
          stroke={getColor(i + 1)}
          strokeWidth={SW}
          style={t}
        />
      ))}

      {/* Store name */}
      <text
        x="185"
        y="212"
        textAnchor="middle"
        fontSize="30"
        fontWeight="700"
        fontFamily="Assistant, sans-serif"
        direction="rtl"
        fill={getColor(lines.length + 1)}
        style={t}
      >
        קומפורט סליפ
      </text>
    </svg>
  );
}
