import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'מדיניות פרטיות',
  description: 'מדיניות הפרטיות של האתר בהתאם לחוק הגנת הפרטיות, התשמ"א-1981 ותיקון 13',
  alternates: { canonical: '/privacy' },
};

export default function PrivacyPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6 lg:px-8">
      <h1 className="text-3xl font-bold text-foreground mb-2">מדיניות פרטיות</h1>
      <p className="text-sm text-muted-foreground mb-8">עודכן לאחרונה: 21 באפריל 2026</p>

      <div className="space-y-8 text-foreground leading-relaxed">
        <section>
          <h2 className="text-xl font-bold mb-2">1. כללי</h2>
          <p>
            מדיניות פרטיות זו מסדירה את אופן איסוף, שימוש, שמירה וגילוי מידע אישי של משתמשי האתר,
            בהתאם לחוק הגנת הפרטיות, התשמ&quot;א-1981, תקנות הגנת הפרטיות (אבטחת מידע), התשע&quot;ז-2017,
            ותיקון 13 לחוק הגנת הפרטיות (שנכנס לתוקף באוגוסט 2025).
          </p>
          <p className="mt-2">
            השימוש באתר מהווה הסכמה לתנאי מדיניות פרטיות זו. אם אינך מסכים/ה לתנאים — נא אל
            תעשה/י שימוש באתר.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-bold mb-2">2. בעל מאגר המידע</h2>
          <ul className="list-disc pr-6 space-y-1">
            <li><strong>שם העסק:</strong> [למילוי על ידי בעל האתר]</li>
            <li><strong>ח.פ / ע.מ:</strong> [למילוי]</li>
            <li><strong>כתובת:</strong> [למילוי]</li>
            <li><strong>דוא&quot;ל לפניות בנושא פרטיות:</strong> [למילוי]</li>
            <li><strong>טלפון:</strong> [למילוי]</li>
            <li><strong>מספר מאגר רשום ברשם מאגרי המידע:</strong> [למילוי אם חל]</li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-bold mb-2">3. סוגי המידע הנאסף</h2>
          <p className="mb-2">במהלך השימוש באתר, ייתכן שייאסף מידע מהסוגים הבאים:</p>
          <ul className="list-disc pr-6 space-y-1">
            <li><strong>מידע שאתה מוסר ביודעין:</strong> שם מלא, כתובת דוא&quot;ל, טלפון, כתובת למשלוח, פרטי חשבון (סיסמה מאוחסנת בצורה מוצפנת בלבד).</li>
            <li><strong>מידע על הזמנות ותשלומים:</strong> פרטי הזמנות, היסטוריית רכישות. <strong>פרטי כרטיס אשראי אינם נשמרים אצלנו</strong> — הם מועברים ישירות לספק סליקה מאובטח תקן PCI-DSS.</li>
            <li><strong>מידע טכני שנאסף אוטומטית:</strong> כתובת IP, סוג דפדפן, מערכת הפעלה, עמודים שנצפו, זמני גלישה, מזהי session.</li>
            <li><strong>עוגיות (Cookies):</strong> ראה/י סעיף העוגיות להלן.</li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-bold mb-2">4. מטרות השימוש במידע</h2>
          <ul className="list-disc pr-6 space-y-1">
            <li>ביצוע הזמנות, עיבוד תשלומים וניהול משלוחים.</li>
            <li>יצירת חשבון משתמש ותחזוקתו.</li>
            <li>מתן שירות לקוחות וטיפול בפניות.</li>
            <li>שיפור חוויית המשתמש והאתר.</li>
            <li>משלוח תוכן שיווקי ועדכונים (בכפוף להסכמה מפורשת נפרדת בלבד, סעיף 30א לחוק התקשורת &quot;חוק הספאם&quot;).</li>
            <li>עמידה בדרישות החוק (דיני מס, דוחות, חקירות רשויות).</li>
            <li>מניעת הונאות ושמירה על אבטחת האתר.</li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-bold mb-2">5. חובת מסירת המידע</h2>
          <p>
            אין חובה חוקית למסור מידע אישי לאתר, אולם ללא מסירת מידע מסוים לא ניתן יהיה לבצע הזמנה
            או לפתוח חשבון משתמש. שדות חובה מסומנים בכוכבית בטפסים.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-bold mb-2">6. העברת מידע לצדדים שלישיים</h2>
          <p className="mb-2">המידע עשוי לעבור לצדדים שלישיים אך ורק למטרות הבאות:</p>
          <ul className="list-disc pr-6 space-y-1">
            <li><strong>ספקי סליקה:</strong> לצורך עיבוד תשלומים (לא נשמרים אצלנו פרטי אשראי).</li>
            <li><strong>חברות שליחויות ומשלוחים:</strong> שם, כתובת וטלפון לצורך משלוח בלבד.</li>
            <li><strong>ספקי תשתית וענן:</strong> לאחסון מאובטח של המידע.</li>
            <li><strong>רשויות מוסמכות:</strong> מכוח צו שיפוטי או חובה חוקית מפורשת.</li>
          </ul>
          <p className="mt-2">
            לא נמכור, נשכיר או נסחור במידע האישי שלך לכל גורם חיצוני למטרות שיווקיות של צד ג&#39;.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-bold mb-2">7. העברת מידע אל מחוץ לישראל</h2>
          <p>
            חלק משירותי הענן ותשתיות האתר עשויים לאחסן מידע בשרתים מחוץ לישראל. בהתאם לתקנות הגנת
            הפרטיות (העברת מידע אל מאגרי מידע שמחוץ לגבולות המדינה), התשס&quot;א-2001, נעשה שימוש
            בספקים הפועלים תחת דיני הגנת פרטיות מקבילים (לרבות GDPR באיחוד האירופי).
          </p>
        </section>

        <section>
          <h2 className="text-xl font-bold mb-2">8. עוגיות (Cookies)</h2>
          <p className="mb-2">האתר עושה שימוש בעוגיות מסוגים הבאים:</p>
          <ul className="list-disc pr-6 space-y-1">
            <li><strong>עוגיות חיוניות:</strong> הכרחיות לתפקוד האתר (סל קניות, התחברות, אבטחה). לא ניתן לחסום אותן ללא פגיעה בשירות.</li>
            <li><strong>עוגיות העדפות:</strong> שומרות הגדרות משתמש (שפה, העדפות נגישות).</li>
            <li><strong>עוגיות ביצועים ואנליטיקה:</strong> עוזרות לנו להבין כיצד משתמשים באתר (בצורה מצטברת ואנונימית).</li>
          </ul>
          <p className="mt-2">
            ניתן לחסום או למחוק עוגיות בהגדרות הדפדפן. חסימת עוגיות חיוניות עלולה לפגוע בפעילות האתר.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-bold mb-2">9. אבטחת מידע</h2>
          <p>
            אנו נוקטים באמצעי אבטחה מקובלים בהתאם לתקנות הגנת הפרטיות (אבטחת מידע), התשע&quot;ז-2017,
            לרבות: הצפנת תעבורה (HTTPS/TLS), הצפנת סיסמאות, בקרת גישה, גיבויים, ניטור אירועי אבטחה,
            ובדיקות חדירה תקופתיות. עם זאת, אין באפשרותנו להבטיח חסינות מוחלטת מפני פריצות או גישה
            בלתי מורשית.
          </p>
        </section>

        <section className="rounded-lg border border-border bg-secondary p-5">
          <h2 className="text-xl font-bold mb-2">10. דיווח על אירוע אבטחה (תיקון 13)</h2>
          <p>
            בהתאם לתיקון 13 לחוק הגנת הפרטיות (בתוקף מאוגוסט 2025), במקרה של אירוע אבטחה חמור שעשוי
            לפגוע בפרטיותך, אנו מתחייבים לדווח על כך לרשות להגנת הפרטיות ולך כנפגע/ת בהתאם לדרישות
            החוק ובזמן הנדרש.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-bold mb-2">11. תקופת שמירת המידע</h2>
          <ul className="list-disc pr-6 space-y-1">
            <li><strong>חשבון פעיל:</strong> כל עוד החשבון קיים.</li>
            <li><strong>הזמנות ותשלומים:</strong> 7 שנים מיום ההזמנה (חובת שמירת מסמכים לפי דיני מס).</li>
            <li><strong>נתוני אנליטיקה:</strong> עד 26 חודשים באופן מצטבר.</li>
            <li><strong>מידע שיווקי:</strong> עד לביטול ההסכמה.</li>
          </ul>
        </section>

        <section className="rounded-lg border border-border bg-secondary p-5">
          <h2 className="text-xl font-bold mb-2">12. זכויותיך</h2>
          <p className="mb-2">על פי חוק הגנת הפרטיות, התשמ&quot;א-1981, עומדות לך הזכויות הבאות:</p>
          <ul className="list-disc pr-6 space-y-1">
            <li><strong>זכות עיון (סעיף 13):</strong> לבקש לעיין במידע האישי הנשמר עליך.</li>
            <li><strong>זכות לתיקון (סעיף 14):</strong> לבקש תיקון מידע שגוי, לא מעודכן או לא מדויק.</li>
            <li><strong>זכות למחיקה:</strong> לבקש מחיקת המידע (בכפוף לחובות שמירה חוקיות).</li>
            <li><strong>זכות ביטול דיוור:</strong> לבקש הסרה מרשימות תפוצה שיווקיות בכל עת.</li>
            <li><strong>זכות להגבלת עיבוד:</strong> לפי תיקון 13 — לבקש להגביל עיבוד מידע במקרים מסוימים.</li>
            <li><strong>זכות לנייד מידע:</strong> לקבל העתק של המידע בפורמט קריא.</li>
          </ul>
          <p className="mt-3">
            למימוש זכויות אלו — פנה/י אלינו בדוא&quot;ל המופיע בסעיף 2. נענה לפנייתך תוך 30 ימים בהתאם
            לתקנות הגנת הפרטיות (תנאים לעיון במידע), התשמ&quot;א-1981.
          </p>
          <p className="mt-2 text-sm text-muted-foreground">
            במידה ופנייתך לא נענתה לשביעות רצונך, הינך רשאי/ת לפנות לרשות להגנת הפרטיות במשרד
            המשפטים: <a href="https://www.gov.il/he/departments/the_privacy_protection_authority" target="_blank" rel="noopener noreferrer" className="text-primary underline">רשות להגנת הפרטיות</a>.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-bold mb-2">13. פרטיות קטינים</h2>
          <p>
            השירות אינו מיועד לקטינים מתחת לגיל 18. אם מתחת לגיל 18 — יש לקבל אישור מפורש של
            הורה/אפוטרופוס טרם השימוש. במידה ונוודע לנו שנאסף מידע מקטין ללא אישור כאמור, נפעל
            למחיקתו בהקדם.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-bold mb-2">14. שינויים במדיניות</h2>
          <p>
            אנו שומרים לעצמנו את הזכות לעדכן מדיניות זו מעת לעת. שינויים מהותיים יובאו לידיעתך
            באמצעות הודעה בולטת באתר או בדוא&quot;ל. תאריך העדכון האחרון מופיע בראש העמוד.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-bold mb-2">15. יצירת קשר</h2>
          <p>
            בכל שאלה, בקשה או תלונה בנוגע לפרטיותך או מדיניות זו, ניתן לפנות אלינו בפרטים המופיעים
            בסעיף 2 לעיל. אנו מתחייבים להשיב לכל פנייה בתוך 30 ימים.
          </p>
        </section>
      </div>
    </div>
  );
}
