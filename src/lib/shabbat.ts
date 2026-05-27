// Closure-time calculator for Shabbat + Yom Tov (Israel).
// Self-contained: NOAA sunset + Reingold/Dershowitz Hebrew calendar arithmetic.
// No external API or library dependencies.

const JERUSALEM_LAT = 31.7683;
const JERUSALEM_LNG = 35.2137;
const CANDLE_LIGHTING_OFFSET_MIN = 20;
const HAVDALAH_OFFSET_MIN = 42;
const TZ = 'Asia/Jerusalem';

// ============================================================
// Sunset (NOAA solar algorithm)
// ============================================================

function toJulian(date: Date): number {
  return date.getTime() / 86400000 + 2440587.5;
}
function fromJulian(j: number): Date {
  return new Date((j - 2440587.5) * 86400000);
}

function calcSunsetUTC(year: number, month: number, day: number, lat: number, lng: number): Date {
  const date = new Date(Date.UTC(year, month - 1, day, 12, 0, 0));
  const n = Math.floor(toJulian(date) - 2451545.0 + 0.0008);
  const Jstar = n - lng / 360;
  const M = (357.5291 + 0.98560028 * Jstar) % 360;
  const Mrad = (M * Math.PI) / 180;
  const C = 1.9148 * Math.sin(Mrad) + 0.02 * Math.sin(2 * Mrad) + 0.0003 * Math.sin(3 * Mrad);
  const lambda = (M + C + 180 + 102.9372) % 360;
  const lambdaRad = (lambda * Math.PI) / 180;
  const Jtransit = 2451545.0 + Jstar + 0.0053 * Math.sin(Mrad) - 0.0069 * Math.sin(2 * lambdaRad);
  const delta = Math.asin(Math.sin(lambdaRad) * Math.sin((23.44 * Math.PI) / 180));
  const latRad = (lat * Math.PI) / 180;
  const cosH =
    (Math.sin((-0.83 * Math.PI) / 180) - Math.sin(latRad) * Math.sin(delta)) /
    (Math.cos(latRad) * Math.cos(delta));
  if (cosH > 1 || cosH < -1) return date;
  const H = (Math.acos(cosH) * 180) / Math.PI;
  const Jset = Jtransit + H / 360;
  return fromJulian(Jset);
}

// ============================================================
// Jerusalem-local civil date
// ============================================================

function jerusalemParts(d: Date): { y: number; m: number; day: number } {
  const fmt = new Intl.DateTimeFormat('en-US', {
    timeZone: TZ,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
  const parts = fmt.formatToParts(d);
  const get = (t: string) => parts.find((p) => p.type === t)?.value ?? '';
  return {
    y: Number(get('year')),
    m: Number(get('month')),
    day: Number(get('day')),
  };
}

// ============================================================
// Gregorian ↔ Rata Die (RD; Jan 1, 1 CE = day 1)
// ============================================================

function isGregLeap(y: number): boolean {
  return (y % 4 === 0 && y % 100 !== 0) || y % 400 === 0;
}

function gregorianToRD(y: number, m: number, d: number): number {
  const yPrior = y - 1;
  let rd =
    365 * yPrior +
    Math.floor(yPrior / 4) -
    Math.floor(yPrior / 100) +
    Math.floor(yPrior / 400) +
    Math.floor((367 * m - 362) / 12) +
    d;
  if (m > 2) rd += isGregLeap(y) ? -1 : -2;
  return rd;
}

function rdToGregorian(rd: number): { y: number; m: number; d: number } {
  const d0 = rd - 1;
  const n400 = Math.floor(d0 / 146097);
  const d1 = d0 % 146097;
  const n100 = Math.floor(d1 / 36524);
  const d2 = d1 % 36524;
  const n4 = Math.floor(d2 / 1461);
  const d3 = d2 % 1461;
  const n1 = Math.floor(d3 / 365);
  let year = 400 * n400 + 100 * n100 + 4 * n4 + n1;
  if (n100 === 4 || n1 === 4) return { y: year, m: 12, d: 31 };
  year += 1;
  const priorDays = rd - gregorianToRD(year, 1, 1);
  const correction = rd < gregorianToRD(year, 3, 1) ? 0 : isGregLeap(year) ? 1 : 2;
  const month = Math.floor((12 * (priorDays + correction) + 373) / 367);
  const day = rd - gregorianToRD(year, month, 1) + 1;
  return { y: year, m: month, d: day };
}

function weekdayOfRD(rd: number): number {
  const g = rdToGregorian(rd);
  return new Date(Date.UTC(g.y, g.m - 1, g.d, 12)).getUTCDay();
}

// ============================================================
// Hebrew calendar (Reingold/Dershowitz arithmetic)
// Months: 1=Nisan, 2=Iyar, 3=Sivan, 4=Tammuz, 5=Av, 6=Elul,
//         7=Tishrei, 8=Cheshvan, 9=Kislev, 10=Tevet, 11=Shevat,
//         12=Adar (or AdarI in leap), 13=AdarII (leap years only)
// ============================================================

const HEBREW_EPOCH = -1373427;

function isHebrewLeapYear(year: number): boolean {
  return (7 * year + 1) % 19 < 7;
}

function hebrewMonthsInYear(year: number): number {
  return isHebrewLeapYear(year) ? 13 : 12;
}

function hebrewCalendarElapsedDays(year: number): number {
  const monthsElapsed = Math.floor((235 * year - 234) / 19);
  const partsElapsed = 12084 + 13753 * monthsElapsed;
  const day = monthsElapsed * 29 + Math.floor(partsElapsed / 25920);
  return (3 * (day + 1)) % 7 < 3 ? day + 1 : day;
}

function hebrewYearLengthCorrection(year: number): number {
  const ny0 = hebrewCalendarElapsedDays(year - 1);
  const ny1 = hebrewCalendarElapsedDays(year);
  const ny2 = hebrewCalendarElapsedDays(year + 1);
  if (ny2 - ny1 === 356) return 2;
  if (ny1 - ny0 === 382) return 1;
  return 0;
}

function hebrewNewYear(year: number): number {
  return HEBREW_EPOCH + hebrewCalendarElapsedDays(year) + hebrewYearLengthCorrection(year);
}

function hebrewDaysInYear(year: number): number {
  return hebrewNewYear(year + 1) - hebrewNewYear(year);
}

function hebrewLongCheshvan(year: number): boolean {
  return hebrewDaysInYear(year) % 10 === 5;
}

function hebrewShortKislev(year: number): boolean {
  return hebrewDaysInYear(year) % 10 === 3;
}

function hebrewLastDayOfMonth(month: number, year: number): number {
  if ([2, 4, 6, 10, 13].includes(month)) return 29;
  if (month === 12 && !isHebrewLeapYear(year)) return 29;
  if (month === 8 && !hebrewLongCheshvan(year)) return 29;
  if (month === 9 && hebrewShortKislev(year)) return 29;
  return 30;
}

function hebrewToRD(year: number, month: number, day: number): number {
  let rd = hebrewNewYear(year) + day - 1;
  if (month < 7) {
    for (let k = 7; k <= hebrewMonthsInYear(year); k++) rd += hebrewLastDayOfMonth(k, year);
    for (let k = 1; k < month; k++) rd += hebrewLastDayOfMonth(k, year);
  } else {
    for (let k = 7; k < month; k++) rd += hebrewLastDayOfMonth(k, year);
  }
  return rd;
}

function rdToHebrew(rd: number): { y: number; m: number; d: number } {
  let year = Math.floor((rd - HEBREW_EPOCH) / 366) + 1;
  while (hebrewNewYear(year + 1) <= rd) year++;
  let month = rd < hebrewToRD(year, 1, 1) ? 7 : 1;
  while (rd > hebrewToRD(year, month, hebrewLastDayOfMonth(month, year))) month++;
  const day = rd - hebrewToRD(year, month, 1) + 1;
  return { y: year, m: month, d: day };
}

// ============================================================
// Yom Tov (Israel observance only — no second day Diaspora)
// ============================================================

function getYomTovHe(rd: number): string | null {
  const { m, d } = rdToHebrew(rd);
  if (m === 7) {
    if (d === 1 || d === 2) return 'ראש השנה';
    if (d === 10) return 'יום הכיפורים';
    if (d === 15) return 'סוכות';
    if (d === 22) return 'שמיני עצרת';
  }
  if (m === 1) {
    if (d === 15) return 'פסח';
    if (d === 21) return 'שביעי של פסח';
  }
  if (m === 3 && d === 6) return 'שבועות';
  return null;
}

function isShabbatRD(rd: number): boolean {
  return weekdayOfRD(rd) === 6; // Saturday
}

// ============================================================
// Closure windows (Shabbat + Yom Tov, merged across consecutive days)
// ============================================================

interface ClosureWindow {
  start: Date;
  end: Date;
  reasonsHe: string[];
}

function sunsetForRD(rd: number): Date {
  const g = rdToGregorian(rd);
  return calcSunsetUTC(g.y, g.m, g.d, JERUSALEM_LAT, JERUSALEM_LNG);
}

function buildClosureWindows(centerRD: number): ClosureWindow[] {
  const closed: Array<{ rd: number; reasons: string[] }> = [];
  for (let offset = -2; offset <= 40; offset++) {
    const rd = centerRD + offset;
    const reasons: string[] = [];
    if (isShabbatRD(rd)) reasons.push('שבת');
    const yt = getYomTovHe(rd);
    if (yt) reasons.push(yt);
    if (reasons.length) closed.push({ rd, reasons });
  }
  const windows: ClosureWindow[] = [];
  let i = 0;
  while (i < closed.length) {
    let j = i;
    while (j + 1 < closed.length && closed[j + 1].rd === closed[j].rd + 1) j++;
    const firstRD = closed[i].rd;
    const lastRD = closed[j].rd;
    const startSunset = sunsetForRD(firstRD - 1);
    const endSunset = sunsetForRD(lastRD);
    const start = new Date(startSunset.getTime() - CANDLE_LIGHTING_OFFSET_MIN * 60_000);
    const end = new Date(endSunset.getTime() + HAVDALAH_OFFSET_MIN * 60_000);
    const reasonSet = new Set<string>();
    for (let k = i; k <= j; k++) closed[k].reasons.forEach((r) => reasonSet.add(r));
    windows.push({ start, end, reasonsHe: Array.from(reasonSet) });
    i = j + 1;
  }
  return windows;
}

// ============================================================
// Public API
// ============================================================

export interface ClosureStatus {
  isClosed: boolean;
  start: Date;
  end: Date;
  reasonsHe: string[];
}

export function getClosureStatus(now: Date = new Date()): ClosureStatus | null {
  const jp = jerusalemParts(now);
  const centerRD = gregorianToRD(jp.y, jp.m, jp.day);
  const windows = buildClosureWindows(centerRD);
  for (const w of windows) {
    if (now >= w.start && now < w.end) {
      return { isClosed: true, start: w.start, end: w.end, reasonsHe: w.reasonsHe };
    }
  }
  const next = windows.find((w) => w.start > now);
  if (!next) return null;
  return { isClosed: false, start: next.start, end: next.end, reasonsHe: next.reasonsHe };
}

export function formatJerusalemTime(d: Date): string {
  return new Intl.DateTimeFormat('he-IL', {
    timeZone: TZ,
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).format(d);
}

export function formatJerusalemDate(d: Date): string {
  return new Intl.DateTimeFormat('he-IL', {
    timeZone: TZ,
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  }).format(d);
}

export function formatReasonHeading(reasons: string[]): {
  greeting: string;
  description: string;
} {
  const hasShabbat = reasons.includes('שבת');
  const chag = reasons.find((r) => r !== 'שבת');
  if (hasShabbat && chag) {
    return {
      greeting: `שבת שלום וחג ${chag} שמח`,
      description: `האתר סגור לכבוד שבת ו${chag}`,
    };
  }
  if (chag) {
    return {
      greeting: `חג ${chag} שמח`,
      description: `האתר סגור לכבוד ${chag}`,
    };
  }
  return {
    greeting: 'שבת שלום',
    description: 'האתר סגור לכבוד שבת קודש',
  };
}
