import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth';
import sql from '@/lib/db';
import { sanitizeString, isPositiveInt } from '@/lib/validate';

export async function GET(_: NextRequest, { params }: { params: { id: string } }) {
  try {
    await requireAdmin();
    if (!isPositiveInt(params.id)) return NextResponse.json({ error: '잘못된 요청입니다.' }, { status: 400 });
    const rows = await sql`SELECT * FROM employees WHERE id = ${Number(params.id)}`;
    if (rows.length === 0) return NextResponse.json({ error: '직원을 찾을 수 없습니다.' }, { status: 404 });
    return NextResponse.json(rows[0]);
  } catch {
    return NextResponse.json({ error: '권한이 없습니다.' }, { status: 403 });
  }
}

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    await requireAdmin();
    if (!isPositiveInt(params.id)) return NextResponse.json({ error: '잘못된 요청입니다.' }, { status: 400 });
    const d = await req.json();

    if (!d.name || !d.hire_date) {
      return NextResponse.json({ error: '이름과 입사일은 필수입니다.' }, { status: 400 });
    }

    await sql`
      UPDATE employees SET
        name = ${sanitizeString(d.name, 50)}, birth_date = ${sanitizeString(d.birth_date, 10)},
        phone = ${sanitizeString(d.phone, 20)}, email = ${sanitizeString(d.email, 100)},
        address = ${sanitizeString(d.address, 200)}, emergency_contact = ${sanitizeString(d.emergency_contact, 50)},
        department = ${sanitizeString(d.department, 50)}, position = ${sanitizeString(d.position, 50)},
        employment_type = ${sanitizeString(d.employment_type, 20)}, hire_date = ${sanitizeString(d.hire_date, 10)},
        resign_date = ${sanitizeString(d.resign_date, 10)}, resign_reason = ${sanitizeString(d.resign_reason, 200)},
        base_salary = ${d.base_salary}, meal_allowance = ${d.meal_allowance},
        is_active = ${d.is_active ?? 1}, note = ${sanitizeString(d.note, 500)}
      WHERE id = ${Number(params.id)}
    `;
    return NextResponse.json({ success: true });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: '수정 중 오류가 발생했습니다.' }, { status: 500 });
  }
}

export async function DELETE(_: NextRequest, { params }: { params: { id: string } }) {
  try {
    await requireAdmin();
    if (!isPositiveInt(params.id)) return NextResponse.json({ error: '잘못된 요청입니다.' }, { status: 400 });
    await sql`UPDATE employees SET is_active = 0 WHERE id = ${Number(params.id)}`;
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: '오류가 발생했습니다.' }, { status: 500 });
  }
}
