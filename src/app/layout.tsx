
import type { Metadata } from 'next';
import { Rubik } from 'next/font/google';
import { StoreProvider } from '@/providers/store-provider';
import { Header } from '@/components/layout/header';
import { Footer } from '@/components/layout/footer';
import { AccessibilityMenu } from '@/components/accessibility/accessibility-menu';
import { SkipToContent } from '@/components/accessibility/skip-to-content';
import { CookieConsentBanner } from '@/components/cookie-consent/cookie-consent-banner';
import { getNonce } from '@/lib/nonce';
import './globals.css';

const font = Rubik({ subsets: ['hebrew', 'latin'] });

const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://example.com';

export const metadata: Metadata = {
  metadataBase: new URL(baseUrl),
  title: {
    default: "קומפורט סליפ",
    template: "%s | קומפורט סליפ",
  },
  description: "קומפורט סליפ",
  alternates: {
    canonical: '/',
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
  name: "קומפורט סליפ",
  url: baseUrl,
};

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
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(organizationJsonLd)
              .replace(/</g, '\\u003c')
              .replace(/>/g, '\\u003e')
              .replace(/&/g, '\\u0026'),
          }}
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
        </StoreProvider>
      </body>
    </html>
  );
}

