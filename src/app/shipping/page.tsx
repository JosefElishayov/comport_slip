import type { Metadata } from 'next';
import { cookies } from 'next/headers';
import { LOCALE_COOKIE, normalizeLocale, type Locale } from '@/lib/locale';

const META = {
  he: {
    title: 'מדיניות משלוחים',
    description: 'זמני אספקה, עלויות משלוח ואזורי חלוקה',
  },
  en: {
    title: 'Shipping policy',
    description: 'Delivery times, shipping costs and delivery areas',
  },
} as const;

export async function generateMetadata(): Promise<Metadata> {
  const locale = normalizeLocale((await cookies()).get(LOCALE_COOKIE)?.value);
  return { ...META[locale], alternates: { canonical: '/shipping' } };
}

/** A section is rendered as: heading + array of blocks. A block is either a
 *  paragraph (string) or a bullet list ({ list: string[] }). */
type Block = string | { list: string[] };
interface Section {
  title: string;
  blocks: Block[];
  highlight?: boolean;
}

const CONTENT: Record<Locale, { title: string; lastUpdated: string; sections: Section[] }> = {
  he: {
    title: 'מדיניות משלוחים',
    lastUpdated: 'עודכן לאחרונה: 19 ביוני 2026',
    sections: [
      {
        title: '1. אזורי חלוקה',
        blocks: [
          'אנו מבצעים משלוחים לכל רחבי הארץ. ייתכנו אזורים מרוחקים או בעלי גישה מוגבלת בהם זמני האספקה יתארכו או יתואמו טלפונית מראש.',
        ],
      },
      {
        title: '2. עלויות משלוח',
        highlight: true,
        blocks: [
          {
            list: [
              'משלוח חינם בקנייה מעל ₪299.',
              'בהזמנות מתחת לסכום זה, עלות המשלוח תוצג באופן ברור בעמוד התשלום (Checkout) טרם אישור ההזמנה.',
              'אין עלויות נסתרות — הסכום הסופי לתשלום, כולל משלוח, מוצג לפני אישור ההזמנה.',
            ],
          },
        ],
      },
      {
        title: '3. זמני אספקה',
        blocks: [
          'זמן האספקה המשוער הוא 3–7 ימי עסקים מרגע אישור ההזמנה והתשלום. ימי עסקים אינם כוללים ימי שישי, שבת, ערבי חג וחגים.',
          'מוצרים מסוימים, לרבות מזרונים בהזמנה אישית, עשויים לחייב זמן אספקה ארוך יותר. במקרים אלו נעדכן אותך מראש ונתאם את מועד המסירה טלפונית.',
        ],
      },
      {
        title: '4. תיאום מסירה',
        blocks: [
          'לפני המסירה ניצור עמך קשר טלפוני לתיאום מועד נוח. חשוב להזין בעת ההזמנה מספר טלפון פעיל וכתובת מלאה ומדויקת.',
          'באחריות הלקוח לוודא נגישות סבירה למסירת המוצר (כניסה, מעלית/קומה). מסירת מוצרים גדולים מתבצעת עד הכניסה לבית.',
        ],
      },
      {
        title: '5. עיכובים',
        blocks: [
          'אנו עושים כמיטב יכולתנו לעמוד בזמני האספקה. במקרים חריגים שאינם בשליטתנו (מזג אוויר, עומסים אצל חברת השליחויות, מלאי) ייתכנו עיכובים. נעדכן אותך בהקדם ונפעל לפתרון מהיר.',
        ],
      },
      {
        title: '6. בדיקת המשלוח בקבלה',
        blocks: [
          'מומלץ לבדוק את שלמות האריזה במעמד הקבלה. אם הגיע מוצר באריזה פגומה — יש לציין זאת בפני השליח ולפנות אלינו תוך 14 ימים לטיפול.',
        ],
      },
      {
        title: '7. יצירת קשר',
        blocks: [
          'לשאלות בנוגע למשלוח הזמנה קיימת, ניתן לפנות אלינו בטלפון 03-5794542 או באמצעות טופס "צור קשר" באתר.',
        ],
      },
    ],
  },
  en: {
    title: 'Shipping policy',
    lastUpdated: 'Last updated: June 19, 2026',
    sections: [
      {
        title: '1. Delivery areas',
        blocks: [
          'We ship throughout Israel. In remote or restricted-access areas, delivery times may be longer or coordinated by phone in advance.',
        ],
      },
      {
        title: '2. Shipping costs',
        highlight: true,
        blocks: [
          {
            list: [
              'Free shipping on orders over ₪299.',
              'For orders below this amount, the shipping cost is shown clearly at Checkout before you confirm the order.',
              'No hidden costs — the final amount to pay, including shipping, is shown before you confirm the order.',
            ],
          },
        ],
      },
      {
        title: '3. Delivery times',
        blocks: [
          'The estimated delivery time is 3–7 business days from confirmation of the order and payment. Business days do not include Fridays, Saturdays, holiday eves and holidays.',
          'Certain products, including made-to-order mattresses, may require a longer delivery time. In such cases we will notify you in advance and coordinate the delivery date by phone.',
        ],
      },
      {
        title: '4. Delivery coordination',
        blocks: [
          'Before delivery we will contact you by phone to arrange a convenient time. It is important to enter an active phone number and a full, accurate address when ordering.',
          'It is the customer’s responsibility to ensure reasonable access for delivery (entrance, elevator/floor). Large items are delivered up to the entrance of the home.',
        ],
      },
      {
        title: '5. Delays',
        blocks: [
          'We do our best to meet the stated delivery times. In exceptional cases beyond our control (weather, courier-company loads, stock), delays may occur. We will update you promptly and work toward a quick resolution.',
        ],
      },
      {
        title: '6. Inspecting the shipment on receipt',
        blocks: [
          'We recommend checking the integrity of the packaging upon receipt. If a product arrives in damaged packaging — note this to the courier and contact us within 14 days for handling.',
        ],
      },
      {
        title: '7. Contact',
        blocks: [
          'For questions about the shipping of an existing order, you may contact us by phone at 03-5794542 or via the "Contact" form on the site.',
        ],
      },
    ],
  },
};

export default async function ShippingPage() {
  const locale: Locale = normalizeLocale((await cookies()).get(LOCALE_COOKIE)?.value);
  const c = CONTENT[locale];

  return (
    <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6 lg:px-8">
      <h1 className="text-3xl font-bold text-foreground mb-2">{c.title}</h1>
      <p className="text-sm text-muted-foreground mb-8">{c.lastUpdated}</p>

      <div className="space-y-8 text-foreground leading-relaxed">
        {c.sections.map((section) => (
          <section
            key={section.title}
            className={section.highlight ? 'rounded-lg border border-border bg-secondary p-5' : undefined}
          >
            <h2 className="text-xl font-bold mb-2">{section.title}</h2>
            {section.blocks.map((block, bi) =>
              typeof block === 'string' ? (
                <p key={bi} className={bi > 0 ? 'mt-2' : undefined}>
                  {block}
                </p>
              ) : (
                <ul key={bi} className="list-disc ps-6 space-y-1">
                  {block.list.map((item, ii) => (
                    <li key={ii}>{item}</li>
                  ))}
                </ul>
              )
            )}
          </section>
        ))}
      </div>
    </div>
  );
}
