'use client';

// Quỹ lớp (migration 0052): khoản thu theo đầu em (bấm tên em là ghi "đã nộp"), sổ quỹ thu khác / chi,
// tồn quỹ, chép tin nhắc em chưa nộp và báo cáo công khai quỹ gửi nhóm Zalo phụ huynh, tải sổ quỹ Excel.
// Chỉ giáo viên của lớp đọc/ghi (RLS theo teaches_class).
import { useCallback, useEffect, useMemo, useState } from 'react';
import { Check, Copy, Download, Megaphone, Plus, Trash2, Undo2 } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { downloadXlsx, XS, type XCell, type XSheet } from '@/lib/xlsx';
import { ToolIcon } from '@/components/classroom/tool-icons';
import { FUND_HINTS, fmtMoney, ledgerSheet, parseMoney, todayVn, viDay, type Kind, type MoneyRow } from '@/lib/utils/money';

type Student = { id: string; name: string };
type Collection = { id: string; title: string; amount_per: number; due_on: string | null; created_at: string };
type Payment = { collection_id: string; student_id: string; amount: number; paid_on: string };
type Entry = { id: string; day: string; kind: Kind; amount: number; content: string; note: string };
const MISSING = 'Chưa bật Quỹ lớp: hãy chạy supabase/migrations/0052_teacher_money.sql trên Supabase.';
const dm = (iso: string) => `${iso.slice(8, 10)}/${iso.slice(5, 7)}`;

export default function ClassFund({ classId, className, students }: { classId: string; className: string; students: Student[] }) {
  const supabase = useMemo(() => { try { return createClient(); } catch { return null; } }, []);
  const [cols, setCols] = useState<Collection[]>([]);
  const [pays, setPays] = useState<Payment[]>([]);
  const [entries, setEntries] = useState<Entry[]>([]);
  const [state, setState] = useState<'loading' | 'ready' | 'missing'>('loading');
  const [tab, setTab] = useState<'collect' | 'book'>('collect');
  const [selId, setSelId] = useState<string | null>(null);
  const [onlyUnpaid, setOnlyUnpaid] = useState(false);
  const [msg, setMsg] = useState<{ kind: 'ok' | 'error'; text: string } | null>(null);
  const [busy, setBusy] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!supabase) { setState('missing'); return; }
    const [c, e] = await Promise.all([
      supabase.from('class_fund_collections').select('id, title, amount_per, due_on, created_at').eq('class_id', classId).order('created_at', { ascending: false }),
      supabase.from('class_fund_entries').select('id, day, kind, amount, content, note').eq('class_id', classId).order('day', { ascending: false }).order('created_at', { ascending: false }),
    ]);
    if (c.error || e.error) { setState('missing'); return; }
    const list = ((c.data ?? []) as Collection[]).map((x) => ({ ...x, amount_per: Number(x.amount_per) }));
    setCols(list);
    setEntries(((e.data ?? []) as Entry[]).map((x) => ({ ...x, amount: Number(x.amount) })));
    if (list.length) {
      const { data } = await supabase.from('class_fund_payments').select('collection_id, student_id, amount, paid_on').in('collection_id', list.map((x) => x.id));
      setPays(((data ?? []) as Payment[]).map((x) => ({ ...x, amount: Number(x.amount) })));
    } else setPays([]);
    setSelId((s) => (s && list.some((x) => x.id === s) ? s : list[0]?.id ?? null));
    setState('ready');
  }, [supabase, classId]);
  useEffect(() => { void load(); }, [load]);

  const ids = useMemo(() => new Set(students.map((s) => s.id)), [students]);
  const paysOf = (cid: string) => pays.filter((p) => p.collection_id === cid && ids.has(p.student_id));
  const statOf = (c: Collection) => {
    const ps = paysOf(c.id);
    const got = ps.reduce((a, p) => a + p.amount, 0);
    const full = ps.filter((p) => p.amount >= c.amount_per).length;
    return { got, full, need: Math.max(0, c.amount_per * students.length - got) };
  };
  const collected = pays.filter((p) => ids.has(p.student_id)).reduce((a, p) => a + p.amount, 0);
  const otherIn = entries.filter((e) => e.kind === 'thu').reduce((a, e) => a + e.amount, 0);
  const spent = entries.filter((e) => e.kind === 'chi').reduce((a, e) => a + e.amount, 0);
  const balance = collected + otherIn - spent;
  const owed = cols.reduce((a, c) => a + statOf(c).need, 0);
  const sel = cols.find((c) => c.id === selId) ?? null;

  const fail = (m: string) => setMsg({ kind: 'error', text: /relation|schema cache/i.test(m) ? MISSING : 'Chưa lưu được. Kiểm tra mạng rồi thử lại.' });
  const copy = async (text: string, ok: string) => { try { await navigator.clipboard.writeText(text); setMsg({ kind: 'ok', text: ok }); } catch { window.prompt('Chép nội dung dưới đây:', text); } };

  // ---- Khoản thu theo em ----
  const [nc, setNc] = useState({ title: '', amount: '', due: '' });
  const ncAmount = parseMoney(nc.amount);
  const addCollection = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!supabase || !nc.title.trim() || !ncAmount) return;
    setBusy('new');
    const { data, error } = await supabase.from('class_fund_collections').insert({ class_id: classId, title: nc.title.trim().slice(0, 80), amount_per: ncAmount, due_on: nc.due || null }).select('id').single();
    setBusy(null);
    if (error) { fail(error.message); return; }
    setNc({ title: '', amount: '', due: '' });
    setSelId((data as { id: string }).id);
    void load();
  };
  const setPaid = async (c: Collection, s: Student, amount: number | null) => {
    if (!supabase) return;
    setBusy(s.id);
    const { error } = amount === null
      ? await supabase.from('class_fund_payments').delete().eq('collection_id', c.id).eq('student_id', s.id)
      : await supabase.from('class_fund_payments').upsert({ collection_id: c.id, student_id: s.id, amount, paid_on: todayVn(), updated_at: new Date().toISOString() });
    setBusy(null);
    if (error) { fail(error.message); return; }
    setPays((ps) => {
      const rest = ps.filter((p) => !(p.collection_id === c.id && p.student_id === s.id));
      return amount === null ? rest : [...rest, { collection_id: c.id, student_id: s.id, amount, paid_on: todayVn() }];
    });
  };
  const partial = (c: Collection, s: Student, cur?: Payment) => {
    const v = window.prompt(`Số tiền ${s.name} đã nộp (vd 30k):`, cur ? String(cur.amount) : '');
    if (v === null) return;
    const n = parseMoney(v);
    if (!n) { setMsg({ kind: 'error', text: 'Số tiền chưa đúng.' }); return; }
    void setPaid(c, s, n);
  };
  const removeCollection = async (c: Collection) => {
    if (!supabase || !window.confirm(`Xoá khoản thu "${c.title}" và toàn bộ danh sách nộp của khoản này?`)) return;
    const { error } = await supabase.from('class_fund_collections').delete().eq('id', c.id);
    if (error) { fail(error.message); return; }
    void load();
  };
  const remindText = (c: Collection) => {
    const paid = new Map(paysOf(c.id).map((p) => [p.student_id, p.amount]));
    const unpaid = students.filter((s) => (paid.get(s.id) ?? 0) < c.amount_per);
    return `📌 Nhắc nộp "${c.title}" (${fmtMoney(c.amount_per)}/em${c.due_on ? `, hạn ${dm(c.due_on)}` : ''}).\nCòn ${unpaid.length} em chưa nộp đủ: ${unpaid.map((s) => { const g = paid.get(s.id); return g ? `${s.name} (còn ${fmtMoney(c.amount_per - g)})` : s.name; }).join(', ')}.\nPhụ huynh vui lòng gửi cô/thầy giúp ạ. Cảm ơn quý phụ huynh!`;
  };
  const reportText = () => {
    const lines = [`📒 CÔNG KHAI QUỸ LỚP ${className.toUpperCase()} (đến ngày ${viDay(todayVn())})`, '', `• Tổng thu: ${fmtMoney(collected + otherIn)}`];
    cols.forEach((c) => { const st = statOf(c); lines.push(`   - ${c.title}: ${st.full}/${students.length} em nộp đủ = ${fmtMoney(st.got)}`); });
    entries.filter((e) => e.kind === 'thu').forEach((e) => lines.push(`   - ${dm(e.day)} ${e.content}: ${fmtMoney(e.amount)}`));
    lines.push(`• Tổng chi: ${fmtMoney(spent)}`);
    [...entries].filter((e) => e.kind === 'chi').reverse().forEach((e) => lines.push(`   - ${dm(e.day)} ${e.content}: ${fmtMoney(e.amount)}`));
    lines.push(`• Tồn quỹ: ${fmtMoney(balance)}`, '', 'Mọi thắc mắc quý phụ huynh nhắn riêng cho cô/thầy. Trân trọng cảm ơn!');
    return lines.join('\n');
  };

  // ---- Sổ quỹ ----
  const [ne, setNe] = useState({ kind: 'chi' as Kind, amount: '', content: '', day: todayVn(), note: '' });
  const neAmount = parseMoney(ne.amount);
  const addEntry = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!supabase || !neAmount || !ne.content.trim()) return;
    setBusy('entry');
    const { error } = await supabase.from('class_fund_entries').insert({ class_id: classId, kind: ne.kind, amount: neAmount, content: ne.content.trim().slice(0, 120), day: ne.day, note: ne.note.trim().slice(0, 200) });
    setBusy(null);
    if (error) { fail(error.message); return; }
    setNe({ ...ne, amount: '', content: '', note: '' });
    void load();
  };
  const removeEntry = async (en: Entry) => {
    if (!supabase || !window.confirm(`Xoá "${en.content}" ${fmtMoney(en.amount)}?`)) return;
    await supabase.from('class_fund_entries').delete().eq('id', en.id);
    void load();
  };
  // Sổ quỹ gộp: tiền các em nộp (gộp theo khoản + ngày) và các dòng thu khác / chi
  const ledger: (MoneyRow & { auto?: boolean })[] = useMemo(() => {
    const agg = new Map<string, { day: string; title: string; n: number; amount: number }>();
    for (const p of pays) {
      if (!ids.has(p.student_id)) continue;
      const c = cols.find((x) => x.id === p.collection_id);
      if (!c) continue;
      const k = `${p.paid_on}|${c.id}`;
      const a = agg.get(k) ?? { day: p.paid_on, title: c.title, n: 0, amount: 0 };
      a.n += 1; a.amount += p.amount; agg.set(k, a);
    }
    const auto = [...agg.entries()].map(([k, a]) => ({ id: k, day: a.day, kind: 'thu' as Kind, amount: a.amount, content: `Thu ${a.title} (${a.n} em)`, note: '', auto: true }));
    return [...auto, ...entries].sort((a, b) => b.day.localeCompare(a.day));
  }, [pays, cols, entries, ids]);

  const excel = () => {
    const sheets: XSheet[] = [ledgerSheet(`Sổ quỹ lớp ${className}`, ledger, (r) => r.content ?? '')];
    for (const c of cols) {
      const paid = new Map(paysOf(c.id).map((p) => [p.student_id, p]));
      const rows: XCell[][] = [
        [{ v: `${c.title.toUpperCase()} — ${fmtMoney(c.amount_per)}/em`, s: XS.title }], [],
        ['STT', 'Họ và tên', 'Đã nộp (đ)', 'Ngày nộp', 'Còn thiếu (đ)'].map((v) => ({ v, s: XS.header })),
        ...students.map((s, i): XCell[] => { const p = paid.get(s.id); return [{ v: i + 1, s: XS.center }, { v: s.name, s: XS.text }, { v: p?.amount ?? 0, s: XS.text }, { v: p ? viDay(p.paid_on) : '', s: XS.center }, { v: Math.max(0, c.amount_per - (p?.amount ?? 0)), s: XS.text }]; }),
      ];
      sheets.push({ name: c.title.replace(/[\\/?*[\]:]/g, ' ').slice(0, 28) || 'Khoản thu', rows, merges: ['A1:E1'], cols: [6, 28, 14, 12, 14], freeze: { rows: 3, cols: 0 } });
    }
    downloadXlsx(`quy-lop-${className}.xlsx`, sheets);
  };

  if (state === 'missing') return <div className="ct"><p className="adm-alert is-warn">{MISSING}</p></div>;

  const selPaid = sel ? new Map(paysOf(sel.id).map((p) => [p.student_id, p])) : new Map<string, Payment>();
  const shown = sel && onlyUnpaid ? students.filter((s) => (selPaid.get(s.id)?.amount ?? 0) < sel.amount_per) : students;

  return (
    <div className="ct fd">
      <div className="ct-head">
        <div>
          <p className="ct-sub">Tiện ích · Lớp {className}</p>
          <h1><ToolIcon k="quy-lop" /> Quỹ lớp</h1>
        </div>
        <div className="ct-actions">
          <button type="button" className="btn btn-outline" onClick={() => copy(reportText(), 'Đã chép báo cáo công khai quỹ — dán vào nhóm Zalo phụ huynh.')} disabled={state !== 'ready'}><Megaphone aria-hidden="true" /> Chép báo cáo công khai</button>
          <button type="button" className="btn btn-outline" onClick={excel} disabled={state !== 'ready'}><Download aria-hidden="true" /> Tải sổ quỹ Excel</button>
        </div>
      </div>

      <div className="mn-tiles is-4">
        <div className="mn-tile is-thu"><small>Đã thu</small><b>{fmtMoney(collected + otherIn)}</b></div>
        <div className="mn-tile is-chi"><small>Đã chi</small><b>{fmtMoney(spent)}</b></div>
        <div className={`mn-tile ${balance >= 0 ? 'is-pos' : 'is-neg'}`}><small>Tồn quỹ</small><b>{balance < 0 ? '−' : ''}{fmtMoney(Math.abs(balance))}</b></div>
        <div className="mn-tile is-owed"><small>Còn phải thu</small><b>{fmtMoney(owed)}</b></div>
      </div>

      {msg && <p className={`adm-alert ${msg.kind === 'ok' ? 'is-ok' : 'is-error'}`} role="status">{msg.text}</p>}

      <div className="ct-seg fd-tabs" role="tablist">
        <button type="button" role="tab" aria-selected={tab === 'collect'} className={tab === 'collect' ? 'is-on' : ''} onClick={() => setTab('collect')}>Khoản thu theo em</button>
        <button type="button" role="tab" aria-selected={tab === 'book'} className={tab === 'book' ? 'is-on' : ''} onClick={() => setTab('book')}>Sổ quỹ (thu khác, chi)</button>
      </div>

      {state === 'loading' ? <p className="ct-hint">Đang tải…</p> : tab === 'collect' ? (
        <div className="fd-cols">
          <div className="fd-side">
            <ul className="fd-list">
              {cols.map((c) => {
                const st = statOf(c);
                return (
                  <li key={c.id}>
                    <button type="button" className={`fd-col${c.id === selId ? ' is-on' : ''}`} onClick={() => setSelId(c.id)}>
                      <b>{c.title}</b>
                      <small>{fmtMoney(c.amount_per)}/em{c.due_on ? ` · hạn ${dm(c.due_on)}` : ''}</small>
                      <span className="fd-prog"><i style={{ width: `${students.length ? (st.full / students.length) * 100 : 0}%` }} /></span>
                      <small><b>{st.full}/{students.length}</b> em nộp đủ · {fmtMoney(st.got)}</small>
                    </button>
                  </li>
                );
              })}
            </ul>
            <form className="card fd-new" onSubmit={addCollection}>
              <h2><Plus aria-hidden="true" /> Khoản thu mới</h2>
              <input value={nc.title} onChange={(e) => setNc({ ...nc, title: e.target.value })} placeholder="Tên khoản: Quỹ lớp HK1, Tiền nước…" maxLength={80} aria-label="Tên khoản thu" />
              <div className="mn-row2">
                <input value={nc.amount} onChange={(e) => setNc({ ...nc, amount: e.target.value })} placeholder="Mỗi em: 50k" aria-label="Số tiền mỗi em" />
                <input type="date" value={nc.due} onChange={(e) => setNc({ ...nc, due: e.target.value })} aria-label="Hạn nộp" title="Hạn nộp (không bắt buộc)" />
              </div>
              {nc.amount && <small className={ncAmount ? 'ct-hint' : 'is-bad'}>{ncAmount ? `${fmtMoney(ncAmount)}/em × ${students.length} em = ${fmtMoney(ncAmount * students.length)}` : 'Số tiền chưa đúng'}</small>}
              <button type="submit" className="btn btn-primary btn-sm" disabled={busy === 'new' || !nc.title.trim() || !ncAmount}>Tạo khoản thu</button>
            </form>
          </div>

          <section className="card fd-detail">
            {!sel ? <p className="ct-hint">Tạo khoản thu đầu tiên (ví dụ “Quỹ lớp HK1 · 50k/em”) rồi bấm tên từng em khi các em nộp.</p> : (
              <>
                <div className="fd-dhead">
                  <div>
                    <h2>{sel.title}</h2>
                    <p className="ct-hint">{fmtMoney(sel.amount_per)}/em{sel.due_on ? ` · hạn ${viDay(sel.due_on)}` : ''} · bấm vào em để ghi “đã nộp đủ”</p>
                  </div>
                  <div className="fd-dacts">
                    <button type="button" className="mini-btn" onClick={() => copy(remindText(sel), 'Đã chép tin nhắc — dán vào nhóm Zalo phụ huynh.')}><Copy aria-hidden="true" /> Chép tin nhắc</button>
                    <button type="button" className={`mini-btn${onlyUnpaid ? ' is-primary' : ''}`} onClick={() => setOnlyUnpaid((v) => !v)} aria-pressed={onlyUnpaid}>Chỉ em chưa nộp</button>
                    <button type="button" className="mini-btn is-danger" onClick={() => removeCollection(sel)} aria-label={`Xoá khoản ${sel.title}`}><Trash2 aria-hidden="true" /></button>
                  </div>
                </div>
                <ul className="fd-kids">
                  {shown.map((s) => {
                    const p = selPaid.get(s.id);
                    const full = p && p.amount >= sel.amount_per;
                    return (
                      <li key={s.id} className={full ? 'is-paid' : p ? 'is-part' : ''}>
                        <button type="button" className="fd-kid" disabled={busy === s.id} onClick={() => (p ? partial(sel, s, p) : setPaid(sel, s, sel.amount_per))}
                          title={p ? 'Bấm để sửa số tiền' : 'Bấm để ghi đã nộp đủ'}>
                          <span className="fd-tick" aria-hidden="true">{full ? <Check /> : p ? '½' : ''}</span>
                          <span className="fd-name">{s.name}</span>
                          <small>{p ? `${fmtMoney(p.amount)} · ${dm(p.paid_on)}${full ? '' : ` · thiếu ${fmtMoney(sel.amount_per - p.amount)}`}` : 'Chưa nộp'}</small>
                        </button>
                        {p ? <button type="button" className="ct-x" onClick={() => setPaid(sel, s, null)} aria-label={`Bỏ ghi nộp của ${s.name}`} title="Bỏ ghi nộp"><Undo2 aria-hidden="true" /></button>
                          : <button type="button" className="ct-x fd-part" onClick={() => partial(sel, s)} aria-label={`Ghi ${s.name} nộp một phần`} title="Nộp một phần">½</button>}
                      </li>
                    );
                  })}
                </ul>
                {shown.length === 0 && <p className="ct-hint">Cả lớp đã nộp đủ. 🎉</p>}
              </>
            )}
          </section>
        </div>
      ) : (
        <div className="fd-cols">
          <form className="card mn-form" onSubmit={addEntry}>
            <h2>Ghi sổ quỹ</h2>
            <div className="mn-kind" role="radiogroup" aria-label="Loại">
              {(['chi', 'thu'] as Kind[]).map((k) => (
                <button key={k} type="button" role="radio" aria-checked={ne.kind === k} className={ne.kind === k ? `is-on is-${k}` : ''} onClick={() => setNe({ ...ne, kind: k })}>{k === 'chi' ? '− Chi quỹ' : '+ Thu khác'}</button>
              ))}
            </div>
            <input value={ne.content} onChange={(e) => setNe({ ...ne, content: e.target.value })} placeholder={ne.kind === 'chi' ? 'Nội dung: Mua phần thưởng…' : 'Nội dung: Phụ huynh ủng hộ…'} list="fd-hints" maxLength={120} aria-label="Nội dung" />
            <datalist id="fd-hints">{FUND_HINTS.map((h) => <option key={h} value={h} />)}</datalist>
            <div className="mn-row2">
              <input value={ne.amount} onChange={(e) => setNe({ ...ne, amount: e.target.value })} placeholder="Số tiền: 300k" aria-label="Số tiền" />
              <input type="date" value={ne.day} onChange={(e) => setNe({ ...ne, day: e.target.value || todayVn() })} aria-label="Ngày" />
            </div>
            {ne.amount && <small className={neAmount ? 'ct-hint' : 'is-bad'}>{neAmount ? `= ${fmtMoney(neAmount)}` : 'Số tiền chưa đúng'}</small>}
            <input value={ne.note} onChange={(e) => setNe({ ...ne, note: e.target.value })} placeholder="Ghi chú: người mua, hoá đơn… (không bắt buộc)" maxLength={200} aria-label="Ghi chú" />
            <button type="submit" className="btn btn-primary btn-sm" disabled={busy === 'entry' || !neAmount || !ne.content.trim()}>Ghi vào sổ</button>
          </form>

          <section className="card fd-book">
            <h2>Sổ quỹ</h2>
            {ledger.length === 0 ? <p className="ct-hint">Sổ quỹ còn trống. Tiền các em nộp ở “Khoản thu theo em” tự vào sổ.</p> : (
              <div className="table-scroll">
                <table className="roster-table fd-table">
                  <thead><tr><th>Ngày</th><th>Nội dung</th><th className="is-num">Thu</th><th className="is-num">Chi</th><th><span className="sr-only">Xoá</span></th></tr></thead>
                  <tbody>
                    {ledger.map((r) => (
                      <tr key={r.id}>
                        <td>{viDay(r.day)}</td>
                        <td className="fd-content">{r.content}{r.note && <small>{r.note}</small>}</td>
                        <td className="is-num is-thu">{r.kind === 'thu' ? fmtMoney(r.amount) : ''}</td>
                        <td className="is-num is-chi">{r.kind === 'chi' ? fmtMoney(r.amount) : ''}</td>
                        <td>{!r.auto && <button type="button" className="ct-x" onClick={() => removeEntry(r as Entry)} aria-label={`Xoá ${r.content}`}><Trash2 aria-hidden="true" /></button>}</td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot><tr><th colSpan={2}>Cộng · tồn quỹ {fmtMoney(balance)}</th><th className="is-num">{fmtMoney(collected + otherIn)}</th><th className="is-num">{fmtMoney(spent)}</th><th /></tr></tfoot>
                </table>
              </div>
            )}
          </section>
        </div>
      )}
    </div>
  );
}
