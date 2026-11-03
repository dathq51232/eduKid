'use client';
/* eslint-disable @next/next/no-img-element -- linh vật / hình dán nhỏ có sẵn trong dự án */

// "Tạo bài thao giảng": nạp bài theo LỊCH BÁO GIẢNG (giáo án từng tiết đã nạp ở Kế hoạch bài dạy) hoặc chọn trong kho bài học.
// App dựng sẵn kịch bản 5 hoạt động (tình huống, trò chơi, câu hỏi của bài / nhiệm vụ trong giáo án); cô thêm / bớt trang,
// đổi linh vật, trò khởi động, cảnh nền rồi tạo một hoặc nhiều bài cùng lúc.
import Link from 'next/link';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { Check, Minus, Plus, RotateCcw, Search, Sparkles, X } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import type { ContentLesson } from '@/lib/content/types';
import { emptyDeck, type Deck, type SceneKind } from '@/lib/deck/types';
import { SCENES, pickScene } from '@/lib/deck/scenes';
import { MASCOTS, PHASES, WARMUPS, buildPlan, buildPlanFromGiaoAn, planSlides, type Knowledge, type LessonPlan, type MascotId, type PhaseId, type Warmup } from '@/lib/deck/fromLesson';
import { SUBJECT_NAMES, isAppSubject, isPlan, mondayOf, addDays, viDate, weekdayVi, type LessonPlan as GiaoAn } from '@/lib/plans/generate';
import SlideView, { SlideFrame } from './SlideView';

type Bank = { lessons: ContentLesson[]; byId: Map<string, ContentLesson>; know: (id: string) => Knowledge };
type PlanRow = { id: string; subject: string; grade: number; title: string; teach_date: string | null; period: number | null };
/** chỉnh sửa riêng của từng nguồn (bài trong kho / tiết trong lịch) */
type Ed = { counts: Record<PhaseId, number> | null; removed: string[]; scene: SceneKind; autoScene: SceneKind; seed: number; title: string };

const SUBJECTS = [{ id: 'toan', label: 'Toán' }, { id: 'tieng-viet', label: 'Tiếng Việt' }, { id: 'tieng-anh', label: 'Tiếng Anh' }];
const MIN_TOTAL = 8, MAX_TOTAL = 20;
const GROW: PhaseId[] = ['lt', 'kp', 'vd', 'kd', 'cc'];
/** tiết thao giảng / dự giờ ghi trong lịch báo giảng */
const DEMO_RE = /thao\s*giảng|dự\s*giờ|chuyên\s*đề|hội\s*giảng|giáo\s*viên\s*giỏi|gv\s*giỏi/i;
const norm = (s: string) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/đ/g, 'd').toLowerCase();
const subjOf = (g: GiaoAn) => g.subjectLabel?.trim() || SUBJECT_NAMES[g.subject] || 'Môn học';
const isDemo = (g: GiaoAn) => DEMO_RE.test(`${g.adjust ?? ''} ${g.integration ?? ''} ${g.title}`);
const SUBJ_CLS: Record<string, string> = { toan: 'toan', 'tieng-viet': 'tv', 'tieng-anh': 'ta', 'dao-duc': 'dd', tnxh: 'tn', hdtn: 'hd' };
/** cảnh mặc định theo môn khi tên bài không gợi ý cảnh nào */
const SUBJ_SCENE: Record<string, SceneKind> = { 'dao-duc': 'class', tnxh: 'garden', 'khoa-hoc': 'garden', hdtn: 'yard', 'ls-dl': 'yard', 'tin-hoc': 'class', 'cong-nghe': 'class' };
const todayIso = () => { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`; };

export default function DeckFromLesson({ classId, grade, busy, made, onCreate, onClose }: {
  classId: string; grade: number; busy: boolean;
  /** id giáo án (tiết) đã có bài thao giảng */
  made: Set<string>;
  onCreate: (d: Deck[]) => void; onClose: () => void;
}) {
  const [bank, setBank] = useState<Bank | null>(null);
  const [mode, setMode] = useState<'lich' | 'kho'>('lich');
  const [mascot, setMascot] = useState<MascotId>('professor');
  const [warmup, setWarmup] = useState<Warmup>('gift');
  const [eds, setEds] = useState<Record<string, Ed>>({});
  /* kho bài học */
  const [subject, setSubject] = useState('toan');
  const [g, setG] = useState(Math.min(5, Math.max(1, grade || 1)));
  const [q, setQ] = useState('');
  const [lesson, setLesson] = useState<ContentLesson | null>(null);
  /* lịch báo giảng */
  const [rows, setRows] = useState<PlanRow[] | null>(null);
  const [rowErr, setRowErr] = useState('');
  const [week, setWeek] = useState('');
  const [plans, setPlans] = useState<Record<string, GiaoAn>>({});
  const [loadingWeek, setLoadingWeek] = useState(false);
  const [picked, setPicked] = useState<Set<string>>(new Set());
  const [focus, setFocus] = useState<string | null>(null);

  useEffect(() => {
    let off = false;
    void Promise.all([import('@/lib/content'), import('@/lib/content/knowledge')]).then(([c, k]) => {
      if (!off) setBank({ lessons: c.CONTENT, byId: new Map(c.CONTENT.map((l) => [l.id, l])), know: (id) => k.knowledgeFor(id) });
    });
    void (async () => {
      try {
        const { data, error } = await createClient().rpc('teacher_list_plans', { p_class: classId });
        if (off) return;
        if (error) { setRowErr('Chưa đọc được lịch báo giảng.'); setRows([]); return; }
        const list = ((data ?? []) as PlanRow[]).filter((r) => r.teach_date);
        setRows(list);
        if (!list.length) { setMode('kho'); return; }
        const weeks = [...new Set(list.map((r) => mondayOf(r.teach_date!)))].sort();
        const now = mondayOf(todayIso());
        setWeek(weeks.includes(now) ? now : weeks.filter((w) => w <= now).at(-1) ?? weeks[0]);
      } catch { if (!off) { setRows([]); setMode('kho'); } }
    })();
    return () => { off = true; };
  }, [classId]);

  const weeks = useMemo(() => [...new Set((rows ?? []).map((r) => mondayOf(r.teach_date!)))].sort(), [rows]);
  const weekRows = useMemo(() => (rows ?? []).filter((r) => r.teach_date! >= week && r.teach_date! <= addDays(week, 6)), [rows, week]);

  // tải giáo án các tiết trong tuần, chọn sẵn tiết thao giảng / dự giờ
  useEffect(() => {
    if (!weekRows.length) return;
    const need = weekRows.filter((r) => !plans[r.id]);
    let off = false;
    const pick = (all: Record<string, GiaoAn>) => {
      const demo = weekRows.filter((r) => all[r.id] && isDemo(all[r.id])).map((r) => r.id);
      setPicked(new Set(demo)); setFocus(demo[0] ?? null);
    };
    if (!need.length) { pick(plans); return; }
    setLoadingWeek(true);
    const sb = createClient();
    void Promise.all(need.map((r) => sb.rpc('teacher_get_plan', { p_plan: r.id }).then((x) => [r.id, ((x.data ?? []) as { data: unknown }[])[0]?.data] as const))).then((got) => {
      if (off) return;
      const add: Record<string, GiaoAn> = {};
      for (const [id, d] of got) if (isPlan(d)) add[id] = d;
      setPlans((p) => { const all = { ...p, ...add }; pick(all); return all; });
      setLoadingWeek(false);
    });
    return () => { off = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [week, weekRows]);

  /* ---------- nguồn → kế hoạch trang ---------- */
  const appLesson = useCallback((ga: GiaoAn) => (ga.lessonId && isAppSubject(ga.subject) ? bank?.byId.get(ga.lessonId) ?? null : null), [bank]);
  const defaultEd = useCallback((key: string): Ed | null => {
    if (key.startsWith('L:')) {
      const l = bank?.byId.get(key.slice(2)); if (!l) return null;
      const sc = pickScene(`${l.title} ${l.unit?.title ?? ''} ${l.questions.map((x) => x.prompt).join(' ')}`);
      return { counts: null, removed: [], scene: sc, autoScene: sc, seed: 1, title: l.title };
    }
    const ga = plans[key.slice(2)]; if (!ga) return null;
    const l = appLesson(ga);
    const sc = pickScene(`${ga.title} ${l ? l.questions.map((x) => x.prompt).join(' ') : ga.goals.knowledge}`, SUBJ_SCENE[ga.subject] ?? 'yard');
    return { counts: null, removed: [], scene: sc, autoScene: sc, seed: 1, title: `${subjOf(ga)} ${ga.grade} – ${ga.title}` };
  }, [bank, plans, appLesson]);
  const edOf = useCallback((key: string) => eds[key] ?? defaultEd(key), [eds, defaultEd]);
  const planOf = useCallback((key: string, ed: Ed): LessonPlan | null => {
    if (!bank) return null;
    const o = { mascot, warmup, scene: ed.scene, seed: ed.seed };
    if (key.startsWith('L:')) { const l = bank.byId.get(key.slice(2)); return l ? buildPlan(l, bank.know(l.id), o) : null; }
    const ga = plans[key.slice(2)]; if (!ga) return null;
    const l = appLesson(ga);
    return l ? buildPlan(l, bank.know(l.id), o, ga) : buildPlanFromGiaoAn(ga, o);
  }, [bank, plans, mascot, warmup, appLesson]);

  const curKey = mode === 'kho' ? (lesson ? `L:${lesson.id}` : null) : (focus ? `P:${focus}` : null);
  const ed = curKey ? edOf(curKey) : null;
  const plan = useMemo(() => (curKey && ed ? planOf(curKey, ed) : null), [curKey, ed, planOf]);
  const setEd = (patch: Partial<Ed>) => { if (curKey && ed) setEds((m) => ({ ...m, [curKey]: { ...ed, ...patch } })); };

  const deckFor = (key: string): Deck | null => {
    const e = edOf(key); if (!e) return null;
    const p = planOf(key, e); if (!p) return null;
    const on = onKeysOf(p, e);
    if (key.startsWith('L:')) {
      const l = bank!.byId.get(key.slice(2))!;
      const D = emptyDeck((e.title.trim() || l.title).slice(0, 120), l.grade);
      return { ...D, slides: planSlides(p, on, {}), src: { lesson: l.id } };
    }
    const ga = plans[key.slice(2)];
    const D = emptyDeck((e.title.trim() || ga.title).slice(0, 120), ga.grade);
    return { ...D, slides: planSlides(p, on, {}), src: { plan: key.slice(2), lesson: ga.lessonId || undefined, date: ga.date || undefined, period: ga.period || undefined } };
  };
  const createNow = () => {
    const keys = mode === 'kho' ? (curKey ? [curKey] : []) : weekRows.filter((r) => picked.has(r.id)).map((r) => `P:${r.id}`);
    const ds = keys.map(deckFor).filter((d): d is Deck => !!d);
    if (ds.length) onCreate(ds);
  };

  /* ---------- kho bài học ---------- */
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

  /* ---------- lưới lịch tuần ---------- */
  const grid = useMemo(() => {
    const cells = weekRows.map((r) => ({ r, ga: plans[r.id] })).filter((c) => c.ga);
    const days = [...new Set(cells.map((c) => c.r.teach_date!))].sort();
    const slotKey = (ga: GiaoAn, r: PlanRow) => `${/chiều/i.test(ga.session ?? '') ? 1 : 0}-${String(r.period ?? 0).padStart(2, '0')}`;
    const slots = [...new Set(cells.map((c) => slotKey(c.ga, c.r)))].sort();
    const at = new Map<string, typeof cells>();
    for (const c of cells) { const k = `${c.r.teach_date}|${slotKey(c.ga, c.r)}`; at.set(k, [...(at.get(k) ?? []), c]); }
    return { days, slots, at };
  }, [weekRows, plans]);
  const nPicked = weekRows.filter((r) => picked.has(r.id)).length;
  const togglePick = (id: string) => setPicked((s) => { const n = new Set(s); if (n.has(id)) n.delete(id); else n.add(id); return n; });

  const focusGa = focus ? plans[focus] : null;
  const focusApp = focusGa ? appLesson(focusGa) : null;
  const wi = weeks.indexOf(week);

  return (
    <section className="dfl" aria-label="Tạo bài thao giảng">
      <header className="dfl-top">
        <h2><Sparkles aria-hidden="true" /> Tạo bài thao giảng</h2>
        <small>App dựng sẵn tình huống, trò chơi, câu hỏi theo 5 hoạt động. Cô thêm / bớt trang rồi bấm Tạo.</small>
        <button type="button" className="dfl-x" aria-label="Đóng" onClick={onClose}><X aria-hidden="true" /></button>
      </header>
      <div className="dfl-tabs" role="tablist">
        <button type="button" role="tab" aria-selected={mode === 'lich'} className={mode === 'lich' ? 'is-on' : ''} onClick={() => setMode('lich')}>📅 Theo lịch báo giảng</button>
        <button type="button" role="tab" aria-selected={mode === 'kho'} className={mode === 'kho' ? 'is-on' : ''} onClick={() => setMode('kho')}>📚 Chọn trong kho bài học</button>
      </div>

      {mode === 'lich' && <div className="dfl-cal">
        {rows === null ? <p className="dk-hint">Đang đọc lịch báo giảng…</p>
          : !rows.length ? <p className="dfl-none">{rowErr || 'Lớp này chưa có lịch báo giảng.'} Nạp file lịch báo giảng (Excel) ở <Link href={`/giao-vien/lop/${classId}/ke-hoach`}>Kế hoạch bài dạy</Link>, app sẽ nhận ra các tiết cần thao giảng. Hoặc chọn bài ở tab “Chọn trong kho bài học”.</p>
          : <>
            <div className="dfl-bar">
              <span className="dfl-wk">
                <button type="button" aria-label="Tuần trước" disabled={wi <= 0} onClick={() => setWeek(weeks[wi - 1])}>‹</button>
                <b>{(() => { const w = focusGa?.week || plans[weekRows[0]?.id]?.week; return w ? `Tuần ${w.replace(/^tuần\s*/i, '')} · ` : ''; })()}{viDate(week)} – {viDate(addDays(week, 6))}</b>
                <button type="button" aria-label="Tuần sau" disabled={wi >= weeks.length - 1} onClick={() => setWeek(weeks[wi + 1])}>›</button>
              </span>
              <small>{weekRows.length} tiết · lấy từ lịch báo giảng ở <Link href={`/giao-vien/lop/${classId}/ke-hoach`}>Kế hoạch bài dạy</Link></small>
            </div>
            <div className="dfl-leg"><span>⭐ tiết thao giảng / dự giờ (ghi trong lịch)</span><span>🧩 có ngân hàng câu hỏi</span><span>📄 dựng từ giáo án</span><span>✅ đã có bài thao giảng</span></div>
            {loadingWeek ? <p className="dk-hint">Đang tải giáo án các tiết…</p> : (
              <div className="dfl-grid" style={{ gridTemplateColumns: `86px repeat(${grid.days.length}, minmax(120px, 1fr))` }}>
                <div />
                {grid.days.map((d) => <div key={d} className="dfl-gh">{weekdayVi(d)} {viDate(d).replace(/\/\d{4}$/, '')}</div>)}
                {grid.slots.map((s) => [
                  <div key={s} className="dfl-gs">{s.startsWith('1') ? 'Chiều' : 'Sáng'} · T{Number(s.slice(2))}</div>,
                  ...grid.days.map((d) => (
                    <div key={`${s}${d}`} className="dfl-gc">
                      {(grid.at.get(`${d}|${s}`) ?? []).map(({ r, ga }) => {
                        const on = picked.has(r.id), app = !!appLesson(ga);
                        return (
                          <div key={r.id} className={`dfl-p s-${SUBJ_CLS[ga.subject] ?? 'kh'}${on ? ' is-on' : ''}${focus === r.id ? ' is-focus' : ''}`}>
                            <button type="button" className="dfl-pb" onClick={() => { setFocus(r.id); if (!on) togglePick(r.id); }}>
                              <b>{isDemo(ga) && '⭐ '}{subjOf(ga)} {app ? '🧩' : '📄'}{made.has(r.id) && ' ✅'}</b><span>{ga.title}</span>
                            </button>
                            <button type="button" className="dfl-ck" role="checkbox" aria-checked={on} aria-label={`Chọn tiết ${subjOf(ga)}: ${ga.title}`} onClick={() => togglePick(r.id)}>{on && <Check aria-hidden="true" />}</button>
                          </div>
                        );
                      })}
                    </div>
                  )),
                ])}
              </div>
            )}
            {focusGa && <p className="dfl-src">
              <b>{weekdayVi(focusGa.date)} · Tiết {focusGa.period} · {subjOf(focusGa)} — {focusGa.title}</b>
              {focusApp ? <span className="dfl-tag2 is-ok">🧩 khớp bài “{focusApp.title}” ({focusApp.questions.length} câu)</span> : <span className="dfl-tag2 is-warn">📄 dựng từ giáo án của tiết này</span>}
              <span className="dfl-tag2 is-blue">📄 ghi chú của cô lấy từ hoạt động GV/HS trong giáo án</span>
            </p>}
          </>}
      </div>}

      <div className={`dfl-body${mode === 'lich' ? ' is-cal' : ''}`}>
        {mode === 'kho' && <aside className="dfl-pick">
          <div className="dk-seg">{SUBJECTS.map((s) => <button key={s.id} type="button" className={subject === s.id ? 'is-on' : ''} onClick={() => setSubject(s.id)}>{s.label}</button>)}</div>
          <div className="dk-seg">{[1, 2, 3, 4, 5].map((n) => <button key={n} type="button" className={g === n ? 'is-on' : ''} onClick={() => setG(n)}>Lớp {n}</button>)}</div>
          <label className="dfl-search"><Search aria-hidden="true" /><input value={q} placeholder="Tìm bài…" onChange={(e) => setQ(e.target.value)} /></label>
          <div className="dfl-list">
            {!bank && <p className="dk-hint">Đang tải ngân hàng bài…</p>}
            {bank && !list.length && <p className="dk-hint">Không có bài phù hợp.</p>}
            {groups.map(([u, ls]) => (
              <div key={u}><h3>{u}</h3>
                {ls.map((l) => <button key={l.id} type="button" className={lesson?.id === l.id ? 'is-on' : ''} onClick={() => setLesson(l)}>{l.title}<small>{l.questions.length} câu</small></button>)}
              </div>
            ))}
          </div>
        </aside>}

        <div className="dfl-plan">
          {!plan || !ed ? (mode === 'kho' || rows?.length ? <div className="dfl-empty"><img src="/brand/milo-professor-sm.webp" alt="" /><p>{mode === 'kho' ? <>Chọn một bài ở cột bên trái,<br />Cú Milo sẽ dựng sẵn kịch bản tiết dạy.</> : <>Bấm vào một tiết trong lịch để xem và chỉnh các trang.</>}</p></div> : null)
            : <PlanEditor key={curKey!} plan={plan} ed={ed} setEd={setEd} mascot={mascot} setMascot={setMascot} warmup={warmup} setWarmup={setWarmup} />}
          {(mode === 'kho' ? !!plan : rows?.length) ? (
            <div className="dfl-foot">
              {mode === 'kho' || nPicked <= 1
                ? <label className="dh-name"><span>Tên bài thao giảng</span><input value={ed?.title ?? ''} maxLength={120} disabled={!ed} onChange={(e) => setEd({ title: e.target.value })} /></label>
                : <small className="dk-hint">Đã chọn {nPicked} tiết · mỗi tiết thành một bài thao giảng riêng (tiết đang xem dùng các trang cô vừa chỉnh, tiết khác dùng trang gợi ý).</small>}
              <button type="button" className="btn btn-primary" disabled={busy || (mode === 'kho' ? !plan : !nPicked)} onClick={createNow}>
                <Sparkles aria-hidden="true" /> {busy ? 'Đang tạo…' : mode === 'lich' && nPicked > 1 ? `Tạo ${nPicked} bài thao giảng` : `Tạo bài thao giảng${plan ? ` (${onKeysOf(plan, ed!).size} trang)` : ''}`}
              </button>
            </div>
          ) : null}
        </div>
      </div>
    </section>
  );
}

/** các trang đang chọn của một kế hoạch: mỗi hoạt động lấy n trang đầu chưa bị bỏ */
function countsOf(plan: LessonPlan, ed: Ed) {
  const avail = {} as Record<PhaseId, number>, cnt = {} as Record<PhaseId, number>;
  const removed = new Set(ed.removed);
  for (const p of PHASES) {
    avail[p.id] = plan.cands.filter((c) => c.phase === p.id).length;
    const rm = plan.cands.filter((c) => c.phase === p.id && removed.has(c.key)).length;
    cnt[p.id] = Math.min((ed.counts ?? plan.defaults)[p.id] ?? 0, avail[p.id] - rm);
  }
  return { avail, cnt, removed };
}
function onKeysOf(plan: LessonPlan, ed: Ed) {
  const { cnt, removed } = countsOf(plan, ed);
  const s = new Set<string>();
  for (const p of PHASES) plan.cands.filter((c) => c.phase === p.id && !removed.has(c.key)).slice(0, cnt[p.id]).forEach((c) => s.add(c.key));
  return s;
}

function PlanEditor({ plan, ed, setEd, mascot, setMascot, warmup, setWarmup }: {
  plan: LessonPlan; ed: Ed; setEd: (p: Partial<Ed>) => void;
  mascot: MascotId; setMascot: (m: MascotId) => void; warmup: Warmup; setWarmup: (w: Warmup) => void;
}) {
  const { avail, cnt, removed } = countsOf(plan, ed);
  const onKeys = onKeysOf(plan, ed);
  const total = onKeys.size;
  const rmIn = (p: PhaseId) => plan.cands.filter((c) => c.phase === p && removed.has(c.key)).length;
  const room = (p: PhaseId) => cnt[p] + rmIn(p) < avail[p];
  const setCount = (p: PhaseId, v: number) => setEd({ counts: { ...cnt, [p]: Math.max(p === 'bia' ? 1 : 0, v) } });
  const grow = (d: 1 | -1) => {
    if (d > 0) { const p = GROW.find((x) => room(x)); if (p) setCount(p, cnt[p] + 1); }
    else { const p = GROW.find((x) => cnt[x] > (x === 'lt' ? 1 : 0)); if (p) setCount(p, cnt[p] - 1); }
  };
  const toggle = (k: string, p: PhaseId) => {
    if (removed.has(k)) setEd({ removed: ed.removed.filter((x) => x !== k), counts: { ...cnt, [p]: cnt[p] + 1 } });
    else setEd({ removed: [...ed.removed, k], counts: { ...cnt, [p]: Math.max(0, cnt[p] - 1) } });
  };
  return <>
    <div className="dfl-opts">
      <div className="dfl-opt"><b>Linh vật</b><span className="dfl-mascots">{MASCOTS.map((m) => <button key={m.id} type="button" title={m.name} aria-label={m.name} className={mascot === m.id ? 'is-on' : ''} onClick={() => setMascot(m.id)}><img src={m.src} alt="" /></button>)}</span></div>
      <div className="dfl-opt"><b>Khởi động</b><span className="dk-seg">{WARMUPS.map((w) => <button key={w.id} type="button" className={warmup === w.id ? 'is-on' : ''} onClick={() => setWarmup(w.id)}>{w.icon} {w.label}</button>)}</span></div>
      <div className="dfl-opt"><b>Cảnh nền</b><span className="dfl-scenes">{SCENES.map((s) => <button key={s.id} type="button" className={ed.scene === s.id ? 'is-on' : ''} onClick={() => setEd({ scene: s.id })}><i>{s.icon}</i>{s.label}{ed.autoScene === s.id ? ' ✨' : ''}</button>)}</span></div>
      <div className="dfl-opt dfl-row">
        <button type="button" className="btn btn-outline btn-sm" onClick={() => setEd({ seed: ed.seed + 1, removed: [] })}>🎲 Tình huống khác</button>
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
            {p.id !== 'bia' && room(p.id) && total < MAX_TOTAL && <button type="button" className="dfl-add" onClick={() => setCount(p.id, cnt[p.id] + 1)}><Plus aria-hidden="true" />Thêm trang<small>{p.id === 'lt' ? 'câu hỏi / hoạt động khác' : p.id === 'kd' ? 'tình huống khác' : 'trang gợi ý khác'}</small></button>}
          </div>
        </div>
      );
    })}
  </>;
}
