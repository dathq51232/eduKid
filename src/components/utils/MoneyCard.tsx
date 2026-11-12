'use client';

// Khối "Thu chi tháng này" cho dashboard: tổng thu / chi / còn lại (bảng teacher_money, chỉ chủ tài khoản đọc được),
// ghi nhanh một khoản ngay trên dashboard, và (giáo viên) tồn quỹ lớp + còn phải thu.
// Số tiền mặc định che đi (màn hình giáo viên hay được chiếu) — bấm con mắt để hiện, nhớ trên máy.
import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { ChevronRight, Eye, EyeOff } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { fmtMoney, parseMoney, todayVn, type Kind } from '@/lib/utils/money';

const SHOW_KEY = 'uw-hien-tien';
type Fund = { balance: number; owed: number };

export default function MoneyCard({ href, title = 'Thu chi tháng này', fundHref, classId }: { href: string; title?: string; fundHref?: string; classId?: string }) {
  const supabase = useMemo(() => { try { return createClient(); } catch { return null; } }, []);
  const [sum, setSum] = useState<{ thu: number; chi: number } | null>(null);
  const [missing, setMissing] = useState(false);
  const [fund, setFund] = useState<Fund | null>(null);
  const [show, setShow] = useState(false);
  const [amount, setAmount] = useState('');
  const [busy, setBusy] = useState(false);
  const [note, setNote] = useState('');
  useEffect(() => { try { setShow(localStorage.getItem(SHOW_KEY) === '1'); } catch { /* bỏ qua */ } }, []);
  const toggle = () => setShow((v) => { try { localStorage.setItem(SHOW_KEY, v ? '0' : '1'); } catch { /* bỏ qua */ } return !v; });
  const money = (n: number) => (show ? fmtMoney(n) : '•••••');

  const load = useCallback(async () => {
    if (!supabase) { setMissing(true); return; }
    const ym = todayVn().slice(0, 7);
    const [y, m] = ym.split('-').map(Number);
    const nextMonth = new Date(Date.UTC(y, m, 1)).toISOString().slice(0, 10); // ngày 1 tháng sau (tránh "31/11" không hợp lệ)
    const { data, error } = await supabase.from('teacher_money').select('kind, amount').gte('day', `${ym}-01`).lt('day', nextMonth);
    if (error) { setMissing(true); return; }
    const rows = (data ?? []) as { kind: Kind; amount: number }[];
    setSum({ thu: rows.filter((r) => r.kind === 'thu').reduce((a, r) => a + Number(r.amount), 0), chi: rows.filter((r) => r.kind === 'chi').reduce((a, r) => a + Number(r.amount), 0) });
    if (classId) {
      const [c, e] = await Promise.all([
        supabase.from('class_fund_collections').select('id, amount_per').eq('class_id', classId),
        supabase.from('class_fund_entries').select('kind, amount').eq('class_id', classId),
      ]);
      if (!c.error && !e.error) {
        const cols = (c.data ?? []) as { id: string; amount_per: number }[];
        const { data: m } = await supabase.from('class_memberships').select('student_id').eq('class_id', classId).eq('status', 'active');
        const ids = new Set(((m ?? []) as { student_id: string }[]).map((x) => x.student_id));
        const pays = cols.length ? (((await supabase.from('class_fund_payments').select('collection_id, student_id, amount').in('collection_id', cols.map((x) => x.id))).data ?? []) as { collection_id: string; student_id: string; amount: number }[]).filter((p) => ids.has(p.student_id)) : [];
        const got = pays.reduce((a, p) => a + Number(p.amount), 0);
        const ent = (e.data ?? []) as { kind: Kind; amount: number }[];
        const other = ent.reduce((a, x) => a + (x.kind === 'thu' ? Number(x.amount) : -Number(x.amount)), 0);
        const owed = cols.reduce((a, col) => a + Math.max(0, Number(col.amount_per) * ids.size - pays.filter((p) => p.collection_id === col.id).reduce((s, p) => s + Number(p.amount), 0)), 0);
        if (cols.length || ent.length) setFund({ balance: got + other, owed });
      }
    }
  }, [supabase, classId]);
  useEffect(() => { void load(); }, [load]);

  const val = parseMoney(amount);
  const add = async (kind: Kind) => {
    if (!supabase || !val) return;
    setBusy(true);
    const { error } = await supabase.from('teacher_money').insert({ kind, amount: val, category: 'Khác', note: '', day: todayVn() });
    setBusy(false);
    if (error) { setNote('Chưa lưu được, thử lại nhé.'); return; }
    setAmount(''); setNote(`Đã ghi ${kind} ${fmtMoney(val)} (danh mục Khác — sửa ở sổ thu chi).`);
    void load();
  };

  const left = sum ? sum.thu - sum.chi : 0;
  const pct = sum && sum.thu > 0 ? Math.min(100, Math.round((sum.chi / sum.thu) * 100)) : sum?.chi ? 100 : 0;

  return (
    <section className="uw uw-money" aria-labelledby="uw-money-h">
      <div className="uw-hd">
        <h2 id="uw-money-h">👛 {title}</h2>
        {!missing && <button type="button" className="uw-eye" onClick={toggle} aria-pressed={show} aria-label={show ? 'Che số tiền' : 'Hiện số tiền'} title={show ? 'Che số tiền' : 'Hiện số tiền'}>{show ? <EyeOff aria-hidden="true" /> : <Eye aria-hidden="true" />}</button>}
        <Link href={href} className="uw-more">Sổ thu chi <ChevronRight aria-hidden="true" /></Link>
      </div>
      {missing ? <p className="uw-muted">Chưa bật Sổ thu chi (cần chạy migration 0052 trên Supabase).</p> : !sum ? <p className="uw-muted">Đang tải…</p> : (
        <>
          <div className="uw-nums">
            <div className="is-thu"><small>Thu</small><b>{money(sum.thu)}</b></div>
            <div className="is-chi"><small>Chi</small><b>{money(sum.chi)}</b></div>
            <div className={left >= 0 ? 'is-pos' : 'is-neg'}><small>Còn lại</small><b>{show ? `${left < 0 ? '−' : ''}${fmtMoney(Math.abs(left))}` : '•••••'}</b></div>
          </div>
          <div className="uw-meter" role="img" aria-label={`Đã chi ${pct}% số thu tháng này`}><i style={{ width: `${pct}%` }} className={pct >= 90 ? 'is-hot' : ''} /></div>
          <p className="uw-muted">{sum.thu ? `Đã chi ${pct}% số thu tháng này` : sum.chi ? 'Tháng này chưa ghi khoản thu' : 'Tháng này chưa ghi khoản nào'}</p>
          <form className="uw-quick" onSubmit={(e) => { e.preventDefault(); void add('chi'); }}>
            <input value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="Ghi nhanh: 50k, 1tr2…" aria-label="Số tiền ghi nhanh" />
            <button type="submit" className="is-chi" disabled={busy || !val}>− Chi</button>
            <button type="button" className="is-thu" disabled={busy || !val} onClick={() => add('thu')}>+ Thu</button>
          </form>
          {(note || (amount && !val)) && <p className="uw-muted" role="status">{amount && !val ? 'Chưa hiểu số tiền (ví dụ 50k, 1tr2).' : note}</p>}
        </>
      )}
      {fund && fundHref && (
        <Link href={fundHref} className="uw-fund">
          <span>📒 Quỹ lớp</span>
          <span>Tồn <b>{money(fund.balance)}</b>{fund.owed > 0 && <> · còn thu <b>{money(fund.owed)}</b></>}</span>
          <ChevronRight aria-hidden="true" />
        </Link>
      )}
    </section>
  );
}
