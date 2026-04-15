// 이 API는 Vercel 배포 후 딱 1번만 실행하면 됩니다.
// 브라우저에서 /api/setup 주소를 열면 테이블이 자동으로 생성됩니다.
import { NextResponse } from 'next/server';
import sql from '@/lib/db';
import { hash as bcryptHash } from 'bcryptjs';

export async function GET() {
  try {
    // 사용자 테이블
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

    // 직원 테이블
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

    // 출퇴근 테이블
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

    // 급여 테이블
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

    // 세금계산서 테이블
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

    // 거래처 테이블
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

    // 관리자 계정 생성 (없을 경우에만)
    const existing = await sql`SELECT id FROM users WHERE username = 'admin'`;
    if (existing.length === 0) {
      const hash = await bcryptHash('admin1234', 10);
      await sql`
        INSERT INTO users (username, password_hash, role)
        VALUES ('admin', ${hash}, 'admin')
      `;
    }

    return NextResponse.json({
      success: true,
      message: '데이터베이스 설정 완료! 이제 /login 으로 이동하세요.',
      admin: 'admin / admin1234',
    });
  } catch (e: any) {
    console.error(e);
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
