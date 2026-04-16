import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { getIronSession } from 'iron-session';
import { SessionData, sessionOptions } from '@/lib/session';
import sql from '@/lib/db';
import { compare } from 'bcryptjs';
import { checkRateLimit, resetRateLimit } from '@/lib/rate-limit';

export async function POST(req: NextRequest) {
  try {
    const ip = req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || 'unknown';
    const rateCheck = checkRateLimit(ip);

    if (!rateCheck.allowed) {
      return NextResponse.json(
        { error: `로그인 시도가 너무 많습니다. ${rateCheck.retryAfterSeconds}초 후 다시 시도하세요.` },
        { status: 429 }
      );
    }

    const { username, password } = await req.json();

    if (!username || !password || typeof username !== 'string' || typeof password !== 'string') {
      return NextResponse.json({ error: '아이디와 비밀번호를 입력하세요.' }, { status: 400 });
    }

    if (username.length > 50 || password.length > 100) {
      return NextResponse.json({ error: '입력값이 너무 깁니다.' }, { status: 400 });
    }

    const rows = await sql`SELECT * FROM users WHERE username = ${username}`;
    const user = rows[0] as any;

    if (!user || !(await compare(password, user.password_hash))) {
      return NextResponse.json(
        { error: `아이디 또는 비밀번호가 올바르지 않습니다. (남은 시도: ${rateCheck.remainingAttempts}회)` },
        { status: 401 }
      );
    }

    resetRateLimit(ip);

    const cookieStore = await cookies();
    const session = await getIronSession<SessionData>(cookieStore, sessionOptions);
    session.userId = Number(user.id);
    session.username = user.username;
    session.role = user.role;
    session.employeeId = user.employee_id ? Number(user.employee_id) : undefined;

    if (user.employee_id) {
      const empRows = await sql`SELECT name FROM employees WHERE id = ${user.employee_id}`;
      if (empRows[0]) session.employeeName = (empRows[0] as any).name;
    }

    await session.save();
    return NextResponse.json({ role: user.role, success: true });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: '서버 오류가 발생했습니다.' }, { status: 500 });
  }
}
