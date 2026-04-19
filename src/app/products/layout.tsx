import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Products',
  description: 'Browse our full collection of products.',
  alternates: {
    canonical: '/products',
  },
  openGraph: {
    title: 'Products',
    description: 'Browse our full collection of products.',
    type: 'website',
  },
};

export default function ProductsLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
