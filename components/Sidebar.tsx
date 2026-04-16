'use client';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

const adminMenu = [
  { href: '/dashboard', icon: '📊', label: '대시보드' },
  { href: '/employees', icon: '👥', label: '직원 관리' },
  { href: '/attendance', icon: '⏰', label: '출퇴근 관리' },
  { href: '/payroll', icon: '💰', label: '급여 관리' },
  { href: '/tax-invoices', icon: '🧾', label: '세금계산서' },
  { href: '/reports', icon: '📈', label: '보고서' },
];

const employeeMenu = [
  { href: '/attendance', icon: '⏰', label: '출퇴근' },
];

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const [role, setRole] = useState<string>('');
  const [name, setName] = useState<string>('');

  useEffect(() => {
    fetch('/api/auth/me').then(r => r.json()).then(data => {
      setRole(data.role || '');
      setName(data.employeeName || data.username || '');
    });
  }, []);

  const menu = role === 'admin' ? adminMenu : employeeMenu;

  async function handleLogout() {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.push('/login');
  }

  return (
    <aside className="w-60 min-h-screen text-white flex flex-col" style={{ background: 'linear-gradient(180deg, #1a5c2e 0%, #1e3a2f 100%)' }}>
      {/* 회사명 */}
      <div className="px-6 py-5 border-b border-green-700/50">
        <div className="flex items-center gap-3">
          <img src="/logo-clean.png" alt="푸드브리즈" className="w-9 h-auto" />
          <div>
            <p className="font-bold text-sm">Food Breeze</p>
            <p className="text-xs text-green-300">{name ? `${name}님` : '푸드브리즈 HR'}</p>
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
                active ? 'bg-orange-500 text-white font-semibold shadow-lg' : 'text-green-100 hover:bg-green-700/50'
              }`}
            >
              <span>{item.icon}</span>
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>

      {/* 하단 메뉴 */}
      <div className="px-3 pb-6 space-y-1 border-t border-green-700/50 pt-4">
        <Link
          href="/change-password"
          className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm transition ${
            pathname === '/change-password' ? 'bg-orange-500 text-white font-semibold' : 'text-green-100 hover:bg-green-700/50'
          }`}
        >
          <span>🔒</span>
          <span>비밀번호 변경</span>
        </Link>
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm text-green-100 hover:bg-green-700/50 transition"
        >
          <span>🚪</span>
          <span>로그아웃</span>
        </button>
      </div>
    </aside>
  );
}
