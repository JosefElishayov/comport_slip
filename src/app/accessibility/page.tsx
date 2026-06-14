import type { Metadata } from 'next';
import { cookies } from 'next/headers';
import { LOCALE_COOKIE, normalizeLocale, type Locale } from '@/lib/locale';

const META = {
  he: {
    title: 'הצהרת נגישות',
    description: 'הצהרת הנגישות של האתר בהתאם לתקן ישראלי 5568 ותיקון 16 לחוק שוויון זכויות לאנשים עם מוגבלות',
  },
  en: {
    title: 'Accessibility statement',
    description: 'The website accessibility statement in accordance with Israeli Standard 5568 and Amendment 16 to the Equal Rights for Persons with Disabilities Law',
  },
} as const;

export async function generateMetadata(): Promise<Metadata> {
  const locale = normalizeLocale((await cookies()).get(LOCALE_COOKIE)?.value);
  return { ...META[locale], alternates: { canonical: '/accessibility' } };
}

const CONTENT = {
  he: {
    title: 'הצהרת נגישות',
    lastUpdated: 'עודכן לאחרונה: 21 באפריל 2026',
    commitmentTitle: 'מחויבות לנגישות',
    commitmentBody:
      'אנו רואים בהנגשת האתר לאנשים עם מוגבלות ערך חשוב ופועלים ליישום תקנות שוויון זכויות לאנשים עם מוגבלות (התאמות נגישות לשירות), התשע"ג-2013, תקן ישראלי 5568 (מבוסס WCAG 2.0 ברמת AA), ותיקון 16 לחוק שוויון זכויות לאנשים עם מוגבלות, התשנ"ח-1998.',
    levelTitle: 'רמת הנגישות באתר',
    levelBody:
      'האתר עומד בדרישות תקנות הנגישות ברמת AA ומותאם לתקן הישראלי 5568. ההנגשה תואמת גם למכשירים ניידים ככל הניתן.',
    adjustmentsTitle: 'התאמות הנגישות באתר',
    adjustments: [
      'תפריט נגישות בולט וזמין בכל עמודי האתר (לחצן בפינה התחתונה).',
      'שינוי גודל גופן (הגדלה/הקטנה עד 160%).',
      'מצבי ניגודיות: ניגודיות גבוהה, ניגודיות הפוכה, מונוכרום, רקע בהיר.',
      'הדגשת קישורים והדגשת כותרות.',
      'גופן קריא המותאם לקוראים עם דיסלקציה.',
      'ריווח אותיות ושורות מוגדל.',
      'עצירת אנימציות ותמונות נעות.',
      'סמן עכבר מוגדל ומצביע קריאה.',
      'אפשרות הסתרת תמונות לקריאה נקייה.',
      'תמיכה מלאה בניווט במקלדת (Tab, Shift+Tab, Enter, Esc).',
      'מבנה סמנטי תקין (כותרות, אזורים, תוויות ARIA).',
      'תמיכה בקוראי מסך (NVDA, JAWS, VoiceOver, TalkBack).',
      'קישור "דלג לתוכן המרכזי" בראש כל עמוד.',
      'טקסט חלופי לתמונות בעלות משמעות (alt).',
      'כיווניות RTL/LTR תקינה ושפת עמוד מוגדרת (he/en).',
      'שמירת העדפות הנגישות של המשתמש בין ביקורים.',
    ],
    exceptionsTitle: 'חריגים וסייגים',
    exceptionsBody:
      'חלק מהתכנים באתר מקורם בצדדים שלישיים (כגון שערי תשלום, ספקי משלוח, מפות, סרטונים חיצוניים). אין באפשרותנו להבטיח את רמת הנגישות של תכנים אלו, אך אנו פועלים ככל הניתן לבחור ספקים התומכים בנגישות. אם נתקלתם בבעיית נגישות בתוכן חיצוני, נודה לכם אם תדווחו לנו על כך ונעשה מאמץ לסייע או להציע חלופה נגישה.',
    coordinatorTitle: 'רכז נגישות',
    coordinatorIntro:
      'במסגרת תיקון 16 לחוק שוויון זכויות לאנשים עם מוגבלות, מונה באתר רכז נגישות אליו ניתן לפנות בכל בקשה, הצעה או תלונה בנושא נגישות:',
    coordinator: [
      { label: 'שם', value: 'אברהם וויס' },
      { label: 'טלפון', value: '03-5794542' },
      { label: 'כתובת', value: 'רש"י 30, בני ברק' },
      { label: 'שעות מענה', value: 'א׳, ב׳, ד׳, ה׳ 11:00-14:00 ו-17:00-21:00; ג׳ 11:00-14:00; ו׳-ש׳ סגור' },
    ],
    coordinatorCommit:
      'אנו מתחייבים לטפל בכל פנייה בנושא נגישות בתוך 45 ימים ממועד קבלתה, בהתאם להוראות החוק.',
    reportTitle: 'דיווח על בעיית נגישות',
    reportIntro: 'אם נתקלתם בבעיית נגישות באתר, נשמח לדעת. אנא ציינו בפנייתכם:',
    reportItems: [
      'תיאור הבעיה.',
      'הפעולה שניסיתם לבצע.',
      'כתובת העמוד שבו נתקלתם בבעיה.',
      'סוג הדפדפן והמכשיר שבו השתמשתם.',
      'טכנולוגיה מסייעת, אם בשימוש (קורא מסך, הגדלה וכו׳).',
    ],
    updateTitle: 'עדכון ההצהרה',
    updateBody:
      'הצהרת נגישות זו עודכנה ביום 21 באפריל 2026. אנו ממשיכים לשפר ולעדכן את האתר על מנת להבטיח רמת נגישות מיטבית, ונעדכן הצהרה זו בהתאם.',
  },
  en: {
    title: 'Accessibility statement',
    lastUpdated: 'Last updated: April 21, 2026',
    commitmentTitle: 'Commitment to accessibility',
    commitmentBody:
      'We consider making our website accessible to people with disabilities an important value, and we work to implement the Equal Rights for Persons with Disabilities Regulations (Service Accessibility Adjustments), 5773-2013, Israeli Standard 5568 (based on WCAG 2.0 Level AA), and Amendment 16 to the Equal Rights for Persons with Disabilities Law, 5758-1998.',
    levelTitle: 'Accessibility level',
    levelBody:
      'The site meets the accessibility regulations at Level AA and conforms to Israeli Standard 5568. Accessibility is also adapted to mobile devices as far as possible.',
    adjustmentsTitle: 'Accessibility adjustments on the site',
    adjustments: [
      'A prominent accessibility menu available on every page (button in the corner of the screen).',
      'Font resizing (enlarge/reduce up to 160%).',
      'Contrast modes: high contrast, inverted contrast, monochrome, light background.',
      'Link highlighting and heading highlighting.',
      'A readable font adapted for readers with dyslexia.',
      'Increased letter and line spacing.',
      'Stopping animations and moving images.',
      'Enlarged mouse cursor and reading guide.',
      'Option to hide images for clean reading.',
      'Full keyboard navigation support (Tab, Shift+Tab, Enter, Esc).',
      'Valid semantic structure (headings, landmarks, ARIA labels).',
      'Screen reader support (NVDA, JAWS, VoiceOver, TalkBack).',
      'A "Skip to main content" link at the top of every page.',
      'Alternative text for meaningful images (alt).',
      'Correct RTL/LTR direction and a defined page language (he/en).',
      'Saving the user’s accessibility preferences between visits.',
    ],
    exceptionsTitle: 'Exceptions and reservations',
    exceptionsBody:
      'Some content on the site originates from third parties (such as payment gateways, shipping providers, maps, external videos). We cannot guarantee the accessibility level of such content, but we do our best to choose providers that support accessibility. If you encounter an accessibility problem in external content, we would appreciate it if you let us know, and we will make an effort to assist or offer an accessible alternative.',
    coordinatorTitle: 'Accessibility coordinator',
    coordinatorIntro:
      'Under Amendment 16 to the Equal Rights for Persons with Disabilities Law, an accessibility coordinator has been appointed, whom you may contact with any request, suggestion or complaint regarding accessibility:',
    coordinator: [
      { label: 'Name', value: 'Avraham Weiss' },
      { label: 'Phone', value: '03-5794542' },
      { label: 'Address', value: '30 Rashi St., Bnei Brak' },
      { label: 'Response hours', value: 'Sun, Mon, Wed, Thu 11:00-14:00 & 17:00-21:00; Tue 11:00-14:00; Fri-Sat closed' },
    ],
    coordinatorCommit:
      'We undertake to handle every accessibility request within 45 days of receipt, in accordance with the provisions of the law.',
    reportTitle: 'Reporting an accessibility problem',
    reportIntro: 'If you encounter an accessibility problem on the site, we’d like to know. Please include in your message:',
    reportItems: [
      'A description of the problem.',
      'The action you were trying to perform.',
      'The address of the page where you encountered the problem.',
      'The type of browser and device you used.',
      'Assistive technology, if used (screen reader, magnification, etc.).',
    ],
    updateTitle: 'Updating this statement',
    updateBody:
      'This accessibility statement was updated on April 21, 2026. We continue to improve and update the site to ensure an optimal level of accessibility, and we will update this statement accordingly.',
  },
} as const;

export default async function AccessibilityPage() {
  const locale: Locale = normalizeLocale((await cookies()).get(LOCALE_COOKIE)?.value);
  const c = CONTENT[locale];

  return (
    <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6 lg:px-8">
      <h1 className="text-3xl font-bold text-foreground mb-2">{c.title}</h1>
      <p className="text-sm text-muted-foreground mb-8">{c.lastUpdated}</p>

      <div className="prose prose-lg max-w-none space-y-6 text-foreground">
        <section>
          <h2 className="text-xl font-bold mb-2">{c.commitmentTitle}</h2>
          <p>{c.commitmentBody}</p>
        </section>

        <section>
          <h2 className="text-xl font-bold mb-2">{c.levelTitle}</h2>
          <p>{c.levelBody}</p>
        </section>

        <section>
          <h2 className="text-xl font-bold mb-2">{c.adjustmentsTitle}</h2>
          <ul className="list-disc ps-6 space-y-1">
            {c.adjustments.map((item, i) => (
              <li key={i}>{item}</li>
            ))}
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-bold mb-2">{c.exceptionsTitle}</h2>
          <p>{c.exceptionsBody}</p>
        </section>

        <section className="rounded-lg border border-border bg-secondary p-5">
          <h2 className="text-xl font-bold mb-2">{c.coordinatorTitle}</h2>
          <p className="mb-3">{c.coordinatorIntro}</p>
          <ul className="space-y-1">
            {c.coordinator.map((row) => (
              <li key={row.label}>
                <strong>{row.label}:</strong> {row.value}
              </li>
            ))}
          </ul>
          <p className="mt-3 text-sm text-muted-foreground">{c.coordinatorCommit}</p>
        </section>

        <section>
          <h2 className="text-xl font-bold mb-2">{c.reportTitle}</h2>
          <p>{c.reportIntro}</p>
          <ul className="list-disc ps-6 space-y-1">
            {c.reportItems.map((item, i) => (
              <li key={i}>{item}</li>
            ))}
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-bold mb-2">{c.updateTitle}</h2>
          <p>{c.updateBody}</p>
        </section>
      </div>
    </div>
  );
}
