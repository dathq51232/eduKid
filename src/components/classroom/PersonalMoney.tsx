'use client';

// Thu chi cá nhân của giáo viên (migration 0052, bảng teacher_money): chỉ chính thầy cô đọc/ghi được.
// Ghi nhanh: gõ "50k", "1tr2"… chọn danh mục rồi Enter. Xem theo tháng: tổng thu, chi, còn lại, chi theo danh mục.
import { useCallback, useEffect, useMemo, useState } from 'react';
import { ChevronLeft, ChevronRight, Download, Eye, EyeOff, Lock, Pencil, Trash2, X } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { downloadXlsx } from '@/lib/xlsx';
import { ToolIcon } from '@/components/classroom/tool-icons';
import { PERSONAL_CATS, catIcon, fmtMoney, ledgerSheet, parseMoney, todayVn, viDay, type Kind, type MoneyRow } from '@/lib/utils/money';
import { WEEKDAYS } from '@/lib/utils/lunar';

const MISSING = 'Chưa bật Sổ thu chi: hãy chạy supabase/migrations/0052_teacher_money.sql trên Supabase.';
const HIDE_KEY = 'gv-an-tien';
const QUICK = [20_000, 50_000, 100_000, 200_000, 500_000];
type Row = MoneyRow & { category: string };
type Draft = { id: string | null; kind: Kind; amount: string; category: string; note: string; day: string };
const blank = (kind: Kind = 'chi'): Draft => ({ id: null, kind, amount: '', category: PERSONAL_CATS[kind][0].name, note: '', day: todayVn() });

export default function PersonalMoney() {
  const supabase = useMemo(() => { try { return createClient(); } catch { return null; } }, []);
  const now = todayVn();
  const [ym, setYm] = useState(now.slice(0, 7));
  const [rows, setRows] = useState<Row[]>([]);
  const [state, setState] = useState<'loading' | 'ready' | 'missing'>('loading');
  const [draft, setDraft] = useState<Draft>(blank());
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');
  const [hide, setHide] = useState(false);
  useEffect(() => { try { setHide(localStorage.getItem(HIDE_KEY) === '1'); } catch { /* bỏ qua */ } }, []);
  const toggleHide = () => setHide((h) => { try { localStorage.setItem(HIDE_KEY, h ? '0' : '1'); } catch { /* bỏ qua */ } return !h; });
  const money = (n: number) => (hide ? '••••••' : fmtMoney(n));

  const load = useCallback(async () => {
    if (!supabase) { setState('missing'); return; }
    const [y, m] = ym.split('-').map(Number);
    const end = new Date(Date.UTC(y, m, 0)).toISOString().slice(0, 10);
    const { data, error } = await supabase.from('teacher_money').select('id, day, kind, amount, category, note')
      .gte('day', `${ym}-01`).lte('day', end).order('day', { ascending: false }).order('created_at', { ascending: false });
    if (error) { setState('missing'); return; }
    setRows(((data ?? []) as Row[]).map((r) => ({ ...r, amount: Number(r.amount) })));
    setState('ready');
  }, [supabase, ym]);
  useEffect(() => { void load(); }, [load]);

  const amount = parseMoney(draft.amount);
  const save = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!supabase) return;
    if (!amount) { setErr('Số tiền chưa đúng (ví dụ: 50k, 1tr2, 150000).'); return; }
    setBusy(true); setErr('');
    const rec = { day: draft.day, kind: draft.kind, amount, category: draft.category, note: draft.note.trim().slice(0, 200) };
    const { error } = draft.id ? await supabase.from('teacher_money').update(rec).eq('id', draft.id) : await supabase.from('teacher_money').insert(rec);
    setBusy(false);
    if (error) { setErr(/relation|schema cache/i.test(error.message) ? MISSING : 'Chưa lưu được. Kiểm tra mạng rồi thử lại.'); return; }
    if (draft.day.slice(0, 7) !== ym) setYm(draft.day.slice(0, 7)); else void load();
    setDraft({ ...blank(draft.kind), category: draft.category, day: draft.day });
  };
  const remove = async (r: Row) => {
    if (!supabase || !window.confirm(`Xoá khoản ${r.kind} ${fmtMoney(r.amount)} (${r.category})?`)) return;
    await supabase.from('teacher_money').delete().eq('id', r.id);
    void load();
  };

  const thu = rows.filter((r) => r.kind === 'thu').reduce((a, r) => a + r.amount, 0);
  const chi = rows.filter((r) => r.kind === 'chi').reduce((a, r) => a + r.amount, 0);
  const byCat = useMemo(() => {
    const m = new Map<string, number>();
    rows.filter((r) => r.kind === 'chi').forEach((r) => m.set(r.category, (m.get(r.category) ?? 0) + r.amount));
    return [...m.entries()].sort((a, b) => b[1] - a[1]);
  }, [rows]);
  const byDay = useMemo(() => {
    const m = new Map<string, Row[]>();
    rows.forEach((r) => m.set(r.day, [...(m.get(r.day) ?? []), r]));
    return [...m.entries()];
  }, [rows]);
  const [y, mo] = ym.split('-').map(Number);
  const move = (d: number) => { const t = new Date(Date.UTC(y, mo - 1 + d, 1)); setYm(t.toISOString().slice(0, 7)); };

  if (state === 'missing') return <div className="ct"><p className="adm-alert is-warn">{MISSING}</p></div>;

  return (
    <div className="ct mn">
      <div className="ct-head">
        <div>
          <p className="ct-sub"><Lock aria-hidden="true" /> Tiện ích · chỉ mình thầy cô xem được</p>
          <h1><ToolIcon k="thu-chi" /> Thu chi cá nhân</h1>
        </div>
        <div className="ct-actions">
          <button type="button" className="btn btn-outline" onClick={toggleHide} aria-pressed={hide}>{hide ? <><Eye aria-hidden="true" /> Hiện số tiền</> : <><EyeOff aria-hidden="true" /> Ẩn khi chiếu</>}</button>
          <button type="button" className="btn btn-outline" disabled={!rows.length}
            onClick={() => downloadXlsx(`thu-chi-${ym}.xlsx`, [ledgerSheet(`Sổ thu chi tháng ${mo}/${y}`, rows, (r) => `${r.category}${r.note ? ` — ${r.note}` : ''}`)])}>
            <Download aria-hidden="true" /> Tải Excel
          </button>
        </div>
      </div>

      <div className="mn-month">
        <button type="button" className="ct-week" onClick={() => move(-1)} aria-label="Tháng trước"><ChevronLeft aria-hidden="true" /></button>
        <b>Tháng {mo}/{y}</b>
        <button type="button" className="ct-week" onClick={() => move(1)} aria-label="Tháng sau" disabled={ym >= now.slice(0, 7)}><ChevronRight aria-hidden="true" /></button>
      </div>

      <div className="mn-tiles">
        <div className="mn-tile is-thu"><small>Thu</small><b>{money(thu)}</b></div>
        <div className="mn-tile is-chi"><small>Chi</small><b>{money(chi)}</b></div>
        <div className={`mn-tile ${thu - chi >= 0 ? 'is-pos' : 'is-neg'}`}><small>Còn lại</small><b>{hide ? '••••••' : `${thu - chi < 0 ? '−' : ''}${fmtMoney(Math.abs(thu - chi))}`}</b></div>
      </div>

      <div className="mn-cols">
        <form className="card mn-form" onSubmit={save}>
          <div className="mn-form-hd">
            <h2>{draft.id ? 'Sửa khoản' : 'Ghi nhanh'}</h2>
            {draft.id && <button type="button" className="ct-x" onClick={() => setDraft(blank(draft.kind))} aria-label="Huỷ sửa"><X aria-hidden="true" /></button>}
          </div>
          <div className="mn-kind" role="radiogroup" aria-label="Loại">
            {(['chi', 'thu'] as Kind[]).map((k) => (
              <button key={k} type="button" role="radio" aria-checked={draft.kind === k} className={draft.kind === k ? `is-on is-${k}` : ''}
                onClick={() => setDraft({ ...draft, kind: k, category: PERSONAL_CATS[k][0].name })}>{k === 'chi' ? '− Chi' : '+ Thu'}</button>
            ))}
          </div>
          <label className="mn-amount">
            <span className="sr-only">Số tiền</span>
            <input value={draft.amount} onChange={(e) => setDraft({ ...draft, amount: e.target.value })} placeholder="Số tiền: 50k, 1tr2…" inputMode="text" autoComplete="off" autoFocus />
            <small className={draft.amount && !amount ? 'is-bad' : ''}>{draft.amount ? (amount ? `= ${fmtMoney(amount)}` : 'chưa hiểu số tiền') : 'gõ 50k = 50.000đ, 1tr2 = 1.200.000đ'}</small>
          </label>
          <div className="mn-quick">{QUICK.map((q) => <button key={q} type="button" onClick={() => setDraft({ ...draft, amount: String(q / 1000) + 'k' })}>{q / 1000}k</button>)}</div>
          <div className="mn-cats" role="radiogroup" aria-label="Danh mục">
            {PERSONAL_CATS[draft.kind].map((c) => (
              <button key={c.name} type="button" role="radio" aria-checked={draft.category === c.name} className={draft.category === c.name ? 'is-on' : ''} onClick={() => setDraft({ ...draft, category: c.name })}>
                <span aria-hidden="true">{c.icon}</span> {c.name}
              </button>
            ))}
          </div>
          <div className="mn-row2">
            <input value={draft.note} onChange={(e) => setDraft({ ...draft, note: e.target.value })} placeholder="Ghi chú (không bắt buộc)" maxLength={200} aria-label="Ghi chú" />
            <input type="date" value={draft.day} max={now} onChange={(e) => setDraft({ ...draft, day: e.target.value || now })} aria-label="Ngày" />
          </div>
          {err && <p className="adm-alert is-error" role="alert">{err}</p>}
          <button type="submit" className="btn btn-primary" disabled={busy || !amount}>{busy ? 'Đang lưu…' : draft.id ? 'Lưu thay đổi' : `Ghi khoản ${draft.kind}`}</button>
        </form>

        <section className="card mn-cat">
          <h2>Chi theo danh mục</h2>
          {byCat.length === 0 ? <p className="ct-hint">Tháng này chưa có khoản chi.</p> : (
            <ul className="mn-bars">
              {byCat.map(([name, v]) => (
                <li key={name}>
                  <span className="mn-bar-l"><span aria-hidden="true">{catIcon('chi', name)}</span> {name}</span>
                  <span className="mn-bar-v">{money(v)} <small>{Math.round((v / chi) * 100)}%</small></span>
                  <i style={{ width: `${(v / byCat[0][1]) * 100}%` }} />
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>

      <section className="card mn-list">
        <h2>Các khoản trong tháng</h2>
        {state === 'loading' ? <p className="ct-hint">Đang tải…</p> : byDay.length === 0 ? <p className="ct-hint">Chưa có khoản nào trong tháng {mo}/{y}.</p> : byDay.map(([day, list]) => {
          const net = list.reduce((a, r) => a + (r.kind === 'thu' ? r.amount : -r.amount), 0);
          return (
            <div key={day} className="mn-day">
              <p className="mn-day-hd"><b>{WEEKDAYS[new Date(`${day}T00:00:00Z`).getUTCDay()]}, {viDay(day)}</b><span className={net >= 0 ? 'is-thu' : 'is-chi'}>{hide ? '' : `${net >= 0 ? '+' : '−'}${fmtMoney(Math.abs(net))}`}</span></p>
              <ul>
                {list.map((r) => (
                  <li key={r.id} className={`mn-item is-${r.kind}`}>
                    <span className="mn-ic" aria-hidden="true">{catIcon(r.kind, r.category)}</span>
                    <span className="mn-txt"><b>{r.category}</b>{r.note && <small>{r.note}</small>}</span>
                    <b className="mn-amt">{hide ? '••••' : `${r.kind === 'thu' ? '+' : '−'}${fmtMoney(r.amount)}`}</b>
                    <button type="button" className="ct-x" onClick={() => setDraft({ id: r.id, kind: r.kind, amount: String(r.amount), category: r.category, note: r.note, day: r.day })} aria-label="Sửa"><Pencil aria-hidden="true" /></button>
                    <button type="button" className="ct-x" onClick={() => remove(r)} aria-label="Xoá"><Trash2 aria-hidden="true" /></button>
                  </li>
                ))}
              </ul>
            </div>
          );
        })}
      </section>
    </div>
  );
}
