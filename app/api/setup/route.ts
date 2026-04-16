import { NextRequest, NextResponse } from 'next/server';
import sql from '@/lib/db';
import { hash as bcryptHash } from 'bcryptjs';

export async function GET(req: NextRequest) {
  const token = req.nextUrl.searchParams.get('token');
  if (token !== process.env.SETUP_TOKEN) {
    return NextResponse.json({ error: '접근이 거부되었습니다.' }, { status: 403 });
  }

  try {
    await sql`
      CREATE TABLE IF NOT EXISTS users (
        id BIGSERIAL PRIMARY KEY,
        username TEXT UNIQUE NOT NULL,
        password_hash TEXT NOT NULL,
        role TEXT NOT NULL DEFAULT 'employee',
        employee_id BIGINT,
        created_at TIMESTAMP DEFAULT NOW()
      )
    `;

    await sql`
      CREATE TABLE IF NOT EXISTS employees (
        id BIGSERIAL PRIMARY KEY,
        employee_number TEXT UNIQUE NOT NULL,
        name TEXT NOT NULL,
        birth_date TEXT,
        phone TEXT,
        email TEXT,
        address TEXT,
        emergency_contact TEXT,
        department TEXT DEFAULT '운영팀',
        position TEXT DEFAULT '사원',
        employment_type TEXT DEFAULT '정규직',
        hire_date TEXT NOT NULL,
        resign_date TEXT,
        resign_reason TEXT,
        base_salary INTEGER DEFAULT 0,
        meal_allowance INTEGER DEFAULT 200000,
        is_active INTEGER DEFAULT 1,
        note TEXT,
        created_at TIMESTAMP DEFAULT NOW()
      )
    `;

    await sql`
      CREATE TABLE IF NOT EXISTS attendance (
        id BIGSERIAL PRIMARY KEY,
        employee_id BIGINT NOT NULL,
        date TEXT NOT NULL,
        check_in TEXT,
        check_out TEXT,
        work_hours FLOAT8,
        overtime_hours FLOAT8 DEFAULT 0,
        note TEXT,
        created_at TIMESTAMP DEFAULT NOW(),
        UNIQUE(employee_id, date)
      )
    `;

    await sql`
      CREATE TABLE IF NOT EXISTS payroll (
        id BIGSERIAL PRIMARY KEY,
        employee_id BIGINT NOT NULL,
        year INTEGER NOT NULL,
        month INTEGER NOT NULL,
        base_salary INTEGER NOT NULL,
        meal_allowance INTEGER DEFAULT 0,
        overtime_pay INTEGER DEFAULT 0,
        other_allowance INTEGER DEFAULT 0,
        gross_salary INTEGER NOT NULL,
        national_pension INTEGER NOT NULL,
        health_insurance INTEGER NOT NULL,
        long_term_care INTEGER NOT NULL,
        employment_insurance INTEGER NOT NULL,
        income_tax INTEGER NOT NULL,
        local_income_tax INTEGER NOT NULL,
        total_deduction INTEGER NOT NULL,
        net_salary INTEGER NOT NULL,
        payment_date TEXT,
        note TEXT,
        created_at TIMESTAMP DEFAULT NOW(),
        UNIQUE(employee_id, year, month)
      )
    `;

    await sql`
      CREATE TABLE IF NOT EXISTS tax_invoices (
        id BIGSERIAL PRIMARY KEY,
        invoice_number TEXT UNIQUE NOT NULL,
        issue_date TEXT NOT NULL,
        invoice_type TEXT NOT NULL,
        client_name TEXT NOT NULL,
        client_business_number TEXT,
        client_address TEXT,
        client_representative TEXT,
        items TEXT NOT NULL,
        supply_amount INTEGER NOT NULL,
        tax_amount INTEGER NOT NULL,
        total_amount INTEGER NOT NULL,
        note TEXT,
        created_at TIMESTAMP DEFAULT NOW()
      )
    `;

    await sql`
      CREATE TABLE IF NOT EXISTS clients (
        id BIGSERIAL PRIMARY KEY,
        name TEXT NOT NULL,
        business_number TEXT,
        representative TEXT,
        address TEXT,
        phone TEXT,
        email TEXT,
        created_at TIMESTAMP DEFAULT NOW()
      )
    `;

    const existing = await sql`SELECT id FROM users WHERE username = 'admin'`;
    if (existing.length === 0) {
      const hash = await bcryptHash('admin1234', 12);
      await sql`
        INSERT INTO users (username, password_hash, role)
        VALUES ('admin', ${hash}, 'admin')
      `;
    }

    return NextResponse.json({
      success: true,
      message: '데이터베이스 설정 완료! 로그인 후 반드시 비밀번호를 변경하세요.',
    });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: '설정 중 오류가 발생했습니다.' }, { status: 500 });
  }
}
