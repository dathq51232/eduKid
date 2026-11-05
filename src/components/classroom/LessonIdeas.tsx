'use client';

// Bảng "Gợi ý ý tưởng dạy" cho một tiết: AI gợi ý 3 ý tưởng cho mỗi hoạt động (gọi /api/ai/lesson-ideas).
// Kết quả lưu trên máy theo môn + tên bài → mở lại không tốn lượt AI. Thời lượng, tình trạng lớp, bộ lọc
// chỉ sắp xếp / làm mờ trên máy.
import { useEffect, useMemo, useState } from 'react';
import { RefreshCw, Sparkles, X } from 'lucide-react';
import type { LessonIdea } from '@/app/api/ai/lesson-ideas/route';

type Phase = 'kd' | 'kp' | 'lt' | 'vd';
type Data = { goal: string; ideas: Record<Phase, LessonIdea[]> };
const PHASES: { k: Phase; n: string; r: number; c: string }[] = [
  { k: 'kd', n: 'Khởi động', r: 0.14, c: '#ff9f43' },
  { k: 'kp', n: 'Khám phá', r: 0.34, c: '#5b8cff' },
  { k: 'lt', n: 'Luyện tập', r: 0.34, c: '#3ecf8e' },
  { k: 'vd', n: 'Vận dụng', r: 0.18, c: '#c56cf0' },
];
const KEY = 'li:v1:';
const readCache = (k: string): Data | null => { try { const v = localStorage.getItem(KEY + k); return v ? JSON.parse(v) as Data : null; } catch { return null; } };
const writeCache = (k: string, d: Data) => { try { localStorage.setItem(KEY + k, JSON.stringify(d)); } catch { /* bỏ qua */ } };

function split(dur: number) {
  const a = PHASES.map((p) => Math.round(p.r * dur));
  a[1] += dur - a.reduce((x, y) => x + y, 0);
  return a;
}

export default function LessonIdeas({ subject, title, saved, onClose }: { subject: string; title: string; saved: boolean; onClose: () => void }) {
  const cacheKey = `${subject}|${title}`.toLowerCase();
  const [data, setData] = useState<Data | null>(null);
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);
  const [dur, setDur] = useState(35);
  const [mood, setMood] = useState<'calm' | 'norm' | 'low'>('norm');
  const [noPrep, setNoPrep] = useState(false);
  const [sel, setSel] = useState<Partial<Record<Phase, number>>>({});
  const [open, setOpen] = useState<string>('');

  async function load(force = false) {
    if (!force) { const c = readCache(cacheKey); if (c) { setData(c); return; } }
    setBusy(true); setErr('');
    try {
      const res = await fetch('/api/ai/lesson-ideas', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ subject, title, minutes: dur }) });
      const j = await res.json();
      if (!res.ok) throw new Error(j.error || 'Lỗi');
      setData(j as Data); writeCache(cacheKey, j as Data); setSel({});
    } catch (e) { setErr(e instanceof Error ? e.message : 'Lỗi'); }
    finally { setBusy(false); }
  }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { load(); }, [cacheKey]);
  useEffect(() => { const f = (e: KeyboardEvent) => e.key === 'Escape' && onClose(); addEventListener('keydown', f); return () => removeEventListener('keydown', f); }, [onClose]);

  const pm = useMemo(() => split(dur), [dur]);
  const score = (x: LessonIdea) => (mood === 'calm' ? 4 - x.e : mood === 'low' ? x.e : 2 - Math.abs(2 - x.e));
  let total = 0, n = 0;
  if (data) PHASES.forEach((p) => { const i = sel[p.k]; if (i != null && data.ideas[p.k][i]) { total += data.ideas[p.k][i].m; n++; } });

  function autoPick() {
    if (!data) return;
    const s: Partial<Record<Phase, number>> = {};
    PHASES.forEach((p, k) => {
      const list = data.ideas[p.k].map((x, i) => ({ x, i }));
      const ok = list.filter((o) => o.x.m <= pm[k] && (!noPrep || !o.x.p)).sort((a, b) => score(b.x) - score(a.x) || b.x.m - a.x.m);
      s[p.k] = (ok[0] ?? list.sort((a, b) => a.x.m - b.x.m)[0])?.i;
    });
    setSel(s);
  }

  return (
    <div className="li-ov" onClick={onClose}>
      <aside className="li-dr" onClick={(e) => e.stopPropagation()} role="dialog" aria-label="Gợi ý ý tưởng dạy">
        <header className="li-hd">
          <div><b>{subject} · {title}</b><small>{saved ? 'Đã có giáo án' : 'Chưa có giáo án — gợi ý theo tên bài'}{data?.goal ? ` · ${data.goal}` : ''}</small></div>
          <button className="li-x" onClick={onClose} aria-label="Đóng"><X size={18} /></button>
        </header>
        <div className="li-ctl">
          <span className="li-seg">{[30, 35, 40].map((d) => <button key={d} className={dur === d ? 'on' : ''} onClick={() => setDur(d)}>{d}′</button>)}</span>
          <span className="li-seg">{([['calm', 'Cần trật tự'], ['norm', 'Bình thường'], ['low', 'Uể oải']] as const).map(([k, l]) => <button key={k} className={mood === k ? 'on' : ''} onClick={() => setMood(k)}>{l}</button>)}</span>
          <button className={`li-chip${noPrep ? ' on' : ''}`} onClick={() => setNoPrep(!noPrep)}>⚡ Không cần chuẩn bị</button>
          <button className="li-chip" onClick={() => load(true)} disabled={busy} title="Gọi AI gợi ý bộ khác (tốn 1 lượt)"><RefreshCw size={13} /> Gợi ý khác</button>
        </div>
        <div className="li-tl">{PHASES.map((p, k) => <span key={p.k} style={{ flex: pm[k], background: p.c }}>{p.n} · {pm[k]}′</span>)}</div>
        <div className="li-body">
          {busy && <p className="li-msg">✨ AI đang nghĩ ý tưởng…</p>}
          {err && <p className="li-msg is-err">{err} <button onClick={() => load(true)}>Thử lại</button></p>}
          {data && PHASES.map((p, k) => (
            <section key={p.k}>
              <h4><i style={{ background: p.c }} />{p.n}<em>{pm[k]} phút</em></h4>
              <div className="li-grid">
                {data.ideas[p.k].map((x, i) => [x, i] as const).sort((a, b) => score(b[0]) - score(a[0])).map(([x, i]) => {
                  const over = x.m > pm[k], dim = over || (noPrep && x.p > 0), on = sel[p.k] === i, id = `${p.k}${i}`;
                  return (
                    <div key={i} className={`li-card${on ? ' on' : ''}${dim && !on ? ' dim' : ''}`} onClick={() => setSel({ ...sel, [p.k]: on ? undefined : i })}>
                      <b>{x.t}</b>
                      <div className="li-tags">
                        <span className={over ? 'over' : ''}>⏱ {x.m}′{over ? ` · vượt ${x.m - pm[k]}′` : ''}</span>
                        <span>{x.p ? `🧰 ${x.p}′` : '⚡ Không chuẩn bị'}</span>
                        {x.mv ? <span>🏃 Vận động</span> : null}
                        <span>{x.g ? '👥 Nhóm' : '🙋 Cả lớp'}</span>
                      </div>
                      <p>{x.d}</p>
                      {open === id && <><ol>{x.s.map((s, j) => <li key={j}>{s}</li>)}</ol>{x.w && <p className="li-why">🎯 {x.w}</p>}</>}
                      <button className="li-more" onClick={(e) => { e.stopPropagation(); setOpen(open === id ? '' : id); }}>{open === id ? 'Thu gọn ▴' : 'Cách tổ chức ▾'}</button>
                    </div>
                  );
                })}
              </div>
            </section>
          ))}
        </div>
        <footer className="li-ft">
          <span>Đã chọn <b>{n}/4</b> · <b className={total > dur ? 'is-err' : ''}>{total}/{dur} phút</b>
            <i className="li-bar"><i style={{ width: `${Math.min(100, (total / dur) * 100)}%` }} className={total > dur ? 'over' : ''} /></i></span>
          <button className="btn btn-outline" onClick={autoPick} disabled={!data}><Sparkles size={15} /> Tự chọn giúp tôi</button>
        </footer>
      </aside>
    </div>
  );
}
