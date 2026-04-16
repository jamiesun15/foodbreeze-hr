'use client';
import { useEffect, useState } from 'react';

export default function ReportsPage() {
  const [year, setYear] = useState(new Date().getFullYear().toString());
  const [month, setMonth] = useState(String(new Date().getMonth() + 1));
  const [attendanceData, setAttendanceData] = useState<any[]>([]);
  const [payrollData, setPayrollData] = useState<any[]>([]);
  const [employees, setEmployees] = useState<any[]>([]);

  useEffect(() => {
    fetch('/api/employees').then(r => r.json()).then(d => setEmployees(Array.isArray(d) ? d.filter((e: any) => e.is_active) : []));
  }, []);

  useEffect(() => {
    const m = month.padStart(2, '0');
    fetch(`/api/attendance?year=${year}&month=${m}`).then(r => r.json()).then(d => setAttendanceData(Array.isArray(d) ? d : []));
    fetch(`/api/payroll?year=${year}&month=${month}`).then(r => r.json()).then(d => setPayrollData(Array.isArray(d) ? d : []));
  }, [year, month]);

  const fmt = (n: number) => (n || 0).toLocaleString('ko-KR');

  // 직원별 출퇴근 집계
  const byEmployee = employees.map(emp => {
    const recs = attendanceData.filter(r => r.employee_id === emp.id);
    const totalDays = recs.filter(r => r.check_in).length;
    const totalHours = recs.reduce((s, r) => s + (r.work_hours || 0), 0);
    const overtimeHours = recs.reduce((s, r) => s + (r.overtime_hours || 0), 0);
    const payroll = payrollData.find(p => p.employee_id === emp.id);
    return { ...emp, totalDays, totalHours, overtimeHours, payroll };
  });

  const totalPayroll = payrollData.reduce((s, p) => s + (p.net_salary || 0), 0);

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800">보고서</h1>
        <p className="text-gray-500 text-sm mt-1">출퇴근 현황 및 급여 통계</p>
      </div>

      {/* 기간 선택 */}
      <div className="flex gap-3 mb-6">
        <select value={year} onChange={e => setYear(e.target.value)} className="border rounded-lg px-3 py-2 text-sm">
          {[2024, 2025, 2026].map(y => <option key={y} value={y}>{y}년</option>)}
        </select>
        <select value={month} onChange={e => setMonth(e.target.value)} className="border rounded-lg px-3 py-2 text-sm">
          {Array.from({ length: 12 }, (_, i) => i + 1).map(m => (
            <option key={m} value={m}>{m}월</option>
          ))}
        </select>
      </div>

      {/* 요약 카드 */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <div className="bg-blue-50 rounded-xl p-5 border border-blue-100">
          <p className="text-xs text-blue-600 mb-1">재직 직원수</p>
          <p className="text-2xl font-bold text-blue-700">{employees.length}명</p>
        </div>
        <div className="bg-green-50 rounded-xl p-5 border border-green-100">
          <p className="text-xs text-green-600 mb-1">총 출근일수</p>
          <p className="text-2xl font-bold text-green-700">{byEmployee.reduce((s, e) => s + e.totalDays, 0)}일</p>
        </div>
        <div className="bg-green-50 rounded-xl p-5 border border-green-100">
          <p className="text-xs text-green-800 mb-1">총 근무시간</p>
          <p className="text-2xl font-bold text-green-900">{byEmployee.reduce((s, e) => s + e.totalHours, 0).toFixed(0)}h</p>
        </div>
        <div className="bg-purple-50 rounded-xl p-5 border border-purple-100">
          <p className="text-xs text-purple-600 mb-1">이번달 급여 총액</p>
          <p className="text-xl font-bold text-purple-700">{fmt(totalPayroll)}원</p>
        </div>
      </div>

      {/* 직원별 상세 보고서 */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden mb-6">
        <div className="px-6 py-4 border-b bg-gray-50">
          <h2 className="font-semibold text-gray-800">{year}년 {month}월 직원별 현황</h2>
        </div>
        <table className="w-full text-sm">
          <thead>
            <tr className="text-gray-500 text-left border-b">
              <th className="px-5 py-3 font-medium">직원</th>
              <th className="px-5 py-3 font-medium">부서</th>
              <th className="px-5 py-3 font-medium">출근일수</th>
              <th className="px-5 py-3 font-medium">총근무시간</th>
              <th className="px-5 py-3 font-medium">초과근무</th>
              <th className="px-5 py-3 font-medium">총지급액</th>
              <th className="px-5 py-3 font-medium">실수령액</th>
            </tr>
          </thead>
          <tbody>
            {byEmployee.length === 0 ? (
              <tr><td colSpan={7} className="text-center py-10 text-gray-400">직원 데이터가 없습니다.</td></tr>
            ) : byEmployee.map((e: any) => (
              <tr key={e.id} className="border-b last:border-0 hover:bg-gray-50">
                <td className="px-5 py-3 font-medium">{e.name}</td>
                <td className="px-5 py-3 text-gray-500">{e.department}</td>
                <td className="px-5 py-3">{e.totalDays}일</td>
                <td className="px-5 py-3">{e.totalHours.toFixed(1)}h</td>
                <td className="px-5 py-3">{e.overtimeHours > 0 ? <span className="text-green-500">{e.overtimeHours.toFixed(1)}h</span> : '-'}</td>
                <td className="px-5 py-3">{e.payroll ? `${fmt(e.payroll.gross_salary)}원` : <span className="text-gray-300">미계산</span>}</td>
                <td className="px-5 py-3 font-semibold text-green-600">{e.payroll ? `${fmt(e.payroll.net_salary)}원` : <span className="text-gray-300">미계산</span>}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* 연간 급여 통계 */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <h2 className="font-semibold text-gray-800 mb-4">{year}년 월별 급여 현황</h2>
        <p className="text-sm text-gray-400">급여를 계산한 달만 표시됩니다. 각 달에서 [일괄 급여 계산]을 실행해주세요.</p>
      </div>
    </div>
  );
}
