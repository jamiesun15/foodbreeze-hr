import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth';
import sql from '@/lib/db';

export async function GET() {
  try {
    await requireAdmin();
    const clients = await sql`SELECT * FROM clients ORDER BY name ASC`;
    return NextResponse.json(clients);
  } catch {
    return NextResponse.json({ error: '권한이 없습니다.' }, { status: 403 });
  }
}

export async function POST(req: NextRequest) {
  try {
    await requireAdmin();
    const data = await req.json();
    const result = await sql`
      INSERT INTO clients (name, business_number, representative, address, phone, email)
      VALUES (${data.name}, ${data.business_number || null}, ${data.representative || null},
              ${data.address || null}, ${data.phone || null}, ${data.email || null})
      RETURNING id
    `;
    return NextResponse.json({ id: (result[0] as any).id });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: '거래처 등록 중 오류가 발생했습니다.' }, { status: 500 });
  }
}
