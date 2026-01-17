import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'PAA Solutions',
  description: 'Enterprise chat solution for business automation',
  themeColor: '#0a0e1a',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="ar" dir="rtl">
      <body className="font-sans antialiased">
        {children}
      </body>
    </html>
  );
}
