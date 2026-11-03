'use client';
/* eslint-disable @next/next/no-img-element -- linh vật / hình dán nhỏ có sẵn trong dự án */

// "Tạo bài thao giảng từ bài học": chọn bài trong ngân hàng nội dung → app dựng sẵn kịch bản 5 hoạt động
// (tình huống, trò chơi, câu hỏi của bài), cô thêm / bớt trang, đổi linh vật, trò khởi động, cảnh nền rồi tạo bài.
import { useEffect, useMemo, useState } from 'react';
import { Minus, Plus, RotateCcw, Search, Sparkles, X } from 'lucide-react';
import type { ContentLesson } from '@/lib/content/types';
import { emptyDeck, type Deck, type SceneKind } from '@/lib/deck/types';
import { SCENES, pickScene } from '@/lib/deck/scenes';
import { MASCOTS, PHASES, WARMUPS, buildPlan, planSlides, type Knowledge, type MascotId, type PhaseId, type Warmup } from '@/lib/deck/fromLesson';
import SlideView, { SlideFrame } from './SlideView';

type Bank = { lessons: ContentLesson[]; know: (id: string) => Knowledge };
const SUBJECTS = [{ id: 'toan', label: 'Toán' }, { id: 'tieng-viet', label: 'Tiếng Việt' }, { id: 'tieng-anh', label: 'Tiếng Anh' }];
const MIN_TOTAL = 8, MAX_TOTAL = 20;
const GROW: PhaseId[] = ['lt', 'kp', 'vd', 'kd', 'cc'];
const norm = (s: string) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/đ/g, 'd').toLowerCase();

export default function DeckFromLesson({ grade, busy, onCreate, onClose }: { grade: number; busy: boolean; onCreate: (d: Deck) => void; onClose: () => void }) {
  const [bank, setBank] = useState<Bank | null>(null);
  const [subject, setSubject] = useState('toan');
  const [g, setG] = useState(Math.min(5, Math.max(1, grade || 1)));
  const [q, setQ] = useState('');
  const [lesson, setLesson] = useState<ContentLesson | null>(null);
  const [mascot, setMascot] = useState<MascotId>('professor');
  const [warmup, setWarmup] = useState<Warmup>('gift');
  const [scene, setScene] = useState<SceneKind>('garden');
  const [autoScene, setAutoScene] = useState<SceneKind>('garden');
  const [seed, setSeed] = useState(1);
  const [counts, setCounts] = useState<Record<PhaseId, number> | null>(null);
  const [removed, setRemoved] = useState<Set<string>>(new Set());
  const [title, setTitle] = useState('');

  useEffect(() => {
    let off = false;
    void Promise.all([import('@/lib/content'), import('@/lib/content/knowledge')]).then(([c, k]) => {
      if (!off) setBank({ lessons: c.CONTENT, know: (id) => k.knowledgeFor(id) });
    });
    return () => { off = true; };
  }, []);

  const list = useMemo(() => {
    if (!bank) return [];
    const n = norm(q.trim());
    return bank.lessons.filter((l) => l.subject === subject && l.grade === g && (!n || norm(`${l.title} ${l.unit?.title ?? ''}`).includes(n)));
  }, [bank, subject, g, q]);
  const groups = useMemo(() => {
    const m = new Map<string, ContentLesson[]>();
    for (const l of list) { const k = `HK${l.semester} · ${l.unit?.title ?? ''}`; m.set(k, [...(m.get(k) ?? []), l]); }
    return [...m.entries()];
  }, [list]);

  const plan = useMemo(() => (lesson && bank ? buildPlan(lesson, bank.know(lesson.id), { mascot, warmup, scene, seed }) : null), [lesson, bank, mascot, warmup, scene, seed]);
  const avail = useMemo(() => {
    const a = {} as Record<PhaseId, number>;
    for (const p of PHASES) a[p.id] = plan?.cands.filter((c) => c.phase === p.id).length ?? 0;
    return a;
  }, [plan]);
  const cnt = useMemo(() => {
    const base = counts ?? plan?.defaults; if (!base) return null;
    const c = {} as Record<PhaseId, number>;
    for (const p of PHASES) c[p.id] = Math.min(base[p.id] ?? 0, avail[p.id] - [...removed].filter((k) => k.startsWith(p.id + ':')).length);
    return c;
  }, [counts, plan, avail, removed]);
  const onKeys = useMemo(() => {
    const s = new Set<string>(); if (!plan || !cnt) return s;
    for (const p of PHASES) plan.cands.filter((c) => c.phase === p.id && !removed.has(c.key)).slice(0, cnt[p.id]).forEach((c) => s.add(c.key));
    return s;
  }, [plan, cnt, removed]);
  const total = onKeys.size;

  const choose = (l: ContentLesson) => {
    setLesson(l); setCounts(null); setRemoved(new Set()); setTitle(`${l.title}`);
    const sc = pickScene(`${l.title} ${l.unit?.title ?? ''} ${l.questions.map((x) => x.prompt).join(' ')}`);
    setScene(sc); setAutoScene(sc);
  };
  const setCount = (p: PhaseId, v: number) => { if (!cnt) return; setCounts({ ...cnt, [p]: Math.max(p === 'bia' ? 1 : 0, v) }); };
  const room = (p: PhaseId) => !!cnt && cnt[p] + [...removed].filter((k) => k.startsWith(p + ':')).length < avail[p];
  const grow = (d: 1 | -1) => {
    if (!cnt) return;
    if (d > 0) { const p = GROW.find((x) => room(x)); if (p) setCount(p, cnt[p] + 1); }
    else { const p = GROW.find((x) => cnt[x] > (x === 'lt' ? 1 : 0)); if (p) setCount(p, cnt[p] - 1); }
  };
  const toggle = (k: string, p: PhaseId) => {
    if (!cnt) return;
    const r = new Set(removed);
    if (r.has(k)) { r.delete(k); setCounts({ ...cnt, [p]: cnt[p] + 1 }); } else { r.add(k); setCounts({ ...cnt, [p]: Math.max(0, cnt[p] - 1) }); }
    setRemoved(r);
  };
  const create = () => {
    if (!plan || !lesson) return;
    const D = emptyDeck((title.trim() || lesson.title).slice(0, 120), lesson.grade);
    D.slides = planSlides(plan, onKeys, {});
    onCreate(D);
  };

  return (
    <section className="dfl" aria-label="Tạo bài thao giảng từ bài học">
      <header className="dfl-top">
        <h2><Sparkles aria-hidden="true" /> Tạo bài thao giảng từ bài học</h2>
        <small>Chọn bài → app dựng sẵn tình huống, trò chơi, câu hỏi theo 5 hoạt động. Cô thêm / bớt trang rồi bấm Tạo.</small>
        <button type="button" className="dfl-x" aria-label="Đóng" onClick={onClose}><X aria-hidden="true" /></button>
      </header>
      <div className="dfl-body">
        <aside className="dfl-pick">
          <div className="dk-seg">{SUBJECTS.map((s) => <button key={s.id} type="button" className={subject === s.id ? 'is-on' : ''} onClick={() => setSubject(s.id)}>{s.label}</button>)}</div>
          <div className="dk-seg">{[1, 2, 3, 4, 5].map((n) => <button key={n} type="button" className={g === n ? 'is-on' : ''} onClick={() => setG(n)}>Lớp {n}</button>)}</div>
          <label className="dfl-search"><Search aria-hidden="true" /><input value={q} placeholder="Tìm bài…" onChange={(e) => setQ(e.target.value)} /></label>
          <div className="dfl-list">
            {!bank && <p className="dk-hint">Đang tải ngân hàng bài…</p>}
            {bank && !list.length && <p className="dk-hint">Không có bài phù hợp.</p>}
            {groups.map(([u, ls]) => (
              <div key={u}><h3>{u}</h3>
                {ls.map((l) => <button key={l.id} type="button" className={lesson?.id === l.id ? 'is-on' : ''} onClick={() => choose(l)}>{l.title}<small>{l.questions.length} câu</small></button>)}
              </div>
            ))}
          </div>
        </aside>

        <div className="dfl-plan">
          {!plan || !cnt ? <div className="dfl-empty"><img src="/brand/milo-professor-sm.webp" alt="" /><p>Chọn một bài ở cột bên trái,<br />Cú Milo sẽ dựng sẵn kịch bản tiết dạy.</p></div> : <>
            <div className="dfl-opts">
              <div className="dfl-opt"><b>Linh vật</b><span className="dfl-mascots">{MASCOTS.map((m) => <button key={m.id} type="button" title={m.name} aria-label={m.name} className={mascot === m.id ? 'is-on' : ''} onClick={() => setMascot(m.id)}><img src={m.src} alt="" /></button>)}</span></div>
              <div className="dfl-opt"><b>Khởi động</b><span className="dk-seg">{WARMUPS.map((w) => <button key={w.id} type="button" className={warmup === w.id ? 'is-on' : ''} onClick={() => setWarmup(w.id)}>{w.icon} {w.label}</button>)}</span></div>
              <div className="dfl-opt"><b>Cảnh nền</b><span className="dfl-scenes">{SCENES.map((s) => <button key={s.id} type="button" className={scene === s.id ? 'is-on' : ''} onClick={() => setScene(s.id)}><i>{s.icon}</i>{s.label}{autoScene === s.id ? ' ✨' : ''}</button>)}</span></div>
              <div className="dfl-opt dfl-row">
                <button type="button" className="btn btn-outline btn-sm" onClick={() => { setSeed((x) => x + 1); setRemoved(new Set()); }}>🎲 Tình huống khác</button>
                <span className="dfl-step" aria-label="Tổng số trang"><button type="button" aria-label="Bớt một trang" disabled={total <= MIN_TOTAL} onClick={() => grow(-1)}><Minus aria-hidden="true" /></button><b>{total} trang</b><button type="button" aria-label="Thêm một trang" disabled={total >= MAX_TOTAL || !GROW.some(room)} onClick={() => grow(1)}><Plus aria-hidden="true" /></button></span>
                <small className="dk-hint">✨ cảnh app tự chọn theo bài · mỗi trang đổi cảnh riêng trong trình soạn</small>
              </div>
            </div>

            {PHASES.map((p) => {
              const shown = plan.cands.filter((c) => c.phase === p.id && (onKeys.has(c.key) || removed.has(c.key)));
              return (
                <div key={p.id} className="dfl-ph">
                  <div className="dfl-ph-h">
                    <span className="dfl-tag" style={{ background: p.color }}>{p.label}{p.time && <small>{p.time}</small>}</span>
                    {p.id !== 'bia' && <span className="dfl-step is-sm"><button type="button" aria-label={`Bớt trang ${p.label}`} disabled={cnt[p.id] <= 0} onClick={() => setCount(p.id, cnt[p.id] - 1)}><Minus aria-hidden="true" /></button><b>{cnt[p.id]} trang</b><button type="button" aria-label={`Thêm trang ${p.label}`} disabled={!room(p.id) || total >= MAX_TOTAL} onClick={() => setCount(p.id, cnt[p.id] + 1)}><Plus aria-hidden="true" /></button></span>}
                  </div>
                  <div className="dfl-thumbs">
                    {shown.map((c) => {
                      const off = removed.has(c.key);
                      return (
                        <figure key={c.key} className={`dfl-th${off ? ' is-off' : ''}`}>
                          <SlideFrame>{(k) => <SlideView slide={c.slide} mode="thumb" scale={k} />}</SlideFrame>
                          <figcaption title={c.title}>{c.title}</figcaption>
                          {p.id !== 'bia' && <button type="button" className="dfl-tg" aria-label={off ? 'Lấy lại trang' : 'Bỏ trang'} onClick={() => toggle(c.key, p.id)}>{off ? <RotateCcw aria-hidden="true" /> : <X aria-hidden="true" />}</button>}
                        </figure>
                      );
                    })}
                    {p.id !== 'bia' && room(p.id) && total < MAX_TOTAL && <button type="button" className="dfl-add" onClick={() => setCount(p.id, cnt[p.id] + 1)}><Plus aria-hidden="true" />Thêm trang<small>{p.id === 'lt' ? 'câu hỏi khác của bài' : p.id === 'kd' ? 'tình huống khác' : 'trang gợi ý khác'}</small></button>}
                  </div>
                </div>
              );
            })}

            <div className="dfl-foot">
              <label className="dh-name"><span>Tên bài thao giảng</span><input value={title} maxLength={120} onChange={(e) => setTitle(e.target.value)} /></label>
              <button type="button" className="btn btn-primary" disabled={busy || !total} onClick={create}><Sparkles aria-hidden="true" /> {busy ? 'Đang tạo…' : `Tạo bài thao giảng (${total} trang)`}</button>
            </div>
          </>}
        </div>
      </div>
    </section>
  );
}
