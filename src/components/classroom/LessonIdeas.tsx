'use client';

// Bảng "Gợi ý ý tưởng dạy" cho một tiết, lấy từ ngân hàng ý tưởng viết sẵn (src/lib/plans/idea-bank.ts) — không dùng AI.
// Thời lượng, tình trạng lớp, bộ lọc chỉ sắp xếp / làm mờ trên máy.
import { useEffect, useMemo, useState } from 'react';
import { Sparkles, X } from 'lucide-react';
import { ideasFor, type LessonIdea, type Phase } from '@/lib/plans/idea-bank';

const PHASES: { k: Phase; n: string; r: number; c: string }[] = [
  { k: 'kd', n: 'Khởi động', r: 0.14, c: '#ff9f43' },
  { k: 'kp', n: 'Khám phá', r: 0.34, c: '#5b8cff' },
  { k: 'lt', n: 'Luyện tập', r: 0.34, c: '#3ecf8e' },
  { k: 'vd', n: 'Vận dụng', r: 0.18, c: '#c56cf0' },
];
function split(dur: number) {
  const a = PHASES.map((p) => Math.round(p.r * dur));
  a[1] += dur - a.reduce((x, y) => x + y, 0);
  return a;
}

export default function LessonIdeas({ subject, title, saved, onClose }: { subject: string; title: string; saved: boolean; onClose: () => void }) {
  const data = useMemo(() => ideasFor(subject, title), [subject, title]);
  const [dur, setDur] = useState(35);
  const [mood, setMood] = useState<'calm' | 'norm' | 'low'>('norm');
  const [noPrep, setNoPrep] = useState(false);
  const [sel, setSel] = useState<Partial<Record<Phase, number>>>({});
  const [open, setOpen] = useState<string>('');
  const [edit, setEdit] = useState<Partial<Record<Phase, boolean>>>({}); // hoạt động đang mở lại để đổi ý tưởng

  useEffect(() => { const f = (e: KeyboardEvent) => e.key === 'Escape' && onClose(); addEventListener('keydown', f); return () => removeEventListener('keydown', f); }, [onClose]);

  const pm = useMemo(() => split(dur), [dur]);
  const score = (x: LessonIdea) => (mood === 'calm' ? 4 - x.e : mood === 'low' ? x.e : 2 - Math.abs(2 - x.e));
  let total = 0, n = 0;
  PHASES.forEach((p) => { const i = sel[p.k]; if (i != null && data.ideas[p.k][i]) { total += data.ideas[p.k][i].m; n++; } });

  const starts: number[] = [];
  PHASES.reduce((t, p, k) => { starts.push(t); const i = sel[p.k]; return t + (i != null ? data.ideas[p.k][i].m : pm[k]); }, 0);

  function autoPick() {
    const s: Partial<Record<Phase, number>> = {};
    PHASES.forEach((p, k) => {
      const list = data.ideas[p.k].map((x, i) => ({ x, i }));
      const ok = list.filter((o) => o.x.m <= pm[k] && (!noPrep || !o.x.p)).sort((a, b) => score(b.x) - score(a.x) || b.x.m - a.x.m);
      s[p.k] = (ok[0] ?? list.sort((a, b) => a.x.m - b.x.m)[0])?.i;
    });
    setSel(s); setEdit({});
  }

  return (
    <div className="li-ov" onClick={onClose}>
      <aside className="li-dr" onClick={(e) => e.stopPropagation()} role="dialog" aria-label="Gợi ý ý tưởng dạy">
        <header className="li-hd">
          <div><b>{subject} · {title}</b><small>{saved ? 'Đã có giáo án' : 'Chưa có giáo án — gợi ý theo tên bài'}</small></div>
          <button className="li-x" onClick={onClose} aria-label="Đóng"><X size={18} /></button>
        </header>
        <div className="li-ctl">
          <span className="li-seg">{[30, 35, 40].map((d) => <button key={d} className={dur === d ? 'on' : ''} onClick={() => setDur(d)}>{d}′</button>)}
            <input className="li-num" type="number" min={15} max={90} value={dur} aria-label="Số phút của tiết"
              onChange={(e) => { const v = Math.round(Number(e.target.value)); if (v >= 15 && v <= 90) setDur(v); }} />phút</span>
          <span className="li-seg">{([['calm', 'Cần trật tự'], ['norm', 'Bình thường'], ['low', 'Uể oải']] as const).map(([k, l]) => <button key={k} className={mood === k ? 'on' : ''} onClick={() => setMood(k)}>{l}</button>)}</span>
          <button className={`li-chip${noPrep ? ' on' : ''}`} onClick={() => setNoPrep(!noPrep)}>⚡ Không cần chuẩn bị</button>
        </div>
        <div className="li-tl">{PHASES.map((p, k) => <span key={p.k} style={{ flex: pm[k], background: p.c }}>{p.n} · {pm[k]}′</span>)}</div>
        <div className="li-body">
          {PHASES.map((p, k) => {
            const ci = sel[p.k], chosen = ci != null ? data.ideas[p.k][ci] : null;
            if (chosen && !edit[p.k]) return (
              <section key={p.k} className="li-row" style={{ borderColor: p.c }}>
                <span className="li-time">{starts[k]}′–{starts[k] + chosen.m}′</span>
                <div className="li-rowb">
                  <small style={{ color: p.c }}>{p.n}</small>
                  <b>{chosen.t}</b>
                  <ol>{chosen.s.map((s, j) => <li key={j}>{s}</li>)}</ol>
                  {chosen.p > 0 && <em>🧰 Chuẩn bị trước {chosen.p}′</em>}
                </div>
                <button className="li-chip" onClick={() => setEdit({ ...edit, [p.k]: true })}>Đổi</button>
              </section>
            );
            return (
            <section key={p.k}>
              <h4><i style={{ background: p.c }} />{p.n}<em>{pm[k]} phút</em></h4>
              <div className="li-grid">
                {data.ideas[p.k].map((x, i) => [x, i] as const).sort((a, b) => score(b[0]) - score(a[0])).map(([x, i]) => {
                  const over = x.m > pm[k], dim = over || (noPrep && x.p > 0), on = ci === i, id = `${p.k}${i}`;
                  return (
                    <div key={i} className={`li-card${on ? ' on' : ''}${dim && !on ? ' dim' : ''}`} onClick={() => { setSel({ ...sel, [p.k]: on ? undefined : i }); setEdit({ ...edit, [p.k]: false }); }}>
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
            );
          })}
        </div>
        <footer className="li-ft">
          <span>Đã chọn <b>{n}/4</b> · <b className={total > dur ? 'is-err' : ''}>{total}/{dur} phút</b>
            <i className="li-bar"><i style={{ width: `${Math.min(100, (total / dur) * 100)}%` }} className={total > dur ? 'over' : ''} /></i></span>
          <button className="btn btn-outline" onClick={autoPick}><Sparkles size={15} /> Tự chọn giúp tôi</button>
        </footer>
      </aside>
    </div>
  );
}
