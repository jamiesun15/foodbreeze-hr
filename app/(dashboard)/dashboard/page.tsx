'use client';
import { useEffect, useState } from 'react';

interface DashboardData {
  totalEmployees: number;
  checkedInToday: number;
  checkedOutToday: number;
  payrollThisMonth: { total: number; net: number; cnt: number } | null;
  recentAttendance: any[];
}

export default function DashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [now, setNow] = useState('');

  useEffect(() => {
    fetch('/api/dashboard').then(r => r.json()).then(setData);
    const tick = () => setNow(new Date().toLocaleString('ko-KR', { dateStyle: 'full', timeStyle: 'medium' }));
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);

  const fmt = (n: number) => n?.toLocaleString('ko-KR') || '0';

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800">대시보드</h1>
        <p className="text-gray-500 text-sm mt-1">{now}</p>
      </div>

      {/* 통계 카드 */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard icon="👥" label="전체 직원" value={`${data?.totalEmployees || 0}명`} color="blue" />
        <StatCard icon="✅" label="오늘 출근" value={`${data?.checkedInToday || 0}명`} color="green" />
        <StatCard icon="🏃" label="오늘 퇴근" value={`${data?.checkedOutToday || 0}명`} color="orange" />
        <StatCard
          icon="💰"
          label="이번달 급여 합계"
          value={data?.payrollThisMonth?.total ? `${fmt(data.payrollThisMonth.total)}원` : '미계산'}
          color="purple"
        />
      </div>

      {/* 오늘 출퇴근 현황 */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <h2 className="font-semibold text-gray-800 mb-4">오늘 출퇴근 현황</h2>
        {data?.recentAttendance?.length === 0 ? (
          <p className="text-gray-400 text-sm text-center py-8">오늘 출퇴근 기록이 없습니다.</p>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b text-gray-500 text-left">
                <th className="pb-3 font-medium">직원명</th>
                <th className="pb-3 font-medium">출근 시간</th>
                <th className="pb-3 font-medium">퇴근 시간</th>
                <th className="pb-3 font-medium">근무 시간</th>
                <th className="pb-3 font-medium">상태</th>
              </tr>
            </thead>
            <tbody>
              {data?.recentAttendance?.map((a: any) => (
                <tr key={a.id} className="border-b last:border-0">
                  <td className="py-3 font-medium">{a.employee_name}</td>
                  <td className="py-3 text-green-600">{a.check_in || '-'}</td>
                  <td className="py-3 text-blue-600">{a.check_out || '-'}</td>
                  <td className="py-3">{a.work_hours ? `${a.work_hours}시간` : '-'}</td>
                  <td className="py-3">
                    {!a.check_in && <span className="bg-gray-100 text-gray-600 px-2 py-1 rounded-full text-xs">미출근</span>}
                    {a.check_in && !a.check_out && <span className="bg-green-100 text-green-700 px-2 py-1 rounded-full text-xs">근무중</span>}
                    {a.check_in && a.check_out && <span className="bg-blue-100 text-blue-700 px-2 py-1 rounded-full text-xs">퇴근완료</span>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

function StatCard({ icon, label, value, color }: { icon: string; label: string; value: string; color: string }) {
  const colors: Record<string, string> = {
    blue: 'bg-blue-50 border-blue-100',
    green: 'bg-green-50 border-green-100',
    orange: 'bg-orange-50 border-orange-100',
    purple: 'bg-purple-50 border-purple-100',
  };
  return (
    <div className={`rounded-xl border p-5 ${colors[color]}`}>
      <div className="text-2xl mb-2">{icon}</div>
      <p className="text-gray-500 text-xs mb-1">{label}</p>
      <p className="text-xl font-bold text-gray-800">{value}</p>
    </div>
  );
}
