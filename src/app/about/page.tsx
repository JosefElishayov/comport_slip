import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'קצת עלינו',
  description:
    'קומפורט סליפ מבית רהיטי וייס — למעלה מ-40 שנות ניסיון בעולם המזרנים והשינה. עמינח, פולירון, סימונס ועוד תחת קורת גג אחת.',
  alternates: { canonical: '/about' },
};

const reasons = [
  {
    title: 'המותגים המובילים תחת קורת גג אחת',
    body: 'אנחנו עובדים בשיתוף פעולה הדוק עם השמות הגדולים ביותר – עמינח, פולירון, סימונס ועוד – כדי להבטיח שכל מזרן שתמצאו אצלנו עומד בסטנדרטים המחמירים ביותר של איכות ונוחות.',
    icon: (
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.562.562 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z"
      />
    ),
  },
  {
    title: 'ניסיון שמנצח הכל',
    body: '40 שנות ותק מאפשרות לנו לדעת בדיוק מה הלקוחות שלנו צריכים. ליווינו כבר אלפי משפחות ולקוחות מרוצים בדרך לשינה המושלמת.',
    icon: (
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z"
      />
    ),
  },
  {
    title: 'שירות מקצועי ואישי',
    body: 'למרות שאנחנו חנות אינטרנטית מתקדמת, הלב שלנו נמצא בשירות הלקוחות. אנחנו כאן כדי לייעץ, לכוון ולהתאים לכם את המזרן הנכון ביותר למבנה הגוף והרגלי השינה שלכם.',
    icon: (
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z"
      />
    ),
  },
  {
    title: 'הגב של "רהיטי וייס"',
    body: 'הקנייה באתר מגובה בכתובת פיזית ובמוניטין רב שנים, כך שאתם יכולים להיות רגועים שיש לכם תמיד למי לפנות.',
    icon: (
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M9 12.75L11.25 15 15 9.75M21 12c0 1.268-.63 2.39-1.593 3.068a3.745 3.745 0 01-1.043 3.296 3.745 3.745 0 01-3.296 1.043A3.745 3.745 0 0112 21c-1.268 0-2.39-.63-3.068-1.593a3.746 3.746 0 01-3.296-1.043 3.745 3.745 0 01-1.043-3.296A3.745 3.745 0 013 12c0-1.268.63-2.39 1.593-3.068a3.745 3.745 0 011.043-3.296 3.746 3.746 0 013.296-1.043A3.746 3.746 0 0112 3c1.268 0 2.39.63 3.068 1.593a3.746 3.746 0 013.296 1.043 3.746 3.746 0 011.043 3.296A3.745 3.745 0 0121 12z"
      />
    ),
  },
];

const brands = ['עמינח', 'פולירון', 'סימונס'];

export default function AboutPage() {
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
            למעלה מ-40 שנות ניסיון
          </span>
          <h1 className="mt-6 text-4xl font-bold tracking-tight text-foreground sm:text-5xl lg:text-6xl">
            נעים להכיר: קומפורט סליפ
          </h1>
          <p className="mt-3 text-xl font-medium text-primary sm:text-2xl">
            מבית רהיטי וייס
          </p>
          <p className="mx-auto mt-6 max-w-2xl text-lg leading-relaxed text-muted-foreground sm:text-xl">
            ארבעה עשורים של שינה טובה מתחילים כאן.
          </p>
        </div>
      </section>

      {/* Story */}
      <section className="mx-auto max-w-3xl px-4 py-16 sm:px-6 sm:py-20 lg:px-8">
        <div className="space-y-6 text-lg leading-relaxed text-foreground">
          <p>
            באתר <strong>&quot;קומפורט סליפ&quot;</strong>, מבית רהיטי וייס המוכרת
            והאהובה מרחוב רש&quot;י 30 בבני ברק, אנחנו מאמינים ששינה איכותית היא לא
            מותרות – היא הבסיס לחיים בריאים ומאושרים.
          </p>
          <p>
            עם ניסיון של למעלה מ-40 שנה בעולם הרהיטים והשינה, הקמנו את
            &quot;קומפורט סליפ&quot; כדי להנגיש לכם את המזרנים הטובים בעולם, במרחק
            קליק אחד, ועם אותה רמת אמינות ושירות אישי שמלווה אותנו בבני ברק כבר
            דורות.
          </p>
        </div>

        {/* Stats */}
        <div className="mt-12 grid grid-cols-2 gap-4 sm:grid-cols-3">
          <div className="rounded-2xl border border-border bg-secondary/60 p-6 text-center">
            <div className="text-4xl font-bold text-primary">40+</div>
            <div className="mt-1 text-sm font-medium text-muted-foreground">שנות ניסיון</div>
          </div>
          <div className="rounded-2xl border border-border bg-secondary/60 p-6 text-center">
            <div className="text-4xl font-bold text-primary">1000+</div>
            <div className="mt-1 text-sm font-medium text-muted-foreground">לקוחות מרוצים</div>
          </div>
          <div className="col-span-2 rounded-2xl border border-border bg-secondary/60 p-6 text-center sm:col-span-1">
            <div className="text-4xl font-bold text-primary">100%</div>
            <div className="mt-1 text-sm font-medium text-muted-foreground">שירות אישי</div>
          </div>
        </div>
      </section>

      {/* Why us */}
      <section className="bg-secondary/40">
        <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-20 lg:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-3xl font-bold text-foreground sm:text-4xl">
              למה לבחור בנו?
            </h2>
            <p className="mt-3 text-lg text-muted-foreground">
              ארבעה דברים שעושים את ההבדל בין מזרן רגיל לבחירה הנכונה לחיים.
            </p>
          </div>

          <div className="mt-12 grid gap-6 sm:grid-cols-2">
            {reasons.map((r) => (
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
                    {r.icon}
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
              עובדים עם המותגים המובילים
            </p>
            <div className="mt-5 flex flex-wrap items-center justify-center gap-x-10 gap-y-4">
              {brands.map((brand) => (
                <span
                  key={brand}
                  className="text-2xl font-bold tracking-tight text-foreground/80 sm:text-3xl"
                >
                  {brand}
                </span>
              ))}
              <span className="text-lg font-medium text-muted-foreground sm:text-xl">
                ועוד...
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
            מוזמנים להצטרף למשפחה
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-lg leading-relaxed text-primary-foreground/90">
            אנו מזמינים אתכם להצטרף למשפחת הלקוחות המרוצים שלנו וליהנות מחוויית
            קנייה בטוחה, משלוח מהיר ושירות ללא פשרות.
          </p>
          <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row sm:gap-4">
            <Link
              href="/products"
              className="inline-flex items-center gap-2 rounded-full bg-accent px-8 py-3.5 text-base font-semibold text-white shadow-lg transition-all hover:shadow-xl hover:brightness-110"
            >
              לצפייה במזרנים
              <svg className="h-5 w-5 rtl:rotate-180" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M14 5l7 7m0 0l-7 7m7-7H3" />
              </svg>
            </Link>
            <Link
              href="/"
              className="inline-flex items-center gap-2 rounded-full border-2 border-white/40 bg-white/10 px-8 py-3.5 text-base font-semibold text-white backdrop-blur transition-all hover:bg-white/20"
            >
              חזרה לדף הבית
            </Link>
          </div>
        </div>

        <p className="mt-12 text-center text-lg font-semibold text-foreground">
          מאחלים לכם לילה טוב ושנת ישרים,
          <br />
          <span className="text-primary">צוות קומפורט סליפ.</span>
        </p>
      </section>
    </div>
  );
}
