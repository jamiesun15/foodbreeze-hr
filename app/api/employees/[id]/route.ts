import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth';
import sql from '@/lib/db';
import { sanitizeString, isPositiveInt } from '@/lib/validate';
import { hash as bcryptHash } from 'bcryptjs';

export async function GET(_: NextRequest, { params }: { params: { id: string } }) {
  try {
    await requireAdmin();
    if (!isPositiveInt(params.id)) return NextResponse.json({ error: '잘못된 요청입니다.' }, { status: 400 });
    const rows = await sql`SELECT * FROM employees WHERE id = ${Number(params.id)}`;
    if (rows.length === 0) return NextResponse.json({ error: '직원을 찾을 수 없습니다.' }, { status: 404 });
    const userRows = await sql`SELECT username FROM users WHERE employee_id = ${Number(params.id)}`;
    const employee = { ...rows[0] as any, login_id: userRows.length > 0 ? (userRows[0] as any).username : '' };
    return NextResponse.json(employee);
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
        break_minutes = ${d.break_minutes ?? 60}, standard_hours = ${d.standard_hours ?? 6},
        is_active = ${d.is_active ?? 1}, note = ${sanitizeString(d.note, 500)}
      WHERE id = ${Number(params.id)}
    `;
    // 로그인 계정 처리
    if (d.login_id) {
      const existingUser = await sql`SELECT id FROM users WHERE employee_id = ${Number(params.id)}`;
      if (existingUser.length > 0) {
        // 기존 계정 - 아이디 변경
        const dupCheck = await sql`SELECT id FROM users WHERE username = ${d.login_id} AND employee_id != ${Number(params.id)}`;
        if (dupCheck.length > 0) {
          return NextResponse.json({ error: '이미 사용중인 아이디입니다.' }, { status: 400 });
        }
        await sql`UPDATE users SET username = ${d.login_id} WHERE employee_id = ${Number(params.id)}`;
        // 비밀번호 변경 (입력한 경우만)
        if (d.login_password && d.login_password.length >= 8) {
          const passwordHash = await bcryptHash(d.login_password, 12);
          await sql`UPDATE users SET password_hash = ${passwordHash} WHERE employee_id = ${Number(params.id)}`;
        }
      } else {
        // 신규 계정 생성
        if (!d.login_password || d.login_password.length < 8) {
          return NextResponse.json({ error: '비밀번호는 8자 이상이어야 합니다.' }, { status: 400 });
        }
        const dupCheck = await sql`SELECT id FROM users WHERE username = ${d.login_id}`;
        if (dupCheck.length > 0) {
          return NextResponse.json({ error: '이미 사용중인 아이디입니다.' }, { status: 400 });
        }
        const passwordHash = await bcryptHash(d.login_password, 12);
        await sql`INSERT INTO users (username, password_hash, role, employee_id) VALUES (${d.login_id}, ${passwordHash}, 'employee', ${Number(params.id)})`;
      }
    }

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
