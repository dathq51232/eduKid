'use client';

// Xưởng bài giảng 3D: thư viện đồ vật | sa bàn 3D | thuộc tính (Đồ vật, Cảnh, Tương tác, Thử thách) + Trình chiếu.
// Bài tự lưu vào bảng lessons3d (migration 0034) sau mỗi lần sửa.
import Link from 'next/link';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ArrowLeft, Copy, Eye, Grid3x3, Maximize, Pause, Play, Plus, Trash2, Upload, X, Zap } from 'lucide-react';
import { assetError, assetUsage, deleteAsset, fmtMB, listAssets, uploadAsset, type TeacherAsset } from '@/lib/assets/client';
import { baseName, prepareBoard } from '@/lib/assets/image';
import { createClient } from '@/lib/supabase/client';
import { ASSETS, ASSET_BY_ID, ASSET_CATS } from '@/lib/lesson3d/assets';
import type { Runtime, Stage3D } from '@/lib/lesson3d/engine';
import { stemByKey } from '@/lib/lesson3d/templates';
import { FIT_LABEL } from '@/lib/lesson3d/stem-catalog';
import { MAX_OBJECTS, uid, type BaseType, type Control3D, type FxType, type Lesson3D, type Link3D, type Obj3D, type Quiz3D } from '@/lib/lesson3d/types';
import { fold } from '@/lib/classroom/teacher-nav';

const SWATCH = ['#ef4444', '#f59e0b', '#facc15', '#22c55e', '#2f8f4e', '#2aa7e0', '#2457c5', '#8b5cf6', '#ec4899', '#ffffff', '#9aa3ad', '#7a5232'];
const FX: { id: FxType; icon: string; name: string }[] = [
  { id: '', icon: '○', name: 'Không' }, { id: 'up', icon: '⇡', name: 'Hơi bay lên' }, { id: 'rain', icon: '☔', name: 'Mưa rơi' }, { id: 'snow', icon: '❄', name: 'Tuyết rơi' },
  { id: 'wind', icon: '≋', name: 'Gió thổi' }, { id: 'spin', icon: '⟳', name: 'Tự quay' }, { id: 'orbit', icon: '◌', name: 'Quay quanh tâm' }, { id: 'pulse', icon: '◎', name: 'Lớn – nhỏ' },
  { id: 'bob', icon: '≈', name: 'Nhấp nhô' }, { id: 'blink', icon: '✦', name: 'Nhấp nháy' }, { id: 'traffic', icon: '🚦', name: 'Đèn đổi màu' }, { id: 'wave', icon: '◖', name: 'Sóng âm' },
  { id: 'heat', icon: '♨', name: 'Nóng lên' }, { id: 'tilt', icon: '⚖', name: 'Cân nghiêng' }, { id: 'clock', icon: '🕒', name: 'Kim chạy' },
];
const BASES: { id: BaseType; name: string }[] = [{ id: 'grass', name: '🌿 Đồng cỏ' }, { id: 'desk', name: '📐 Bàn học' }, { id: 'road', name: '🛣 Đường phố' }, { id: 'water', name: '🌊 Mặt nước' }, { id: 'space', name: '🌌 Vũ trụ' }];
const LINK_KIND: Record<Link3D['kind'], string> = { arrow: 'Mũi tên', measure: 'Thước đo', wire: 'Dây điện' };
const ACTION: Record<Control3D['action'], string> = { on: 'Bật / tắt', speed: 'Tốc độ hiệu ứng', split: 'Tách rời bộ phận', show: 'Hiện / ẩn' };
type Tab = 'obj' | 'scene' | 'act' | 'quiz';
type Play = { i: number; quiz: null | { i: number; score: number; fb: null | { ok: boolean; pick: number | string } }; card: string | null };

function newObj(type: string, x: number, z: number): Obj3D {
  const a = ASSET_BY_ID[type];
  return { id: uid(), type, x, y: a?.y ?? 0, z, ry: 0, s: 1, color: a?.color ?? '#999999', name: a?.text ? 'Viết chữ ở đây' : a?.name ?? type, spot: { on: false, title: '', text: '' }, fx: { type: '', speed: 1 }, on: a?.onoff ? true : undefined };
}
const r1 = (v: number) => Math.round(v * 10) / 10;

export default function Lesson3DStudio({ classId, lessonId, initial }: { classId: string; lessonId: string; initial: Lesson3D }) {
  const supabase = useMemo(() => { try { return createClient(); } catch { return null; } }, []);
  const stageRef = useRef<HTMLDivElement>(null);
  const engRef = useRef<Stage3D | null>(null);
  const [L, setL] = useState<Lesson3D>(initial);
  const [sel, setSel] = useState<string | null>(null);
  const [tab, setTab] = useState<Tab>('obj');
  const [placing, setPlacing] = useState<string | null>(null);
  const [q, setQ] = useState('');
  const [thumbs, setThumbs] = useState<Record<string, string>>({});
  const [save, setSave] = useState<'ok' | 'saving' | 'err'>('ok');
  const [snap, setSnap] = useState(false);
  const [lite, setLite] = useState(false);
  const [play, setPlay] = useState<Play | null>(null);
  const [rt, setRt] = useState<Runtime>({});
  const [sceneOn, setSceneOn] = useState(-1);
  // vật thể của tôi (kho — migration 0043)
  const [mine, setMine] = useState<TeacherAsset[] | null>(null);
  const [mineMsg, setMineMsg] = useState<{ kind: 'ok' | 'error' | 'info' | 'warn'; text: string } | null>(null);
  const [mineBusy, setMineBusy] = useState('');
  const [usage, setUsage] = useState<{ bytes: number; limit: number } | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const ref = useRef({ L, placing, play, tab });
  ref.current = { L, placing, play, tab };

  /* ---------- sửa dữ liệu ---------- */
  const update = useCallback((fn: (d: Lesson3D) => Lesson3D) => setL((d) => fn(structuredClone(d))), []);
  const updObj = useCallback((id: string, fn: (o: Obj3D) => void) => update((d) => { const o = d.objects.find((x) => x.id === id); if (o) fn(o); return d; }), [update]);
  const addObj = useCallback((type: string, x: number, z: number) => {
    if (ref.current.L.objects.length >= MAX_OBJECTS) return;
    const ob = newObj(type, x, z); update((d) => { d.objects.push(ob); return d; }); setSel(ob.id); setTab('obj');
  }, [update]);
  const removeObj = (id: string) => { update((d) => { d.objects = d.objects.filter((o) => o.id !== id); d.links = d.links.filter((l) => l.from !== id && l.to !== id); d.controls.forEach((c) => { c.targets = c.targets.filter((t) => t !== id); }); d.scenes.forEach((s) => { if (s.focus === id) s.focus = ''; }); d.quiz = d.quiz.filter((x) => !(x.type === 'spot' && x.target === id)); return d; }); setSel(null); };

  /* ---------- sân khấu 3D ---------- */
  useEffect(() => {
    let alive = true;
    void import('@/lib/lesson3d/engine').then(({ Stage3D: S, makeThumbs }) => {
      if (!alive || !stageRef.current) return;
      const eng = new S(stageRef.current, {
        onSelect: (id) => { setSel(id); if (id) setTab('obj'); },
        onPlace: (type, x, z) => { addObj(type, x, z); },
        onMoved: (id, x, z) => updObj(id, (o) => { o.x = x; o.z = z; }),
        onPick: (id) => pickRef.current(id),
      });
      engRef.current = eng; eng.setLesson(ref.current.L);
      setThumbs(makeThumbs(ASSETS.map((a) => a.id)));
    });
    return () => { alive = false; engRef.current?.dispose(); engRef.current = null; };
  }, [addObj, updObj]);
  useEffect(() => { engRef.current?.setLesson(L); }, [L]);
  const applyMine = useCallback(async (list: TeacherAsset[]) => {
    const { registerUserAssets } = await import('@/lib/lesson3d/user-assets');
    registerUserAssets(list);
    setMine(list);
    engRef.current?.setLesson(ref.current.L); // dựng các vật thể của tôi đã có trong bài
  }, []);
  useEffect(() => {
    let live = true;
    void listAssets(['model', 'image']).then((l) => { if (live) void applyMine(l); }, (e) => { if (live) { setMine([]); setMineMsg({ kind: 'info', text: assetError(e) }); } });
    void assetUsage().then((u) => { if (live && u) setUsage(u); });
    return () => { live = false; };
  }, [applyMine]);
  const onUpload = async (file: File) => {
    setMineMsg(null);
    try {
      let row: TeacherAsset;
      if (/\.glb$/i.test(file.name)) {
        const { prepareModel } = await import('@/lib/lesson3d/user-model');
        const r = await prepareModel(file, setMineBusy);
        setMineBusy('Đang tải lên kho…');
        row = await uploadAsset('model', baseName(file), r.blob, { thumb: r.thumb, meta: { tris: r.info.tris, size: r.info.size } });
        if (r.warn) setMineMsg({ kind: 'warn', text: r.warn });
      } else {
        setMineBusy('Đang chuẩn hoá ảnh…');
        const r = await prepareBoard(file);
        setMineBusy('Đang tải lên kho…');
        row = await uploadAsset('image', baseName(file), r.blob, { thumb: r.thumb, meta: { w: r.w, h: r.h } });
      }
      await applyMine([row, ...(mine ?? [])]);
      setPlacing(`u-${row.id}`);
      setMineMsg((m) => m ?? { kind: 'ok', text: `Đã thêm “${row.name}” vào Vật thể của tôi — bấm lên sa bàn để đặt.` });
      void assetUsage().then((u) => { if (u) setUsage(u); });
    } catch (e) { setMineMsg({ kind: 'error', text: assetError(e) }); }
    finally { setMineBusy(''); if (fileRef.current) fileRef.current.value = ''; }
  };
  const removeMine = async (a: TeacherAsset) => {
    const type = `u-${a.id}`;
    const used = L.objects.filter((o) => o.type === type).length;
    if (!window.confirm(`Xoá “${a.name}” khỏi kho?${used ? ` ${used} đồ vật này trong bài cũng bị xoá.` : ''}`)) return;
    try {
      await deleteAsset(a);
      if (used) update((d) => { const gone = new Set(d.objects.filter((o) => o.type === type).map((o) => o.id)); d.objects = d.objects.filter((o) => !gone.has(o.id)); d.links = d.links.filter((l) => !gone.has(l.from) && !gone.has(l.to)); return d; });
      const { unregisterUserAsset } = await import('@/lib/lesson3d/user-assets');
      unregisterUserAsset(a.id);
      setMine((l) => (l ?? []).filter((x) => x.id !== a.id));
      void assetUsage().then((u) => { if (u) setUsage(u); });
    } catch (e) { setMineMsg({ kind: 'error', text: assetError(e) }); }
  };
  useEffect(() => { if (engRef.current) engRef.current.snap = snap; }, [snap]);
  useEffect(() => { engRef.current?.setLite(lite); }, [lite]);
  useEffect(() => { engRef.current?.startPlacing(placing); }, [placing]);
  useEffect(() => { engRef.current?.highlight(sel); }, [sel]);
  useEffect(() => { engRef.current?.setRuntime(rt); }, [rt]);
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.target as HTMLElement).matches('input, textarea, select')) return;
      if (e.key === 'Escape') { if (ref.current.placing) setPlacing(null); else if (ref.current.play) stopPlay(); else setSel(null); }
      if (e.key === 'Delete' && sel && !ref.current.play) removeObj(sel);
    };
    addEventListener('keydown', onKey); return () => removeEventListener('keydown', onKey);
  });

  /* ---------- tự lưu ---------- */
  const first = useRef(true);
  useEffect(() => {
    if (first.current) { first.current = false; return; }
    if (!supabase) return;
    setSave('saving');
    const t = setTimeout(async () => {
      const { error } = await supabase.from('lessons3d').update({ title: L.title.slice(0, 120) || 'Bài giảng 3D', grade: L.grade, stem_ref: L.stem ?? null, data: L }).eq('id', lessonId);
      setSave(error ? 'err' : 'ok');
    }, 800);
    return () => clearTimeout(t);
  }, [L, supabase, lessonId]);

  /* ---------- trình chiếu ---------- */
  const startPlay = () => {
    setPlacing(null); setSel(null); setRt({});
    const eng = engRef.current; if (!eng) return;
    eng.playScene = 0; eng.quizMode = false;
    setPlay({ i: 0, quiz: L.scenes.length ? null : { i: 0, score: 0, fb: null }, card: null });
  };
  const stopPlay = () => { const eng = engRef.current; if (eng) { eng.playScene = null; eng.quizMode = false; eng.refreshVisibility(); eng.highlight(null); } setPlay(null); setRt({}); };
  useEffect(() => {
    const eng = engRef.current; if (!eng || !play) return;
    if (play.quiz) { eng.quizMode = true; eng.playScene = Math.max(0, L.scenes.length - 1); eng.refreshVisibility(); if (!play.quiz.fb) eng.highlight(null); return; }
    const s = L.scenes[play.i]; if (!s) return;
    eng.quizMode = false; eng.playScene = play.i; eng.refreshVisibility(); eng.flyTo(s.cam, s.tgt); eng.highlight(null);
  }, [play, L.scenes]);
  useEffect(() => { if (play?.quiz && !play.quiz.fb) engRef.current?.home(); }, [play?.quiz?.i, play?.quiz]);
  const pickRef = useRef<(id: string) => void>(() => {});
  pickRef.current = (id: string) => {
    const P = ref.current.play; if (!P) return;
    if (P.quiz) {
      const qq = ref.current.L.quiz[P.quiz.i]; if (!qq || qq.type !== 'spot' || P.quiz.fb) return;
      const ok = qq.target === id; engRef.current?.highlight(qq.target);
      setPlay({ ...P, quiz: { ...P.quiz, score: P.quiz.score + (ok ? 1 : 0), fb: { ok, pick: id } } }); return;
    }
    const ob = ref.current.L.objects.find((o) => o.id === id); if (ob?.spot.on) setPlay({ ...P, card: id });
  };
  const speak = (text: string) => { try { const s = window.speechSynthesis; s.cancel(); const u = new SpeechSynthesisUtterance(text); u.lang = 'vi-VN'; u.rate = 0.92; const v = s.getVoices().find((x) => x.lang?.toLowerCase().startsWith('vi')); if (v) u.voice = v; s.speak(u); } catch { /* máy không có giọng đọc */ } };
  const fullscreen = () => { const el = stageRef.current?.parentElement; if (!el) return; const p = document.fullscreenElement ? document.exitFullscreen() : el.requestFullscreen?.(); p?.catch?.(() => {}); };
  const ctlVal = (c: Control3D) => { const r = rt[c.targets[0]] ?? {}; return c.action === 'speed' ? r.speed ?? 1 : c.action === 'on' ? r.on ?? (L.objects.find((o) => o.id === c.targets[0])?.on ?? true) : c.action === 'split' ? r.split ?? false : !(r.hidden ?? false); };
  const setCtl = (c: Control3D, v: number | boolean) => setRt((cur) => { const n = { ...cur }; c.targets.forEach((t) => { const x = { ...(n[t] ?? {}) }; if (c.action === 'speed') x.speed = Number(v); if (c.action === 'on') x.on = Boolean(v); if (c.action === 'split') x.split = Boolean(v); if (c.action === 'show') x.hidden = !v; n[t] = x; }); return n; });

  /* ---------- thư viện ---------- */
  const f = fold(q);
  const libCats = ASSET_CATS.map((c) => ({ c, items: ASSETS.filter((a) => a.cat === c && (!f || fold(`${a.name} ${a.kw ?? ''} ${c}`).includes(f))) })).filter((x) => x.items.length);
  const stem = stemByKey(L.stem);
  const suggested = stem?.assets.filter((a) => ASSET_BY_ID[a]) ?? [];
  const selObj = sel ? L.objects.find((o) => o.id === sel) ?? null : null;
  const kb = (new Blob([JSON.stringify(L)]).size / 1024).toFixed(1).replace('.', ',');
  const objName = (id: string) => { const o = L.objects.find((x) => x.id === id); return o ? (o.spot.on && o.spot.title) || o.name : '—'; };
  const objOptions = (value: string, empty?: string) => (<>{empty !== undefined && <option value="">{empty}</option>}{L.objects.map((o) => <option key={o.id} value={o.id}>{(o.spot.on && o.spot.title) || o.name}</option>)}</>);

  const libItem = (id: string) => { const a = ASSET_BY_ID[id]; return (
    <button key={id} type="button" className="s3d-item" draggable aria-pressed={placing === id} title="Bấm rồi bấm lên sa bàn, hoặc kéo thả vào sa bàn"
      onClick={() => setPlacing((p) => (p === id ? null : id))} onDragStart={(e) => e.dataTransfer.setData('text/plain', id)}>
      {/* eslint-disable-next-line @next/next/no-img-element -- ảnh nhỏ dựng tại chỗ (data URL) */}
      {thumbs[id] ?? a.thumb ? <img src={thumbs[id] ?? a.thumb} alt="" /> : <span className="s3d-ph" />}<span>{a.name}</span>
    </button>
  ); };

  return (
    <div className={`s3d${play ? ' is-play' : ''}`}>
      <header className="s3d-top">
        <Link href={`/giao-vien/lop/${classId}/bai-giang-3d`} className="s3d-btn" aria-label="Về danh sách bài giảng 3D"><ArrowLeft aria-hidden="true" /></Link>
        <label className="s3d-ttl"><small>Xưởng bài giảng 3D · Lớp {L.grade}{stem ? ` · STEM bài ${stem.no}` : ''}</small>
          <input value={L.title} maxLength={120} onChange={(e) => { const v = e.target.value; update((d) => { d.title = v; return d; }); }} aria-label="Tên bài giảng" /></label>
        {!play && <>
          <select className="s3d-btn" value={L.base} onChange={(e) => { const v = e.target.value as BaseType; update((d) => { d.base = v; return d; }); }} aria-label="Nền sa bàn">{BASES.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}</select>
          <select className="s3d-btn" value={L.grade} onChange={(e) => { const v = Number(e.target.value); update((d) => { d.grade = v; return d; }); }} aria-label="Khối lớp">{[1, 2, 3, 4, 5].map((g) => <option key={g} value={g}>Lớp {g}</option>)}</select>
          <button type="button" className="s3d-btn" aria-pressed={snap} onClick={() => setSnap((v) => !v)} title="Hít lưới khi đặt và kéo"><Grid3x3 aria-hidden="true" /> <span>Hít lưới</span></button>
          <button type="button" className="s3d-btn" aria-pressed={lite} onClick={() => setLite((v) => !v)} title="Giảm hiệu ứng cho máy yếu"><Zap aria-hidden="true" /> <span>Máy yếu</span></button>
          <span className={`s3d-save is-${save}`} role="status">{save === 'saving' ? 'Đang lưu…' : save === 'err' ? 'Chưa lưu được' : 'Đã lưu'}</span>
        </>}
        {play ? <>
          <button type="button" className="s3d-btn" onClick={fullscreen}><Maximize aria-hidden="true" /> <span>Toàn màn hình</span></button>
          <button type="button" className="s3d-btn is-pri" onClick={stopPlay}><Pause aria-hidden="true" /> Quay lại soạn</button>
        </> : <button type="button" className="s3d-btn is-pri" onClick={startPlay}><Play aria-hidden="true" /> Trình chiếu</button>}
      </header>

      <div className="s3d-main">
        {!play && (
          <aside className="s3d-pane s3d-lib" aria-label="Thư viện đồ vật 3D">
            <div className="s3d-pane-h"><h2>Thư viện 3D <small>{ASSETS.length} đồ vật</small></h2>
              <input className="s3d-search" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Tìm: cây, đèn, khối, pin…" aria-label="Tìm đồ vật" /></div>
            <div className="s3d-lib-list">
              <section className="s3d-mine">
                <h3>Vật thể của tôi {usage && <small>{fmtMB(usage.bytes)} / {fmtMB(usage.limit)}</small>}</h3>
                <input ref={fileRef} type="file" accept=".glb,image/png,image/jpeg,image/webp,image/gif,image/svg+xml" hidden onChange={(e) => { const fl = e.target.files?.[0]; if (fl) void onUpload(fl); }} />
                <div className="s3d-grid">
                  <button type="button" className="s3d-item s3d-up" disabled={!!mineBusy} onClick={() => fileRef.current?.click()} title="Mô hình .glb hoặc ảnh (tự thu về vừa 1 ô sa bàn)">
                    <span className="s3d-up-ic"><Upload aria-hidden="true" /></span><span>{mineBusy || 'Tải lên .glb / ảnh'}</span>
                  </button>
                  {(mine ?? []).filter((a) => ASSET_BY_ID[`u-${a.id}`] && (!f || fold(a.name).includes(f))).map((a) => (
                    <div key={a.id} className="s3d-mine-it">
                      {libItem(`u-${a.id}`)}
                      <button type="button" className="s3d-mine-x" aria-label={`Xoá ${a.name} khỏi kho`} title="Xoá khỏi kho" onClick={() => void removeMine(a)}><X aria-hidden="true" /></button>
                    </div>
                  ))}
                </div>
                {mineMsg && <p className={`s3d-note s3d-mine-msg is-${mineMsg.kind}`} role="status">{mineMsg.text}</p>}
                {mine && !mine.length && !mineMsg && <p className="s3d-note">Tải mô hình .glb (Blender, SketchUp, Tinkercad, Poly Pizza…) hoặc ảnh: app tự thu về vừa 1 ô sa bàn, đặt đáy chạm sàn.</p>}
              </section>
              {suggested.length > 0 && !f && <section><h3>Gợi ý cho bài này</h3><div className="s3d-grid">{suggested.map(libItem)}</div></section>}
              {libCats.map(({ c, items }) => <section key={c}><h3>{c}</h3><div className="s3d-grid">{items.map((a) => libItem(a.id))}</div></section>)}
            </div>
          </aside>
        )}

        <section className="s3d-stage-wrap">
          <div className="s3d-stage" ref={stageRef} aria-label="Sa bàn 3D" />
          {!play && <div className="s3d-stats">{L.objects.length} đồ vật · {L.scenes.length} cảnh · {L.quiz.length} câu hỏi · {kb} KB</div>}
          {!play && <div className="s3d-tip">{placing ? <span className="is-place">Bấm lên sa bàn để đặt {ASSET_BY_ID[placing]?.name} · Esc để thôi</span> : <span>Kéo nền để xoay · cuộn để phóng to · bấm đồ vật để chọn, kéo để di chuyển</span>}</div>}
          {play && <PlayLayer L={L} play={play} setPlay={setPlay} speak={speak} stopPlay={stopPlay} ctlVal={ctlVal} setCtl={setCtl} restart={startPlay} />}
        </section>

        {!play && (
          <aside className="s3d-pane s3d-side">
            <div className="s3d-tabs" role="tablist">
              {(['obj', 'scene', 'act', 'quiz'] as Tab[]).map((t) => <button key={t} type="button" role="tab" aria-selected={tab === t} className="s3d-tab" onClick={() => setTab(t)}>{{ obj: 'Đồ vật', scene: `Cảnh ${L.scenes.length}`, act: 'Tương tác', quiz: `Câu hỏi ${L.quiz.length}` }[t]}</button>)}
            </div>
            <div className="s3d-props">
              {tab === 'obj' && (!selObj ? (
                <>
                  <div className="s3d-empty">Bấm vào một đồ vật trên sa bàn để sửa.<br />Thêm đồ vật: bấm vào thư viện bên trái rồi bấm lên sa bàn (hoặc kéo thả).</div>
                  {stem && <div className="s3d-box s3d-stem"><b>Bài STEM gốc: Lớp {stem.g} · Bài {stem.no}</b><span>{stem.title}</span><span className="s3d-note">{stem.lead}{stem.integrated.length ? ` · tích hợp ${stem.integrated.join(', ')}` : ''} · {FIT_LABEL[stem.fit]}</span>{stem.materials.length > 0 && <details><summary>Vật liệu ({stem.materials.length})</summary><ul>{stem.materials.map((m) => <li key={m}>{m}</li>)}</ul></details>}</div>}
                </>
              ) : (
                <ObjPanel o={selObj} L={L} updObj={updObj} remove={() => removeObj(selObj.id)} dup={() => { const c = { ...structuredClone(selObj), id: uid(), x: r1(Math.min(10.5, selObj.x + 1.5)), z: r1(Math.min(7.5, selObj.z + 1)) }; update((d) => { d.objects.push(c); return d; }); setSel(c.id); }} />
              ))}
              {tab === 'scene' && (
                <>
                  <p className="s3d-note">Mỗi cảnh như một slide: góc nhìn + lời dẫn + đồ vật được làm nổi bật. Xoay sa bàn tới góc đẹp rồi bấm “Lưu góc nhìn”. Đồ vật có “Xuất hiện từ cảnh” sẽ hiện dần (lắp ráp từng bước).</p>
                  <ol className="s3d-list">{L.scenes.map((s, i) => (
                    <li key={i} className={`s3d-card${sceneOn === i ? ' is-on' : ''}`}>
                      <div className="s3d-card-h"><span className="s3d-num">{i + 1}</span><span className="s3d-grow">{s.caption || 'Cảnh chưa có lời dẫn'}</span></div>
                      <textarea value={s.caption} maxLength={240} placeholder="Lời dẫn của cô cho cảnh này" aria-label={`Lời dẫn cảnh ${i + 1}`} onChange={(e) => { const v = e.target.value; update((d) => { d.scenes[i].caption = v; return d; }); }} />
                      <label className="s3d-fld"><span>Làm nổi bật</span><select value={s.focus} onChange={(e) => { const v = e.target.value; update((d) => { d.scenes[i].focus = v; return d; }); }}>{objOptions(s.focus, '— Không —')}</select></label>
                      <div className="s3d-row">
                        <button type="button" className="s3d-btn sm" onClick={() => { setSceneOn(i); engRef.current?.flyTo(s.cam, s.tgt); if (s.focus) setSel(s.focus); }}><Eye aria-hidden="true" /> Xem</button>
                        <button type="button" className="s3d-btn sm" onClick={() => { const c = engRef.current?.camNow(); if (c) update((d) => { Object.assign(d.scenes[i], c); return d; }); }}>📷 Lưu góc nhìn</button>
                        <button type="button" className="s3d-btn sm" disabled={!i} onClick={() => update((d) => { [d.scenes[i - 1], d.scenes[i]] = [d.scenes[i], d.scenes[i - 1]]; return d; })} aria-label="Đưa lên">↑</button>
                        <button type="button" className="s3d-btn sm is-danger" onClick={() => update((d) => { d.scenes.splice(i, 1); return d; })}>Xóa</button>
                      </div>
                    </li>))}</ol>
                  <button type="button" className="s3d-btn is-pri" onClick={() => { const c = engRef.current?.camNow() ?? { cam: [13, 9, 15], tgt: [0, 1.5, 0] }; update((d) => { d.scenes.push({ caption: '', focus: sel ?? '', ...c }); return d; }); setSceneOn(L.scenes.length); }}><Plus aria-hidden="true" /> Thêm cảnh từ góc nhìn hiện tại</button>
                </>
              )}
              {tab === 'act' && <ActPanel L={L} update={update} objOptions={objOptions} objName={objName} sel={sel} />}
              {tab === 'quiz' && <QuizPanel L={L} update={update} objOptions={objOptions} sel={sel} />}
            </div>
          </aside>
        )}
      </div>
    </div>
  );
}

function ObjPanel({ o, L, updObj, remove, dup }: { o: Obj3D; L: Lesson3D; updObj: (id: string, fn: (o: Obj3D) => void) => void; remove: () => void; dup: () => void }) {
  const a = ASSET_BY_ID[o.type];
  const set = (fn: (x: Obj3D) => void) => updObj(o.id, fn);
  return (
    <>
      <h3 className="s3d-h3">{a?.name ?? o.type}</h3>
      <label className="s3d-fld"><span>{a?.text ? 'Chữ in trên đồ vật' : 'Tên hiện cho học sinh'}</span><input value={o.name} maxLength={60} onChange={(e) => { const v = e.target.value; set((x) => { x.name = v; }); }} /></label>
      <div className="s3d-fld"><span>Vị trí & kích thước</span>
        <div className="s3d-row">
          <button type="button" className="s3d-btn sm" onClick={() => set((x) => { x.ry = r1(x.ry + Math.PI / 4); })}>↻ Xoay</button>
          <button type="button" className="s3d-btn sm" onClick={() => set((x) => { x.s = r1(Math.min(4, x.s * 1.2)); })}>＋ To</button>
          <button type="button" className="s3d-btn sm" onClick={() => set((x) => { x.s = r1(Math.max(0.3, x.s / 1.2)); })}>－ Nhỏ</button>
          <button type="button" className="s3d-btn sm" onClick={() => set((x) => { x.y = r1(x.y + 0.5); })}>↑ Nâng</button>
          <button type="button" className="s3d-btn sm" onClick={() => set((x) => { x.y = r1(Math.max(0, x.y - 0.5)); })}>↓ Hạ</button>
        </div>
      </div>
      {!a?.fixed && <div className="s3d-fld"><span>Màu</span><div className="s3d-row">{SWATCH.map((c) => <button key={c} type="button" className="s3d-sw" style={{ background: c }} aria-label={`Màu ${c}`} aria-pressed={o.color === c} onClick={() => set((x) => { x.color = c; })} />)}</div></div>}
      {(a?.onoff || a?.split) && <div className="s3d-row">
        {a?.onoff && <label className="s3d-chk"><input type="checkbox" checked={o.on !== false} onChange={(e) => { const v = e.target.checked; set((x) => { x.on = v; }); }} /> Đang bật</label>}
        {a?.split && <label className="s3d-chk"><input type="checkbox" checked={!!o.split} onChange={(e) => { const v = e.target.checked; set((x) => { x.split = v; }); }} /> Tách rời bộ phận</label>}
      </div>}
      <div className="s3d-box">
        <label className="s3d-chk"><input type="checkbox" checked={o.spot.on} onChange={(e) => { const v = e.target.checked; set((x) => { x.spot.on = v; if (v && !x.spot.title) x.spot.title = x.name; }); }} /> Gắn điểm chạm</label>
        {o.spot.on ? <>
          <label className="s3d-fld"><span>Tiêu đề</span><input value={o.spot.title} maxLength={60} placeholder="Ví dụ: Rễ cây" onChange={(e) => { const v = e.target.value; set((x) => { x.spot.title = v; }); }} /></label>
          <label className="s3d-fld"><span>Lời giảng khi học sinh bấm vào</span><textarea value={o.spot.text} maxLength={500} placeholder="1–3 câu ngắn, dễ hiểu" onChange={(e) => { const v = e.target.value; set((x) => { x.spot.text = v; }); }} /></label>
        </> : <span className="s3d-note">Học sinh bấm vào ghim số sẽ thấy tiêu đề, lời giảng và nghe đọc.</span>}
      </div>
      <div className="s3d-fld"><span>Hiệu ứng</span><div className="s3d-fx">{FX.map((x) => <button key={x.id || 'none'} type="button" aria-pressed={o.fx.type === x.id} onClick={() => set((y) => { y.fx.type = x.id; })}><b>{x.icon}</b>{x.name}</button>)}</div></div>
      {o.fx.type && <label className="s3d-fld"><span>Tốc độ hiệu ứng</span><input type="range" min={0.2} max={2.5} step={0.1} value={o.fx.speed} onChange={(e) => { const v = Number(e.target.value); set((x) => { x.fx.speed = v; }); }} /></label>}
      <label className="s3d-fld"><span>Xuất hiện khi trình chiếu</span><select value={o.appear ?? 0} onChange={(e) => { const v = Number(e.target.value); set((x) => { x.appear = v || undefined; }); }}>
        <option value={0}>Luôn có</option>{L.scenes.map((_, i) => i > 0 && <option key={i} value={i + 1}>Từ cảnh {i + 1}</option>)}
      </select></label>
      <div className="s3d-row"><button type="button" className="s3d-btn sm" onClick={dup}><Copy aria-hidden="true" /> Nhân bản</button><button type="button" className="s3d-btn sm is-danger" onClick={remove}><Trash2 aria-hidden="true" /> Xóa</button></div>
    </>
  );
}

function ActPanel({ L, update, objOptions, objName, sel }: { L: Lesson3D; update: (fn: (d: Lesson3D) => Lesson3D) => void; objOptions: (v: string, e?: string) => React.ReactNode; objName: (id: string) => string; sel: string | null }) {
  const [from, setFrom] = useState(sel ?? ''); const [to, setTo] = useState(''); const [kind, setKind] = useState<Link3D['kind']>('arrow'); const [label, setLabel] = useState('');
  const [cl, setCl] = useState(''); const [ck, setCk] = useState<Control3D['action']>('on'); const [ct, setCt] = useState<string[]>(sel ? [sel] : []);
  return (
    <>
      <h3 className="s3d-h3">Đường nối</h3>
      <p className="s3d-note">Mũi tên cho chuỗi thức ăn, vòng đời; thước đo ghi số cm; dây điện cho mạch điện.</p>
      <ul className="s3d-list">{L.links.map((l) => <li key={l.id} className="s3d-card s3d-mini"><span>{LINK_KIND[l.kind]}: <b>{objName(l.from)}</b> → <b>{objName(l.to)}</b>{l.label ? ` · “${l.label}”` : ''}</span><button type="button" className="s3d-x" aria-label="Xóa đường nối" onClick={() => update((d) => { d.links = d.links.filter((x) => x.id !== l.id); return d; })}><X aria-hidden="true" /></button></li>)}</ul>
      <div className="s3d-box">
        <div className="s3d-row2"><select value={kind} onChange={(e) => setKind(e.target.value as Link3D['kind'])} aria-label="Loại">{Object.entries(LINK_KIND).map(([k, v]) => <option key={k} value={k}>{v}</option>)}</select><input value={label} maxLength={40} onChange={(e) => setLabel(e.target.value)} placeholder={kind === 'measure' ? 'Ví dụ: 20 cm' : 'Chữ trên đường nối'} aria-label="Chữ" /></div>
        <div className="s3d-row2"><select value={from} onChange={(e) => setFrom(e.target.value)} aria-label="Từ">{objOptions(from, 'Từ đồ vật…')}</select><select value={to} onChange={(e) => setTo(e.target.value)} aria-label="Đến">{objOptions(to, 'Đến đồ vật…')}</select></div>
        <button type="button" className="s3d-btn sm is-pri" disabled={!from || !to || from === to} onClick={() => { update((d) => { d.links.push({ id: uid(), from, to, kind, label: label.trim() }); return d; }); setLabel(''); setFrom(to); setTo(''); }}><Plus aria-hidden="true" /> Thêm đường nối</button>
      </div>
      <h3 className="s3d-h3">Nút điều khiển khi trình chiếu</h3>
      <p className="s3d-note">Ví dụ: “Đóng công tắc” bật bóng đèn; thanh “Sức gió” làm cánh quạt quay nhanh hơn; “Tách bộ phận” để xem cấu tạo.</p>
      <ul className="s3d-list">{L.controls.map((c) => <li key={c.id} className="s3d-card s3d-mini"><span><b>{c.label}</b> · {ACTION[c.action]} · {c.targets.map(objName).join(', ')}</span><button type="button" className="s3d-x" aria-label="Xóa nút" onClick={() => update((d) => { d.controls = d.controls.filter((x) => x.id !== c.id); return d; })}><X aria-hidden="true" /></button></li>)}</ul>
      <div className="s3d-box">
        <div className="s3d-row2"><input value={cl} maxLength={40} onChange={(e) => setCl(e.target.value)} placeholder="Tên nút, ví dụ: Sức gió" aria-label="Tên nút" /><select value={ck} onChange={(e) => setCk(e.target.value as Control3D['action'])} aria-label="Tác dụng">{Object.entries(ACTION).map(([k, v]) => <option key={k} value={k}>{v}</option>)}</select></div>
        <div className="s3d-checks">{L.objects.map((o) => <label key={o.id} className="s3d-chk sm"><input type="checkbox" checked={ct.includes(o.id)} onChange={(e) => setCt((t) => (e.target.checked ? [...t, o.id] : t.filter((x) => x !== o.id)))} /> {(o.spot.on && o.spot.title) || o.name}</label>)}</div>
        <button type="button" className="s3d-btn sm is-pri" disabled={!cl.trim() || !ct.length} onClick={() => { update((d) => { d.controls.push({ id: uid(), label: cl.trim(), kind: ck === 'speed' ? 'slider' : 'switch', action: ck, targets: ct }); return d; }); setCl(''); setCt([]); }}><Plus aria-hidden="true" /> Thêm nút điều khiển</button>
      </div>
    </>
  );
}

function QuizPanel({ L, update, objOptions, sel }: { L: Lesson3D; update: (fn: (d: Lesson3D) => Lesson3D) => void; objOptions: (v: string, e?: string) => React.ReactNode; sel: string | null }) {
  const set = (i: number, fn: (x: Quiz3D) => void) => update((d) => { fn(d.quiz[i]); return d; });
  return (
    <>
      <p className="s3d-note">Hai dạng câu: học sinh bấm đúng đồ vật trên sa bàn, hoặc chọn đáp án.</p>
      <ol className="s3d-list">{L.quiz.map((qq, i) => (
        <li key={i} className="s3d-card">
          <div className="s3d-card-h"><span className="s3d-num">{i + 1}</span><span className="s3d-grow">{qq.type === 'spot' ? '👆 Bấm vào đồ vật' : '☑ Chọn đáp án'}</span><button type="button" className="s3d-btn sm is-danger" onClick={() => update((d) => { d.quiz.splice(i, 1); return d; })}>Xóa</button></div>
          <textarea value={qq.q} maxLength={240} placeholder="Câu hỏi" aria-label={`Câu hỏi ${i + 1}`} onChange={(e) => { const v = e.target.value; set(i, (x) => { x.q = v; }); }} />
          {qq.type === 'spot' ? <label className="s3d-fld"><span>Đồ vật đúng</span><select value={qq.target} onChange={(e) => { const v = e.target.value; set(i, (x) => { if (x.type === 'spot') x.target = v; }); }}>{objOptions(qq.target, '— Chọn —')}</select></label> : (
            <div className="s3d-fld"><span>Đáp án (chấm tròn = đáp án đúng)</span>
              {qq.opts.map((t, j) => <div key={j} className="s3d-opt"><input type="radio" name={`a${i}`} checked={qq.a === j} onChange={() => set(i, (x) => { if (x.type === 'choice') x.a = j; })} aria-label={`Đáp án đúng ${j + 1}`} /><input value={t} maxLength={100} onChange={(e) => { const v = e.target.value; set(i, (x) => { if (x.type === 'choice') x.opts[j] = v; }); }} aria-label={`Đáp án ${j + 1}`} /><button type="button" className="s3d-x" disabled={qq.opts.length <= 2} onClick={() => set(i, (x) => { if (x.type === 'choice') { x.opts.splice(j, 1); if (x.a >= x.opts.length) x.a = 0; } })} aria-label="Bỏ đáp án"><X aria-hidden="true" /></button></div>)}
              {qq.opts.length < 4 && <button type="button" className="s3d-btn sm" onClick={() => set(i, (x) => { if (x.type === 'choice') x.opts.push(''); })}><Plus aria-hidden="true" /> Đáp án</button>}
            </div>
          )}
        </li>))}</ol>
      <div className="s3d-row">
        <button type="button" className="s3d-btn" onClick={() => update((d) => { d.quiz.push({ type: 'spot', q: '', target: sel ?? '' }); return d; })}><Plus aria-hidden="true" /> Câu bấm vào đồ vật</button>
        <button type="button" className="s3d-btn" onClick={() => update((d) => { d.quiz.push({ type: 'choice', q: '', opts: ['', ''], a: 0 }); return d; })}><Plus aria-hidden="true" /> Câu chọn đáp án</button>
      </div>
    </>
  );
}

function PlayLayer({ L, play, setPlay, speak, stopPlay, ctlVal, setCtl, restart }: {
  L: Lesson3D; play: Play; setPlay: (p: Play) => void; speak: (t: string) => void; stopPlay: () => void; restart: () => void;
  ctlVal: (c: Control3D) => number | boolean; setCtl: (c: Control3D, v: number | boolean) => void;
}) {
  const card = play.card ? L.objects.find((o) => o.id === play.card) : null;
  const Z = play.quiz;
  const total = L.quiz.length;
  return (
    <>
      {L.controls.length > 0 && !Z && <div className="s3d-ctls" aria-label="Điều khiển">{L.controls.map((c) => (
        c.kind === 'slider'
          ? <label key={c.id} className="s3d-ctl"><span>{c.label}</span><input type="range" min={0} max={2.5} step={0.1} value={Number(ctlVal(c))} onChange={(e) => setCtl(c, Number(e.target.value))} /></label>
          : <button key={c.id} type="button" className="s3d-ctl is-sw" aria-pressed={Boolean(ctlVal(c))} onClick={() => setCtl(c, !ctlVal(c))}><i />{c.label}</button>
      ))}</div>}
      {card && <div className="s3d-spotcard" role="dialog" aria-label={card.spot.title}><h4>{card.spot.title || card.name}</h4><p>{card.spot.text || '…'}</p><div className="s3d-row"><button type="button" className="s3d-btn sm" onClick={() => speak(`${card.spot.title}. ${card.spot.text}`)}>🔊 Nghe đọc</button><button type="button" className="s3d-btn sm" onClick={() => setPlay({ ...play, card: null })}>Đóng</button></div></div>}
      <div className="s3d-play">
        {!Z ? (() => {
          const s = L.scenes[play.i];
          return <>
            <div className="s3d-play-h"><span>Cảnh {play.i + 1}/{L.scenes.length}</span><span>Bấm ghim số để xem lời giảng</span></div>
            <p>{s?.caption || '…'}</p>
            <div className="s3d-row is-end">
              <button type="button" className="s3d-btn" disabled={!play.i} onClick={() => setPlay({ ...play, i: play.i - 1, card: null })}>← Trước</button>
              <button type="button" className="s3d-btn is-pri" onClick={() => (play.i + 1 < L.scenes.length ? setPlay({ ...play, i: play.i + 1, card: null }) : total ? setPlay({ ...play, quiz: { i: 0, score: 0, fb: null }, card: null }) : stopPlay())}>{play.i + 1 < L.scenes.length ? 'Tiếp →' : total ? 'Làm thử thách →' : 'Kết thúc'}</button>
            </div>
          </>;
        })() : Z.i >= total ? <>
          <div className="s3d-play-h"><span>Kết quả</span><span className="s3d-stars">{'★'.repeat(Z.score)}{'☆'.repeat(total - Z.score)}</span></div>
          <p>Đúng {Z.score}/{total} câu. {Z.score === total ? 'Giỏi quá!' : 'Cố gắng lần sau nhé!'}</p>
          <div className="s3d-row is-end"><button type="button" className="s3d-btn" onClick={restart}>Xem lại từ đầu</button><button type="button" className="s3d-btn is-pri" onClick={stopPlay}>Quay lại soạn</button></div>
        </> : (() => {
          const qq = L.quiz[Z.i];
          return <>
            <div className="s3d-play-h"><span>Thử thách · câu {Z.i + 1}/{total}</span><span className="s3d-stars">{'★'.repeat(Z.score)}</span></div>
            <p>{qq.q || '…'}</p>
            {qq.type === 'spot' ? <span className="s3d-note">👆 Bấm vào đồ vật trên sa bàn</span> : <div className="s3d-opts">{qq.opts.map((t, j) => <button key={j} type="button" disabled={!!Z.fb} className={`s3d-optb${Z.fb && j === qq.a ? ' is-ok' : ''}${Z.fb && Z.fb.pick === j && j !== qq.a ? ' is-no' : ''}`} onClick={() => setPlay({ ...play, quiz: { ...Z, score: Z.score + (j === qq.a ? 1 : 0), fb: { ok: j === qq.a, pick: j } } })}>{t}</button>)}</div>}
            {Z.fb && <><div className={`s3d-fb ${Z.fb.ok ? 'is-ok' : 'is-no'}`}>{Z.fb.ok ? '✔ Chính xác!' : '✘ Chưa đúng rồi.'}</div><div className="s3d-row is-end"><button type="button" className="s3d-btn is-pri" onClick={() => setPlay({ ...play, quiz: { ...Z, i: Z.i + 1, fb: null } })}>Tiếp →</button></div></>}
          </>;
        })()}
      </div>
    </>
  );
}
