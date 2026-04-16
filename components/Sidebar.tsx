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
  const [open, setOpen] = useState(false);

  useEffect(() => {
    fetch('/api/auth/me').then(r => r.json()).then(data => {
      setRole(data.role || '');
      setName(data.employeeName || data.username || '');
    });
  }, []);

  // 페이지 이동 시 메뉴 닫기
  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  const menu = role === 'admin' ? adminMenu : employeeMenu;

  async function handleLogout() {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.push('/login');
  }

  return (
    <>
      {/* 모바일 상단바 */}
      <div className="md:hidden fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-4 py-3 text-white" style={{ background: '#1a5c2e' }}>
        <div className="flex items-center gap-2">
          <img src="/logo-clean.png" alt="푸드브리즈" className="w-7 h-auto" />
          <span className="font-bold text-sm">푸드브리즈</span>
          {name && <span className="text-green-300 text-xs ml-1">{name}님</span>}
        </div>
        <button onClick={() => setOpen(!open)} className="p-1.5 rounded-lg hover:bg-green-700/50">
          {open ? (
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
          ) : (
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" /></svg>
          )}
        </button>
      </div>

      {/* 모바일 오버레이 */}
      {open && <div className="md:hidden fixed inset-0 bg-black/50 z-40" onClick={() => setOpen(false)} />}

      {/* 사이드바 */}
      <aside className={`
        fixed md:static z-50 top-0 left-0 h-full w-64 text-white flex flex-col transition-transform duration-300
        ${open ? 'translate-x-0' : '-translate-x-full'} md:translate-x-0 md:w-60 md:min-h-screen
      `} style={{ background: 'linear-gradient(180deg, #1a5c2e 0%, #1e3a2f 100%)' }}>
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
    </>
  );
}
