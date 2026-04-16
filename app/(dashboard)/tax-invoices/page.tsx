'use client';
import { useEffect, useState } from 'react';

const INVOICE_TYPES = ['세금계산서', '계산서(면세)', '영수증', '견적서', '거래명세서'];

export default function TaxInvoicesPage() {
  const [invoices, setInvoices] = useState<any[]>([]);
  const [year, setYear] = useState(new Date().getFullYear().toString());
  const [showForm, setShowForm] = useState(false);
  const [clients, setClients] = useState<any[]>([]);
  const [form, setForm] = useState({
    issue_date: new Date().toISOString().split('T')[0],
    invoice_type: '세금계산서',
    client_name: '',
    client_business_number: '',
    client_address: '',
    client_representative: '',
    note: '',
    items: [{ description: '', quantity: 1, unit_price: 0, amount: 0 }],
  });

  useEffect(() => {
    loadInvoices();
    fetch('/api/clients').then(r => r.json()).then(d => setClients(Array.isArray(d) ? d : []));
  }, [year]);

  async function loadInvoices() {
    const data = await fetch(`/api/tax-invoices?year=${year}`).then(r => r.json());
    setInvoices(Array.isArray(data) ? data : []);
  }

  const setF = (k: string, v: any) => setForm(f => ({ ...f, [k]: v }));

  const updateItem = (i: number, k: string, v: any) => {
    const items = [...form.items];
    items[i] = { ...items[i], [k]: v };
    if (k === 'quantity' || k === 'unit_price') {
      items[i].amount = items[i].quantity * items[i].unit_price;
    }
    setForm(f => ({ ...f, items }));
  };

  const supplyAmount = form.items.reduce((s, i) => s + (i.amount || 0), 0);
  const taxAmount = form.invoice_type === '세금계산서' ? Math.round(supplyAmount * 0.1) : 0;
  const totalAmount = supplyAmount + taxAmount;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const res = await fetch('/api/tax-invoices', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...form, supply_amount: supplyAmount, tax_amount: taxAmount, total_amount: totalAmount }),
    });
    const data = await res.json();
    if (!res.ok) { alert(data.error); return; }
    alert(`발행 완료! 번호: ${data.invoice_number}`);
    setShowForm(false);
    setForm({ issue_date: new Date().toISOString().split('T')[0], invoice_type: '세금계산서', client_name: '', client_business_number: '', client_address: '', client_representative: '', note: '', items: [{ description: '', quantity: 1, unit_price: 0, amount: 0 }] });
    loadInvoices();
  }

  const fmt = (n: number) => (n || 0).toLocaleString('ko-KR');

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">세금계산서</h1>
          <p className="text-gray-500 text-sm mt-1">사업자등록번호: 297-08-03121 | 대표: 선지명</p>
        </div>
        <button onClick={() => setShowForm(true)}
          className="bg-green-500 hover:bg-green-800 text-white px-5 py-2.5 rounded-lg text-sm font-medium transition">
          + 발행
        </button>
      </div>

      <div className="flex gap-3 mb-4">
        <select value={year} onChange={e => setYear(e.target.value)}
          className="border border-gray-300 rounded-lg px-3 py-2 text-sm">
          {[2024, 2025, 2026].map(y => <option key={y} value={y}>{y}년</option>)}
        </select>
      </div>

      {/* 목록 */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b">
            <tr className="text-gray-600 text-left">
              <th className="px-5 py-3 font-medium">번호</th>
              <th className="px-5 py-3 font-medium">발행일</th>
              <th className="px-5 py-3 font-medium">종류</th>
              <th className="px-5 py-3 font-medium">거래처</th>
              <th className="px-5 py-3 font-medium">공급가액</th>
              <th className="px-5 py-3 font-medium">세액</th>
              <th className="px-5 py-3 font-medium">합계</th>
            </tr>
          </thead>
          <tbody>
            {invoices.length === 0 ? (
              <tr><td colSpan={7} className="text-center py-12 text-gray-400">발행 내역이 없습니다.</td></tr>
            ) : invoices.map((inv: any) => (
              <tr key={inv.id} className="border-b last:border-0 hover:bg-gray-50">
                <td className="px-5 py-3 text-gray-500 font-mono text-xs">{inv.invoice_number}</td>
                <td className="px-5 py-3">{inv.issue_date}</td>
                <td className="px-5 py-3">
                  <span className="bg-blue-100 text-blue-700 px-2 py-1 rounded-full text-xs">{inv.invoice_type}</span>
                </td>
                <td className="px-5 py-3 font-medium">{inv.client_name}</td>
                <td className="px-5 py-3">{fmt(inv.supply_amount)}원</td>
                <td className="px-5 py-3 text-green-500">{fmt(inv.tax_amount)}원</td>
                <td className="px-5 py-3 font-bold">{fmt(inv.total_amount)}원</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* 발행 폼 */}
      {showForm && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4 overflow-auto">
          <div className="bg-white rounded-xl w-full max-w-2xl shadow-xl my-4">
            <div className="flex items-center justify-between p-6 border-b">
              <h3 className="font-bold text-gray-800">세금계산서 발행</h3>
              <button onClick={() => setShowForm(false)} className="text-gray-400 hover:text-gray-600 text-xl">×</button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-700">발행일 *</label>
                  <input type="date" value={form.issue_date} onChange={e => setF('issue_date', e.target.value)} required
                    className="w-full border rounded-lg px-3 py-2 text-sm mt-1" />
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700">종류 *</label>
                  <select value={form.invoice_type} onChange={e => setF('invoice_type', e.target.value)}
                    className="w-full border rounded-lg px-3 py-2 text-sm mt-1">
                    {INVOICE_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700">거래처명 *</label>
                  <input list="client-list" value={form.client_name} onChange={e => {
                    setF('client_name', e.target.value);
                    const c = clients.find(c => c.name === e.target.value);
                    if (c) { setF('client_business_number', c.business_number || ''); setF('client_representative', c.representative || ''); setF('client_address', c.address || ''); }
                  }} required className="w-full border rounded-lg px-3 py-2 text-sm mt-1" />
                  <datalist id="client-list">{clients.map(c => <option key={c.id} value={c.name} />)}</datalist>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700">사업자번호</label>
                  <input value={form.client_business_number} onChange={e => setF('client_business_number', e.target.value)}
                    className="w-full border rounded-lg px-3 py-2 text-sm mt-1" placeholder="000-00-00000" />
                </div>
              </div>

              {/* 품목 */}
              <div>
                <div className="flex justify-between items-center mb-2">
                  <p className="text-sm font-medium text-gray-700">품목</p>
                  <button type="button" onClick={() => setForm(f => ({ ...f, items: [...f.items, { description: '', quantity: 1, unit_price: 0, amount: 0 }] }))}
                    className="text-xs text-blue-500 hover:underline">+ 품목 추가</button>
                </div>
                <div className="border rounded-lg overflow-hidden">
                  <table className="w-full text-xs">
                    <thead className="bg-gray-50">
                      <tr className="text-gray-500">
                        <th className="px-3 py-2 text-left">품목명</th>
                        <th className="px-3 py-2 text-center">수량</th>
                        <th className="px-3 py-2 text-center">단가</th>
                        <th className="px-3 py-2 text-right">금액</th>
                      </tr>
                    </thead>
                    <tbody>
                      {form.items.map((item, i) => (
                        <tr key={i} className="border-t">
                          <td className="px-1 py-1"><input value={item.description} onChange={e => updateItem(i, 'description', e.target.value)} className="w-full border rounded px-2 py-1 text-xs" /></td>
                          <td className="px-1 py-1"><input type="number" value={item.quantity} onChange={e => updateItem(i, 'quantity', Number(e.target.value))} className="w-16 border rounded px-2 py-1 text-xs text-center" /></td>
                          <td className="px-1 py-1"><input type="number" value={item.unit_price} onChange={e => updateItem(i, 'unit_price', Number(e.target.value))} className="w-28 border rounded px-2 py-1 text-xs text-right" /></td>
                          <td className="px-3 py-1 text-right font-medium">{item.amount.toLocaleString()}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* 합계 */}
              <div className="bg-gray-50 rounded-lg p-4 text-sm space-y-1">
                <div className="flex justify-between"><span>공급가액</span><span className="font-medium">{fmt(supplyAmount)}원</span></div>
                {taxAmount > 0 && <div className="flex justify-between"><span>부가세 (10%)</span><span className="text-green-500">{fmt(taxAmount)}원</span></div>}
                <div className="flex justify-between border-t pt-2 font-bold"><span>합계</span><span>{fmt(totalAmount)}원</span></div>
              </div>

              <div className="flex gap-3 pt-2">
                <button type="submit" className="bg-green-500 text-white px-6 py-2.5 rounded-lg text-sm font-medium">발행</button>
                <button type="button" onClick={() => setShowForm(false)} className="bg-gray-100 text-gray-700 px-6 py-2.5 rounded-lg text-sm">취소</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
