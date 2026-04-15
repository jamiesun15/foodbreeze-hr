import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth';
import sql from '@/lib/db';
import { calculateTax } from '@/lib/tax';

export async function GET(req: NextRequest) {
  try {
    await requireAdmin();
    const { searchParams } = new URL(req.url);
    const year = Number(searchParams.get('year') || new Date().getFullYear());
    const month = searchParams.get('month') ? Number(searchParams.get('month')) : null;

    const records = month
      ? await sql`
          SELECT p.*, e.name as employee_name, e.employee_number, e.department, e.position
          FROM payroll p JOIN employees e ON p.employee_id = e.id
          WHERE p.year = ${year} AND p.month = ${month}
          ORDER BY p.month DESC, e.employee_number ASC
        `
      : await sql`
          SELECT p.*, e.name as employee_name, e.employee_number, e.department, e.position
          FROM payroll p JOIN employees e ON p.employee_id = e.id
          WHERE p.year = ${year}
          ORDER BY p.month DESC, e.employee_number ASC
        `;

    return NextResponse.json(records);
  } catch {
    return NextResponse.json({ error: '권한이 없습니다.' }, { status: 403 });
  }
}

export async function POST(req: NextRequest) {
  try {
    await requireAdmin();
    const data = await req.json();
    const { employee_id, year, month, overtime_pay = 0, other_allowance = 0, note } = data;

    const empRows = await sql`SELECT * FROM employees WHERE id = ${Number(employee_id)}`;
    const emp = empRows[0] as any;
    if (!emp) return NextResponse.json({ error: '직원을 찾을 수 없습니다.' }, { status: 404 });

    const tax = calculateTax(emp.base_salary, emp.meal_allowance, overtime_pay, other_allowance);
    const payDate = `${year}-${String(month).padStart(2, '0')}-15`;

    await sql`
      INSERT INTO payroll (
        employee_id, year, month, base_salary, meal_allowance, overtime_pay, other_allowance,
        gross_salary, national_pension, health_insurance, long_term_care,
        employment_insurance, income_tax, local_income_tax, total_deduction, net_salary, payment_date, note
      ) VALUES (
        ${employee_id}, ${year}, ${month}, ${emp.base_salary}, ${emp.meal_allowance},
        ${overtime_pay}, ${other_allowance}, ${tax.grossSalary}, ${tax.nationalPension},
        ${tax.healthInsurance}, ${tax.longTermCare}, ${tax.employmentInsurance},
        ${tax.incomeTax}, ${tax.localIncomeTax}, ${tax.totalDeduction}, ${tax.netSalary},
        ${payDate}, ${note || null}
      )
      ON CONFLICT (employee_id, year, month) DO UPDATE SET
        base_salary = EXCLUDED.base_salary, meal_allowance = EXCLUDED.meal_allowance,
        overtime_pay = EXCLUDED.overtime_pay, other_allowance = EXCLUDED.other_allowance,
        gross_salary = EXCLUDED.gross_salary, national_pension = EXCLUDED.national_pension,
        health_insurance = EXCLUDED.health_insurance, long_term_care = EXCLUDED.long_term_care,
        employment_insurance = EXCLUDED.employment_insurance, income_tax = EXCLUDED.income_tax,
        local_income_tax = EXCLUDED.local_income_tax, total_deduction = EXCLUDED.total_deduction,
        net_salary = EXCLUDED.net_salary, payment_date = EXCLUDED.payment_date, note = EXCLUDED.note
    `;

    return NextResponse.json({ success: true, ...tax });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    await requireAdmin();
    const { year, month } = await req.json();
    const employees = await sql`SELECT * FROM employees WHERE is_active = 1`;

    for (const emp of employees as any[]) {
      const tax = calculateTax(emp.base_salary, emp.meal_allowance, 0, 0);
      const payDate = `${year}-${String(month).padStart(2, '0')}-15`;

      await sql`
        INSERT INTO payroll (
          employee_id, year, month, base_salary, meal_allowance, overtime_pay, other_allowance,
          gross_salary, national_pension, health_insurance, long_term_care,
          employment_insurance, income_tax, local_income_tax, total_deduction, net_salary, payment_date
        ) VALUES (
          ${emp.id}, ${year}, ${month}, ${emp.base_salary}, ${emp.meal_allowance}, 0, 0,
          ${tax.grossSalary}, ${tax.nationalPension}, ${tax.healthInsurance}, ${tax.longTermCare},
          ${tax.employmentInsurance}, ${tax.incomeTax}, ${tax.localIncomeTax},
          ${tax.totalDeduction}, ${tax.netSalary}, ${payDate}
        )
        ON CONFLICT (employee_id, year, month) DO UPDATE SET
          gross_salary = EXCLUDED.gross_salary, national_pension = EXCLUDED.national_pension,
          health_insurance = EXCLUDED.health_insurance, long_term_care = EXCLUDED.long_term_care,
          employment_insurance = EXCLUDED.employment_insurance, income_tax = EXCLUDED.income_tax,
          local_income_tax = EXCLUDED.local_income_tax, total_deduction = EXCLUDED.total_deduction,
          net_salary = EXCLUDED.net_salary, payment_date = EXCLUDED.payment_date
      `;
    }

    return NextResponse.json({ success: true, count: employees.length });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
