import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'כל המוצרים',
  description: 'גלה את המבחר המלא של מוצרי קומפורט סליפ — מזרנים, בסיסים, כריות ואביזרי שינה איכותיים.',
  alternates: {
    canonical: '/products',
  },
  openGraph: {
    title: 'כל המוצרים',
    description: 'גלה את המבחר המלא של מוצרי קומפורט סליפ — מזרנים, בסיסים, כריות ואביזרי שינה איכותיים.',
    type: 'website',
  },
};

export default function ProductsLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
