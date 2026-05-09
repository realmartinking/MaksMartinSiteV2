import type { Metadata } from 'next';
import './globals.css';
import { ThemeProvider } from '@/components/theme/ThemeProvider';

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
    images: [
      {
        url: '/favicon/icon-512.png',
        width: 512,
        height: 512,
        alt: 'Maks Martin',
      },
    ],
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
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <ThemeProvider attribute="class" defaultTheme="dark" enableSystem={false}>
          {/* Глобальные SVG-фильтры для эмблемы (cross-browser canvas trick) */}
          <svg
            aria-hidden="true"
            style={{ position: 'absolute', width: 0, height: 0, overflow: 'hidden' }}
          >
            <defs>
              {/* Убираем белый фон у светлой версии эмблемы */}
              <filter
                id="kill-white-bg"
                x="0"
                y="0"
                width="100%"
                height="100%"
                colorInterpolationFilters="sRGB"
              >
                <feColorMatrix
                  type="matrix"
                  values="
                    -1 0 0 0 1
                    0 -1 0 0 1
                    0 0 -1 0 1
                    0.299 0.587 0.114 0 0
                  "
                />
                <feComponentTransfer>
                  <feFuncA type="linear" slope="1" intercept="0" />
                </feComponentTransfer>
                <feComposite in2="SourceGraphic" operator="in" />
              </filter>
              
              {/* Убираем чёрный фон у тёмной версии эмблемы */}
              <filter
                id="kill-black-bg"
                x="0"
                y="0"
                width="100%"
                height="100%"
                colorInterpolationFilters="sRGB"
              >
                <feColorMatrix
                  type="matrix"
                  values="
                    1 0 0 0 0
                    0 1 0 0 0
                    0 0 1 0 0
                    0.299 0.587 0.114 0 0
                  "
                />
                <feComponentTransfer>
                  <feFuncA type="linear" slope="8" intercept="0" />
                </feComponentTransfer>
                <feComposite in2="SourceGraphic" operator="in" />
              </filter>
            </defs>
          </svg>
          
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
