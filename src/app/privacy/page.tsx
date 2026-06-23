import type { Metadata } from 'next';
import { type Locale } from '@/lib/locale';
import { getServerLocale } from '@/lib/locale-server';

const META = {
  he: {
    title: 'מדיניות פרטיות',
    description: 'מדיניות הפרטיות של האתר בהתאם לחוק הגנת הפרטיות, התשמ"א-1981 ותיקון 13',
  },
  en: {
    title: 'Privacy policy',
    description: 'The website privacy policy in accordance with the Protection of Privacy Law, 5741-1981 and Amendment 13',
  },
} as const;

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getServerLocale();
  return { ...META[locale], alternates: { canonical: '/privacy' } };
}

/** A section is rendered as: heading + array of blocks. A block is either a
 *  paragraph (string) or a bullet list ({ list: string[] }). */
type Block = string | { list: string[] };
interface Section {
  title: string;
  blocks: Block[];
  highlight?: boolean;
}

const AUTHORITY_URL = 'https://www.gov.il/he/departments/the_privacy_protection_authority';

const CONTENT: Record<Locale, { title: string; lastUpdated: string; sections: Section[]; authorityNotePrefix: string; authorityLinkText: string }> = {
  he: {
    title: 'מדיניות פרטיות',
    lastUpdated: 'עודכן לאחרונה: 21 באפריל 2026',
    authorityNotePrefix: 'במידה ופנייתך לא נענתה לשביעות רצונך, הינך רשאי/ת לפנות לרשות להגנת הפרטיות במשרד המשפטים: ',
    authorityLinkText: 'רשות להגנת הפרטיות',
    sections: [
      {
        title: '1. כללי',
        blocks: [
          'מדיניות פרטיות זו מסדירה את אופן איסוף, שימוש, שמירה וגילוי מידע אישי של משתמשי האתר, בהתאם לחוק הגנת הפרטיות, התשמ"א-1981, תקנות הגנת הפרטיות (אבטחת מידע), התשע"ז-2017, ותיקון 13 לחוק הגנת הפרטיות (שנכנס לתוקף באוגוסט 2025).',
          'השימוש באתר מהווה הסכמה לתנאי מדיניות פרטיות זו. אם אינך מסכים/ה לתנאים — נא אל תעשה/י שימוש באתר.',
        ],
      },
      {
        title: '2. בעל מאגר המידע',
        blocks: [
          { list: ['שם העסק: אברהם וויס', 'כתובת: רש"י 30, בני ברק', 'טלפון לפניות בנושא פרטיות: 03-5794542'] },
        ],
      },
      {
        title: '3. סוגי המידע הנאסף',
        blocks: [
          'במהלך השימוש באתר, ייתכן שייאסף מידע מהסוגים הבאים:',
          {
            list: [
              'מידע שאתה מוסר ביודעין: שם מלא, כתובת דוא"ל, טלפון, כתובת למשלוח, פרטי חשבון (סיסמה מאוחסנת בצורה מוצפנת בלבד).',
              'מידע על הזמנות ותשלומים: פרטי הזמנות, היסטוריית רכישות. פרטי כרטיס אשראי אינם נשמרים אצלנו — הם מועברים ישירות לספק סליקה מאובטח תקן PCI-DSS.',
              'מידע טכני שנאסף אוטומטית: כתובת IP, סוג דפדפן, מערכת הפעלה, עמודים שנצפו, זמני גלישה, מזהי session.',
              'עוגיות (Cookies): ראה/י סעיף העוגיות להלן.',
            ],
          },
        ],
      },
      {
        title: '4. מטרות השימוש במידע',
        blocks: [
          {
            list: [
              'ביצוע הזמנות, עיבוד תשלומים וניהול משלוחים.',
              'יצירת חשבון משתמש ותחזוקתו.',
              'מתן שירות לקוחות וטיפול בפניות.',
              'שיפור חוויית המשתמש והאתר.',
              'משלוח תוכן שיווקי ועדכונים (בכפוף להסכמה מפורשת נפרדת בלבד, סעיף 30א לחוק התקשורת "חוק הספאם").',
              'עמידה בדרישות החוק (דיני מס, דוחות, חקירות רשויות).',
              'מניעת הונאות ושמירה על אבטחת האתר.',
            ],
          },
        ],
      },
      {
        title: '5. חובת מסירת המידע',
        blocks: [
          'אין חובה חוקית למסור מידע אישי לאתר, אולם ללא מסירת מידע מסוים לא ניתן יהיה לבצע הזמנה או לפתוח חשבון משתמש. שדות חובה מסומנים בכוכבית בטפסים.',
        ],
      },
      {
        title: '6. העברת מידע לצדדים שלישיים',
        blocks: [
          'המידע עשוי לעבור לצדדים שלישיים אך ורק למטרות הבאות:',
          {
            list: [
              'ספקי סליקה: לצורך עיבוד תשלומים (לא נשמרים אצלנו פרטי אשראי).',
              'חברות שליחויות ומשלוחים: שם, כתובת וטלפון לצורך משלוח בלבד.',
              'ספקי תשתית וענן: לאחסון מאובטח של המידע.',
              'רשויות מוסמכות: מכוח צו שיפוטי או חובה חוקית מפורשת.',
            ],
          },
          'לא נמכור, נשכיר או נסחור במידע האישי שלך לכל גורם חיצוני למטרות שיווקיות של צד ג׳.',
        ],
      },
      {
        title: '7. העברת מידע אל מחוץ לישראל',
        blocks: [
          'חלק משירותי הענן ותשתיות האתר עשויים לאחסן מידע בשרתים מחוץ לישראל. בהתאם לתקנות הגנת הפרטיות (העברת מידע אל מאגרי מידע שמחוץ לגבולות המדינה), התשס"א-2001, נעשה שימוש בספקים הפועלים תחת דיני הגנת פרטיות מקבילים (לרבות GDPR באיחוד האירופי).',
        ],
      },
      {
        title: '8. עוגיות (Cookies)',
        blocks: [
          'האתר עושה שימוש בעוגיות מסוגים הבאים:',
          {
            list: [
              'עוגיות חיוניות: הכרחיות לתפקוד האתר (סל קניות, התחברות, אבטחה). לא ניתן לחסום אותן ללא פגיעה בשירות.',
              'עוגיות העדפות: שומרות הגדרות משתמש (שפה, העדפות נגישות).',
              'עוגיות ביצועים ואנליטיקה: עוזרות לנו להבין כיצד משתמשים באתר (בצורה מצטברת ואנונימית).',
            ],
          },
          'ניתן לחסום או למחוק עוגיות בהגדרות הדפדפן. חסימת עוגיות חיוניות עלולה לפגוע בפעילות האתר.',
        ],
      },
      {
        title: '9. אבטחת מידע',
        blocks: [
          'אנו נוקטים באמצעי אבטחה מקובלים בהתאם לתקנות הגנת הפרטיות (אבטחת מידע), התשע"ז-2017, לרבות: הצפנת תעבורה (HTTPS/TLS), הצפנת סיסמאות, בקרת גישה, גיבויים, ניטור אירועי אבטחה, ובדיקות חדירה תקופתיות. עם זאת, אין באפשרותנו להבטיח חסינות מוחלטת מפני פריצות או גישה בלתי מורשית.',
        ],
      },
      {
        title: '10. דיווח על אירוע אבטחה (תיקון 13)',
        highlight: true,
        blocks: [
          'בהתאם לתיקון 13 לחוק הגנת הפרטיות (בתוקף מאוגוסט 2025), במקרה של אירוע אבטחה חמור שעשוי לפגוע בפרטיותך, אנו מתחייבים לדווח על כך לרשות להגנת הפרטיות ולך כנפגע/ת בהתאם לדרישות החוק ובזמן הנדרש.',
        ],
      },
      {
        title: '11. תקופת שמירת המידע',
        blocks: [
          {
            list: [
              'חשבון פעיל: כל עוד החשבון קיים.',
              'הזמנות ותשלומים: 7 שנים מיום ההזמנה (חובת שמירת מסמכים לפי דיני מס).',
              'נתוני אנליטיקה: עד 26 חודשים באופן מצטבר.',
              'מידע שיווקי: עד לביטול ההסכמה.',
            ],
          },
        ],
      },
      {
        title: '12. זכויותיך',
        highlight: true,
        blocks: [
          'על פי חוק הגנת הפרטיות, התשמ"א-1981, עומדות לך הזכויות הבאות:',
          {
            list: [
              'זכות עיון (סעיף 13): לבקש לעיין במידע האישי הנשמר עליך.',
              'זכות לתיקון (סעיף 14): לבקש תיקון מידע שגוי, לא מעודכן או לא מדויק.',
              'זכות למחיקה: לבקש מחיקת המידע (בכפוף לחובות שמירה חוקיות).',
              'זכות ביטול דיוור: לבקש הסרה מרשימות תפוצה שיווקיות בכל עת.',
              'זכות להגבלת עיבוד: לפי תיקון 13 — לבקש להגביל עיבוד מידע במקרים מסוימים.',
              'זכות לנייד מידע: לקבל העתק של המידע בפורמט קריא.',
            ],
          },
          'למימוש זכויות אלו — פנה/י אלינו בפרטים המופיעים בסעיף 2. נענה לפנייתך תוך 30 ימים בהתאם לתקנות הגנת הפרטיות (תנאים לעיון במידע), התשמ"א-1981.',
        ],
      },
      {
        title: '13. פרטיות קטינים',
        blocks: [
          'השירות אינו מיועד לקטינים מתחת לגיל 18. אם מתחת לגיל 18 — יש לקבל אישור מפורש של הורה/אפוטרופוס טרם השימוש. במידה ונוודע לנו שנאסף מידע מקטין ללא אישור כאמור, נפעל למחיקתו בהקדם.',
        ],
      },
      {
        title: '14. שינויים במדיניות',
        blocks: [
          'אנו שומרים לעצמנו את הזכות לעדכן מדיניות זו מעת לעת. שינויים מהותיים יובאו לידיעתך באמצעות הודעה בולטת באתר או בדוא"ל. תאריך העדכון האחרון מופיע בראש העמוד.',
        ],
      },
      {
        title: '15. יצירת קשר',
        blocks: [
          'בכל שאלה, בקשה או תלונה בנוגע לפרטיותך או מדיניות זו, ניתן לפנות אלינו בפרטים המופיעים בסעיף 2 לעיל. אנו מתחייבים להשיב לכל פנייה בתוך 30 ימים.',
        ],
      },
    ],
  },
  en: {
    title: 'Privacy policy',
    lastUpdated: 'Last updated: April 21, 2026',
    authorityNotePrefix: 'If your request was not handled to your satisfaction, you may contact the Privacy Protection Authority at the Ministry of Justice: ',
    authorityLinkText: 'Privacy Protection Authority',
    sections: [
      {
        title: '1. General',
        blocks: [
          'This privacy policy governs how personal information of site users is collected, used, stored and disclosed, in accordance with the Protection of Privacy Law, 5741-1981, the Protection of Privacy Regulations (Data Security), 5777-2017, and Amendment 13 to the Protection of Privacy Law (effective August 2025).',
          'Use of the site constitutes consent to the terms of this privacy policy. If you do not agree to the terms — please do not use the site.',
        ],
      },
      {
        title: '2. Database owner',
        blocks: [
          { list: ['Business name: Avraham Weiss', 'Address: 30 Rashi St., Bnei Brak', 'Phone for privacy inquiries: 03-5794542'] },
        ],
      },
      {
        title: '3. Types of information collected',
        blocks: [
          'During your use of the site, the following types of information may be collected:',
          {
            list: [
              'Information you knowingly provide: full name, email address, phone, shipping address, account details (passwords are stored encrypted only).',
              'Order and payment information: order details, purchase history. Credit card details are not stored by us — they are passed directly to a secure, PCI-DSS-compliant payment processor.',
              'Technical information collected automatically: IP address, browser type, operating system, pages viewed, browsing times, session identifiers.',
              'Cookies: see the cookies section below.',
            ],
          },
        ],
      },
      {
        title: '4. Purposes of using the information',
        blocks: [
          {
            list: [
              'Processing orders, payments and managing shipping.',
              'Creating and maintaining a user account.',
              'Providing customer service and handling inquiries.',
              'Improving the user experience and the site.',
              'Sending marketing content and updates (subject to separate, explicit consent only, Section 30A of the Communications Law, the "Spam Law").',
              'Complying with legal requirements (tax laws, reports, authority investigations).',
              'Preventing fraud and maintaining site security.',
            ],
          },
        ],
      },
      {
        title: '5. Obligation to provide information',
        blocks: [
          'There is no legal obligation to provide personal information to the site, but without providing certain information it will not be possible to place an order or open a user account. Required fields are marked with an asterisk in the forms.',
        ],
      },
      {
        title: '6. Transfer of information to third parties',
        blocks: [
          'Information may be transferred to third parties solely for the following purposes:',
          {
            list: [
              'Payment processors: for processing payments (no credit card details are stored by us).',
              'Courier and shipping companies: name, address and phone for delivery purposes only.',
              'Infrastructure and cloud providers: for secure storage of the information.',
              'Competent authorities: pursuant to a judicial order or an explicit legal obligation.',
            ],
          },
          'We will not sell, rent or trade your personal information to any external party for third-party marketing purposes.',
        ],
      },
      {
        title: '7. Transfer of information outside Israel',
        blocks: [
          'Some of the site’s cloud services and infrastructure may store information on servers outside Israel. In accordance with the Protection of Privacy Regulations (Transfer of Information to Databases Abroad), 5761-2001, we use providers operating under comparable privacy protection laws (including the GDPR in the European Union).',
        ],
      },
      {
        title: '8. Cookies',
        blocks: [
          'The site uses the following types of cookies:',
          {
            list: [
              'Essential cookies: necessary for the site to function (shopping cart, login, security). They cannot be blocked without impairing the service.',
              'Preference cookies: store user settings (language, accessibility preferences).',
              'Performance and analytics cookies: help us understand how the site is used (in an aggregated and anonymous manner).',
            ],
          },
          'You can block or delete cookies in your browser settings. Blocking essential cookies may impair the site’s operation.',
        ],
      },
      {
        title: '9. Data security',
        blocks: [
          'We take customary security measures in accordance with the Protection of Privacy Regulations (Data Security), 5777-2017, including: traffic encryption (HTTPS/TLS), password encryption, access control, backups, monitoring of security events, and periodic penetration testing. Nevertheless, we cannot guarantee absolute immunity from breaches or unauthorized access.',
        ],
      },
      {
        title: '10. Reporting a security incident (Amendment 13)',
        highlight: true,
        blocks: [
          'In accordance with Amendment 13 to the Protection of Privacy Law (effective August 2025), in the event of a serious security incident that may harm your privacy, we undertake to report it to the Privacy Protection Authority and to you as the affected party, in accordance with the requirements of the law and within the required time.',
        ],
      },
      {
        title: '11. Data retention period',
        blocks: [
          {
            list: [
              'Active account: as long as the account exists.',
              'Orders and payments: 7 years from the order date (document retention obligation under tax law).',
              'Analytics data: up to 26 months in aggregate.',
              'Marketing information: until consent is withdrawn.',
            ],
          },
        ],
      },
      {
        title: '12. Your rights',
        highlight: true,
        blocks: [
          'Under the Protection of Privacy Law, 5741-1981, you have the following rights:',
          {
            list: [
              'Right of access (Section 13): to request to review the personal information stored about you.',
              'Right to correction (Section 14): to request correction of incorrect, outdated or inaccurate information.',
              'Right to erasure: to request deletion of the information (subject to legal retention obligations).',
              'Right to opt out of marketing: to request removal from marketing mailing lists at any time.',
              'Right to restrict processing: under Amendment 13 — to request to restrict the processing of information in certain cases.',
              'Right to data portability: to receive a copy of the information in a readable format.',
            ],
          },
          'To exercise these rights — contact us using the details in Section 2. We will respond to your request within 30 days in accordance with the Protection of Privacy Regulations (Conditions for Reviewing Information), 5741-1981.',
        ],
      },
      {
        title: '13. Children’s privacy',
        blocks: [
          'The service is not intended for minors under the age of 18. If you are under 18 — you must obtain the explicit consent of a parent/guardian before use. If we become aware that information was collected from a minor without such consent, we will act to delete it promptly.',
        ],
      },
      {
        title: '14. Changes to the policy',
        blocks: [
          'We reserve the right to update this policy from time to time. Material changes will be brought to your attention through a prominent notice on the site or by email. The date of the last update appears at the top of the page.',
        ],
      },
      {
        title: '15. Contact',
        blocks: [
          'For any question, request or complaint regarding your privacy or this policy, you may contact us using the details in Section 2 above. We undertake to respond to every inquiry within 30 days.',
        ],
      },
    ],
  },
};

export default async function PrivacyPage() {
  const locale: Locale = await getServerLocale();
  const c = CONTENT[locale];
  // Section 12 (Your rights) carries the authority-link footnote.
  const rightsIndex = c.sections.findIndex((s) => s.highlight && s.title.includes('12'));

  return (
    <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6 lg:px-8">
      <h1 className="text-3xl font-bold text-foreground mb-2">{c.title}</h1>
      <p className="text-sm text-muted-foreground mb-8">{c.lastUpdated}</p>

      <div className="space-y-8 text-foreground leading-relaxed">
        {c.sections.map((section, si) => (
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
            {si === rightsIndex && (
              <p className="mt-2 text-sm text-muted-foreground">
                {c.authorityNotePrefix}
                <a
                  href={AUTHORITY_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary underline"
                >
                  {c.authorityLinkText}
                </a>
                .
              </p>
            )}
          </section>
        ))}
      </div>
    </div>
  );
}
