import type { Metadata } from 'next';
import { cookies } from 'next/headers';
import { LOCALE_COOKIE, normalizeLocale, type Locale } from '@/lib/locale';

const META = {
  he: {
    title: 'מדיניות החזרות וביטולים',
    description: 'מדיניות החזרות, החזרים וביטול עסקה בהתאם לחוק הגנת הצרכן, התשמ"א-1981',
  },
  en: {
    title: 'Returns & cancellation policy',
    description: 'Returns, refunds and order cancellation policy in accordance with the Consumer Protection Law, 5741-1981',
  },
} as const;

export async function generateMetadata(): Promise<Metadata> {
  const locale = normalizeLocale((await cookies()).get(LOCALE_COOKIE)?.value);
  return { ...META[locale], alternates: { canonical: '/returns' } };
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
    title: 'מדיניות החזרות וביטולים',
    lastUpdated: 'עודכן לאחרונה: 19 ביוני 2026',
    sections: [
      {
        title: '1. כללי',
        blocks: [
          'מדיניות זו מסדירה את אופן ביטול עסקה, החזרת מוצרים וקבלת החזר כספי, בהתאם לחוק הגנת הצרכן, התשמ"א-1981 ולתקנות הגנת הצרכן (ביטול עסקה), התשע"א-2010. אין באמור כדי לגרוע מזכויותיך על פי דין.',
          'פרטי העסק: אברהם וויס, רחוב רש"י 30, בני ברק. טלפון לפניות: 03-5794542.',
        ],
      },
      {
        title: '2. תקופת הביטול',
        highlight: true,
        blocks: [
          'ניתן לבטל עסקה ולהחזיר מוצר תוך 14 ימים מיום קבלת המוצר או מיום קבלת מסמך פרטי העסקה — לפי המאוחר מביניהם.',
          'לצרכן שהוא אדם עם מוגבלות, אזרח ותיק (מעל גיל 65) או עולה חדש — תקופת הביטול הינה 4 חודשים, בכפוף להצגת תעודה מתאימה.',
        ],
      },
      {
        title: '3. תנאים להחזרת מוצר',
        blocks: [
          'החזרת מוצר תתאפשר בהתקיים התנאים הבאים:',
          {
            list: [
              'המוצר לא נעשה בו שימוש ולא נפגם.',
              'המוצר מוחזר באריזתו המקורית, כשהיא סגורה ושלמה.',
              'מצורפת חשבונית או אסמכתת רכישה.',
            ],
          },
        ],
      },
      {
        title: '4. מוצרים מטעמי היגיינה (מזרונים ומוצרי שינה)',
        highlight: true,
        blocks: [
          'בהתאם לתקנות הגנת הצרכן (ביטול עסקה), מוצרים שעשויים להיפגע מטעמי היגיינה לאחר פתיחת אריזתם — ובכלל זה מזרונים, כריות, מצעים ומגיני מזרון — ניתנים להחזרה רק כל עוד אריזתם המקורית סגורה ולא נפתחה.',
          'מזרון שאריזתו נפתחה או שנעשה בו שימוש לא יתקבל בחזרה, אלא אם נמצא בו פגם או אי-התאמה. מומלץ לבדוק את המוצר טרם פתיחת האריזה.',
        ],
      },
      {
        title: '5. עלות משלוח ההחזרה ודמי ביטול',
        blocks: [
          {
            list: [
              'עלות משלוח ההחזרה חלה על הלקוח, אלא אם המוצר הוחזר עקב פגם או אי-התאמה.',
              'בביטול שאינו עקב פגם, רשאי העסק לגבות דמי ביטול בשיעור של עד 5% ממחיר המוצר או 100 ₪ — לפי הנמוך מביניהם.',
              'במקרה של פגם, אי-התאמה או ביטול מצד העסק — לא ייגבו דמי ביטול והחזר המשלוח יחול עלינו.',
            ],
          },
        ],
      },
      {
        title: '6. ביצוע ההחזר הכספי',
        blocks: [
          'ההחזר הכספי יבוצע באמצעי התשלום שבו בוצעה הרכישה, תוך 14 ימים ממועד קבלת הודעת הביטול (ובהחזרת מוצר — לאחר קבלתו אצלנו). יופחתו ממנו דמי הביטול במידה ורלוונטיים כאמור בסעיף 5.',
        ],
      },
      {
        title: '7. מוצרים פגומים או שגויים',
        blocks: [
          'קיבלת מוצר פגום, שגוי או שאינו תואם להזמנה? צרו עמנו קשר תוך 14 ימים ונדאג לאיסוף, החלפה או החזר כספי מלא — ללא עלות מצדך.',
        ],
      },
      {
        title: '8. אופן ביצוע הביטול',
        blocks: [
          'ניתן להודיע על ביטול עסקה באחת מהדרכים הבאות:',
          {
            list: [
              'בטלפון: 03-5794542',
              'בדוא"ל או באמצעות טופס "צור קשר" באתר',
              'בכתב לכתובת: רחוב רש"י 30, בני ברק',
            ],
          },
          'בהודעה יש לציין שם מלא, מספר הזמנה ופרטי קשר.',
        ],
      },
    ],
  },
  en: {
    title: 'Returns & cancellation policy',
    lastUpdated: 'Last updated: June 19, 2026',
    sections: [
      {
        title: '1. General',
        blocks: [
          'This policy governs how an order may be cancelled, products returned and refunds issued, in accordance with the Consumer Protection Law, 5741-1981 and the Consumer Protection Regulations (Cancellation of a Transaction), 5771-2010. Nothing herein derogates from your rights under law.',
          'Business details: Avraham Weiss, 30 Rashi St., Bnei Brak. Phone for inquiries: 03-5794542.',
        ],
      },
      {
        title: '2. Cancellation period',
        highlight: true,
        blocks: [
          'An order may be cancelled and a product returned within 14 days from the day the product was received or from the day the transaction details document was received — whichever is later.',
          'For a consumer who is a person with a disability, a senior citizen (over the age of 65) or a new immigrant — the cancellation period is 4 months, subject to presentation of a suitable certificate.',
        ],
      },
      {
        title: '3. Conditions for returning a product',
        blocks: [
          'A product may be returned provided that:',
          {
            list: [
              'The product has not been used and has not been damaged.',
              'The product is returned in its original packaging, sealed and intact.',
              'An invoice or proof of purchase is attached.',
            ],
          },
        ],
      },
      {
        title: '4. Products subject to hygiene (mattresses & sleep products)',
        highlight: true,
        blocks: [
          'In accordance with the Consumer Protection Regulations (Cancellation of a Transaction), products that may be impaired for hygiene reasons once their packaging is opened — including mattresses, pillows, bedding and mattress protectors — may be returned only while their original packaging remains sealed and unopened.',
          'A mattress whose packaging has been opened or that has been used will not be accepted for return, unless it is found to be defective or non-conforming. We recommend inspecting the product before opening the packaging.',
        ],
      },
      {
        title: '5. Return shipping cost and cancellation fee',
        blocks: [
          {
            list: [
              'The cost of return shipping is borne by the customer, unless the product is returned due to a defect or non-conformity.',
              'For a cancellation not due to a defect, the business may charge a cancellation fee of up to 5% of the product price or ₪100 — whichever is lower.',
              'In the case of a defect, non-conformity or cancellation by the business — no cancellation fee will be charged and the return shipping will be borne by us.',
            ],
          },
        ],
      },
      {
        title: '6. Issuing the refund',
        blocks: [
          'The refund will be made to the payment method used for the purchase, within 14 days of receiving the cancellation notice (and for a returned product — after we receive it). Any applicable cancellation fee as described in Section 5 will be deducted from it.',
        ],
      },
      {
        title: '7. Defective or incorrect products',
        blocks: [
          'Received a defective, incorrect or non-conforming product? Contact us within 14 days and we will arrange collection, replacement or a full refund — at no cost to you.',
        ],
      },
      {
        title: '8. How to cancel',
        blocks: [
          'You may give notice of cancellation in one of the following ways:',
          {
            list: [
              'By phone: 03-5794542',
              'By email or via the "Contact" form on the site',
              'In writing to: 30 Rashi St., Bnei Brak',
            ],
          },
          'The notice should include your full name, order number and contact details.',
        ],
      },
    ],
  },
};

export default async function ReturnsPage() {
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
