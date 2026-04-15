import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth';
import sql from '@/lib/db';

export async function GET(_: NextRequest, { params }: { params: { id: string } }) {
  try {
    await requireAdmin();
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
    const d = await req.json();
    await sql`
      UPDATE employees SET
        name = ${d.name}, birth_date = ${d.birth_date || null}, phone = ${d.phone || null},
        email = ${d.email || null}, address = ${d.address || null},
        emergency_contact = ${d.emergency_contact || null}, department = ${d.department},
        position = ${d.position}, employment_type = ${d.employment_type},
        hire_date = ${d.hire_date}, resign_date = ${d.resign_date || null},
        resign_reason = ${d.resign_reason || null}, base_salary = ${d.base_salary},
        meal_allowance = ${d.meal_allowance}, is_active = ${d.is_active ?? 1},
        note = ${d.note || null}
      WHERE id = ${Number(params.id)}
    `;
    return NextResponse.json({ success: true });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

export async function DELETE(_: NextRequest, { params }: { params: { id: string } }) {
  try {
    await requireAdmin();
    await sql`UPDATE employees SET is_active = 0 WHERE id = ${Number(params.id)}`;
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: '오류가 발생했습니다.' }, { status: 500 });
  }
}
