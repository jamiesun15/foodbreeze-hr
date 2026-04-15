import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth';
import sql from '@/lib/db';

export async function GET() {
  try {
    await requireAdmin();

    const today = new Date().toISOString().split('T')[0];
    const year = new Date().getFullYear();
    const month = new Date().getMonth() + 1;

    const [{ count: totalEmployees }] = await sql`
      SELECT COUNT(*)::int as count FROM employees WHERE is_active = 1
    ` as any[];

    const [{ count: checkedInToday }] = await sql`
      SELECT COUNT(*)::int as count FROM attendance WHERE date = ${today} AND check_in IS NOT NULL
    ` as any[];

    const [{ count: checkedOutToday }] = await sql`
      SELECT COUNT(*)::int as count FROM attendance WHERE date = ${today} AND check_out IS NOT NULL
    ` as any[];

    const payrollRows = await sql`
      SELECT SUM(gross_salary)::int as total, SUM(net_salary)::int as net, COUNT(*)::int as cnt
      FROM payroll WHERE year = ${year} AND month = ${month}
    `;
    const payrollThisMonth = payrollRows[0] || null;

    const recentAttendance = await sql`
      SELECT a.*, e.name as employee_name
      FROM attendance a JOIN employees e ON a.employee_id = e.id
      WHERE a.date = ${today}
      ORDER BY a.check_in DESC NULLS LAST
    `;

    return NextResponse.json({ totalEmployees, checkedInToday, checkedOutToday, payrollThisMonth, recentAttendance });
  } catch {
    return NextResponse.json({ error: '권한이 없습니다.' }, { status: 403 });
  }
}
