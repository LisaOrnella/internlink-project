import type { Metadata, Viewport } from 'next';
import { Inter, Plus_Jakarta_Sans } from 'next/font/google';
import { Toaster } from 'sonner';
import { Navbar } from '@/components/layout/navbar';
import { Footer } from '@/components/layout/footer';
import './globals.css';

const sans = Inter({ subsets: ['latin'], variable: '--font-sans', display: 'swap' });
const display = Plus_Jakarta_Sans({ subsets: ['latin'], variable: '--font-display', display: 'swap' });

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000'),
  title: { default: 'InternLink — Your Future Starts With an Internship', template: '%s · InternLink' },
  description: 'InternLink connects university students with companies offering internships. Find your first opportunity or hire your next intern.',
  openGraph: { title: 'InternLink', description: 'Your Future Starts With an Internship.', type: 'website' },
};
export const viewport: Viewport = { themeColor: '#0b1c42', width: 'device-width', initialScale: 1 };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${sans.variable} ${display.variable}`}>
      <body className="flex min-h-screen flex-col font-sans">
        <a href="#main" className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded-lg focus:bg-white focus:px-4 focus:py-2 focus:shadow-lift">Skip to content</a>
        <Navbar />
        <div className="flex-1">{children}</div>
        <Footer />
        <Toaster richColors position="top-right" closeButton />
      </body>
    </html>
  );
}
