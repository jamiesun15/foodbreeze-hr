import { NextRequest, NextResponse } from 'next/server';
import { getSession, requireAdmin } from '@/lib/auth';
import sql from '@/lib/db';
import { calculateWorkHours, calculateOvertime } from '@/lib/tax';
import { isValidYear, isValidMonth, isValidTime, sanitizeString, isPositiveInt } from '@/lib/validate';

export async function GET(req: NextRequest) {
  const session = await getSession();
  if (!session.userId) return NextResponse.json({ error: '로그인 필요' }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const year = searchParams.get('year') || new Date().getFullYear().toString();
  const month = (searchParams.get('month') || String(new Date().getMonth() + 1)).padStart(2, '0');
  const employeeId = searchParams.get('employee_id');

  if (!isValidYear(year) || !isValidMonth(month)) {
    return NextResponse.json({ error: '날짜 형식이 올바르지 않습니다.' }, { status: 400 });
  }

  const datePrefix = `${year}-${month}-%`;

  let records;
  if (session.role === 'employee') {
    if (!session.employeeId) return NextResponse.json({ error: '직원 정보 없음' }, { status: 400 });
    records = await sql`
      SELECT a.*, e.name as employee_name, e.employee_number
      FROM attendance a JOIN employees e ON a.employee_id = e.id
      WHERE a.date LIKE ${datePrefix} AND a.employee_id = ${session.employeeId}
      ORDER BY a.date DESC
    `;
  } else if (employeeId) {
    records = await sql`
      SELECT a.*, e.name as employee_name, e.employee_number
      FROM attendance a JOIN employees e ON a.employee_id = e.id
      WHERE a.date LIKE ${datePrefix} AND a.employee_id = ${Number(employeeId)}
      ORDER BY a.date DESC
    `;
  } else {
    records = await sql`
      SELECT a.*, e.name as employee_name, e.employee_number
      FROM attendance a JOIN employees e ON a.employee_id = e.id
      WHERE a.date LIKE ${datePrefix}
      ORDER BY a.date DESC, e.employee_number ASC
    `;
  }

  return NextResponse.json(records);
}

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session.userId) return NextResponse.json({ error: '로그인 필요' }, { status: 401 });

  const data = await req.json();
  const { action, employee_id, note } = data;

  if (action !== 'checkin' && action !== 'checkout') {
    return NextResponse.json({ error: '잘못된 요청입니다.' }, { status: 400 });
  }

  const empId = session.role === 'admin' ? Number(employee_id) : session.employeeId;
  if (!empId) return NextResponse.json({ error: '직원 정보 없음' }, { status: 400 });

  const today = new Date().toISOString().split('T')[0];
  const now = new Date().toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit', hour12: false });
  const sanitizedNote = sanitizeString(note, 500);

  const existingRows = await sql`SELECT * FROM attendance WHERE employee_id = ${empId} AND date = ${today}`;
  const existing = existingRows[0] as any;

  if (action === 'checkin') {
    if (existing) {
      await sql`UPDATE attendance SET check_in = ${now}, note = ${sanitizedNote} WHERE employee_id = ${empId} AND date = ${today}`;
    } else {
      await sql`INSERT INTO attendance (employee_id, date, check_in, note) VALUES (${empId}, ${today}, ${now}, ${sanitizedNote})`;
    }
  } else if (action === 'checkout') {
    if (!existing) return NextResponse.json({ error: '출근 기록이 없습니다.' }, { status: 400 });
    const checkIn = existing.check_in;
    let workHours = 0, overtimeHours = 0;
    if (checkIn) {
      workHours = calculateWorkHours(checkIn, now, 60);
      overtimeHours = calculateOvertime(workHours, 6);
    }
    await sql`
      UPDATE attendance SET check_out = ${now}, work_hours = ${workHours}, overtime_hours = ${overtimeHours}
      WHERE employee_id = ${empId} AND date = ${today}
    `;
  }

  return NextResponse.json({ success: true });
}

export async function PUT(req: NextRequest) {
  try {
    await requireAdmin();
    const data = await req.json();
    const { id, check_in, check_out, note } = data;

    if (!isPositiveInt(id)) {
      return NextResponse.json({ error: '잘못된 요청입니다.' }, { status: 400 });
    }

    if (check_in && !isValidTime(check_in)) {
      return NextResponse.json({ error: '출근 시간 형식이 올바르지 않습니다.' }, { status: 400 });
    }
    if (check_out && !isValidTime(check_out)) {
      return NextResponse.json({ error: '퇴근 시간 형식이 올바르지 않습니다.' }, { status: 400 });
    }

    let workHours = 0, overtimeHours = 0;
    if (check_in && check_out) {
      workHours = calculateWorkHours(check_in, check_out, 60);
      overtimeHours = calculateOvertime(workHours, 6);
    }

    await sql`
      UPDATE attendance SET check_in = ${check_in || null}, check_out = ${check_out || null},
        work_hours = ${workHours}, overtime_hours = ${overtimeHours}, note = ${sanitizeString(note, 500)}
      WHERE id = ${id}
    `;
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: '권한이 없습니다.' }, { status: 403 });
  }
}
