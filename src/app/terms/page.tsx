import type { Metadata } from 'next';
import { cookies } from 'next/headers';
import { LOCALE_COOKIE, normalizeLocale, type Locale } from '@/lib/locale';

const META = {
  he: {
    title: 'תקנון ותנאי שימוש',
    description: 'תקנון האתר ותנאי השימוש בהתאם לדין הישראלי',
  },
  en: {
    title: 'Terms of use',
    description: 'Website terms and conditions in accordance with Israeli law',
  },
} as const;

export async function generateMetadata(): Promise<Metadata> {
  const locale = normalizeLocale((await cookies()).get(LOCALE_COOKIE)?.value);
  return { ...META[locale], alternates: { canonical: '/terms' } };
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
    title: 'תקנון ותנאי שימוש',
    lastUpdated: 'עודכן לאחרונה: 19 ביוני 2026',
    sections: [
      {
        title: '1. כללי',
        blocks: [
          'אתר זה ("האתר") מופעל על ידי אברהם וויס, רחוב רש"י 30, בני ברק ("העסק"). תקנון זה מסדיר את תנאי השימוש באתר ואת תנאי רכישת המוצרים המוצעים בו.',
          'עצם השימוש באתר וביצוע רכישה מהווים הסכמה מלאה לתנאי תקנון זה. אם אינך מסכים/ה לתנאים — נא הימנע/י משימוש באתר.',
          'התקנון מנוסח בלשון זכר מטעמי נוחות בלבד ומופנה לכלל המגדרים כאחד.',
        ],
      },
      {
        title: '2. הגדרות',
        blocks: [
          {
            list: [
              '"משתמש" / "לקוח" — כל הגולש או מבצע פעולה באתר.',
              '"מוצר" — כל פריט המוצע למכירה באתר.',
              '"עסקה" — רכישת מוצר באמצעות האתר.',
            ],
          },
        ],
      },
      {
        title: '3. כשרות לבצע רכישה',
        blocks: [
          'רשאי לבצע רכישה כל אדם בן 18 ומעלה, בעל כשרות משפטית, המחזיק באמצעי תשלום תקף. רכישה על ידי קטין מחייבת אישור הורה או אפוטרופוס.',
        ],
      },
      {
        title: '4. מוצרים, מחירים ומלאי',
        blocks: [
          {
            list: [
              'כל המחירים באתר נקובים בשקלים חדשים (₪) וכוללים מע"מ כדין.',
              'המחיר המחייב הוא המחיר המוצג במעמד אישור ההזמנה.',
              'אנו עושים מאמץ להציג תיאורים, תמונות וצבעים מדויקים. ייתכנו הבדלי גוון קלים בין התצוגה במסך לבין המוצר בפועל.',
              'המוצרים מוצעים בכפוף למלאי קיים. במקרה של חוסר במלאי לאחר ביצוע הזמנה, נעדכן אותך ונאפשר ביטול והחזר מלא.',
            ],
          },
        ],
      },
      {
        title: '5. ביצוע הזמנה ותשלום',
        blocks: [
          'ההזמנה נחשבת כמאושרת רק לאחר קבלת אישור תשלום מחברת הסליקה. התשלום מתבצע באמצעים המוצגים בעמוד התשלום. פרטי כרטיס האשראי מאובטחים ומועברים ישירות לספק סליקה בתקן PCI-DSS ואינם נשמרים אצלנו.',
          'העסק רשאי לבטל הזמנה במקרה של טעות מחיר מהותית, חשד למרמה או חריגה ממלאי, ובמקרה כזה יושב לך מלוא הסכום ששולם.',
        ],
      },
      {
        title: '6. אספקה והובלה',
        blocks: [
          'תנאי האספקה, זמני המשלוח והעלויות מפורטים במדיניות המשלוחים של האתר, המהווה חלק בלתי נפרד מתקנון זה.',
        ],
      },
      {
        title: '7. ביטול עסקה והחזרות',
        highlight: true,
        blocks: [
          'מדיניות ביטול עסקה, החזרת מוצרים וקבלת החזר כספי מפורטת במלואה בעמוד "מדיניות החזרות וביטולים" של האתר, בהתאם לחוק הגנת הצרכן, התשמ"א-1981 ולתקנות מכוחו.',
        ],
      },
      {
        title: '8. אחריות ושירות',
        blocks: [
          'המוצרים מסופקים עם אחריות יצרן/יבואן כמפורט במידע המצורף למוצר ובהתאם לדין. אחריות אינה חלה על נזק שנגרם משימוש לא נכון, בלאי טבעי או אי-עמידה בהוראות התחזוקה.',
        ],
      },
      {
        title: '9. קניין רוחני',
        blocks: [
          'כל התכנים באתר — לרבות עיצוב, טקסטים, תמונות, לוגו וסימני מסחר — הם קניינו של העסק או של מי מטעמו, ומוגנים בדיני הקניין הרוחני. אין להעתיק, לשכפל, להפיץ או לעשות שימוש מסחרי בתכנים ללא אישור מראש ובכתב.',
        ],
      },
      {
        title: '10. הגבלת אחריות',
        blocks: [
          'האתר ותכניו מסופקים כפי שהם ("AS IS"). העסק לא יישא באחריות לנזק עקיף או תוצאתי הנובע מהשימוש באתר. אחריות העסק בכל מקרה מוגבלת לסכום ששולם בפועל עבור המוצר נשוא התביעה.',
        ],
      },
      {
        title: '11. הגנת הפרטיות',
        blocks: [
          'איסוף המידע ושימושו כפופים למדיניות הפרטיות של האתר, המהווה חלק בלתי נפרד מתקנון זה.',
        ],
      },
      {
        title: '12. סמכות שיפוט ודין חל',
        blocks: [
          'על תקנון זה ועל כל הנובע ממנו יחולו דיני מדינת ישראל בלבד. סמכות השיפוט הבלעדית נתונה לבתי המשפט המוסמכים במחוז תל אביב.',
        ],
      },
      {
        title: '13. יצירת קשר',
        blocks: [
          'בכל שאלה בנוגע לתקנון זה ניתן לפנות אלינו בטלפון 03-5794542, בכתובת רחוב רש"י 30, בני ברק, או באמצעות טופס "צור קשר" באתר.',
        ],
      },
    ],
  },
  en: {
    title: 'Terms of use',
    lastUpdated: 'Last updated: June 19, 2026',
    sections: [
      {
        title: '1. General',
        blocks: [
          'This website (the "Site") is operated by Avraham Weiss, 30 Rashi St., Bnei Brak (the "Business"). These terms govern the use of the Site and the purchase of the products offered on it.',
          'Use of the Site and making a purchase constitute full agreement to these terms. If you do not agree to the terms — please refrain from using the Site.',
        ],
      },
      {
        title: '2. Definitions',
        blocks: [
          {
            list: [
              '"User" / "Customer" — anyone browsing or taking an action on the Site.',
              '"Product" — any item offered for sale on the Site.',
              '"Transaction" — the purchase of a product through the Site.',
            ],
          },
        ],
      },
      {
        title: '3. Eligibility to purchase',
        blocks: [
          'Any person aged 18 or over, with legal capacity, holding a valid means of payment, may make a purchase. A purchase by a minor requires the consent of a parent or guardian.',
        ],
      },
      {
        title: '4. Products, prices and stock',
        blocks: [
          {
            list: [
              'All prices on the Site are stated in New Israeli Shekels (₪) and include VAT as required by law.',
              'The binding price is the price displayed at the time the order is confirmed.',
              'We make every effort to present accurate descriptions, images and colors. Slight shade differences may exist between the on-screen display and the actual product.',
              'Products are offered subject to availability. If an item is out of stock after an order is placed, we will notify you and allow cancellation with a full refund.',
            ],
          },
        ],
      },
      {
        title: '5. Placing an order and payment',
        blocks: [
          'An order is considered confirmed only after payment approval is received from the payment processor. Payment is made via the means shown on the checkout page. Credit card details are secured and passed directly to a PCI-DSS-compliant payment processor and are not stored by us.',
          'The Business may cancel an order in the event of a material pricing error, suspected fraud or stock shortage, in which case the full amount paid will be refunded to you.',
        ],
      },
      {
        title: '6. Supply and delivery',
        blocks: [
          'Delivery terms, shipping times and costs are detailed in the Site’s shipping policy, which forms an integral part of these terms.',
        ],
      },
      {
        title: '7. Cancellation and returns',
        highlight: true,
        blocks: [
          'The policy for cancellation, product returns and refunds is set out in full on the Site’s "Returns & cancellation policy" page, in accordance with the Consumer Protection Law, 5741-1981 and the regulations thereunder.',
        ],
      },
      {
        title: '8. Warranty and service',
        blocks: [
          'Products are supplied with a manufacturer/importer warranty as detailed in the information accompanying the product and in accordance with the law. The warranty does not cover damage caused by improper use, natural wear or failure to follow maintenance instructions.',
        ],
      },
      {
        title: '9. Intellectual property',
        blocks: [
          'All content on the Site — including design, texts, images, logo and trademarks — is the property of the Business or those on its behalf, and is protected by intellectual property law. The content may not be copied, reproduced, distributed or used commercially without prior written consent.',
        ],
      },
      {
        title: '10. Limitation of liability',
        blocks: [
          'The Site and its content are provided "AS IS". The Business shall not be liable for any indirect or consequential damage arising from the use of the Site. The Business’s liability is in any event limited to the amount actually paid for the product at issue.',
        ],
      },
      {
        title: '11. Privacy',
        blocks: [
          'The collection and use of information are subject to the Site’s privacy policy, which forms an integral part of these terms.',
        ],
      },
      {
        title: '12. Jurisdiction and governing law',
        blocks: [
          'These terms and anything arising from them shall be governed solely by the laws of the State of Israel. Exclusive jurisdiction is granted to the competent courts in the Tel Aviv District.',
        ],
      },
      {
        title: '13. Contact',
        blocks: [
          'For any question regarding these terms you may contact us by phone at 03-5794542, at 30 Rashi St., Bnei Brak, or via the "Contact" form on the site.',
        ],
      },
    ],
  },
};

export default async function TermsPage() {
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
