'use client';
import { useEffect, useState } from 'react';

export default function PayrollPage() {
  const [records, setRecords] = useState<any[]>([]);
  const [, setEmployees] = useState<any[]>([]);
  const [year, setYear] = useState(new Date().getFullYear().toString());
  const [month, setMonth] = useState(String(new Date().getMonth() + 1));
  const [loading, setLoading] = useState(false);
  const [bulkLoading, setBulkLoading] = useState(false);
  const [selected, setSelected] = useState<any>(null);

  useEffect(() => {
    fetch('/api/employees').then(r => r.json()).then(d => setEmployees(Array.isArray(d) ? d.filter((e: any) => e.is_active) : []));
  }, []);

  useEffect(() => { loadPayroll(); }, [year, month]);

  async function loadPayroll() {
    setLoading(true);
    const data = await fetch(`/api/payroll?year=${year}&month=${month}`).then(r => r.json());
    setRecords(Array.isArray(data) ? data : []);
    setLoading(false);
  }

  async function handleBulkCalc() {
    if (!confirm(`${year}년 ${month}월 전체 직원 급여를 일괄 계산하시겠습니까?`)) return;
    setBulkLoading(true);
    const res = await fetch('/api/payroll', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ year: Number(year), month: Number(month) }),
    });
    const data = await res.json();
    setBulkLoading(false);
    alert(`${data.count}명의 급여 계산 완료!`);
    loadPayroll();
  }

  const fmt = (n: number) => (n || 0).toLocaleString('ko-KR');
  const totalNet = records.reduce((s, r) => s + (r.net_salary || 0), 0);
  const totalGross = records.reduce((s, r) => s + (r.gross_salary || 0), 0);

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">급여 관리</h1>
          <p className="text-gray-500 text-sm mt-1">급여일: 매월 15일 | 4대보험·소득세 자동계산</p>
        </div>
        <button onClick={handleBulkCalc} disabled={bulkLoading}
          className="bg-orange-500 hover:bg-orange-600 disabled:opacity-50 text-white px-5 py-2.5 rounded-lg text-sm font-medium transition">
          {bulkLoading ? '계산 중...' : '📊 일괄 급여 계산'}
        </button>
      </div>

      {/* 기간 선택 */}
      <div className="flex gap-3 mb-4">
        <select value={year} onChange={e => setYear(e.target.value)}
          className="border border-gray-300 rounded-lg px-3 py-2 text-sm">
          {[2024, 2025, 2026].map(y => <option key={y} value={y}>{y}년</option>)}
        </select>
        <select value={month} onChange={e => setMonth(e.target.value)}
          className="border border-gray-300 rounded-lg px-3 py-2 text-sm">
          {Array.from({ length: 12 }, (_, i) => i + 1).map(m => (
            <option key={m} value={m}>{m}월</option>
          ))}
        </select>
      </div>

      {/* 요약 */}
      {records.length > 0 && (
        <div className="grid grid-cols-3 gap-4 mb-6">
          <div className="bg-blue-50 rounded-xl p-4 border border-blue-100">
            <p className="text-xs text-blue-600 mb-1">총 지급액</p>
            <p className="text-lg font-bold text-blue-700">{fmt(totalGross)}원</p>
          </div>
          <div className="bg-green-50 rounded-xl p-4 border border-green-100">
            <p className="text-xs text-green-600 mb-1">총 실수령액</p>
            <p className="text-lg font-bold text-green-700">{fmt(totalNet)}원</p>
          </div>
          <div className="bg-red-50 rounded-xl p-4 border border-red-100">
            <p className="text-xs text-red-600 mb-1">총 공제액</p>
            <p className="text-lg font-bold text-red-700">{fmt(totalGross - totalNet)}원</p>
          </div>
        </div>
      )}

      {/* 급여 테이블 */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b">
            <tr className="text-gray-600 text-left">
              <th className="px-4 py-3 font-medium">직원</th>
              <th className="px-4 py-3 font-medium">기본급</th>
              <th className="px-4 py-3 font-medium">식대</th>
              <th className="px-4 py-3 font-medium">총지급</th>
              <th className="px-4 py-3 font-medium">공제합계</th>
              <th className="px-4 py-3 font-medium text-green-600">실수령액</th>
              <th className="px-4 py-3 font-medium">상세</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={7} className="text-center py-12 text-gray-400">불러오는 중...</td></tr>
            ) : records.length === 0 ? (
              <tr><td colSpan={7} className="text-center py-12 text-gray-400">
                급여 계산 내역이 없습니다. [일괄 급여 계산] 버튼을 눌러주세요.
              </td></tr>
            ) : records.map((r: any) => (
              <tr key={r.id} className="border-b last:border-0 hover:bg-gray-50">
                <td className="px-4 py-3">
                  <p className="font-medium">{r.employee_name}</p>
                  <p className="text-xs text-gray-400">{r.department} · {r.position}</p>
                </td>
                <td className="px-4 py-3">{fmt(r.base_salary)}원</td>
                <td className="px-4 py-3">{fmt(r.meal_allowance)}원</td>
                <td className="px-4 py-3 font-medium">{fmt(r.gross_salary)}원</td>
                <td className="px-4 py-3 text-red-500">-{fmt(r.total_deduction)}원</td>
                <td className="px-4 py-3 font-bold text-green-600">{fmt(r.net_salary)}원</td>
                <td className="px-4 py-3">
                  <button onClick={() => setSelected(r)} className="text-blue-500 hover:underline text-xs">명세서</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* 급여명세서 모달 */}
      {selected && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl w-full max-w-md shadow-xl">
            <div className="p-6 border-b">
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-gray-800">급여명세서</h3>
                <button onClick={() => setSelected(null)} className="text-gray-400 hover:text-gray-600 text-xl">×</button>
              </div>
              <p className="text-sm text-gray-500 mt-1">{selected.year}년 {selected.month}월 | {selected.employee_name}</p>
            </div>
            <div className="p-6 space-y-2 text-sm">
              <Row label="기본급" value={`${fmt(selected.base_salary)}원`} />
              <Row label="식대" value={`${fmt(selected.meal_allowance)}원`} />
              {selected.overtime_pay > 0 && <Row label="연장수당" value={`${fmt(selected.overtime_pay)}원`} />}
              <div className="border-t pt-2 mt-2">
                <Row label="총 지급액" value={`${fmt(selected.gross_salary)}원`} bold />
              </div>
              <div className="border-t pt-2 mt-2 space-y-1">
                <p className="font-medium text-red-500 mb-2">공제 항목</p>
                <Row label="국민연금 (4.5%)" value={`-${fmt(selected.national_pension)}원`} red />
                <Row label="건강보험 (3.545%)" value={`-${fmt(selected.health_insurance)}원`} red />
                <Row label="장기요양보험" value={`-${fmt(selected.long_term_care)}원`} red />
                <Row label="고용보험 (0.9%)" value={`-${fmt(selected.employment_insurance)}원`} red />
                <Row label="소득세" value={`-${fmt(selected.income_tax)}원`} red />
                <Row label="지방소득세" value={`-${fmt(selected.local_income_tax)}원`} red />
                <Row label="공제 합계" value={`-${fmt(selected.total_deduction)}원`} bold red />
              </div>
              <div className="border-t pt-3 mt-2 bg-green-50 rounded-lg px-3 py-3">
                <Row label="실수령액" value={`${fmt(selected.net_salary)}원`} bold />
              </div>
            </div>
            <div className="px-6 pb-6">
              <button onClick={() => window.print()} className="w-full bg-gray-100 hover:bg-gray-200 text-gray-700 py-2.5 rounded-lg text-sm font-medium">
                🖨️ 인쇄
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function Row({ label, value, bold = false, red = false }: any) {
  return (
    <div className="flex justify-between">
      <span className={`text-gray-600 ${bold ? 'font-semibold' : ''}`}>{label}</span>
      <span className={`${bold ? 'font-bold' : ''} ${red ? 'text-red-500' : 'text-gray-800'}`}>{value}</span>
    </div>
  );
}
