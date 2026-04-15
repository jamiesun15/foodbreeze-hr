import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth';
import sql from '@/lib/db';

export async function GET(req: NextRequest) {
  try {
    await requireAdmin();
    const { searchParams } = new URL(req.url);
    const year = searchParams.get('year') || new Date().getFullYear().toString();
    const invoices = await sql`
      SELECT * FROM tax_invoices WHERE issue_date LIKE ${year + '-%'} ORDER BY issue_date DESC
    `;
    return NextResponse.json(invoices);
  } catch {
    return NextResponse.json({ error: '권한이 없습니다.' }, { status: 403 });
  }
}

export async function POST(req: NextRequest) {
  try {
    await requireAdmin();
    const data = await req.json();

    const year = new Date().getFullYear().toString();
    const countRows = await sql`SELECT COUNT(*)::int as count FROM tax_invoices WHERE issue_date LIKE ${year + '-%'}`;
    const count = (countRows[0] as any).count;
    const invoiceNumber = `${year}-${String(count + 1).padStart(4, '0')}`;

    await sql`
      INSERT INTO tax_invoices (
        invoice_number, issue_date, invoice_type, client_name, client_business_number,
        client_address, client_representative, items, supply_amount, tax_amount, total_amount, note
      ) VALUES (
        ${invoiceNumber}, ${data.issue_date}, ${data.invoice_type}, ${data.client_name},
        ${data.client_business_number || null}, ${data.client_address || null},
        ${data.client_representative || null}, ${JSON.stringify(data.items || [])},
        ${data.supply_amount}, ${data.tax_amount}, ${data.total_amount}, ${data.note || null}
      )
    `;

    return NextResponse.json({ success: true, invoice_number: invoiceNumber });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
