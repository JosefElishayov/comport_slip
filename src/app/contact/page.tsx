import type { Metadata } from 'next';
import { ContactForm } from '@/components/contact/contact-form';

export const metadata: Metadata = {
  title: 'צור קשר',
  description:
    'יש לכם שאלה על מזרן, משלוח או הזמנה? צוות קומפורט סליפ זמין עבורכם — מלאו את הטופס ונחזור אליכם בהקדם.',
  alternates: { canonical: '/contact' },
};

export default function ContactPage() {
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
            דברו איתנו
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-lg text-muted-foreground sm:text-xl">
            יש שאלה על מזרן, ייעוץ להתאמה אישית או בירור על הזמנה?
            <br />
            נשמח לעזור — מלאו את הטופס ונחזור אליכם בהקדם.
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
                <h2 className="text-lg font-semibold text-foreground">שירות לקוחות</h2>
                <dl className="mt-4 space-y-3 text-sm">
                  <div>
                    <dt className="text-muted-foreground">שעות פעילות</dt>
                    <dd className="mt-0.5 text-foreground">
                      <div>א׳, ב׳, ד׳, ה׳: 11:00–14:00, 17:00–21:00</div>
                      <div>ג׳: 11:00–14:00 (אחה״צ סגור)</div>
                      <div>ו׳–ש׳: סגור</div>
                    </dd>
                  </div>
                  <div>
                    <dt className="text-muted-foreground">חנות</dt>
                    <dd className="mt-0.5 text-foreground">רחוב רש&quot;י 30, בני ברק</dd>
                  </div>
                  <div>
                    <dt className="text-muted-foreground">טלפון</dt>
                    <dd className="mt-0.5 text-foreground">
                      <a href="tel:+97235794542" className="hover:text-primary">03-5794542</a>
                    </dd>
                  </div>
                </dl>
              </div>

              <div className="rounded-2xl border border-border bg-background p-6">
                <h2 className="text-lg font-semibold text-foreground">מה כדאי לכלול בפנייה</h2>
                <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
                  <li>• מספר הזמנה (אם רלוונטי)</li>
                  <li>• דגם המזרן או המוצר שמעניין אתכם</li>
                  <li>• אופן יצירת הקשר המועדף עליכם</li>
                </ul>
              </div>
            </div>
          </aside>
        </div>
      </section>
    </div>
  );
}
