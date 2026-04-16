'use client';
import { useEffect, useState } from 'react';

export default function AttendancePage() {
  const [records, setRecords] = useState<any[]>([]);
  const [employees, setEmployees] = useState<any[]>([]);
  const [year, setYear] = useState(new Date().getFullYear().toString());
  const [month, setMonth] = useState(String(new Date().getMonth() + 1).padStart(2, '0'));
  const [selectedEmp, setSelectedEmp] = useState('');
  const [loading, setLoading] = useState(false);
  const [editRow, setEditRow] = useState<any>(null);
  const [session, setSession] = useState<any>(null);

  useEffect(() => {
    fetch('/api/auth/me').then(r => r.json()).then(setSession);
    fetch('/api/employees').then(r => r.json()).then(data => {
      setEmployees(Array.isArray(data) ? data.filter((e: any) => e.is_active) : []);
    });
  }, []);

  useEffect(() => { loadRecords(); }, [year, month, selectedEmp]);

  async function loadRecords() {
    setLoading(true);
    const params = new URLSearchParams({ year, month });
    if (selectedEmp) params.append('employee_id', selectedEmp);
    const data = await fetch(`/api/attendance?${params}`).then(r => r.json());
    setRecords(Array.isArray(data) ? data : []);
    setLoading(false);
  }

  async function handleCheckIn() {
    const empId = session?.role === 'admin' ? (selectedEmp || employees[0]?.id) : session?.employeeId;
    if (!empId) { alert('직원을 선택하세요.'); return; }
    await fetch('/api/attendance', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'checkin', employee_id: empId }),
    });
    loadRecords();
  }

  async function handleCheckOut() {
    const empId = session?.role === 'admin' ? (selectedEmp || employees[0]?.id) : session?.employeeId;
    if (!empId) { alert('직원을 선택하세요.'); return; }
    await fetch('/api/attendance', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'checkout', employee_id: empId }),
    });
    loadRecords();
  }

  async function handleEdit() {
    await fetch('/api/attendance', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(editRow),
    });
    setEditRow(null);
    loadRecords();
  }

  const todayStr = new Date().toISOString().split('T')[0];
  const todayRecord = records.find(r => r.date === todayStr && (session?.role === 'admin' ? (!selectedEmp || r.employee_id === Number(selectedEmp)) : r.employee_id === session?.employeeId));

  const totalHours = records.reduce((s, r) => s + (r.work_hours || 0), 0);

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">출퇴근 관리</h1>
          <p className="text-gray-500 text-sm mt-1">기본 근무시간: 09:00 ~ 15:00</p>
        </div>

        {/* 출퇴근 버튼 */}
        <div className="flex gap-3">
          <button onClick={handleCheckIn} disabled={!!todayRecord?.check_in}
            className="bg-green-500 hover:bg-green-600 disabled:bg-gray-300 text-white px-5 py-2.5 rounded-lg text-sm font-medium transition">
            ✅ 출근 체크
          </button>
          <button onClick={handleCheckOut} disabled={!todayRecord?.check_in || !!todayRecord?.check_out}
            className="bg-blue-500 hover:bg-blue-600 disabled:bg-gray-300 text-white px-5 py-2.5 rounded-lg text-sm font-medium transition">
            🏃 퇴근 체크
          </button>
        </div>
      </div>

      {/* 오늘 상태 */}
      {todayRecord && (
        <div className="bg-green-50 border border-green-200 rounded-xl p-4 mb-6 flex items-center gap-6 text-sm">
          <span className="text-green-700 font-medium">오늘 ({todayStr})</span>
          <span>출근: <strong className="text-green-600">{todayRecord.check_in || '미체크'}</strong></span>
          <span>퇴근: <strong className="text-blue-600">{todayRecord.check_out || '미체크'}</strong></span>
          {todayRecord.work_hours ? <span>근무시간: <strong>{todayRecord.work_hours}시간</strong></span> : null}
        </div>
      )}

      {/* 필터 */}
      <div className="flex gap-3 mb-4 flex-wrap">
        <select value={year} onChange={e => setYear(e.target.value)}
          className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400">
          {[2024, 2025, 2026].map(y => <option key={y} value={y}>{y}년</option>)}
        </select>
        <select value={month} onChange={e => setMonth(e.target.value)}
          className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400">
          {Array.from({ length: 12 }, (_, i) => String(i + 1).padStart(2, '0')).map(m => (
            <option key={m} value={m}>{Number(m)}월</option>
          ))}
        </select>
        {session?.role === 'admin' && (
          <select value={selectedEmp} onChange={e => setSelectedEmp(e.target.value)}
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400">
            <option value="">전체 직원</option>
            {employees.map((e: any) => <option key={e.id} value={e.id}>{e.name}</option>)}
          </select>
        )}
      </div>

      {/* 요약 */}
      <div className="flex gap-4 mb-4 text-sm text-gray-600">
        <span>총 {records.length}일 기록</span>
        <span>총 근무시간: <strong>{totalHours.toFixed(1)}시간</strong></span>
      </div>

      {/* 테이블 */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b">
            <tr className="text-gray-600 text-left">
              <th className="px-5 py-3 font-medium">날짜</th>
              {session?.role === 'admin' && <th className="px-5 py-3 font-medium">직원명</th>}
              <th className="px-5 py-3 font-medium">출근</th>
              <th className="px-5 py-3 font-medium">퇴근</th>
              <th className="px-5 py-3 font-medium">근무시간</th>
              <th className="px-5 py-3 font-medium">초과근무</th>
              <th className="px-5 py-3 font-medium">상태</th>
              {session?.role === 'admin' && <th className="px-5 py-3 font-medium">수정</th>}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={8} className="text-center py-12 text-gray-400">불러오는 중...</td></tr>
            ) : records.length === 0 ? (
              <tr><td colSpan={8} className="text-center py-12 text-gray-400">기록이 없습니다.</td></tr>
            ) : records.map((r: any) => (
              <tr key={r.id} className="border-b last:border-0 hover:bg-gray-50">
                <td className="px-5 py-3">{r.date}</td>
                {session?.role === 'admin' && <td className="px-5 py-3 font-medium">{r.employee_name}</td>}
                <td className="px-5 py-3 text-green-600">{r.check_in || '-'}</td>
                <td className="px-5 py-3 text-blue-600">{r.check_out || '-'}</td>
                <td className="px-5 py-3">{r.work_hours ? `${r.work_hours}h` : '-'}</td>
                <td className="px-5 py-3">{r.overtime_hours > 0 ? <span className="text-green-500">{r.overtime_hours}h</span> : '-'}</td>
                <td className="px-5 py-3">
                  {!r.check_in && <span className="bg-gray-100 text-gray-600 px-2 py-1 rounded-full text-xs">미출근</span>}
                  {r.check_in && !r.check_out && <span className="bg-green-100 text-green-700 px-2 py-1 rounded-full text-xs">근무중</span>}
                  {r.check_in && r.check_out && <span className="bg-blue-100 text-blue-700 px-2 py-1 rounded-full text-xs">완료</span>}
                </td>
                {session?.role === 'admin' && (
                  <td className="px-5 py-3">
                    <button onClick={() => setEditRow({ ...r })} className="text-blue-500 hover:underline text-xs">수정</button>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* 수정 모달 */}
      {editRow && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-96 shadow-xl">
            <h3 className="font-bold text-gray-800 mb-4">출퇴근 수정 — {editRow.date}</h3>
            <div className="space-y-3 mb-5">
              <div>
                <label className="text-sm font-medium text-gray-700">출근 시간</label>
                <input type="time" value={editRow.check_in || ''} onChange={e => setEditRow({ ...editRow, check_in: e.target.value })}
                  className="w-full border rounded-lg px-3 py-2 text-sm mt-1" />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700">퇴근 시간</label>
                <input type="time" value={editRow.check_out || ''} onChange={e => setEditRow({ ...editRow, check_out: e.target.value })}
                  className="w-full border rounded-lg px-3 py-2 text-sm mt-1" />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700">메모</label>
                <input type="text" value={editRow.note || ''} onChange={e => setEditRow({ ...editRow, note: e.target.value })}
                  className="w-full border rounded-lg px-3 py-2 text-sm mt-1" />
              </div>
            </div>
            <div className="flex gap-3">
              <button onClick={handleEdit} className="bg-green-500 text-white px-5 py-2 rounded-lg text-sm font-medium">저장</button>
              <button onClick={() => setEditRow(null)} className="bg-gray-100 text-gray-700 px-5 py-2 rounded-lg text-sm">취소</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
