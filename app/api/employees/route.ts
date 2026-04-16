import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth';
import sql from '@/lib/db';
import { sanitizeString } from '@/lib/validate';

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

    if (!data.name || !data.hire_date) {
      return NextResponse.json({ error: '이름과 입사일은 필수입니다.' }, { status: 400 });
    }

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
        ${employeeNumber}, ${sanitizeString(data.name, 50)}, ${sanitizeString(data.birth_date, 10)},
        ${sanitizeString(data.phone, 20)}, ${sanitizeString(data.email, 100)},
        ${sanitizeString(data.address, 200)}, ${sanitizeString(data.emergency_contact, 50)},
        ${sanitizeString(data.department, 50) || '운영팀'}, ${sanitizeString(data.position, 50) || '사원'},
        ${sanitizeString(data.employment_type, 20) || '정규직'}, ${sanitizeString(data.hire_date, 10)},
        ${data.base_salary || 0}, ${data.meal_allowance || 200000}, ${sanitizeString(data.note, 500)}
      ) RETURNING id
    `;

    return NextResponse.json({ id: (result[0] as any).id, employee_number: employeeNumber });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: '직원 등록 중 오류가 발생했습니다.' }, { status: 500 });
  }
}
