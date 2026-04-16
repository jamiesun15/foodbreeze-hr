'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError('');

    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password }),
    });

    const data = await res.json();
    setLoading(false);

    if (!res.ok) {
      setError(data.error || '로그인에 실패했습니다.');
      return;
    }

    if (data.role === 'admin') router.push('/dashboard');
    else router.push('/attendance');
  }

  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden">
      {/* 배경 그라데이션 */}
      <div className="absolute inset-0 bg-gradient-to-br from-green-700 via-green-600 to-green-800" />

      {/* 장식 요소 - 바람 느낌 곡선들 */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden">
        <div className="absolute -top-20 -right-20 w-96 h-96 rounded-full bg-green-500 opacity-20" />
        <div className="absolute top-1/4 -left-32 w-80 h-80 rounded-full bg-orange-400 opacity-15" />
        <div className="absolute bottom-10 right-1/4 w-64 h-64 rounded-full bg-green-400 opacity-15" />
        <div className="absolute -bottom-20 -left-10 w-72 h-72 rounded-full bg-orange-300 opacity-10" />
        {/* 곡선 바람 라인 */}
        <svg className="absolute top-0 left-0 w-full h-full opacity-10" viewBox="0 0 1200 800" fill="none">
          <path d="M0 400 Q300 200 600 350 T1200 300" stroke="white" strokeWidth="2" />
          <path d="M0 500 Q300 300 600 450 T1200 400" stroke="white" strokeWidth="1.5" />
          <path d="M0 600 Q300 400 600 550 T1200 500" stroke="white" strokeWidth="1" />
        </svg>
      </div>

      {/* 로그인 카드 */}
      <div className="relative z-10 bg-white/95 backdrop-blur-sm rounded-2xl shadow-2xl p-10 w-full max-w-md mx-4">
        {/* 로고 */}
        <div className="text-center mb-8">
          <img src="/logo-clean.png" alt="푸드브리즈 로고" className="w-20 h-auto mb-3" />
          <h1 className="text-2xl font-bold text-gray-800">Food Breeze</h1>
          <p className="text-green-600 font-medium text-sm">푸드브리즈</p>
          <p className="text-gray-400 text-xs mt-1">HR 관리 시스템</p>
        </div>

        {/* 로그인 폼 */}
        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">아이디</label>
            <input
              type="text"
              value={username}
              onChange={e => setUsername(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-green-400 focus:border-green-400"
              placeholder="아이디를 입력하세요"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">비밀번호</label>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-green-400 focus:border-green-400"
              placeholder="비밀번호를 입력하세요"
              required
            />
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-600 text-sm rounded-lg px-4 py-3">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full text-white font-semibold py-3 rounded-lg transition disabled:opacity-50"
            style={{ background: 'linear-gradient(135deg, #2d8a4e 0%, #3a9d5e 100%)' }}
          >
            {loading ? '로그인 중...' : '로그인'}
          </button>
        </form>

        <p className="text-center text-xs text-gray-400 mt-6">
          푸드브리즈 HR 관리 시스템 v1.0
        </p>
      </div>
    </div>
  );
}
