import type { Metadata, Viewport } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Retaam Solutions | حلول ريتام',
  description: 'حلول المؤسسات للدردشة وأتمتة الأعمال - Enterprise chat solution for business automation',
  keywords: ['حلول الأعمال', 'أتمتة', 'دردشة المؤسسات', 'business solutions', 'automation', 'retaam'],
  authors: [{ name: 'Retaam Solutions' }],
  creator: 'Retaam Solutions',
  publisher: 'Retaam Solutions',
  robots: 'index, follow',
  icons: {
    icon: [
      { url: '/favicon.ico', sizes: '32x32', type: 'image/svg+xml' },
      { url: '/logo-icon.svg', sizes: 'any', type: 'image/svg+xml' },
    ],
    apple: [
      { url: '/logo-icon.svg', sizes: '180x180', type: 'image/svg+xml' },
    ],
  },
  openGraph: {
    title: 'Retaam Solutions | حلول ريتام',
    description: 'حلول المؤسسات للدردشة وأتمتة الأعمال',
    type: 'website',
    locale: 'ar_SA',
    alternateLocale: 'en_US',
    images: [
      {
        url: '/logo.svg',
        width: 300,
        height: 80,
        alt: 'Retaam Solutions Logo',
      },
    ],
  },
};

export const viewport: Viewport = {
  themeColor: '#0a0e1a',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="ar" dir="rtl" className="scroll-smooth">
      <head>
        {/* Preconnect to Google Fonts for faster loading */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      </head>
      <body className="font-sans antialiased text-foreground bg-background selection:bg-primary/20 selection:text-primary">
        {/* Skip link for accessibility */}
        <a
          href="#main-content"
          className="skip-link sr-only focus:not-sr-only focus:absolute focus:z-50 focus:p-4 focus:bg-primary focus:text-white focus:top-0 focus:start-0"
        >
          تخطي إلى المحتوى الرئيسي
        </a>
        <main id="main-content">
          {children}
        </main>
      </body>
    </html>
  );
}
