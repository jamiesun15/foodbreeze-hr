'use client';
import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';

const departments = ['운영팀', '주방팀', '홀팀', '관리팀'];
const positions = ['사원', '주임', '매니저(과장)', '팀장', '부장'];

export default function EditEmployeePage() {
  const router = useRouter();
  const params = useParams();
  const [form, setForm] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetch(`/api/employees/${params.id}`).then(r => r.json()).then(setForm);
  }, [params.id]);

  const set = (key: string, val: any) => setForm((f: any) => ({ ...f, [key]: val }));

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    await fetch(`/api/employees/${params.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    });
    setLoading(false);
    alert('수정 완료!');
    router.push('/employees');
  }

  if (!form) return <div className="text-center py-20 text-gray-400">불러오는 중...</div>;

  return (
    <div>
      <div className="flex items-center gap-3 mb-6">
        <Link href="/employees" className="text-gray-400 hover:text-gray-600">← 직원 목록</Link>
        <h1 className="text-2xl font-bold text-gray-800">직원 수정 — {form.name}</h1>
        <span className="bg-gray-100 text-gray-600 text-xs px-2 py-1 rounded">{form.employee_number}</span>
      </div>

      <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-sm border border-gray-100 p-8 max-w-2xl">
        <h2 className="font-semibold text-gray-700 mb-4 pb-2 border-b">로그인 계정</h2>
        <div className="grid grid-cols-2 gap-4 mb-6">
          <Field label="아이디" value={form.login_id || ''} onChange={v => set('login_id', v)} placeholder="로그인 아이디" />
          <Field label="비밀번호 변경" value={form.login_password || ''} onChange={v => set('login_password', v)} placeholder="변경 시에만 입력 (8자 이상)" />
        </div>
        {!form.login_id && <p className="text-sm text-orange-500 mb-4">* 아이디를 입력하면 로그인 계정이 생성됩니다.</p>}

        <h2 className="font-semibold text-gray-700 mb-4 pb-2 border-b">기본 정보</h2>
        <div className="grid grid-cols-2 gap-4 mb-6">
          <Field label="이름 *" value={form.name} onChange={v => set('name', v)} required />
          <Field label="생년월일" type="date" value={form.birth_date || ''} onChange={v => set('birth_date', v)} />
          <Field label="연락처" value={form.phone || ''} onChange={v => set('phone', v)} />
          <Field label="이메일" type="email" value={form.email || ''} onChange={v => set('email', v)} />
          <Field label="주소" value={form.address || ''} onChange={v => set('address', v)} className="col-span-2" />
          <Field label="비상연락처" value={form.emergency_contact || ''} onChange={v => set('emergency_contact', v)} className="col-span-2" />
        </div>

        <h2 className="font-semibold text-gray-700 mb-4 pb-2 border-b">직무 정보</h2>
        <div className="grid grid-cols-2 gap-4 mb-6">
          <SelectField label="부서" value={form.department} onChange={v => set('department', v)} options={departments} />
          <SelectField label="직급" value={form.position} onChange={v => set('position', v)} options={positions} />
          <SelectField label="고용형태" value={form.employment_type} onChange={v => set('employment_type', v)} options={['정규직', '계약직', '아르바이트']} />
          <Field label="입사일" type="date" value={form.hire_date || ''} onChange={v => set('hire_date', v)} />
          <Field label="퇴사일" type="date" value={form.resign_date || ''} onChange={v => set('resign_date', v)} />
          <Field label="퇴사사유" value={form.resign_reason || ''} onChange={v => set('resign_reason', v)} />
        </div>

        <h2 className="font-semibold text-gray-700 mb-4 pb-2 border-b">급여 정보</h2>
        <div className="grid grid-cols-2 gap-4 mb-6">
          <Field label="기본급 (원)" type="number" value={form.base_salary || 0} onChange={v => set('base_salary', Number(v))} />
          <Field label="식대 (원)" type="number" value={form.meal_allowance || 200000} onChange={v => set('meal_allowance', Number(v))} />
        </div>

        <h2 className="font-semibold text-gray-700 mb-4 pb-2 border-b">근무 설정</h2>
        <div className="grid grid-cols-2 gap-4 mb-6">
          <Field label="휴게시간 (분)" type="number" value={form.break_minutes ?? 60} onChange={v => set('break_minutes', Number(v))} placeholder="60" />
          <Field label="기본 근무시간 (시간)" type="number" value={form.standard_hours ?? 6} onChange={v => set('standard_hours', Number(v))} placeholder="6" />
        </div>

        <div className="flex gap-3">
          <button type="submit" disabled={loading} className="bg-green-500 hover:bg-green-800 text-white px-6 py-2.5 rounded-lg text-sm font-medium transition disabled:opacity-50">
            {loading ? '저장 중...' : '저장'}
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
      <input type={type} value={value} onChange={e => onChange(e.target.value)} required={required} placeholder={placeholder}
        className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400" />
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
