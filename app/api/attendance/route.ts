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

  // 직원별 휴게시간/기본근무시간 조회
  const empRows = await sql`SELECT break_minutes, standard_hours FROM employees WHERE id = ${empId}`;
  const empSettings = empRows[0] as any;
  const breakMin = empSettings?.break_minutes ?? 60;
  const stdHours = empSettings?.standard_hours ?? 6;

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
      workHours = calculateWorkHours(checkIn, now, breakMin);
      overtimeHours = calculateOvertime(workHours, stdHours);
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

    // 해당 출퇴근 기록의 직원 설정 조회
    const attRow = await sql`SELECT employee_id FROM attendance WHERE id = ${id}`;
    if (attRow.length === 0) return NextResponse.json({ error: '기록을 찾을 수 없습니다.' }, { status: 404 });
    const editEmpId = (attRow[0] as any).employee_id;
    const editEmpRows = await sql`SELECT break_minutes, standard_hours FROM employees WHERE id = ${editEmpId}`;
    const editEmpSettings = editEmpRows[0] as any;
    const editBreakMin = editEmpSettings?.break_minutes ?? 60;
    const editStdHours = editEmpSettings?.standard_hours ?? 6;

    let workHours = 0, overtimeHours = 0;
    if (check_in && check_out) {
      workHours = calculateWorkHours(check_in, check_out, editBreakMin);
      overtimeHours = calculateOvertime(workHours, editStdHours);
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
