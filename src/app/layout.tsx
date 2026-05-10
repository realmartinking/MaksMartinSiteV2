import type { Metadata } from 'next';
import './globals.css';
import { Chrome } from '@/components/chrome/Chrome';
import { ThemeProvider } from '@/components/theme/ThemeProvider';
import { Preloader } from '@/components/preloader/Preloader';
import { DebugPanel } from '@/components/debug/DebugPanel';

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover' as const,
};

export const metadata: Metadata = {
  title: 'Maks Martin',
  description: 'Timeless design, like classical music, love and money',
  metadataBase: new URL('https://maksmartin-v2.vercel.app'),
  openGraph: {
    title: 'Maks Martin',
    description: 'Timeless design, like classical music, love and money',
    url: 'https://maksmartin-v2.vercel.app',
    siteName: 'Maks Martin',
    type: 'website',
    images: [{ url: '/favicon/icon-512.png', width: 512, height: 512, alt: 'Maks Martin' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Maks Martin',
    description: 'Timeless design, like classical music, love and money',
  },
  icons: {
    icon: [
      { url: '/favicon/favicon.ico' },
      { url: '/favicon/icon-32.png', sizes: '32x32', type: 'image/png' },
      { url: '/favicon/icon-192.png', sizes: '192x192', type: 'image/png' },
    ],
    apple: { url: '/favicon/icon-180.png', sizes: '180x180', type: 'image/png' },
  },
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="font-sans text-[15px] select-none cursor-crosshair antialiased">

        <ThemeProvider attribute="class" defaultTheme="light" enableSystem={false}>
          <Preloader />
          <Chrome />
          {children}
          <DebugPanel />
        </ThemeProvider>
      </body>
    </html>
  );
}
