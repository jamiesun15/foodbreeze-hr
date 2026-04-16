'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

const departments = ['운영팀', '주방팀', '홀팀', '관리팀'];
const positions = ['사원', '주임', '매니저(과장)', '팀장', '부장'];

export default function NewEmployeePage() {
  const router = useRouter();
  const [form, setForm] = useState({
    name: '', birth_date: '', phone: '', email: '', address: '',
    emergency_contact: '', department: '운영팀', position: '사원',
    employment_type: '정규직', hire_date: '', base_salary: '',
    meal_allowance: '200000', note: '',
    login_id: '', login_password: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const set = (key: string, val: string) => setForm(f => ({ ...f, [key]: val }));

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError('');

    const res = await fetch('/api/employees', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...form, base_salary: Number(form.base_salary), meal_allowance: Number(form.meal_allowance) }),
    });

    const data = await res.json();
    setLoading(false);

    if (!res.ok) { setError(data.error); return; }
    alert(`직원 등록 완료!\n사원번호: ${data.employee_number}\n로그인 아이디: ${form.login_id}`);
    router.push('/employees');
  }

  return (
    <div>
      <div className="flex items-center gap-3 mb-6">
        <Link href="/employees" className="text-gray-400 hover:text-gray-600">← 직원 목록</Link>
        <h1 className="text-2xl font-bold text-gray-800">직원 등록</h1>
      </div>

      <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-sm border border-gray-100 p-8 max-w-2xl">
        <h2 className="font-semibold text-gray-700 mb-4 pb-2 border-b">로그인 계정</h2>
        <div className="grid grid-cols-2 gap-4 mb-6">
          <Field label="아이디 *" value={form.login_id} onChange={v => set('login_id', v)} required placeholder="직원이 로그인할 아이디" />
          <Field label="초기 비밀번호 *" value={form.login_password} onChange={v => set('login_password', v)} required placeholder="8자 이상" />
        </div>

        <h2 className="font-semibold text-gray-700 mb-4 pb-2 border-b">기본 정보</h2>
        <div className="grid grid-cols-2 gap-4 mb-6">
          <Field label="이름 *" value={form.name} onChange={v => set('name', v)} required />
          <Field label="생년월일" type="date" value={form.birth_date} onChange={v => set('birth_date', v)} />
          <Field label="연락처" value={form.phone} onChange={v => set('phone', v)} placeholder="010-0000-0000" />
          <Field label="이메일" type="email" value={form.email} onChange={v => set('email', v)} />
          <Field label="주소" value={form.address} onChange={v => set('address', v)} className="col-span-2" />
          <Field label="비상연락처" value={form.emergency_contact} onChange={v => set('emergency_contact', v)} className="col-span-2" />
        </div>

        <h2 className="font-semibold text-gray-700 mb-4 pb-2 border-b">직무 정보</h2>
        <div className="grid grid-cols-2 gap-4 mb-6">
          <SelectField label="부서" value={form.department} onChange={v => set('department', v)} options={departments} />
          <SelectField label="직급" value={form.position} onChange={v => set('position', v)} options={positions} />
          <SelectField label="고용형태" value={form.employment_type} onChange={v => set('employment_type', v)} options={['정규직', '계약직', '아르바이트']} />
          <Field label="입사일 *" type="date" value={form.hire_date} onChange={v => set('hire_date', v)} required />
        </div>

        <h2 className="font-semibold text-gray-700 mb-4 pb-2 border-b">급여 정보</h2>
        <div className="grid grid-cols-2 gap-4 mb-6">
          <Field label="기본급 (원)" type="number" value={form.base_salary} onChange={v => set('base_salary', v)} placeholder="예: 2500000" />
          <Field label="식대 (원)" type="number" value={form.meal_allowance} onChange={v => set('meal_allowance', v)} />
        </div>

        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-1">메모</label>
          <textarea
            value={form.note}
            onChange={e => set('note', e.target.value)}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 h-24"
          />
        </div>

        {error && <div className="bg-red-50 text-red-600 text-sm rounded-lg px-4 py-3 mb-4">{error}</div>}

        <div className="flex gap-3">
          <button type="submit" disabled={loading} className="bg-green-500 hover:bg-green-800 text-white px-6 py-2.5 rounded-lg text-sm font-medium transition disabled:opacity-50">
            {loading ? '등록 중...' : '직원 등록'}
          </button>
          <Link href="/employees" className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-6 py-2.5 rounded-lg text-sm font-medium transition">
            취소
          </Link>
        </div>
      </form>
    </div>
  );
}

interface FieldProps { label: string; value: string | number; onChange: (v: string) => void; type?: string; required?: boolean; placeholder?: string; className?: string; }
function Field({ label, value, onChange, type = 'text', required = false, placeholder = '', className = '' }: FieldProps) {
  return (
    <div className={className}>
      <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
      <input
        type={type} value={value} onChange={e => onChange(e.target.value)}
        required={required} placeholder={placeholder}
        className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
      />
    </div>
  );
}

interface SelectFieldProps { label: string; value: string; onChange: (v: string) => void; options: string[]; }
function SelectField({ label, value, onChange, options }: SelectFieldProps) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
      <select value={value} onChange={e => onChange(e.target.value)}
        className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400">
        {options.map((o: string) => <option key={o} value={o}>{o}</option>)}
      </select>
    </div>
  );
}
