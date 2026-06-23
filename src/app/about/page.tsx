import type { Metadata } from 'next';
import Link from 'next/link';
import { withLocalePrefix, type Locale } from '@/lib/locale';
import { getServerLocale } from '@/lib/locale-server';

const META = {
  he: {
    title: 'קצת עלינו',
    description:
      'קומפורט סליפ מבית רהיטי וייס — למעלה מ-40 שנות ניסיון בעולם המזרנים והשינה. עמינח, פולירון, סימונס ועוד תחת קורת גג אחת.',
  },
  en: {
    title: 'About us',
    description:
      'Comfort Sleep by Weiss Furniture — over 40 years of experience in mattresses and sleep. Aminach, Polyron, Simmons and more under one roof.',
  },
} as const;

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getServerLocale();
  return { ...META[locale], alternates: { canonical: '/about' } };
}

const reasonIcons = [
  (
    <path
      key="star"
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.562.562 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z"
    />
  ),
  (
    <path
      key="clock"
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z"
    />
  ),
  (
    <path
      key="heart"
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z"
    />
  ),
  (
    <path
      key="badge"
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M9 12.75L11.25 15 15 9.75M21 12c0 1.268-.63 2.39-1.593 3.068a3.745 3.745 0 01-1.043 3.296 3.745 3.745 0 01-3.296 1.043A3.745 3.745 0 0112 21c-1.268 0-2.39-.63-3.068-1.593a3.746 3.746 0 01-3.296-1.043 3.745 3.745 0 01-1.043-3.296A3.745 3.745 0 013 12c0-1.268.63-2.39 1.593-3.068a3.745 3.745 0 011.043-3.296 3.746 3.746 0 013.296-1.043A3.746 3.746 0 0112 3c1.268 0 2.39.63 3.068 1.593a3.746 3.746 0 013.296 1.043 3.746 3.746 0 011.043 3.296A3.745 3.745 0 0121 12z"
    />
  ),
];

const CONTENT = {
  he: {
    badge: 'למעלה מ-40 שנות ניסיון',
    heroTitle: 'נעים להכיר: קומפורט סליפ',
    heroSub: 'מבית רהיטי וייס',
    heroLead: 'ארבעה עשורים של שינה טובה מתחילים כאן.',
    story: [
      'באתר "קומפורט סליפ", מבית רהיטי וייס המוכרת והאהובה מרחוב רש"י 30 בבני ברק, אנחנו מאמינים ששינה איכותית היא לא מותרות – היא הבסיס לחיים בריאים ומאושרים.',
      'עם ניסיון של למעלה מ-40 שנה בעולם הרהיטים והשינה, הקמנו את "קומפורט סליפ" כדי להנגיש לכם את המזרנים הטובים בעולם, במרחק קליק אחד, ועם אותה רמת אמינות ושירות אישי שמלווה אותנו בבני ברק כבר דורות.',
    ],
    stats: [
      { value: '40+', label: 'שנות ניסיון' },
      { value: '1000+', label: 'לקוחות מרוצים' },
      { value: '100%', label: 'שירות אישי' },
    ],
    whyTitle: 'למה לבחור בנו?',
    whySub: 'ארבעה דברים שעושים את ההבדל בין מזרן רגיל לבחירה הנכונה לחיים.',
    reasons: [
      {
        title: 'המותגים המובילים תחת קורת גג אחת',
        body: 'אנחנו עובדים בשיתוף פעולה הדוק עם השמות הגדולים ביותר – עמינח, פולירון, סימונס ועוד – כדי להבטיח שכל מזרן שתמצאו אצלנו עומד בסטנדרטים המחמירים ביותר של איכות ונוחות.',
      },
      {
        title: 'ניסיון שמנצח הכל',
        body: '40 שנות ותק מאפשרות לנו לדעת בדיוק מה הלקוחות שלנו צריכים. ליווינו כבר אלפי משפחות ולקוחות מרוצים בדרך לשינה המושלמת.',
      },
      {
        title: 'שירות מקצועי ואישי',
        body: 'למרות שאנחנו חנות אינטרנטית מתקדמת, הלב שלנו נמצא בשירות הלקוחות. אנחנו כאן כדי לייעץ, לכוון ולהתאים לכם את המזרן הנכון ביותר למבנה הגוף והרגלי השינה שלכם.',
      },
      {
        title: 'הגב של "רהיטי וייס"',
        body: 'הקנייה באתר מגובה בכתובת פיזית ובמוניטין רב שנים, כך שאתם יכולים להיות רגועים שיש לכם תמיד למי לפנות.',
      },
    ],
    brandsLabel: 'עובדים עם המותגים המובילים',
    brands: ['עמינח', 'פולירון', 'סימונס'],
    andMore: 'ועוד...',
    ctaTitle: 'מוזמנים להצטרף למשפחה',
    ctaBody:
      'אנו מזמינים אתכם להצטרף למשפחת הלקוחות המרוצים שלנו וליהנות מחוויית קנייה בטוחה, משלוח מהיר ושירות ללא פשרות.',
    ctaProducts: 'לצפייה במזרנים',
    ctaHome: 'חזרה לדף הבית',
    closing1: 'מאחלים לכם לילה טוב ושנת ישרים,',
    closing2: 'צוות קומפורט סליפ.',
  },
  en: {
    badge: 'Over 40 years of experience',
    heroTitle: 'Nice to meet you: Comfort Sleep',
    heroSub: 'by Weiss Furniture',
    heroLead: 'Four decades of good sleep start here.',
    story: [
      'At "Comfort Sleep", by the well-known and beloved Weiss Furniture of 30 Rashi St. in Bnei Brak, we believe that quality sleep is not a luxury — it is the foundation of a healthy and happy life.',
      'With over 40 years of experience in furniture and sleep, we founded "Comfort Sleep" to bring you the world’s best mattresses, just one click away, with the same reliability and personal service that have defined us in Bnei Brak for generations.',
    ],
    stats: [
      { value: '40+', label: 'Years of experience' },
      { value: '1000+', label: 'Happy customers' },
      { value: '100%', label: 'Personal service' },
    ],
    whyTitle: 'Why choose us?',
    whySub: 'Four things that make the difference between an ordinary mattress and the right choice for life.',
    reasons: [
      {
        title: 'The leading brands under one roof',
        body: 'We work closely with the biggest names — Aminach, Polyron, Simmons and more — to ensure every mattress you find with us meets the highest standards of quality and comfort.',
      },
      {
        title: 'Experience that beats everything',
        body: '40 years of seniority let us know exactly what our customers need. We have already guided thousands of families and satisfied customers on the way to perfect sleep.',
      },
      {
        title: 'Professional, personal service',
        body: 'Even though we’re an advanced online store, our heart is in customer service. We’re here to advise, guide and match you with the right mattress for your body and sleep habits.',
      },
      {
        title: 'Backed by "Weiss Furniture"',
        body: 'Shopping on the site is backed by a physical address and a long-standing reputation, so you can rest assured there’s always someone to turn to.',
      },
    ],
    brandsLabel: 'Working with the leading brands',
    brands: ['Aminach', 'Polyron', 'Simmons'],
    andMore: 'and more...',
    ctaTitle: 'Join the family',
    ctaBody:
      'We invite you to join our family of satisfied customers and enjoy a secure shopping experience, fast shipping and uncompromising service.',
    ctaProducts: 'Browse mattresses',
    ctaHome: 'Back to home',
    closing1: 'Wishing you a good night and sweet dreams,',
    closing2: 'The Comfort Sleep team.',
  },
} as const;

export default async function AboutPage() {
  const locale: Locale = await getServerLocale();
  const c = CONTENT[locale];

  return (
    <div className="bg-background">
      {/* Hero */}
      <section className="relative overflow-hidden bg-gradient-to-b from-primary/10 via-secondary to-background">
        <div className="absolute inset-0 -z-10 opacity-40">
          <div className="absolute -top-24 -right-24 h-72 w-72 rounded-full bg-accent/20 blur-3xl" />
          <div className="absolute -bottom-32 -left-20 h-80 w-80 rounded-full bg-primary/20 blur-3xl" />
        </div>
        <div className="mx-auto max-w-4xl px-4 py-20 text-center sm:px-6 sm:py-24 lg:py-28 lg:px-8">
          <span className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-white/70 px-4 py-1.5 text-sm font-medium text-primary backdrop-blur">
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.562.562 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z" />
            </svg>
            {c.badge}
          </span>
          <h1 className="mt-6 text-4xl font-bold tracking-tight text-foreground sm:text-5xl lg:text-6xl">
            {c.heroTitle}
          </h1>
          <p className="mt-3 text-xl font-medium text-primary sm:text-2xl">
            {c.heroSub}
          </p>
          <p className="mx-auto mt-6 max-w-2xl text-lg leading-relaxed text-muted-foreground sm:text-xl">
            {c.heroLead}
          </p>
        </div>
      </section>

      {/* Story */}
      <section className="mx-auto max-w-3xl px-4 py-16 sm:px-6 sm:py-20 lg:px-8">
        <div className="space-y-6 text-lg leading-relaxed text-foreground">
          {c.story.map((p, i) => (
            <p key={i}>{p}</p>
          ))}
        </div>

        {/* Stats */}
        <div className="mt-12 grid grid-cols-2 gap-4 sm:grid-cols-3">
          {c.stats.map((s, i) => (
            <div
              key={s.value}
              className={`rounded-2xl border border-border bg-secondary/60 p-6 text-center ${i === 2 ? 'col-span-2 sm:col-span-1' : ''}`}
            >
              <div className="text-4xl font-bold text-primary">{s.value}</div>
              <div className="mt-1 text-sm font-medium text-muted-foreground">{s.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Why us */}
      <section className="bg-secondary/40">
        <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-20 lg:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-3xl font-bold text-foreground sm:text-4xl">
              {c.whyTitle}
            </h2>
            <p className="mt-3 text-lg text-muted-foreground">
              {c.whySub}
            </p>
          </div>

          <div className="mt-12 grid gap-6 sm:grid-cols-2">
            {c.reasons.map((r, i) => (
              <div
                key={r.title}
                className="group relative rounded-2xl border border-border bg-background p-6 shadow-sm transition-all hover:-translate-y-1 hover:shadow-lg sm:p-8"
              >
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-accent/15 text-accent">
                  <svg
                    className="h-6 w-6"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={1.7}
                  >
                    {reasonIcons[i]}
                  </svg>
                </div>
                <h3 className="mt-5 text-xl font-bold text-foreground">{r.title}</h3>
                <p className="mt-3 leading-relaxed text-muted-foreground">{r.body}</p>
              </div>
            ))}
          </div>

          {/* Brands */}
          <div className="mt-14 rounded-2xl border border-border bg-background px-6 py-8 text-center sm:px-10">
            <p className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
              {c.brandsLabel}
            </p>
            <div className="mt-5 flex flex-wrap items-center justify-center gap-x-10 gap-y-4">
              {c.brands.map((brand) => (
                <span
                  key={brand}
                  className="text-2xl font-bold tracking-tight text-foreground/80 sm:text-3xl"
                >
                  {brand}
                </span>
              ))}
              <span className="text-lg font-medium text-muted-foreground sm:text-xl">
                {c.andMore}
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* Closing + CTA */}
      <section className="mx-auto max-w-4xl px-4 py-16 sm:px-6 sm:py-20 lg:px-8">
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-primary to-primary/80 px-6 py-12 text-center text-primary-foreground shadow-xl sm:px-12 sm:py-16">
          <div className="absolute inset-0 -z-10 opacity-20">
            <div className="absolute -top-10 -right-10 h-40 w-40 rounded-full bg-white blur-2xl" />
            <div className="absolute -bottom-10 -left-10 h-40 w-40 rounded-full bg-accent blur-2xl" />
          </div>
          <h2 className="text-3xl font-bold sm:text-4xl">
            {c.ctaTitle}
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-lg leading-relaxed text-primary-foreground/90">
            {c.ctaBody}
          </p>
          <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row sm:gap-4">
            <Link
              href={withLocalePrefix('/products', locale)}
              className="inline-flex items-center gap-2 rounded-full bg-accent px-8 py-3.5 text-base font-semibold text-white shadow-lg transition-all hover:shadow-xl hover:brightness-110"
            >
              {c.ctaProducts}
              <svg className="h-5 w-5 rtl:rotate-180" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M14 5l7 7m0 0l-7 7m7-7H3" />
              </svg>
            </Link>
            <Link
              href={withLocalePrefix('/', locale)}
              className="inline-flex items-center gap-2 rounded-full border-2 border-white/40 bg-white/10 px-8 py-3.5 text-base font-semibold text-white backdrop-blur transition-all hover:bg-white/20"
            >
              {c.ctaHome}
            </Link>
          </div>
        </div>

        <p className="mt-12 text-center text-lg font-semibold text-foreground">
          {c.closing1}
          <br />
          <span className="text-primary">{c.closing2}</span>
        </p>
      </section>
    </div>
  );
}
