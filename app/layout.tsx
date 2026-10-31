import type { Metadata, Viewport } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import './globals.css';
import { DemoProvider } from '@/components/providers/demo-provider';
import { Toaster } from '@/components/ui/toast';
import { STORAGE_PREFIX, STORAGE_KEYS } from '@/lib/services/storage';

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

export const metadata: Metadata = {
  title: {
    default: 'Trellis Commerce — Merchant Dashboard Demo',
    template: '%s · Trellis Commerce',
  },
  description:
    'A multi-tenant e-commerce SaaS demo: merchant dashboard, storefront customiser, checkout and platform administration. All data is fictional and stored locally.',
  applicationName: 'Trellis Commerce',
  robots: { index: false, follow: false },
};

export const viewport: Viewport = {
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#f5f6f8' },
    { media: '(prefers-color-scheme: dark)', color: '#090b0f' },
  ],
  width: 'device-width',
  initialScale: 1,
};

const themeScript = `(function(){try{var k="${STORAGE_PREFIX}${STORAGE_KEYS.theme}";var m=localStorage.getItem(k)||"system";var d=m==="dark"||(m==="system"&&window.matchMedia("(prefers-color-scheme: dark)").matches);var r=document.documentElement;r.classList.toggle("dark",d);r.style.colorScheme=d?"dark":"light";}catch(e){}})();`;

export default function RootLayout({ children }: LayoutProps<'/'>) {
  return (
    <html lang='en' suppressHydrationWarning className={`${geistSans.variable} ${geistMono.variable}`}>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body className='min-h-screen bg-canvas text-ink antialiased'>
        <DemoProvider>
          {children}
          <Toaster />
        </DemoProvider>
      </body>
    </html>
  );
}
