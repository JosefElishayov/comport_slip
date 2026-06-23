import type { Metadata } from 'next';
import { ContactForm } from '@/components/contact/contact-form';
import { type Locale } from '@/lib/locale';
import { getServerLocale } from '@/lib/locale-server';

const META = {
  he: {
    title: 'צור קשר',
    description:
      'יש לכם שאלה על מזרן, משלוח או הזמנה? צוות קומפורט סליפ זמין עבורכם — מלאו את הטופס ונחזור אליכם בהקדם.',
  },
  en: {
    title: 'Contact',
    description:
      'Have a question about a mattress, shipping or an order? The Comfort Sleep team is here for you — fill in the form and we’ll get back to you soon.',
  },
} as const;

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getServerLocale();
  return { ...META[locale], alternates: { canonical: '/contact' } };
}

const CONTENT = {
  he: {
    heroTitle: 'דברו איתנו',
    heroLead1: 'יש שאלה על מזרן, ייעוץ להתאמה אישית או בירור על הזמנה?',
    heroLead2: 'נשמח לעזור — מלאו את הטופס ונחזור אליכם בהקדם.',
    serviceTitle: 'שירות לקוחות',
    hoursLabel: 'שעות פעילות',
    hours: ['א׳, ב׳, ד׳, ה׳: 11:00–14:00, 17:00–21:00', 'ג׳: 11:00–14:00 (אחה״צ סגור)', 'ו׳–ש׳: סגור'],
    storeLabel: 'חנות',
    storeValue: 'רחוב רש"י 30, בני ברק',
    phoneLabel: 'טלפון',
    includeTitle: 'מה כדאי לכלול בפנייה',
    includeItems: [
      '• מספר הזמנה (אם רלוונטי)',
      '• דגם המזרן או המוצר שמעניין אתכם',
      '• אופן יצירת הקשר המועדף עליכם',
    ],
  },
  en: {
    heroTitle: 'Talk to us',
    heroLead1: 'Have a question about a mattress, need a personal fitting consultation, or want to check on an order?',
    heroLead2: 'We’re happy to help — fill in the form and we’ll get back to you soon.',
    serviceTitle: 'Customer service',
    hoursLabel: 'Opening hours',
    hours: ['Sun, Mon, Wed, Thu: 11:00–14:00, 17:00–21:00', 'Tue: 11:00–14:00 (afternoon closed)', 'Fri–Sat: closed'],
    storeLabel: 'Store',
    storeValue: '30 Rashi St., Bnei Brak',
    phoneLabel: 'Phone',
    includeTitle: 'What to include in your message',
    includeItems: [
      '• Order number (if relevant)',
      '• The mattress model or product you’re interested in',
      '• Your preferred contact method',
    ],
  },
} as const;

export default async function ContactPage() {
  const locale: Locale = await getServerLocale();
  const c = CONTENT[locale];

  return (
    <div className="relative bg-gradient-to-b from-secondary/60 via-secondary/30 to-background">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-10 overflow-hidden"
      >
        <div className="absolute -top-32 -right-24 h-96 w-96 rounded-full bg-primary/10 blur-3xl" />
        <div className="absolute top-1/3 -left-32 h-[28rem] w-[28rem] rounded-full bg-accent/20 blur-3xl" />
      </div>
      <section className="relative overflow-hidden bg-gradient-to-b from-primary/10 via-secondary/60 to-transparent">
        <div className="mx-auto max-w-4xl px-4 py-16 text-center sm:px-6 sm:py-20 lg:px-8">
          <h1 className="text-4xl font-bold tracking-tight text-foreground sm:text-5xl">
            {c.heroTitle}
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-lg text-muted-foreground sm:text-xl">
            {c.heroLead1}
            <br />
            {c.heroLead2}
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-5xl px-4 py-12 sm:px-6 sm:py-16 lg:px-8">
        <div className="grid gap-8 lg:grid-cols-5">
          <div className="lg:col-span-3">
            <div className="rounded-2xl border border-border bg-background p-6 shadow-sm sm:p-8">
              <ContactForm />
            </div>
          </div>

          <aside className="lg:col-span-2">
            <div className="space-y-4">
              <div className="rounded-2xl border border-border bg-secondary/40 p-6">
                <h2 className="text-lg font-semibold text-foreground">{c.serviceTitle}</h2>
                <dl className="mt-4 space-y-3 text-sm">
                  <div>
                    <dt className="text-muted-foreground">{c.hoursLabel}</dt>
                    <dd className="mt-0.5 text-foreground">
                      {c.hours.map((h) => (
                        <div key={h}>{h}</div>
                      ))}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-muted-foreground">{c.storeLabel}</dt>
                    <dd className="mt-0.5 text-foreground">{c.storeValue}</dd>
                  </div>
                  <div>
                    <dt className="text-muted-foreground">{c.phoneLabel}</dt>
                    <dd className="mt-0.5 text-foreground">
                      <a href="tel:+97235794542" className="hover:text-primary" dir="ltr">03-5794542</a>
                    </dd>
                  </div>
                </dl>
              </div>

              <div className="rounded-2xl border border-border bg-background p-6">
                <h2 className="text-lg font-semibold text-foreground">{c.includeTitle}</h2>
                <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
                  {c.includeItems.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              </div>
            </div>
          </aside>
        </div>
      </section>
    </div>
  );
}
