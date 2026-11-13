# קומפורט סליפ — שיפורי מוכנות לסוכנים ודרישות Brainerce

נבדק ב־13 בנובמבר 2026. דוח Ora שנבדק: scanId 438924, ציון 65, scoringVersion 3, revision 5. כתובת: https://ora.ai/comfortsleep.co.il.

## שינויים באתר

- נוספו `/.well-known/ard.json` ו־`/.well-known/ai-catalog.json` עם רשומת MCP אמיתית, זיהוי לפי דומיין ושאילתות לדוגמה.
- נוסף כרטיס חיבור תקני ב־`/.well-known/mcp/server-card.json`, כולל כתובת Streamable HTTP, גרסת פרוטוקול שאומתה ואייקון החנות. הכרטיס אינו טוען ליכולות שלא קיימות בשרת.
- נוספו `/.well-known/mcp.json`, קטלוג API במבנה linkset, קישורי HTML וכותרות HTTP לגילוי.
- נוספו `/index.md` ותמיכה ב־`Accept: text/markdown` בדף הבית. `Vary: Accept` מפריד בין ייצוגי HTML ו־Markdown.
- נוספה תגובת 404 ב־Markdown לנתיבים לא מוכרים באמצעות fallback rewrite; דפי 404 רגילים ממשיכים להשתמש בעיצוב האתר. מוצר שאינו קיים בתוך הנתיב הדינמי `/products/[slug]` עדיין משתמש במנגנון not-found של דף המוצר.
- נוספו `/auth.md`, `/pricing.md` ו־`/products/llms.txt`. מדריך המחירים קורא מהקטלוג החי, מציין מטבע, זמן קריאה, גודל מדגם והחרגות למחירי וריאנטים ועלויות קופה. הוא מחזיר 503 כשאין אפשרות לקבל נתונים במקום להמציא מחירים.
- נוספו frontmatter והנחיות When to use, עם השם העדכני `search_catalog` וכללי העברת עגלה ללקוח.
- נוספה תמונת Open Graph לדף הבית וברירת מחדל לאתר.
- נוספו תוויות נגישות לשדות החיפוש. כותרת העגלה שמופיעה ב־HTML של ההדר לפני תוכן העמוד הוחלפה בפסקה מעוצבת, כך שהכותרת הראשונה של דף הבית היא H1.
- נוסף `sameAs` עם עמוד הפייסבוק שמסר בעל האתר: https://www.facebook.com/profile.php?id=61593023545584. קישורים תקינים נוספים המוגדרים בעתיד ב־`StoreInfo.socialLinks` ייכללו אוטומטית. כרגע השדה ב־Brainerce הוא null.
- כלי WebMCP לניווט מוצר שונה ל־`view_product`; נוסף `start_checkout`, שפותח את הקופה לעגלה קיימת ואינו משלם. הוא דוחה עגלה ריקה, שגיאת טעינה או סנכרון שטרם הסתיים. תוקן גם ניקוי רישומי הכלים בדפדפנים ישנים.

## מה אומת בשרת Brainerce

נקודת הקצה הציבורית:

`https://api.brainerce.com/api/mcp/storefront/vc_BslbK0EDGoUXP2c5VH0Dk`

| בדיקה | תוצאה |
| --- | --- |
| `initialize` | HTTP 200, גרסת פרוטוקול 2025-03-26, serverInfo.version 1.0.0 |
| יכולות `initialize` | `tools` בלבד; אין הצהרת resources |
| `tools/list` | HTTP 200; תשעה כלים |
| `resources/list` | JSON-RPC error -32601, Method not found |
| `get_store_info` | החנות והדומיין תקינים, ILS, `cart_enabled: true` |
| `<endpoint>/server-card` | HTTP 404 |
| `StoreInfo.socialLinks` | null |

הכלים הקיימים: `search_catalog`, `get_product`, `create_cart`, `list_categories`, `search_policies_and_faqs`, `estimate_delivery_and_total`, `search_locations`, `lookup_locations`, `get_store_info`.

לא בוצעה רכישה או יצירת עגלה לצורך האימות. בתיאורי הכלים שנבדקו לא הופיעה הפניה למשאב UI באמצעות `_meta.ui.resourceUri`.

## דרישות להעברה לצוות Brainerce

### 1. MCP Apps — העדיפות הגבוהה

להוסיף תמיכה אמיתית ב־MCP Apps בשרת ה־storefront:

- לפרסם יכולת resources ולממש `resources/list` ו־`resources/read`.
- לחשוף משאב `ui://` לגלריית מוצרים, בחירת וריאנטים והעברת עגלה.
- לקשר כלים רלוונטיים למשאב באמצעות `_meta.ui.resourceUri`.
- לשרת את ה־HTML עם סוג התוכן והמטא־דאטה שמגדיר MCP Apps, ולהגדיר `_meta.ui.csp` לאוריג'ינים הדרושים בלבד.
- להעביר ל־UI את נתוני הכלים במבנה המתועד, ולשמור על בידוד מלא בין חנויות וערוצי מכירה.
- פעולת יצירת העגלה יכולה להשתמש ב־`create_cart` הקיים. יש לשמר את חוזה האידמפוטנטיות ואת כלל הבעלות: את `checkout_url` מוסרים ללקוח; הסוכן אינו פותח אותו בעצמו.
- לספק תצוגת סקירת פריטים, וריאנטים ומחיר לפני מעבר לקופה. סכום משלוח/מס שלא חושב אינו מוצג כסכום סופי.
- לבדוק בחיבור MCP של חנות אמיתית ובמארח MCP Apps, מעבר לכך שכתובת HTML מחזירה 200.

מקור: https://modelcontextprotocol.io/extensions/apps/overview וה־SDK הרשמי https://github.com/modelcontextprotocol/ext-apps.

### 2. כרטיס גילוי בבעלות הפלטפורמה

לפרסם כרטיס עדכני ב־`<storefront MCP endpoint>/server-card` לכל ערוץ מכירה, בהתאמה לפרטי החנות וליכולות החיבור בפועל. כרגע קומפורט סליפ מפרסמת כרטיס מקומי תקין שמפנה לשרת; כרטיס שמופק על ידי Brainerce ימנע סטייה בין מידע הפלטפורמה לאתר.

הכרטיס צריך לכלול את סכמת Server Card העדכנית, name, title, description, version, icons ו־remotes. כלי MCP ומשאבים נבדקים בחיבור החי; אין צורך להעתיק אותם לכרטיס סטטי או להצהיר על תמיכה ב־MCP Apps לפני שקיימת.

מקור: https://github.com/modelcontextprotocol/experimental-ext-server-card.

### 3. פרטי מותג

לעדכן בנתוני החנות את `socialLinks.facebook` לערך שמסר בעל האתר. באתר הוסף בינתיים הקישור ישירות ל־JSON-LD, כך שזיהוי המותג אינו תלוי בעדכון זה.

### 4. תוספות פלטפורמה, לפי צורך מוצרי

- אם Brainerce רוצה להפעיל גישה מואצלת לחשבונות לקוחות דרך סוכנים, יש לתכנן OAuth, הרשאות, ביטול גישה ומטא־דאטה תקניים בצד שרת. אין לפרסם endpoints פיקטיביים רק כדי לעבור בדיקה. ה־MCP הציבורי הנוכחי אינו דורש OAuth לצפייה בקטלוג או להכנת עגלה.
- NLWeb `/ask`, streaming ו־schemamap הם יכולות מוצר נפרדות. אין כרגע endpoint שאומת עבור החנות, והוספת קובץ שמצהיר עליהן אינה מימוש.
- A2A דורש סוכן פעיל עם חוזה פעולה, ולא רק agent-card. חנות עם כלי MCP אינה אוטומטית סוכן A2A.
- רישום באינדקסי MCP ובספריות אפליקציות מחייב זהות מפרסם, חשבון ותהליך פרסום של הפלטפורמה/בעל האפליקציה. לא נשלחה בקשת פרסום בשם בעל האתר.
- שרת תיעוד MCP נוסף, SDK עצמאי לחנות, skill ציבורי ו־plugin אינם תנאי לתהליך הקנייה באתר. אלה הרחבות נפרדות; אין תועלת בהוספת חבילות ריקות או בהצגת מאגר פרטי כמשאב ציבורי כדי להעלות בונוס בסורק.

## אימות וחזרה לסריקה

הבדיקות המקומיות:

```powershell
npm run build
node scripts/test-webmcp.cjs
npx next start -p 3108
node scripts/test-agent-surfaces.mjs http://127.0.0.1:3108
```

בדיקות HTTP מכסות קטלוגי גילוי, כרטיס MCP, סוגי תוכן, מחירים חיים, Markdown לדף הבית, שגיאות 404, גבולות התחברות, עברית/אנגלית, תמונת שיתוף וסדר כותרות.

אחרי פרסום השינויים לאתר החי:

```powershell
npx ax audit comfortsleep.co.il --force
```

65 הוא הציון של הסריקה שנבדקה לפני השינויים הללו. אין הבטחה לניקוד חדש או לחיבור אריתמטי של אומדני Ora; גילוי MCP יכול להפעיל בדיקות נוספות שלא נמדדו קודם.
