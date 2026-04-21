import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'הצהרת נגישות',
  description: 'הצהרת הנגישות של האתר בהתאם לתקן ישראלי 5568 ותיקון 16 לחוק שוויון זכויות לאנשים עם מוגבלות',
  alternates: { canonical: '/accessibility' },
};

export default function AccessibilityPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6 lg:px-8">
      <h1 className="text-3xl font-bold text-foreground mb-2">הצהרת נגישות</h1>
      <p className="text-sm text-muted-foreground mb-8">
        עודכן לאחרונה: 21 באפריל 2026
      </p>

      <div className="prose prose-lg max-w-none space-y-6 text-foreground">
        <section>
          <h2 className="text-xl font-bold mb-2">מחויבות לנגישות</h2>
          <p>
            אנו רואים בהנגשת האתר לאנשים עם מוגבלות ערך חשוב ופועלים ליישום תקנות
            שוויון זכויות לאנשים עם מוגבלות (התאמות נגישות לשירות), התשע&quot;ג-2013,
            תקן ישראלי 5568 (מבוסס WCAG 2.0 ברמת AA), ותיקון 16 לחוק שוויון זכויות
            לאנשים עם מוגבלות, התשנ&quot;ח-1998.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-bold mb-2">רמת הנגישות באתר</h2>
          <p>
            האתר עומד בדרישות תקנות הנגישות ברמת AA ומותאם לתקן הישראלי 5568.
            ההנגשה תואמת גם למכשירים ניידים ככל הניתן.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-bold mb-2">התאמות הנגישות באתר</h2>
          <ul className="list-disc pr-6 space-y-1">
            <li>תפריט נגישות בולט וזמין בכל עמודי האתר (לחצן בפינה השמאלית התחתונה).</li>
            <li>שינוי גודל גופן (הגדלה/הקטנה עד 160%).</li>
            <li>מצבי ניגודיות: ניגודיות גבוהה, ניגודיות הפוכה, מונוכרום, רקע בהיר.</li>
            <li>הדגשת קישורים והדגשת כותרות.</li>
            <li>גופן קריא המותאם לקוראים עם דיסלקציה.</li>
            <li>ריווח אותיות ושורות מוגדל.</li>
            <li>עצירת אנימציות ותמונות נעות.</li>
            <li>סמן עכבר מוגדל ומצביע קריאה.</li>
            <li>אפשרות הסתרת תמונות לקריאה נקייה.</li>
            <li>תמיכה מלאה בניווט במקלדת (Tab, Shift+Tab, Enter, Esc).</li>
            <li>מבנה סמנטי תקין (כותרות, אזורים, תוויות ARIA).</li>
            <li>תמיכה בקוראי מסך (NVDA, JAWS, VoiceOver, TalkBack).</li>
            <li>קישור &quot;דלג לתוכן המרכזי&quot; בראש כל עמוד.</li>
            <li>טקסט חלופי לתמונות בעלות משמעות (alt).</li>
            <li>כיווניות RTL תקינה ושפת עמוד מוגדרת (he).</li>
            <li>שמירת העדפות הנגישות של המשתמש בין ביקורים.</li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-bold mb-2">חריגים וסייגים</h2>
          <p>
            חלק מהתכנים באתר מקורם בצדדים שלישיים (כגון שערי תשלום, ספקי משלוח, מפות, סרטונים חיצוניים).
            אין באפשרותנו להבטיח את רמת הנגישות של תכנים אלו, אך אנו פועלים ככל הניתן לבחור ספקים
            התומכים בנגישות. אם נתקלתם בבעיית נגישות בתוכן חיצוני, נודה לכם אם תדווחו לנו על כך
            ונעשה מאמץ לסייע או להציע חלופה נגישה.
          </p>
        </section>

        <section className="rounded-lg border border-border bg-secondary p-5">
          <h2 className="text-xl font-bold mb-2">רכז נגישות</h2>
          <p className="mb-3">
            במסגרת תיקון 16 לחוק שוויון זכויות לאנשים עם מוגבלות, מונה באתר רכז נגישות אליו ניתן לפנות
            בכל בקשה, הצעה או תלונה בנושא נגישות:
          </p>
          <ul className="space-y-1">
            <li><strong>שם:</strong> [למילוי על ידי בעל האתר]</li>
            <li><strong>טלפון:</strong> [למילוי על ידי בעל האתר]</li>
            <li><strong>דוא&quot;ל:</strong> [למילוי על ידי בעל האתר]</li>
            <li><strong>כתובת:</strong> [למילוי על ידי בעל האתר]</li>
            <li><strong>שעות מענה:</strong> ימים א&#39;-ה&#39;, 09:00-17:00</li>
          </ul>
          <p className="mt-3 text-sm text-muted-foreground">
            אנו מתחייבים לטפל בכל פנייה בנושא נגישות בתוך 45 ימים ממועד קבלתה, בהתאם להוראות החוק.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-bold mb-2">דיווח על בעיית נגישות</h2>
          <p>
            אם נתקלתם בבעיית נגישות באתר, נשמח לדעת. אנא ציינו בפנייתכם:
          </p>
          <ul className="list-disc pr-6 space-y-1">
            <li>תיאור הבעיה.</li>
            <li>הפעולה שניסיתם לבצע.</li>
            <li>כתובת העמוד שבו נתקלתם בבעיה.</li>
            <li>סוג הדפדפן והמכשיר שבו השתמשתם.</li>
            <li>טכנולוגיה מסייעת, אם בשימוש (קורא מסך, הגדלה וכו&#39;).</li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-bold mb-2">עדכון ההצהרה</h2>
          <p>
            הצהרת נגישות זו עודכנה ביום 21 באפריל 2026. אנו ממשיכים לשפר ולעדכן את האתר על מנת
            להבטיח רמת נגישות מיטבית, ונעדכן הצהרה זו בהתאם.
          </p>
        </section>
      </div>
    </div>
  );
}
