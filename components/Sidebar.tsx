'use client';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';

const menu = [
  { href: '/dashboard', icon: '📊', label: '대시보드' },
  { href: '/employees', icon: '👥', label: '직원 관리' },
  { href: '/attendance', icon: '⏰', label: '출퇴근 관리' },
  { href: '/payroll', icon: '💰', label: '급여 관리' },
  { href: '/tax-invoices', icon: '🧾', label: '세금계산서' },
  { href: '/reports', icon: '📈', label: '보고서' },
];

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();

  async function handleLogout() {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.push('/login');
  }

  return (
    <aside className="w-60 min-h-screen bg-gray-900 text-white flex flex-col">
      {/* 회사명 */}
      <div className="px-6 py-5 border-b border-gray-700">
        <div className="flex items-center gap-3">
          <span className="text-2xl">🍃</span>
          <div>
            <p className="font-bold text-sm">푸드브리즈</p>
            <p className="text-xs text-gray-400">HR 관리 시스템</p>
          </div>
        </div>
      </div>

      {/* 메뉴 */}
      <nav className="flex-1 py-4 px-3 space-y-1">
        {menu.map(item => {
          const active = pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-4 py-3 rounded-lg text-sm transition ${
                active ? 'bg-orange-500 text-white font-semibold' : 'text-gray-300 hover:bg-gray-800'
              }`}
            >
              <span>{item.icon}</span>
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>

      {/* 로그아웃 */}
      <div className="px-3 pb-6">
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm text-gray-300 hover:bg-gray-800 transition"
        >
          <span>🚪</span>
          <span>로그아웃</span>
        </button>
      </div>
    </aside>
  );
}
