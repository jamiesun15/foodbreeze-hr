import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth';
import sql from '@/lib/db';

export async function GET() {
  try {
    await requireAdmin();
    const employees = await sql`SELECT * FROM employees ORDER BY employee_number ASC`;
    return NextResponse.json(employees);
  } catch {
    return NextResponse.json({ error: '권한이 없습니다.' }, { status: 403 });
  }
}

export async function POST(req: NextRequest) {
  try {
    await requireAdmin();
    const data = await req.json();

    // 사원번호 자동 생성 (FB001, FB002 ...)
    const lastRows = await sql`SELECT employee_number FROM employees ORDER BY id DESC LIMIT 1`;
    let nextNum = 1;
    if (lastRows[0]) {
      const match = (lastRows[0] as any).employee_number.match(/(\d+)$/);
      if (match) nextNum = parseInt(match[1]) + 1;
    }
    const employeeNumber = `FB${String(nextNum).padStart(3, '0')}`;

    const result = await sql`
      INSERT INTO employees (
        employee_number, name, birth_date, phone, email, address,
        emergency_contact, department, position, employment_type,
        hire_date, base_salary, meal_allowance, note
      ) VALUES (
        ${employeeNumber}, ${data.name}, ${data.birth_date || null}, ${data.phone || null},
        ${data.email || null}, ${data.address || null}, ${data.emergency_contact || null},
        ${data.department || '운영팀'}, ${data.position || '사원'},
        ${data.employment_type || '정규직'}, ${data.hire_date},
        ${data.base_salary || 0}, ${data.meal_allowance || 200000}, ${data.note || null}
      ) RETURNING id
    `;

    return NextResponse.json({ id: (result[0] as any).id, employee_number: employeeNumber });
  } catch (e: any) {
    console.error(e);
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
