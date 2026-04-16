import type { Metadata } from 'next';
import { Noto_Sans_KR } from 'next/font/google';
import './globals.css';

const notoSansKR = Noto_Sans_KR({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700', '800', '900'],
  display: 'swap',
});

export const metadata: Metadata = {
  title: '푸드브리즈 HR 시스템',
  description: '푸드브리즈 직원관리 및 급여 시스템',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko">
      <body className={`${notoSansKR.className} bg-gray-50 text-gray-900 antialiased font-semibold`}>{children}</body>
    </html>
  );
}
