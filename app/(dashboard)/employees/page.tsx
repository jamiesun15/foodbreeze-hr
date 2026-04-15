'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';

export default function EmployeesPage() {
  const [employees, setEmployees] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/employees').then(r => r.json()).then(data => {
      setEmployees(Array.isArray(data) ? data : []);
      setLoading(false);
    });
  }, []);

  const filtered = employees.filter(e =>
    e.name.includes(search) || e.employee_number.includes(search) || (e.department || '').includes(search)
  );

  async function handleDeactivate(id: number, name: string) {
    if (!confirm(`${name} 직원을 퇴사 처리하시겠습니까?`)) return;
    await fetch(`/api/employees/${id}`, { method: 'DELETE' });
    setEmployees(prev => prev.map(e => e.id === id ? { ...e, is_active: 0 } : e));
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">직원 관리</h1>
          <p className="text-gray-500 text-sm mt-1">전체 {employees.filter(e => e.is_active).length}명</p>
        </div>
        <Link
          href="/employees/new"
          className="bg-orange-500 hover:bg-orange-600 text-white px-5 py-2.5 rounded-lg text-sm font-medium transition"
        >
          + 직원 등록
        </Link>
      </div>

      {/* 검색 */}
      <div className="mb-4">
        <input
          type="text"
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="이름, 사원번호, 부서 검색..."
          className="border border-gray-300 rounded-lg px-4 py-2.5 text-sm w-80 focus:outline-none focus:ring-2 focus:ring-orange-400"
        />
      </div>

      {/* 테이블 */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        {loading ? (
          <p className="text-center py-12 text-gray-400">불러오는 중...</p>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b">
              <tr className="text-gray-600 text-left">
                <th className="px-5 py-3 font-medium">사원번호</th>
                <th className="px-5 py-3 font-medium">이름</th>
                <th className="px-5 py-3 font-medium">부서</th>
                <th className="px-5 py-3 font-medium">직급</th>
                <th className="px-5 py-3 font-medium">고용형태</th>
                <th className="px-5 py-3 font-medium">입사일</th>
                <th className="px-5 py-3 font-medium">기본급</th>
                <th className="px-5 py-3 font-medium">상태</th>
                <th className="px-5 py-3 font-medium">관리</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr><td colSpan={9} className="text-center py-12 text-gray-400">등록된 직원이 없습니다.</td></tr>
              ) : (
                filtered.map((emp: any) => (
                  <tr key={emp.id} className="border-b last:border-0 hover:bg-gray-50">
                    <td className="px-5 py-3 text-gray-500">{emp.employee_number}</td>
                    <td className="px-5 py-3 font-medium">{emp.name}</td>
                    <td className="px-5 py-3">{emp.department}</td>
                    <td className="px-5 py-3">{emp.position}</td>
                    <td className="px-5 py-3">
                      <span className={`px-2 py-1 rounded-full text-xs ${emp.employment_type === '정규직' ? 'bg-blue-100 text-blue-700' : 'bg-yellow-100 text-yellow-700'}`}>
                        {emp.employment_type}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-gray-500">{emp.hire_date}</td>
                    <td className="px-5 py-3">{(emp.base_salary || 0).toLocaleString()}원</td>
                    <td className="px-5 py-3">
                      <span className={`px-2 py-1 rounded-full text-xs ${emp.is_active ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                        {emp.is_active ? '재직중' : '퇴사'}
                      </span>
                    </td>
                    <td className="px-5 py-3">
                      <div className="flex gap-2">
                        <Link href={`/employees/${emp.id}`} className="text-blue-600 hover:underline text-xs">수정</Link>
                        {emp.is_active ? (
                          <button onClick={() => handleDeactivate(emp.id, emp.name)} className="text-red-500 hover:underline text-xs">퇴사처리</button>
                        ) : null}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
