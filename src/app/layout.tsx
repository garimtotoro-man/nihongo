import type { Metadata, Viewport } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: '쇼츠말고 니혼고',
  description: '스와이프하며 익히는 일본어 한 장',
  appleWebApp: { capable: true, statusBarStyle: 'default', title: '니혼고' },
};

export const viewport: Viewport = {
  themeColor: '#f6f5f1',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  viewportFit: 'cover',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko">
      <body className="min-h-dvh antialiased">{children}</body>
    </html>
  );
}
