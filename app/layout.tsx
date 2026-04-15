import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: '푸드브리즈 HR 시스템',
  description: '푸드브리즈 직원관리 및 급여 시스템',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko">
      <body className="bg-gray-50 text-gray-900 antialiased">{children}</body>
    </html>
  );
}
