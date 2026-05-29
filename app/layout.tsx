import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'CheckCeleb - YouTube Channel Analytics',
  description: 'Search any YouTube channel and get a breakdown of views, engagement, upload timing, and more.',
  openGraph: {
    title: 'CheckCeleb - YouTube Channel Analytics',
    description: 'Search any YouTube channel and get a breakdown of views, engagement, upload timing, and more.',
    url: 'https://check-celeb.vercel.app',
    siteName: 'CheckCeleb',
    type: 'website',
  },
  twitter: {
    card: 'summary',
    title: 'CheckCeleb - YouTube Channel Analytics',
    description: 'Search any YouTube channel and get a breakdown of views, engagement, upload timing, and more.',
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-[#0f0f0f] text-white antialiased">
        <header className="border-b border-[#1a1a1a] px-6 py-4 flex items-center justify-between sticky top-0 z-50 bg-[#0f0f0f]/95 backdrop-blur-sm">
          <a href="/" className="flex items-center gap-1">
            <span className="text-[#ff0000] font-black text-xl tracking-tight">Check</span>
            <span className="text-white font-black text-xl tracking-tight">Celeb</span>
          </a>
          <p className="text-gray-500 text-xs hidden sm:block">YouTube Channel Analytics Dashboard</p>
        </header>
        <main>{children}</main>
        <footer className="border-t border-[#1a1a1a] px-6 py-5 flex items-center justify-between text-xs text-gray-600">
          <span>
            Data from{' '}
            <a
              href="https://www.youtube.com"
              target="_blank"
              rel="noopener noreferrer"
              className="text-gray-400 hover:text-white transition-colors underline underline-offset-2"
            >
              YouTube
            </a>
          </span>
          <span>
            Made by{' '}
            <a
              href="https://www.linkedin.com/in/hyunseung--lee/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-gray-400 hover:text-white transition-colors underline underline-offset-2"
            >
              Hyunseung Lee
            </a>
          </span>
        </footer>
      </body>
    </html>
  );
}
