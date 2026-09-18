import type { Metadata, Viewport } from 'next';
import localFont from 'next/font/local';
import './globals.css';

// 레트로 도트 글꼴. 한글·가나·영문을 한 서체로 (OFL, src/app/fonts/LICENSE-Galmuri.txt)
const galmuri = localFont({
  src: [
    { path: './fonts/Galmuri11.woff2', weight: '400', style: 'normal' },
    { path: './fonts/Galmuri11-Bold.woff2', weight: '700', style: 'normal' },
  ],
  variable: '--font-galmuri',
  display: 'swap',
});

export const metadata: Metadata = {
  title: '쇼츠말고 니혼고',
  description: '스와이프하며 익히는 일본어 한 장',
  appleWebApp: { capable: true, statusBarStyle: 'default', title: '니혼고' },
};

export const viewport: Viewport = {
  themeColor: '#e9eef0',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  viewportFit: 'cover',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko" className={galmuri.variable}>
      <body className="min-h-dvh">{children}</body>
    </html>
  );
}
