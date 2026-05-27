
import type { Metadata } from 'next';
import { Rubik } from 'next/font/google';
import { StoreProvider } from '@/providers/store-provider';
import { Header } from '@/components/layout/header';
import { Footer } from '@/components/layout/footer';
import { AccessibilityMenu } from '@/components/accessibility/accessibility-menu';
import { SkipToContent } from '@/components/accessibility/skip-to-content';
import { CookieConsentBanner } from '@/components/cookie-consent/cookie-consent-banner';
import { ShabbatOverlay } from '@/components/shared/shabbat-overlay';
import { getNonce } from '@/lib/nonce';
import './globals.css';

const font = Rubik({ subsets: ['hebrew', 'latin'] });

const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://example.com';

export const metadata: Metadata = {
  metadataBase: new URL(baseUrl),
  title: {
    default: "קומפורט סליפ — מזרנים, מיטות ומוצרי שינה מבית רהיטי וייס",
    template: "%s | קומפורט סליפ",
  },
  description:
    "קומפורט סליפ — חנות המזרנים המובילה מבית רהיטי וייס עם למעלה מ-40 שנות ניסיון. מזרנים אורתופדיים, מיטות, בסיסים ומוצרי שינה מהמותגים המובילים: עמינח, פולירון, סימונס ועוד. משלוח חינם, החזרה תוך 30 יום ותשלום מאובטח.",
  keywords: [
    'מזרנים',
    'מזרן אורתופדי',
    'מיטות',
    'מוצרי שינה',
    'עמינח',
    'פולירון',
    'סימונס',
    'קומפורט סליפ',
    'רהיטי וייס',
  ],
  alternates: {
    canonical: '/',
  },
  icons: {
    icon: [
      { url: '/favicon-16x16.png', sizes: '16x16', type: 'image/png' },
      { url: '/favicon-32x32.png', sizes: '32x32', type: 'image/png' },
      { url: '/favicon.ico' },
    ],
    apple: '/apple-touch-icon.png',
    other: [
      { rel: 'android-chrome', url: '/android-chrome-192x192.png', sizes: '192x192' },
      { rel: 'android-chrome', url: '/android-chrome-512x512.png', sizes: '512x512' },
    ],
  },
  openGraph: {
    siteName: "קומפורט סליפ",
    locale: 'he_IL',
    type: 'website',
  },
  robots: {
    index: true,
    follow: true,
  },
};

const organizationJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'Organization',
  name: 'קומפורט סליפ',
  alternateName: 'Comfort Sleep',
  url: baseUrl,
  logo: `${baseUrl}/logo.png`,
  description:
    'חנות מזרנים ומוצרי שינה מבית רהיטי וייס. מעל 40 שנות ניסיון, מותגים מובילים, משלוח חינם והחזרה תוך 30 יום.',
  contactPoint: {
    '@type': 'ContactPoint',
    contactType: 'customer service',
    areaServed: 'IL',
    availableLanguage: ['Hebrew', 'he'],
  },
};

const websiteJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'WebSite',
  name: 'קומפורט סליפ',
  url: baseUrl,
  inLanguage: 'he-IL',
  potentialAction: {
    '@type': 'SearchAction',
    target: {
      '@type': 'EntryPoint',
      urlTemplate: `${baseUrl}/products?search={search_term_string}`,
    },
    'query-input': 'required name=search_term_string',
  },
  publisher: {
    '@type': 'Organization',
    name: 'קומפורט סליפ',
    logo: `${baseUrl}/logo.png`,
  },
};

function serializeJsonLd(value: unknown): string {
  return JSON.stringify(value)
    .replace(/</g, '\\u003c')
    .replace(/>/g, '\\u003e')
    .replace(/&/g, '\\u0026');
}

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const nonce = await getNonce();
  return (
    <html lang="he" dir="rtl">
      <head>
        <script
          type="application/ld+json"
          nonce={nonce}
          suppressHydrationWarning
          dangerouslySetInnerHTML={{ __html: serializeJsonLd(organizationJsonLd) }}
        />
        <script
          type="application/ld+json"
          nonce={nonce}
          suppressHydrationWarning
          dangerouslySetInnerHTML={{ __html: serializeJsonLd(websiteJsonLd) }}
        />
      </head>
      <body className={font.className}>
        <StoreProvider>
          <SkipToContent />
          <div className="min-h-screen flex flex-col">
            <Header />
            <main id="main-content" tabIndex={-1} className="flex-1 overflow-x-hidden">{children}</main>
            <Footer />
          </div>
          <AccessibilityMenu />
          <CookieConsentBanner />
          <ShabbatOverlay />
        </StoreProvider>
      </body>
    </html>
  );
}

