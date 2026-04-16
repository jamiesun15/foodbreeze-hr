import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import sql from '@/lib/db';
import { compare, hash } from 'bcryptjs';

export async function POST(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session.userId) {
      return NextResponse.json({ error: '로그인이 필요합니다.' }, { status: 401 });
    }

    const { currentPassword, newPassword } = await req.json();

    if (!currentPassword || !newPassword) {
      return NextResponse.json({ error: '현재 비밀번호와 새 비밀번호를 입력하세요.' }, { status: 400 });
    }

    if (newPassword.length < 8) {
      return NextResponse.json({ error: '새 비밀번호는 8자 이상이어야 합니다.' }, { status: 400 });
    }

    if (newPassword.length > 100) {
      return NextResponse.json({ error: '비밀번호가 너무 깁니다.' }, { status: 400 });
    }

    const rows = await sql`SELECT password_hash FROM users WHERE id = ${session.userId}`;
    const user = rows[0] as any;
    if (!user) {
      return NextResponse.json({ error: '사용자를 찾을 수 없습니다.' }, { status: 404 });
    }

    const isValid = await compare(currentPassword, user.password_hash);
    if (!isValid) {
      return NextResponse.json({ error: '현재 비밀번호가 올바르지 않습니다.' }, { status: 401 });
    }

    const newHash = await hash(newPassword, 12);
    await sql`UPDATE users SET password_hash = ${newHash} WHERE id = ${session.userId}`;

    return NextResponse.json({ success: true, message: '비밀번호가 변경되었습니다.' });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: '서버 오류가 발생했습니다.' }, { status: 500 });
  }
}
